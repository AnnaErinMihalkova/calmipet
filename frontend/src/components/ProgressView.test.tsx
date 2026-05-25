import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressView from './ProgressView';
import userEvent from '@testing-library/user-event';

jest.mock('../services/api', () => ({
  breathingService: {
    getStreak: jest.fn().mockResolvedValue({ streak: 0, xp: 0 }),
  },
}));

test('ProgressView shows streak and toggles rituals', async () => {
  const getStreak = jest.fn().mockResolvedValue({ streak: 5, xp: 100 });
  render(<ProgressView getStreak={getStreak} />);
  const loading = screen.getByText(/Loading/i);
  expect(loading).toBeInTheDocument();
  const streakText = await screen.findByText(/5 Day Streak/i);
  expect(streakText).toBeInTheDocument();
  const item = screen.getByText(/Evening reflection/i);
  const container = item.closest('.ritual-item') as HTMLElement;
  expect(container).not.toHaveClass('completed');
  await userEvent.click(item);
  await waitFor(() => {
    expect(container).toHaveClass('completed');
  });
});
