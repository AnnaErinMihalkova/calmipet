import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PetCard from './PetCard';

jest.mock('../services/api', () => ({
  breathingService: {
    getStreak: jest.fn().mockResolvedValue({
      streak: 5,
      xp: 250,
      last_session_date: '2024-01-01',
      sessions_today: 1,
    }),
  },
}));

jest.mock('./AnimatedPetGraphic', () => (props: { animal: string; mood: string }) => (
  <div data-testid="pet-graphic">
    {props.animal}-{props.mood}
  </div>
));

describe('PetCard', () => {
  test('renders calm mood when stress score is low', async () => {
    render(<PetCard hrv={80} heartRate={60} stressScore={10} />);

    expect(screen.getByText('Your Masked Buddy')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('pet-graphic')).toHaveTextContent('raccoon-calm');
    });
    expect(screen.getByText('Mood: calm')).toBeInTheDocument();
  });

  test('renders stressed mood when stress score is high', () => {
    render(<PetCard hrv={20} heartRate={100} stressScore={80} />);

    expect(screen.getByText(/0%/)).toBeInTheDocument();
    expect(screen.getByTestId('pet-graphic')).toHaveTextContent('raccoon-stressed');
    expect(screen.getByText('Mood: stressed')).toBeInTheDocument();
  });
});
