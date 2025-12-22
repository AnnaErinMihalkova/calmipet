from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import (
    Reading, StressEvent, BreathingSession, VirtualPet, Streak,
    Achievement, Unlockable, UserUnlockable, JournalEntry, UserProfile
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
