from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import StressEvent, VirtualPet, Reading
import json


@receiver(post_save, sender=StressEvent)
def notify_stress_event(sender, instance, created, **kwargs):
    """Send WebSocket notification when stress event is created"""
    if created:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f'stress_alerts_{instance.user.id}',
                {
                    'type': 'stress_alert',
                    'data': {
                        'id': instance.id,
                        'level': instance.level,
                        'detected_by': instance.detected_by,
                        'timestamp': instance.ts.isoformat(),
                    }
                }
            )


@receiver(post_save, sender=VirtualPet)
def notify_pet_update(sender, instance, **kwargs):
    """Send WebSocket notification when pet state changes"""
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            f'stress_alerts_{instance.user.id}',
            {
                'type': 'pet_update',
                'data': {
                    'mood': instance.mood,
                    'mood_score': instance.mood_score,
                    'level': instance.level,
                    'health': instance.health,
                }
            }
        )

