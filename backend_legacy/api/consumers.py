import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import StressEvent, VirtualPet, Reading


class UserConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for user-specific real-time updates"""
    
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'user_{self.user_id}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        
        # Echo message back to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))
    
    # Receive message from room group
    async def user_update(self, event):
        message = event['message']
        data = event.get('data', {})
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'message': message,
            'data': data
        }))


class StressAlertConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for stress alerts and pet mood updates"""
    
    async def connect(self):
        user = self.scope.get('user')
        if user.is_authenticated:
            self.user = user
            self.room_group_name = f'stress_alerts_{user.id}'
            
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
        else:
            await self.close()
    
    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'message')
        
        if message_type == 'ping':
            await self.send(text_data=json.dumps({
                'type': 'pong'
            }))
    
    # Receive message from room group
    async def stress_alert(self, event):
        """Send stress alert to connected client"""
        await self.send(text_data=json.dumps({
            'type': 'stress_alert',
            'data': event['data']
        }))
    
    async def pet_update(self, event):
        """Send pet mood/state update to connected client"""
        await self.send(text_data=json.dumps({
            'type': 'pet_update',
            'data': event['data']
        }))
    
    async def reading_update(self, event):
        """Send new reading update to connected client"""
        await self.send(text_data=json.dumps({
            'type': 'reading_update',
            'data': event['data']
        }))


# Helper function to send WebSocket messages from views
async def send_stress_alert(user_id, stress_event_data):
    """Send stress alert via WebSocket"""
    from channels.layers import get_channel_layer
    channel_layer = get_channel_layer()
    
    await channel_layer.group_send(
        f'stress_alerts_{user_id}',
        {
            'type': 'stress_alert',
            'data': stress_event_data
        }
    )


async def send_pet_update(user_id, pet_data):
    """Send pet update via WebSocket"""
    from channels.layers import get_channel_layer
    channel_layer = get_channel_layer()
    
    await channel_layer.group_send(
        f'stress_alerts_{user_id}',
        {
            'type': 'pet_update',
            'data': pet_data
        }
    )

