import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import PetCard from './PetCard';

jest.mock('../services/api', () => ({
  wellnessService: {
    getPet: jest.fn().mockResolvedValue({ mood: 'calm', mood_score: 0.8 }),
    getStreak: jest.fn().mockResolvedValue({ current_streak: 3, max_streak: 5, level: 1, badges: '' }),
  },
}));

jest.mock('./PetGraphic', () => (props: any) => <div data-testid="pet-graphic">{props.animal}-{props.mood}</div>);

describe('PetCard', () => {
  beforeEach(() => {
    try {
      localStorage.setItem('hb_user_info', JSON.stringify({ petAnimal: 'fox' }));
    } catch {}
  });

  test('renders pet info and streak', async () => {
    jest.useFakeTimers();
    render(<PetCard />);
    await waitFor(() => expect(screen.getByText('Your Pet')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('pet-graphic')).toBeInTheDocument());
    await waitFor(() => expect(screen.queryByText(/Loading/i)).toBeInTheDocument());
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    await waitFor(() => expect(screen.getByText(/Mood: calm/)).toBeInTheDocument());
    expect(screen.getByTestId('pet-graphic')).toHaveTextContent('fox-calm');
    const api = require('../services/api');
    expect(api.wellnessService.getStreak).toHaveBeenCalled();
  });
});
