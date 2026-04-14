import { authService, validateEmail } from './auth';
import { apiClient } from './api';
import { clearCachedUser } from './bracelet-simulator';

jest.mock('./api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  }
}));

jest.mock('./bracelet-simulator', () => ({
  clearCachedUser: jest.fn(),
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('validateEmail validates email format', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
  });

  test('register stores token and returns data', async () => {
    const mockData = { token: 'mock-jwt-token', user_id: 1 };
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockData });

    const payload = { email: 'test@example.com', username: 'testuser', password: 'password123' };
    const result = await authService.register(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/auth/register/', payload);
    expect(localStorage.getItem('calmipet-token')).toBe('mock-jwt-token');
    expect(result).toEqual(mockData);
  });

  test('login stores token and returns data', async () => {
    const mockData = { token: 'mock-jwt-token', user_id: 1 };
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockData });

    const payload = { email: 'test@example.com', password: 'password123' };
    const result = await authService.login(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login/', payload);
    expect(localStorage.getItem('calmipet-token')).toBe('mock-jwt-token');
    expect(result).toEqual(mockData);
  });

  test('logout removes token and clears cached user', () => {
    localStorage.setItem('calmipet-token', 'mock-jwt-token');
    authService.logout();

    expect(localStorage.getItem('calmipet-token')).toBeNull();
    expect(clearCachedUser).toHaveBeenCalled();
  });

  test('getMe fetches user profile', async () => {
    const mockProfile = { id: 1, email: 'test@test.com', username: 'tester', is_admin: false, pet_type: 'raccoon' };
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockProfile });

    const result = await authService.getMe();
    expect(apiClient.get).toHaveBeenCalledWith('/auth/me/');
    expect(result).toEqual(mockProfile);
  });

  test('isAuthenticated checks localStorage', () => {
    expect(authService.isAuthenticated()).toBe(false);
    localStorage.setItem('calmipet-token', 'mock');
    expect(authService.isAuthenticated()).toBe(true);
  });

  test('updatePet updates pet type', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({ data: { pet_type: 'fox' } });

    const result = await authService.updatePet('fox');
    expect(apiClient.patch).toHaveBeenCalledWith('/users/pet/', null, { params: { pet_type: 'fox' } });
    expect(result).toEqual({ pet_type: 'fox' });
  });

  test('deleteAccount calls delete endpoint', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce({});
    await authService.deleteAccount();
    expect(apiClient.delete).toHaveBeenCalledWith('/auth/delete/');
  });
});
