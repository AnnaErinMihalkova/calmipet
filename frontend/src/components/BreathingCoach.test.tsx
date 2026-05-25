import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import BreathingCoach from './BreathingCoach';
import { authService } from '../services/auth';
import { breathingService } from '../services/api';

jest.mock('../services/auth', () => ({
  authService: {
    getMe: jest.fn().mockResolvedValue({ pet_type: 'cat' }),
  },
}));

jest.mock('../services/api', () => ({
  breathingService: {
    startSession: jest.fn().mockResolvedValue({ id: 123 }),
    completeSession: jest.fn().mockResolvedValue({ id: 123, completed: true }),
  },
}));

jest.mock('./PetGraphic', () => (props: any) => <div data-testid="pet-graphic">{props.animal}-{props.mood}</div>);

describe('BreathingCoach', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authService.getMe as jest.Mock).mockResolvedValue({ pet_type: 'cat' });
    (breathingService.startSession as jest.Mock).mockResolvedValue({ id: 123 });
    (breathingService.completeSession as jest.Mock).mockResolvedValue({ id: 123, completed: true });
  });

  test('renders initial state and fetches user profile', async () => {
    const mockOnClose = jest.fn();
    render(<BreathingCoach onClose={mockOnClose} />);

    expect(screen.getByText('Calming Breath')).toBeInTheDocument();
    expect(screen.getByText('Ready to relax?')).toBeInTheDocument();
    expect(screen.getByText('60s')).toBeInTheDocument();
    expect(screen.getByText('Begin Session')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('pet-graphic')).toHaveTextContent('cat-focused');
    });
  });

  test('starts session and enters inhale phase', async () => {
    const mockOnClose = jest.fn();
    render(<BreathingCoach onClose={mockOnClose} />);

    await act(async () => {
      fireEvent.click(screen.getByText('Begin Session'));
      await Promise.resolve();
    });

    expect(breathingService.startSession).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('Breathe in...')).toBeInTheDocument();
      expect(screen.getByText('End Early')).toBeInTheDocument();
    });
  });

  test('calls onClose when back button is clicked', () => {
    const mockOnClose = jest.fn();
    render(<BreathingCoach onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('← Back'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
