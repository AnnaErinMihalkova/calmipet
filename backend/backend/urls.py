from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    ReadingViewSet, StressEventViewSet, BreathingSessionViewSet,
    VirtualPetViewSet, StreakViewSet, AchievementViewSet,
    UnlockableViewSet, UserUnlockableViewSet, JournalEntryViewSet,
    UserProfileViewSet, signup, login_view, current_user, analytics, mood_meter
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
    path('api/', include(router.urls)),
    path('api/auth/signup/', signup, name='signup'),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/me/', current_user, name='current_user'),
    path('api/analytics/', analytics, name='analytics'),
    path('api/mood-meter/', mood_meter, name='mood_meter'),
]
