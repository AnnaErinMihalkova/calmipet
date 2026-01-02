from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    ReadingViewSet, StressEventViewSet, BreathingSessionViewSet,
    VirtualPetViewSet, StreakViewSet, AchievementViewSet,
    UnlockableViewSet, UserUnlockableViewSet, JournalEntryViewSet,
    UserProfileViewSet, signup, login_view, current_user, logout_view, delete_account, update_account, analytics, mood_meter, refresh_token, createReading, privacy_settings
)

router = DefaultRouter()
router.register(r'readings', ReadingViewSet, basename='reading')
router.register(r'stress-events', StressEventViewSet, basename='stressevent')
router.register(r'breathing-sessions', BreathingSessionViewSet, basename='breathingsession')
router.register(r'pets', VirtualPetViewSet, basename='virtualpet')
router.register(r'streaks', StreakViewSet, basename='streak')
router.register(r'achievements', AchievementViewSet, basename='achievement')
router.register(r'unlockables', UnlockableViewSet, basename='unlockable')
router.register(r'user-unlockables', UserUnlockableViewSet, basename='userunlockable')
router.register(r'journal', JournalEntryViewSet, basename='journalentry')
router.register(r'profile', UserProfileViewSet, basename='userprofile')

urlpatterns = [
    path('admin/', admin.site.urls),
    # Bracelet simulator endpoint (CSRF-exempt, not colliding with router detail routes)
    path('api/bracelet/readings/', createReading, name='create_reading'),
    path('api/', include(router.urls)),
    path('api/auth/signup/', signup, name='signup'),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/refresh/', refresh_token, name='refresh_token'),
    path('api/auth/me/', current_user, name='current_user'),
    path('api/auth/logout/', logout_view, name='logout'),
    path('api/auth/delete/', delete_account, name='delete_account'),
    path('api/auth/update/', update_account, name='update_account'),
    path('api/privacy/', privacy_settings, name='privacy_settings'),
    path('api/analytics/', analytics, name='analytics'),
    path('api/mood-meter/', mood_meter, name='mood_meter'),
    # Aliases for mobile app compatibility
    path('auth/signup/', signup, name='signup_alias'),
    path('auth/login/', login_view, name='login_alias'),
    path('auth/refresh/', refresh_token, name='refresh_alias'),
    path('users/me/', current_user, name='users_me'),
]
