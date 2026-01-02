from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import (
    Reading, StressEvent, BreathingSession, VirtualPet, Streak,
    Achievement, Unlockable, UserUnlockable, JournalEntry, UserProfile, PrivacySettings
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'date_joined')


class SignUpSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        # Create user profile and virtual pet
        UserProfile.objects.create(user=user)
        VirtualPet.objects.create(user=user)
        Streak.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            try:
                user = User.objects.get(email=email)
                user = authenticate(username=user.username, password=password)
                if not user:
                    raise serializers.ValidationError("Invalid email or password.")
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid email or password.")
        else:
            raise serializers.ValidationError("Must include 'email' and 'password'.")

        attrs['user'] = user
        return attrs


class ReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reading
        fields = '__all__'
        read_only_fields = ('user', 'ts')


class CreateReadingDto(serializers.Serializer):
    """Serializer for creating readings with userId, hr, optional hrv, and timestamp"""
    userId = serializers.CharField(required=True, help_text="User ID (username or ID)")
    hr = serializers.IntegerField(required=True, min_value=30, max_value=220, help_text="Heart rate in BPM (30-220)")
    hrv = serializers.FloatField(required=False, allow_null=True, min_value=10, max_value=200, help_text="Heart rate variability (optional, 10-200)")
    timestamp = serializers.DateTimeField(required=False, allow_null=True, help_text="Timestamp (ISO8601 format). If not provided, current time is used.")
    
    def validate_userId(self, value):
        """Validate that the user exists"""
        from django.contrib.auth.models import User
        try:
            # Try to find user by ID (if numeric) or username
            if value.isdigit():
                user = User.objects.get(id=int(value))
            else:
                user = User.objects.get(username=value)
            return user
        except User.DoesNotExist:
            raise serializers.ValidationError(f"User with ID/username '{value}' does not exist.")
    
    def validate_hr(self, value):
        """Validate HR is between 30 and 220"""
        # Additional explicit validation with custom error message
        # (min_value/max_value already validate, but this provides clearer errors)
        if not (30 <= value <= 220):
            raise serializers.ValidationError("HR must be between 30 and 220 BPM.")
        return value
    
    def validate_hrv(self, value):
        """Validate HRV is between 10 and 200 if provided"""
        if value is not None:
            # Additional explicit validation with custom error message
            if not (10 <= value <= 200):
                raise serializers.ValidationError("HRV must be between 10 and 200 if provided.")
        return value
    
    def validate_timestamp(self, value):
        """Validate timestamp is in ISO8601 format if provided as string"""
        # DateTimeField automatically parses ISO8601, but we can add explicit validation
        if value is not None and isinstance(value, str):
            from django.utils.dateparse import parse_datetime
            parsed = parse_datetime(value)
            if parsed is None:
                raise serializers.ValidationError("Timestamp must be in ISO8601 format (e.g., '2024-12-01T10:30:00Z').")
        return value
    
    def validate(self, attrs):
        """Cross-field validation"""
        # Additional validation can be added here if needed
        return attrs
    
    def create(self, validated_data):
        """Create a Reading instance"""
        user = validated_data['userId']
        hr_bpm = validated_data['hr']
        hrv_rmssd = validated_data.get('hrv')
        ts = validated_data.get('timestamp')
        
        # Create reading with timestamp if provided
        # Note: auto_now_add=True fields can be set during creation
        reading_data = {
            'user': user,
            'hr_bpm': hr_bpm,
        }
        
        if hrv_rmssd is not None:
            reading_data['hrv_rmssd'] = hrv_rmssd
        
        if ts:
            reading_data['ts'] = ts
        
        reading = Reading.objects.create(**reading_data)
        return reading


class StressEventSerializer(serializers.ModelSerializer):
    reading = ReadingSerializer(read_only=True)
    
    class Meta:
        model = StressEvent
        fields = '__all__'
        read_only_fields = ('user', 'ts', 'resolved_at')


class BreathingSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BreathingSession
        fields = '__all__'
        read_only_fields = ('user', 'started_at', 'completed_at', 'duration_seconds')


class VirtualPetSerializer(serializers.ModelSerializer):
    class Meta:
        model = VirtualPet
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'last_interaction')


class StreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = Streak
        fields = '__all__'
        read_only_fields = ('user',)


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = '__all__'
        read_only_fields = ('user', 'unlocked_at')


class UnlockableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unlockable
        fields = '__all__'


class UserUnlockableSerializer(serializers.ModelSerializer):
    unlockable = UnlockableSerializer(read_only=True)
    unlockable_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = UserUnlockable
        fields = '__all__'
        read_only_fields = ('user', 'unlocked_at')

    def create(self, validated_data):
        unlockable_id = validated_data.pop('unlockable_id', None)
        if unlockable_id:
            validated_data['unlockable'] = Unlockable.objects.get(id=unlockable_id)
        return super().create(validated_data)


class JournalEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ('user', 'created_at')


class PrivacySettingsSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = PrivacySettings
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')
