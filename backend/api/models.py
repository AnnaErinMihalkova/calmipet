from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import json


class Reading(models.Model):
    """Sensor readings from heart rate monitor and stress ball"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    ts = models.DateTimeField(auto_now_add=True, db_index=True)
    hr_bpm = models.PositiveSmallIntegerField(help_text="Heart rate in beats per minute")
    hrv_rmssd = models.FloatField(null=True, blank=True, help_text="Heart rate variability (RMSSD)")
    posture_score = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)], help_text="Posture quality score 0-1")
    grip_force = models.FloatField(null=True, blank=True, help_text="Stress ball pressure in Newtons or arbitrary units")
    breathing_rate = models.FloatField(null=True, blank=True, help_text="Breathing rate per minute")
    spo2 = models.FloatField(null=True, blank=True, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)], help_text="Blood oxygen saturation %")
    
    class Meta:
        ordering = ['-ts']
        indexes = [
            models.Index(fields=['user', '-ts']),
        ]

    def __str__(self):
        return f"{self.user} - {self.hr_bpm} bpm @ {self.ts}"


class StressEvent(models.Model):
    """Detected stress events based on sensor readings"""
    STRESS_LEVELS = [
        ('low', 'Low'),
        ('moderate', 'Moderate'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    ts = models.DateTimeField(auto_now_add=True, db_index=True)
    level = models.CharField(max_length=20, choices=STRESS_LEVELS)
    reading = models.ForeignKey(Reading, on_delete=models.SET_NULL, null=True, blank=True, related_name='stress_events')
    detected_by = models.CharField(max_length=50, help_text="What triggered detection: HR, HRV, grip, etc.")
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-ts']
        indexes = [
            models.Index(fields=['user', '-ts']),
            models.Index(fields=['user', 'resolved']),
        ]

    def __str__(self):
        return f"{self.user} - {self.level} stress @ {self.ts}"


class BreathingSession(models.Model):
    """Guided breathing exercise sessions"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    exercise_type = models.CharField(max_length=50, default='box_breathing', help_text="Type: box_breathing, 4-7-8, etc.")
    completed = models.BooleanField(default=False)
    stress_event = models.ForeignKey(StressEvent, on_delete=models.SET_NULL, null=True, blank=True, related_name='breathing_sessions')
    
    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        status = "Completed" if self.completed else "In Progress"
        return f"{self.user} - {self.exercise_type} - {status}"


class VirtualPet(models.Model):
    """Virtual pet state and mood"""
    PET_TYPES = [
        ('cat', 'Cat'),
        ('fox', 'Fox'),
        ('dragon', 'Dragon'),
        ('dog', 'Dog'),
        ('rabbit', 'Rabbit'),
    ]
    
    MOOD_STATES = [
        ('happy', 'Happy'),
        ('calm', 'Calm'),
        ('worried', 'Worried'),
        ('stressed', 'Stressed'),
        ('excited', 'Excited'),
        ('sleeping', 'Sleeping'),
    ]
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='virtual_pet')
    pet_type = models.CharField(max_length=20, choices=PET_TYPES, default='cat')
    name = models.CharField(max_length=50, default='Buddy')
    level = models.PositiveIntegerField(default=1)
    experience_points = models.PositiveIntegerField(default=0)
    mood = models.CharField(max_length=20, choices=MOOD_STATES, default='calm')
    mood_score = models.FloatField(default=0.5, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)], help_text="0=worried, 1=happy")
    health = models.PositiveIntegerField(default=100, validators=[MaxValueValidator(100)])
    last_fed = models.DateTimeField(null=True, blank=True)
    last_interaction = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    accessories = models.JSONField(default=list, blank=True, help_text="List of unlocked accessory IDs")
    environment = models.CharField(max_length=50, default='default', help_text="Current environment/theme")
    
    class Meta:
        ordering = ['-last_interaction']

    def __str__(self):
        return f"{self.user}'s {self.pet_type} - {self.name} (Lv.{self.level})"

    def update_mood_from_stress(self, stress_level):
        """Update pet mood based on user's stress level"""
        if stress_level == 'critical':
            self.mood = 'stressed'
            self.mood_score = max(0.0, self.mood_score - 0.2)
        elif stress_level == 'high':
            self.mood = 'worried'
            self.mood_score = max(0.0, self.mood_score - 0.1)
        elif stress_level == 'moderate':
            self.mood = 'calm'
            self.mood_score = max(0.0, self.mood_score - 0.05)
        else:
            self.mood = 'calm'
            self.mood_score = min(1.0, self.mood_score + 0.05)
        
        # Auto-adjust mood state based on score
        if self.mood_score >= 0.8:
            self.mood = 'happy'
        elif self.mood_score >= 0.6:
            self.mood = 'calm'
        elif self.mood_score >= 0.4:
            self.mood = 'worried'
        else:
            self.mood = 'stressed'
        
        self.save()

    def add_experience(self, points):
        """Add experience points and level up if needed"""
        self.experience_points += points
        # Simple leveling: 100 XP per level
        new_level = (self.experience_points // 100) + 1
        if new_level > self.level:
            self.level = new_level
        self.save()


class Streak(models.Model):
    """Daily streaks for maintaining calm"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='streak')
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user} - {self.current_streak} day streak"

    def update_streak(self):
        """Update streak based on today's activity"""
        today = timezone.now().date()
        
        if self.last_activity_date is None:
            self.current_streak = 1
            self.last_activity_date = today
        elif self.last_activity_date == today:
            # Already updated today
            pass
        elif self.last_activity_date == today - timezone.timedelta(days=1):
            # Consecutive day
            self.current_streak += 1
            self.last_activity_date = today
        else:
            # Streak broken
            self.current_streak = 1
            self.last_activity_date = today
        
        if self.current_streak > self.longest_streak:
            self.longest_streak = self.current_streak
        
        self.save()


class Achievement(models.Model):
    """Unlockable achievements"""
    ACHIEVEMENT_TYPES = [
        ('streak', 'Streak'),
        ('breathing', 'Breathing'),
        ('stress_management', 'Stress Management'),
        ('pet_care', 'Pet Care'),
        ('milestone', 'Milestone'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='achievements')
    achievement_id = models.CharField(max_length=100, help_text="Unique identifier: streak_7, breathing_10, etc.")
    achievement_type = models.CharField(max_length=30, choices=ACHIEVEMENT_TYPES)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    unlocked_at = models.DateTimeField(auto_now_add=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon identifier for frontend")
    
    class Meta:
        ordering = ['-unlocked_at']
        unique_together = ['user', 'achievement_id']

    def __str__(self):
        return f"{self.user} - {self.title}"


class Unlockable(models.Model):
    """Unlockable items (accessories, environments, pet types)"""
    UNLOCKABLE_TYPES = [
        ('accessory', 'Accessory'),
        ('environment', 'Environment'),
        ('pet_type', 'Pet Type'),
        ('color', 'Color Variant'),
    ]
    
    unlockable_id = models.CharField(max_length=100, unique=True)
    unlockable_type = models.CharField(max_length=30, choices=UNLOCKABLE_TYPES)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    required_level = models.PositiveIntegerField(default=1)
    required_streak = models.PositiveIntegerField(null=True, blank=True)
    required_achievement = models.CharField(max_length=100, blank=True, help_text="Required achievement_id")
    icon = models.CharField(max_length=50, blank=True)
    cost_coins = models.PositiveIntegerField(default=0, help_text="Virtual currency cost")
    
    def __str__(self):
        return f"{self.name} ({self.unlockable_type})"


class UserUnlockable(models.Model):
    """User's unlocked items"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='unlocked_items')
    unlockable = models.ForeignKey(Unlockable, on_delete=models.CASCADE)
    unlocked_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=False, help_text="Currently equipped/active")
    
    class Meta:
        unique_together = ['user', 'unlockable']
        ordering = ['-unlocked_at']

    def __str__(self):
        return f"{self.user} unlocked {self.unlockable.name}"


class JournalEntry(models.Model):
    """Emotional journal entries"""
    MOOD_CHOICES = [
        ('very_happy', 'Very Happy'),
        ('happy', 'Happy'),
        ('neutral', 'Neutral'),
        ('sad', 'Sad'),
        ('anxious', 'Anxious'),
        ('stressed', 'Stressed'),
        ('calm', 'Calm'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='journal_entries')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES)
    content = models.TextField()
    tags = models.JSONField(default=list, blank=True, help_text="List of tags")
    stress_level = models.CharField(max_length=20, choices=StressEvent.STRESS_LEVELS, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Journal Entries'

    def __str__(self):
        return f"{self.user} - {self.mood} @ {self.created_at}"


class UserProfile(models.Model):
    """Extended user profile with preferences and stats"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    coins = models.PositiveIntegerField(default=0, help_text="Virtual currency")
    total_breathing_sessions = models.PositiveIntegerField(default=0)
    total_stress_events_resolved = models.PositiveIntegerField(default=0)
    average_hr_bpm = models.FloatField(null=True, blank=True)
    average_hrv = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    notifications_enabled = models.BooleanField(default=True)
    haptic_feedback_enabled = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.user.username}'s profile"
