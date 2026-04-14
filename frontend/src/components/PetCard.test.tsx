import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PetCard from './PetCard';

// Mock the services
jest.mock('../services/auth', () => ({
  authService: {
    getMe: jest.fn().mockResolvedValue({ id: 1, email: 'test@test.com', username: 'tester', is_admin: false, pet_type: 'fox' }),
  },
}));

jest.mock('../services/api', () => ({
  breathingService: {
    getStreak: jest.fn().mockResolvedValue({ streak: 5, xp: 250, last_session_date: '2024-01-01', sessions_today: 1 }),
  },
}));

// Mock the PetGraphic component
jest.mock('./PetGraphic', () => (props: any) => <div data-testid="pet-graphic">{props.animal}-{props.mood}</div>);

describe('PetCard', () => {
  test('renders pet info and streak correctly', async () => {
    // HR 60 -> hrFactor = 0
    // HRV 80 -> hrvFactor = 0
    // stressScore = 0 -> Calmness = 100
    render(<PetCard hrv={80} heartRate={60} />);

    // Check title
    expect(screen.getByText('Your Companion')).toBeInTheDocument();

    // Check if the mock services have loaded data into the UI
    await waitFor(() => {
      expect(screen.getByText('Lvl 3')).toBeInTheDocument();
      expect(screen.getByText('🔥 5 Day Streak')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    expect(screen.getByTestId('pet-graphic')).toHaveTextContent('fox-calm');
  });

  test('renders stressed mood when hr is high and hrv is low', async () => {
    // HR 100 -> hrFactor = 1
    // HRV 20 -> hrvFactor = 1
    // stressScore = 100 -> Calmness = 0
    render(<PetCard hrv={20} heartRate={100} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('pet-graphic')).toHaveTextContent('fox-stressed');
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });
});
