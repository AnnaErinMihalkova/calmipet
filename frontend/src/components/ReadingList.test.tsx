import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import ReadingList from './ReadingList';
import { authService } from '../services/auth';
import { readingService } from '../services/api';

jest.mock('../services/auth', () => ({
  authService: {
    getMe: jest.fn().mockResolvedValue({ id: 1 }),
  },
}));

jest.mock('../services/api', () => ({
  readingService: {
    getReadings: jest.fn().mockResolvedValue([
      { id: 1, heart_rate: 60, stress_level: 80, timestamp: '2024-01-01T12:00:00Z' }, // Calm
      { id: 2, heart_rate: 80, stress_level: 50, timestamp: '2024-01-01T12:05:00Z' }, // Moderate
      { id: 3, heart_rate: 100, stress_level: 20, timestamp: '2024-01-01T12:10:00Z' } // Stressed
    ]),
    createReading: jest.fn().mockResolvedValue({ status: 'ok' }),
    exportCsv: jest.fn().mockResolvedValue(new Blob(['mock csv'], { type: 'text/csv' })),
  },
}));

describe('ReadingList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches and displays readings on mount', async () => {
    render(<ReadingList />);
    
    expect(screen.getByText('Loading readings...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('CalmiPet Wellness Readings')).toBeInTheDocument();
    });

    // Check if readings were loaded and mood logic is correct
    // < 30 is Stressed, < 50 is Moderate, >= 50 is Calm
    expect(screen.getByText('😫 Stressed')).toBeInTheDocument();
    expect(screen.getByText('😐 Moderate')).toBeInTheDocument();
    expect(screen.getByText('😌 Calm')).toBeInTheDocument();

    expect(screen.getByText('60 BPM')).toBeInTheDocument();
    expect(screen.getByText('80 BPM')).toBeInTheDocument();
    expect(screen.getByText('100 BPM')).toBeInTheDocument();
  });

  test('handles auth error', async () => {
    (authService.getMe as jest.Mock).mockRejectedValueOnce(new Error('unauthorized'));
    
    render(<ReadingList />);
    
    await waitFor(() => {
      expect(screen.getByText('Please log in to view readings')).toBeInTheDocument();
    });
  });

  test('handles add test reading', async () => {
    render(<ReadingList />);
    
    await waitFor(() => {
      expect(screen.getByText('Add Test Reading')).toBeInTheDocument();
    });

    const addBtn = screen.getByText('Add Test Reading');
    await act(async () => {
      fireEvent.click(addBtn);
    });

    expect(readingService.createReading).toHaveBeenCalled();
  });

  test('handles export csv', async () => {
    // Mock URL functions
    global.URL.createObjectURL = jest.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = jest.fn();

    render(<ReadingList />);
    
    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    const exportBtn = screen.getByText('Export CSV');
    await act(async () => {
      fireEvent.click(exportBtn);
    });

    expect(readingService.exportCsv).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });
});
