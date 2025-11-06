from rest_framework import viewsets, permissions
from .models import Reading
from .serializers import ReadingSerializer

class ReadingViewSet(viewsets.ModelViewSet):
    queryset = Reading.objects.all().order_by('-ts')
    serializer_class = ReadingSerializer
    permission_classes = [permissions.AllowAny]
