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
    render(<PetCard hrv={40} />);

    // Check title
    expect(screen.getByText('Your Companion')).toBeInTheDocument();

    // Check if the mock services have loaded data into the UI
    await waitFor(() => {
      // Level should be Math.floor(250 / 100) + 1 = 3
      expect(screen.getByText('Lvl 3')).toBeInTheDocument();
      expect(screen.getByText('🔥 5 Day Streak')).toBeInTheDocument();
      // HRV = 40. Calmness = (40 - 20)/60 * 100 = 33%
      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    // Check if PetGraphic was rendered with correct props (hrv=40 means not stressed, so calm)
    expect(screen.getByTestId('pet-graphic')).toHaveTextContent('fox-calm');
  });

  test('renders stressed mood when hrv is low', async () => {
    render(<PetCard hrv={25} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('pet-graphic')).toHaveTextContent('fox-stressed');
      // HRV = 25. Calmness = (25 - 20)/60 * 100 = 8%
      expect(screen.getByText('8%')).toBeInTheDocument();
    });
  });
});
