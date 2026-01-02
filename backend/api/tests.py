from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Reading, UserProfile, VirtualPet, Streak, StressEvent, BreathingSession, Achievement, UserUnlockable, JournalEntry


class AuthenticationTests(TestCase):
    """Test authentication flows: signup and login"""
    
    def setUp(self):
        self.client = APIClient()
        self.signup_url = '/api/auth/signup/'
        self.login_url = '/api/auth/login/'
        self.me_url = '/api/auth/me/'
        self.logout_url = '/api/auth/logout/'
    
    def test_signup_with_valid_data(self):
        """Test successful user signup"""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'TestPassword123!'
        }
        response = self.client.post(self.signup_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')
        self.assertEqual(response.data['user']['email'], 'test@example.com')
        
        # Verify user was created
        self.assertTrue(User.objects.filter(username='testuser').exists())
        self.assertTrue(User.objects.filter(email='test@example.com').exists())
    
    def test_signup_with_duplicate_email(self):
        """Test signup fails with duplicate email"""
        # Create first user
        User.objects.create_user(
            username='existing',
            email='duplicate@example.com',
            password='password123'
        )
        
        # Try to signup with same email
        data = {
            'username': 'newuser',
            'email': 'duplicate@example.com',
            'password': 'TestPassword123!'
        }
        response = self.client.post(self.signup_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_signup_with_short_password(self):
        """Test signup fails with password less than 8 characters"""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'short'
        }
        response = self.client.post(self.signup_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
    
    def test_signup_with_invalid_email(self):
        """Test signup fails with invalid email format"""
        data = {
            'username': 'testuser',
            'email': 'invalid-email',
            'password': 'TestPassword123!'
        }
        response = self.client.post(self.signup_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_login_with_valid_credentials(self):
        """Test successful login"""
        # Create user first
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPassword123!'
        )
        
        data = {
            'email': 'test@example.com',
            'password': 'TestPassword123!'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'test@example.com')
    
    def test_login_with_invalid_email(self):
        """Test login fails with non-existent email"""
        data = {
            'email': 'nonexistent@example.com',
            'password': 'TestPassword123!'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_login_with_wrong_password(self):
        """Test login fails with wrong password"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='CorrectPassword123!'
        )
        
        data = {
            'email': 'test@example.com',
            'password': 'WrongPassword123!'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_get_current_user_authenticated(self):
        """Test getting current user when authenticated"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPassword123!'
        )
        self.client.force_authenticate(user=user)
        
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')
    
    def test_get_current_user_unauthenticated(self):
        """Test getting current user fails when not authenticated"""
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_session_persistence(self):
        """Test that session persists after login"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPassword123!'
        )
        
        # Login
        data = {
            'email': 'test@example.com',
            'password': 'TestPassword123!'
        }
        login_response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        
        # Session should persist - can access protected endpoint
        me_response = self.client.get(self.me_url)
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
    
    def test_logout(self):
        """Test logout functionality"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPassword123!'
        )
        self.client.force_authenticate(user=user)
        
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ReadingsCRUDTests(TestCase):
    """Test Readings CRUD operations"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPassword123!'
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='TestPassword123!'
        )
        self.readings_url = '/api/readings/'
    
    def test_create_reading_authenticated(self):
        """Test creating a reading when authenticated"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'hr_bpm': 75,
            'hrv_rmssd': 45.5,
            'grip_force': 30.0
        }
        response = self.client.post(self.readings_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['hr_bpm'], 75)
        self.assertEqual(response.data['hrv_rmssd'], 45.5)
        
        # Verify reading was created and assigned to user
        reading = Reading.objects.get(id=response.data['id'])
        self.assertEqual(reading.user, self.user)
    
    def test_create_reading_unauthenticated(self):
        """Test creating a reading fails when not authenticated"""
        data = {
            'hr_bpm': 75,
            'hrv_rmssd': 45.5
        }
        response = self.client.post(self.readings_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_list_readings_authenticated(self):
        """Test listing readings when authenticated"""
        self.client.force_authenticate(user=self.user)
        
        # Create some readings
        Reading.objects.create(user=self.user, hr_bpm=75, hrv_rmssd=45.5)
        Reading.objects.create(user=self.user, hr_bpm=80, hrv_rmssd=40.0)
        Reading.objects.create(user=self.other_user, hr_bpm=70, hrv_rmssd=50.0)
        
        response = self.client.get(self.readings_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Only user's readings
        
        # Verify all returned readings belong to the user
        for reading_data in response.data:
            reading = Reading.objects.get(id=reading_data['id'])
            self.assertEqual(reading.user, self.user)
    
    def test_list_readings_unauthenticated(self):
        """Test listing readings fails when not authenticated"""
        response = self.client.get(self.readings_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_get_single_reading(self):
        """Test retrieving a single reading"""
        self.client.force_authenticate(user=self.user)
        
        reading = Reading.objects.create(
            user=self.user,
            hr_bpm=75,
            hrv_rmssd=45.5
        )
        
        url = f'{self.readings_url}{reading.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['hr_bpm'], 75)
    
    def test_get_other_user_reading_fails(self):
        """Test that users cannot access other users' readings"""
        self.client.force_authenticate(user=self.user)
        
        other_reading = Reading.objects.create(
            user=self.other_user,
            hr_bpm=70,
            hrv_rmssd=50.0
        )
        
        url = f'{self.readings_url}{other_reading.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_update_reading(self):
        """Test updating a reading"""
        self.client.force_authenticate(user=self.user)
        
        reading = Reading.objects.create(
            user=self.user,
            hr_bpm=75,
            hrv_rmssd=45.5
        )
        
        url = f'{self.readings_url}{reading.id}/'
        data = {
            'hr_bpm': 80,
            'hrv_rmssd': 40.0
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['hr_bpm'], 80)
        
        reading.refresh_from_db()
        self.assertEqual(reading.hr_bpm, 80)
    
    def test_delete_reading(self):
        """Test deleting a reading"""
        self.client.force_authenticate(user=self.user)
        
        reading = Reading.objects.create(
            user=self.user,
            hr_bpm=75,
            hrv_rmssd=45.5
        )
        
        url = f'{self.readings_url}{reading.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        self.assertFalse(Reading.objects.filter(id=reading.id).exists())


class PrivacyTests(TestCase):
    """Test privacy features including data deletion"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='privacyuser',
            email='privacy@example.com',
            password='TestPassword123!'
        )
        self.client.force_authenticate(user=self.user)
        self.reset_url = '/api/privacy/reset-data/'
        
        # Create some data
        Reading.objects.create(user=self.user, hr_bpm=80, hrv_rmssd=40)
        
        # Ensure profile exists and has data
        if not hasattr(self.user, 'profile'):
            UserProfile.objects.create(user=self.user)
        self.user.profile.coins = 100
        self.user.profile.save()
        
        # Ensure pet exists and has data
        if not hasattr(self.user, 'virtual_pet'):
            VirtualPet.objects.create(user=self.user)
        self.user.virtual_pet.name = 'OldName'
        self.user.virtual_pet.save()
        
    def test_reset_data_without_confirmation(self):
        """Test reset fails without confirmation"""
        response = self.client.post(self.reset_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_reset_data_success(self):
        """Test successful data reset"""
        response = self.client.post(self.reset_url, {'confirm': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify Readings are gone
        self.assertEqual(Reading.objects.filter(user=self.user).count(), 0)
        
        # Verify Profile reset
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.coins, 0)
        
        # Verify Pet reset
        self.user.virtual_pet.refresh_from_db()
        self.assertEqual(self.user.virtual_pet.name, 'Buddy')


class ExportEndpointTests(TestCase):
    """Basic tests for readings export endpoint and rate limiting"""
    
    def setUp(self):
        from django.core.cache import cache
        cache.clear()
        
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='exportuser',
            email='export@example.com',
            password='TestPassword123!'
        )
        self.client.force_authenticate(user=self.user)
        self.export_csv_url = '/api/export-readings/?format=csv'
        self.export_json_url = '/api/export-readings/?format=json'
        
        # Seed some readings
        Reading.objects.create(user=self.user, hr_bpm=70, hrv_rmssd=50.0)
        Reading.objects.create(user=self.user, hr_bpm=80, hrv_rmssd=40.0)
    
    def test_export_csv_success(self):
        """Export CSV returns streaming CSV with correct headers"""
        response = self.client.get(self.export_csv_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment; filename=', response['Content-Disposition'])
        
        # Read streaming content
        content = b''.join(response.streaming_content).decode('utf-8')
        self.assertIn('id,timestamp,hr_bpm,hrv_rmssd', content.splitlines()[0])
    
    def test_export_json_success(self):
        """Export JSON returns array of reading objects"""
        response = self.client.get(self.export_json_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        self.assertGreaterEqual(len(response.data), 2)
        self.assertIn('hr_bpm', response.data[0])
    
    def test_export_rate_limiting(self):
        """Rate limiting triggers 429 on fourth request within window"""
        # Allow first three requests
        for i in range(3):
            r = self.client.get(self.export_csv_url)
            self.assertEqual(r.status_code, status.HTTP_200_OK)
        # Fourth should be throttled
        r4 = self.client.get(self.export_csv_url)
        self.assertEqual(r4.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
