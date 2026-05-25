import { readingService, analysisService, breathingService, apiClient } from './api';

jest.mock('axios', () => {
  const mAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
    },
  };
  return {
    create: jest.fn(() => mAxiosInstance),
  };
});

describe('api services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('readingService.getReadings fetches data', async () => {
    const mockData = [{ id: 1, heart_rate: 60, hrv: 40, stress_level: 20, timestamp: '2024-01-01' }];
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockData });
    
    const result = await readingService.getReadings(10);
    expect(apiClient.get).toHaveBeenCalledWith('/data', { params: { limit: 10 } });
    expect(result).toEqual(mockData);
  });

  test('readingService.createReading posts data', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { status: 'ok' } });
    const payload = { heart_rate: 65, stress_level: 30 };
    
    const result = await readingService.createReading(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/data', payload);
    expect(result).toEqual({ status: 'ok' });
  });

  test('stub methods throw descriptive errors', async () => {
    await expect(readingService.getReading(1)).rejects.toThrow(/not implemented yet/);
    await expect(readingService.updateReading(1, {})).rejects.toThrow(/not implemented yet/);
    await expect(readingService.deleteReading(1)).rejects.toThrow(/not implemented yet/);
    await expect(readingService.exportCsv()).rejects.toThrow(/not implemented yet/);
  });

  test('analysisService.analyze posts to analyze', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { stress_label: 'calm' } });
    const payload = { heart_rate: 60, hrv: 55 };
    
    const result = await analysisService.analyze(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/analyze', payload);
    expect(result).toEqual({ stress_label: 'calm' });
  });

  test('breathingService functions call correct endpoints', async () => {
    (apiClient.post as jest.Mock)
      .mockResolvedValueOnce({ data: { id: 1 } })
      .mockResolvedValueOnce({ data: { id: 1, completed: true } });
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { streak: 5 } });

    await breathingService.startSession();
    expect(apiClient.post).toHaveBeenCalledWith('/breathing/start');

    await breathingService.completeSession(1);
    expect(apiClient.post).toHaveBeenCalledWith('/breathing/1/complete');

    await breathingService.getStreak();
    expect(apiClient.get).toHaveBeenCalledWith('/breathing/streak');
  });
});
