from rest_framework import viewsets, permissions
from .models import Reading
from .serializers import ReadingSerializer

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class ReadingViewSet(viewsets.ModelViewSet):
    queryset = Reading.objects.all()
    serializer_class = ReadingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Reading.objects.filter(user=self.request.user).order_by("-ts")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
