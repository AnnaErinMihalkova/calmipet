from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import ReadingViewSet, signup, login_view

router = DefaultRouter()
router.register(r'readings', ReadingViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/auth/signup/', signup, name='signup'),
    path('api/auth/login/', login_view, name='login'),
]
