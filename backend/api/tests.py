from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Reading


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
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
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
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
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
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
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
