from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Avg, Count, Q, F
from django.db import transaction
from datetime import timedelta
from .models import (
    Reading, StressEvent, BreathingSession, VirtualPet, Streak,
    Achievement, Unlockable, UserUnlockable, JournalEntry, UserProfile
)
from .serializers import (
    ReadingSerializer, StressEventSerializer, BreathingSessionSerializer,
    VirtualPetSerializer, StreakSerializer, AchievementSerializer,
    UnlockableSerializer, UserUnlockableSerializer, JournalEntrySerializer,
    UserProfileSerializer, SignUpSerializer, LoginSerializer, UserSerializer
)


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


# ==================== AUTHENTICATION ====================

@csrf_exempt  # Frontend hits from a different origin; session cookie only
@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignUpSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        login(request, user)
        return Response({
            'user': UserSerializer(user).data,
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt  # Frontend hits from a different origin; session cookie only
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response(UserSerializer(request.user).data)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logged out'}, status=status.HTTP_200_OK)

@csrf_exempt
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    user = request.user
    logout(request)
    user.delete()
    return Response({'message': 'Account deleted'}, status=status.HTTP_200_OK)


# ==================== STRESS DETECTION LOGIC ====================

def detect_stress_level(reading, user):
    """
    Detect stress level based on sensor readings.
    Returns: 'low', 'moderate', 'high', or 'critical'
    """
    stress_indicators = []
    
    # Get user's baseline (average of last 7 days)
    week_ago = timezone.now() - timedelta(days=7)
    baseline_readings = Reading.objects.filter(
        user=user,
        ts__gte=week_ago
    ).exclude(id=reading.id)
    
    if baseline_readings.exists():
        avg_hr = baseline_readings.aggregate(Avg('hr_bpm'))['hr_bpm__avg']
        avg_hrv = baseline_readings.aggregate(Avg('hrv_rmssd'))['hrv_rmssd__avg']
    else:
        # Default baselines if no history
        avg_hr = 70
        avg_hrv = 50
    
    # Heart rate check
    if reading.hr_bpm:
        hr_elevation = reading.hr_bpm - avg_hr if avg_hr else 0
        if hr_elevation > 30:
            stress_indicators.append(('HR', 'critical'))
        elif hr_elevation > 20:
            stress_indicators.append(('HR', 'high'))
        elif hr_elevation > 10:
            stress_indicators.append(('HR', 'moderate'))
        elif reading.hr_bpm > 100:  # Absolute threshold
            stress_indicators.append(('HR', 'high'))
    
    # HRV check (lower HRV = higher stress)
    if reading.hrv_rmssd and avg_hrv:
        hrv_drop = avg_hrv - reading.hrv_rmssd
        if hrv_drop > 20:
            stress_indicators.append(('HRV', 'high'))
        elif hrv_drop > 10:
            stress_indicators.append(('HRV', 'moderate'))
    
    # Grip force check (high pressure = stress)
    if reading.grip_force:
        if reading.grip_force > 80:  # Arbitrary threshold, adjust based on sensor
            stress_indicators.append(('grip', 'high'))
        elif reading.grip_force > 50:
            stress_indicators.append(('grip', 'moderate'))
    
    # Determine overall stress level
    if not stress_indicators:
        return 'low', None
    
    # Get highest stress level detected
    level_map = {'low': 0, 'moderate': 1, 'high': 2, 'critical': 3}
    max_level = max(stress_indicators, key=lambda x: level_map[x[1]])
    detected_by = ', '.join([ind[0] for ind in stress_indicators])
    
    return max_level[1], detected_by


# ==================== READINGS ====================

class ReadingViewSet(viewsets.ModelViewSet):
    queryset = Reading.objects.all()
    serializer_class = ReadingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reading.objects.filter(user=self.request.user).order_by("-ts")

    def perform_create(self, serializer):
        reading = serializer.save(user=self.request.user)
        
        # Auto-detect stress
        stress_level, detected_by = detect_stress_level(reading, self.request.user)
        
        if stress_level != 'low':
            # Create stress event
            stress_event = StressEvent.objects.create(
                user=self.request.user,
                level=stress_level,
                reading=reading,
                detected_by=detected_by or 'sensor'
            )
            
            # Update virtual pet mood
            try:
                pet = self.request.user.virtual_pet
                pet.update_mood_from_stress(stress_level)
            except VirtualPet.DoesNotExist:
                pass

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export user's readings as CSV"""
        import csv
        from io import StringIO

        qs = self.get_queryset()
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['ts', 'hr_bpm', 'hrv_rmssd'])
        for r in qs.order_by('ts'):
            writer.writerow([
                r.ts.isoformat(),
                r.hr_bpm if r.hr_bpm is not None else '',
                r.hrv_rmssd if r.hrv_rmssd is not None else '',
            ])

        data = output.getvalue()
        output.close()

        response = Response(data, content_type='text/csv')
        filename = f"calmipet_readings_{timezone.now().date().isoformat()}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


# ==================== STRESS EVENTS ====================

class StressEventViewSet(viewsets.ModelViewSet):
    queryset = StressEvent.objects.all()
    serializer_class = StressEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = StressEvent.objects.filter(user=self.request.user).order_by("-ts")
        resolved = self.request.query_params.get('resolved', None)
        if resolved is not None:
            queryset = queryset.filter(resolved=resolved.lower() == 'true')
        return queryset

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark stress event as resolved"""
        stress_event = self.get_object()
        if not stress_event.resolved:
            stress_event.resolved = True
            stress_event.resolved_at = timezone.now()
            stress_event.save()
            
            # Update user profile stats
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            profile.total_stress_events_resolved += 1
            profile.save()
            
            # Reward pet
            try:
                pet = request.user.virtual_pet
                pet.add_experience(10)
                pet.update_mood_from_stress('low')
            except VirtualPet.DoesNotExist:
                pass
            
            # Check for achievements
            check_stress_management_achievements(request.user)
        
        return Response(StressEventSerializer(stress_event).data)


# ==================== BREATHING SESSIONS ====================

class BreathingSessionViewSet(viewsets.ModelViewSet):
    queryset = BreathingSession.objects.all()
    serializer_class = BreathingSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BreathingSession.objects.filter(user=self.request.user).order_by("-started_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark breathing session as completed"""
        session = self.get_object()
        if not session.completed:
            session.completed = True
            session.completed_at = timezone.now()
            if session.started_at:
                duration = (session.completed_at - session.started_at).total_seconds()
                session.duration_seconds = int(duration)
            session.save()
            
            # Update user profile
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            profile.total_breathing_sessions += 1
            profile.save()
            
            # Reward pet
            try:
                pet = request.user.virtual_pet
                pet.add_experience(15)
                pet.update_mood_from_stress('low')
            except VirtualPet.DoesNotExist:
                pass
            
            # Update streak
            try:
                streak = request.user.streak
                streak.update_streak()
            except Streak.DoesNotExist:
                Streak.objects.create(user=request.user)
            
            # Check for achievements
            check_breathing_achievements(request.user)
        
        return Response(BreathingSessionSerializer(session).data)


# ==================== VIRTUAL PET ====================

class VirtualPetViewSet(viewsets.ModelViewSet):
    queryset = VirtualPet.objects.all()
    serializer_class = VirtualPetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VirtualPet.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def mine(self, request):
        """Get current user's pet"""
        try:
            pet = request.user.virtual_pet
            return Response(VirtualPetSerializer(pet).data)
        except VirtualPet.DoesNotExist:
            return Response({'error': 'Pet not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def feed(self, request, pk=None):
        """Feed the pet"""
        pet = self.get_object()
        pet.last_fed = timezone.now()
        pet.health = min(100, pet.health + 10)
        pet.add_experience(5)
        pet.save()
        return Response(VirtualPetSerializer(pet).data)

    @action(detail=True, methods=['post'])
    def interact(self, request, pk=None):
        """Interact with pet"""
        pet = self.get_object()
        pet.last_interaction = timezone.now()
        pet.mood_score = min(1.0, pet.mood_score + 0.1)
        if pet.mood_score >= 0.8:
            pet.mood = 'happy'
        pet.add_experience(3)
        pet.save()
        return Response(VirtualPetSerializer(pet).data)


# ==================== STREAKS ====================

class StreakViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Streak.objects.all()
    serializer_class = StreakSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Streak.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def mine(self, request):
        """Get current user's streak"""
        streak, _ = Streak.objects.get_or_create(user=request.user)
        return Response(StreakSerializer(streak).data)


# ==================== ACHIEVEMENTS ====================

class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Achievement.objects.filter(user=self.request.user).order_by("-unlocked_at")


def check_streak_achievements(user):
    """Check and unlock streak-based achievements"""
    try:
        streak = user.streak
        achievements = {
            'streak_3': (3, '3 Day Streak', 'Maintained calm for 3 consecutive days'),
            'streak_7': (7, '7 Day Streak', 'Maintained calm for a week'),
            'streak_30': (30, '30 Day Streak', 'Maintained calm for a month'),
        }
        
        for ach_id, (days, title, desc) in achievements.items():
            if streak.current_streak >= days:
                Achievement.objects.get_or_create(
                    user=user,
                    achievement_id=ach_id,
                    defaults={
                        'achievement_type': 'streak',
                        'title': title,
                        'description': desc,
                        'icon': 'streak'
                    }
                )
    except Streak.DoesNotExist:
        pass


def check_breathing_achievements(user):
    """Check and unlock breathing-based achievements"""
    profile, _ = UserProfile.objects.get_or_create(user=user)
    achievements = {
        'breathing_10': (10, 'Breathing Beginner', 'Completed 10 breathing exercises'),
        'breathing_50': (50, 'Breathing Master', 'Completed 50 breathing exercises'),
        'breathing_100': (100, 'Zen Master', 'Completed 100 breathing exercises'),
    }
    
    for ach_id, (count, title, desc) in achievements.items():
        if profile.total_breathing_sessions >= count:
            Achievement.objects.get_or_create(
                user=user,
                achievement_id=ach_id,
                defaults={
                    'achievement_type': 'breathing',
                    'title': title,
                    'description': desc,
                    'icon': 'breathing'
                }
            )


def check_stress_management_achievements(user):
    """Check and unlock stress management achievements"""
    profile, _ = UserProfile.objects.get_or_create(user=user)
    achievements = {
        'stress_resolved_10': (10, 'Stress Buster', 'Resolved 10 stress events'),
        'stress_resolved_50': (50, 'Calm Champion', 'Resolved 50 stress events'),
    }
    
    for ach_id, (count, title, desc) in achievements.items():
        if profile.total_stress_events_resolved >= count:
            Achievement.objects.get_or_create(
                user=user,
                achievement_id=ach_id,
                defaults={
                    'achievement_type': 'stress_management',
                    'title': title,
                    'description': desc,
                    'icon': 'stress'
                }
            )


# ==================== UNLOCKABLES ====================

class UnlockableViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Unlockable.objects.all()
    serializer_class = UnlockableSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get unlockables available to user"""
        user = request.user
        try:
            pet = user.virtual_pet
            streak = user.streak
        except (VirtualPet.DoesNotExist, Streak.DoesNotExist):
            pet = None
            streak = None
        
        unlockables = Unlockable.objects.all()
        available = []
        
        for unlockable in unlockables:
            can_unlock = True
            if unlockable.required_level > (pet.level if pet else 1):
                can_unlock = False
            if unlockable.required_streak and streak:
                if unlockable.required_streak > streak.current_streak:
                    can_unlock = False
            if unlockable.required_achievement:
                if not Achievement.objects.filter(
                    user=user,
                    achievement_id=unlockable.required_achievement
                ).exists():
                    can_unlock = False
            
            if can_unlock:
                available.append(unlockable)
        
        serializer = UnlockableSerializer(available, many=True)
        return Response(serializer.data)


class UserUnlockableViewSet(viewsets.ModelViewSet):
    queryset = UserUnlockable.objects.all()
    serializer_class = UserUnlockableSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserUnlockable.objects.filter(user=self.request.user).order_by("-unlocked_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ==================== JOURNAL ====================

class JournalEntryViewSet(viewsets.ModelViewSet):
    queryset = JournalEntry.objects.all()
    serializer_class = JournalEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return JournalEntry.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ==================== USER PROFILE ====================

class UserProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def mine(self, request):
        """Get current user's profile"""
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return Response(UserProfileSerializer(profile).data)

    @action(detail=False, methods=['patch'])
    def update_settings(self, request):
        """Update user settings"""
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        profile.notifications_enabled = request.data.get('notifications_enabled', profile.notifications_enabled)
        profile.haptic_feedback_enabled = request.data.get('haptic_feedback_enabled', profile.haptic_feedback_enabled)
        profile.save()
        return Response(UserProfileSerializer(profile).data)


# ==================== ANALYTICS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics(request):
    """Get analytics and trends for the user"""
    user = request.user
    days = int(request.query_params.get('days', 7))
    
    since = timezone.now() - timedelta(days=days)
    
    # Heart rate stats
    readings = Reading.objects.filter(user=user, ts__gte=since)
    hr_stats = readings.aggregate(
        avg_hr=Avg('hr_bpm'),
        avg_hrv=Avg('hrv_rmssd')
    )
    
    # Stress events
    stress_events = StressEvent.objects.filter(user=user, ts__gte=since)
    stress_stats = {
        'total': stress_events.count(),
        'resolved': stress_events.filter(resolved=True).count(),
        'by_level': {}
    }
    for level, _ in StressEvent.STRESS_LEVELS:
        stress_stats['by_level'][level] = stress_events.filter(level=level).count()
    
    # Breathing sessions
    breathing_sessions = BreathingSession.objects.filter(user=user, started_at__gte=since)
    breathing_stats = {
        'total': breathing_sessions.count(),
        'completed': breathing_sessions.filter(completed=True).count(),
        'total_duration': sum(s.duration_seconds or 0 for s in breathing_sessions.filter(completed=True))
    }
    
    # Update profile averages
    profile, _ = UserProfile.objects.get_or_create(user=user)
    if hr_stats['avg_hr']:
        profile.average_hr_bpm = hr_stats['avg_hr']
    if hr_stats['avg_hrv']:
        profile.average_hrv = hr_stats['avg_hrv']
    profile.save()
    
    return Response({
        'heart_rate': hr_stats,
        'stress': stress_stats,
        'breathing': breathing_stats,
        'period_days': days
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mood_meter(request):
    """Get pet mood meter and user stress trends"""
    user = request.user
    
    try:
        pet = user.virtual_pet
        pet_data = VirtualPetSerializer(pet).data
    except VirtualPet.DoesNotExist:
        pet_data = None
    
    # Recent stress trend (last 24 hours)
    day_ago = timezone.now() - timedelta(hours=24)
    recent_stress = StressEvent.objects.filter(
        user=user,
        ts__gte=day_ago,
        resolved=False
    ).count()
    
    # Recent readings
    recent_readings = Reading.objects.filter(
        user=user,
        ts__gte=day_ago
    ).order_by('-ts')[:10]
    
    return Response({
        'pet': pet_data,
        'recent_stress_events': recent_stress,
        'recent_readings': ReadingSerializer(recent_readings, many=True).data,
        'mood_score': pet.mood_score if pet_data else 0.5
    })
