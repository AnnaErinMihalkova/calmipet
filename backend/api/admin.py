from django.contrib import admin
from .models import (
    Reading, StressEvent, BreathingSession, VirtualPet, Streak,
    Achievement, Unlockable, UserUnlockable, JournalEntry, UserProfile
)


@admin.register(Reading)
class ReadingAdmin(admin.ModelAdmin):
    list_display = ('user', 'ts', 'hr_bpm', 'hrv_rmssd', 'grip_force', 'posture_score')
    list_filter = ('ts', 'user')
    search_fields = ('user__username', 'user__email')
    date_hierarchy = 'ts'


@admin.register(StressEvent)
class StressEventAdmin(admin.ModelAdmin):
    list_display = ('user', 'ts', 'level', 'detected_by', 'resolved', 'resolved_at')
    list_filter = ('level', 'resolved', 'ts')
    search_fields = ('user__username', 'detected_by')
    date_hierarchy = 'ts'
    readonly_fields = ('resolved_at',)


@admin.register(BreathingSession)
class BreathingSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'started_at', 'completed', 'exercise_type', 'duration_seconds')
    list_filter = ('completed', 'exercise_type', 'started_at')
    search_fields = ('user__username',)
    date_hierarchy = 'started_at'


@admin.register(VirtualPet)
class VirtualPetAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'pet_type', 'level', 'mood', 'mood_score', 'health')
    list_filter = ('pet_type', 'mood', 'level')
    search_fields = ('user__username', 'name')
    readonly_fields = ('created_at', 'last_interaction')


@admin.register(Streak)
class StreakAdmin(admin.ModelAdmin):
    list_display = ('user', 'current_streak', 'longest_streak', 'last_activity_date')
    list_filter = ('last_activity_date',)
    search_fields = ('user__username',)


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('user', 'achievement_id', 'title', 'achievement_type', 'unlocked_at')
    list_filter = ('achievement_type', 'unlocked_at')
    search_fields = ('user__username', 'title', 'achievement_id')
    date_hierarchy = 'unlocked_at'


@admin.register(Unlockable)
class UnlockableAdmin(admin.ModelAdmin):
    list_display = ('name', 'unlockable_type', 'required_level', 'required_streak', 'cost_coins')
    list_filter = ('unlockable_type', 'required_level')
    search_fields = ('name', 'unlockable_id')


@admin.register(UserUnlockable)
class UserUnlockableAdmin(admin.ModelAdmin):
    list_display = ('user', 'unlockable', 'unlocked_at', 'is_active')
    list_filter = ('is_active', 'unlocked_at', 'unlockable__unlockable_type')
    search_fields = ('user__username', 'unlockable__name')
    date_hierarchy = 'unlocked_at'


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'mood', 'stress_level')
    list_filter = ('mood', 'stress_level', 'created_at')
    search_fields = ('user__username', 'content')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'coins', 'total_breathing_sessions', 'total_stress_events_resolved', 'notifications_enabled')
    list_filter = ('notifications_enabled', 'haptic_feedback_enabled', 'created_at')
    search_fields = ('user__username',)
    readonly_fields = ('created_at',)
