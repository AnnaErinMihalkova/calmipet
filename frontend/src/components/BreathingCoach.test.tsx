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

  test('starts session and transitions through breathing phases', async () => {
    jest.useFakeTimers();
    const mockOnClose = jest.fn();
    render(<BreathingCoach onClose={mockOnClose} />);

    const startButton = screen.getByText('Begin Session');
    
    // Wrap click and state updates in act
    await act(async () => {
      fireEvent.click(startButton);
    });

    expect(breathingService.startSession).toHaveBeenCalled();

    // After start, it should be in "inhale" phase
    await waitFor(() => {
      expect(screen.getByText('Breathe in...')).toBeInTheDocument();
      expect(screen.getByText('End Early')).toBeInTheDocument();
      expect(screen.getByTestId('pet-graphic')).toHaveTextContent('cat-calm');
    });

    // Advance timer to see it change to "hold"
    act(() => {
      jest.advanceTimersByTime(4000); // 4 seconds
    });
    
    await waitFor(() => {
      expect(screen.getByText('Hold...')).toBeInTheDocument();
    });

    // Advance to "exhale"
    act(() => {
      jest.advanceTimersByTime(7000); // 7 seconds
    });

    await waitFor(() => {
      expect(screen.getByText('Breathe out...')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  test('calls onClose when back button is clicked', () => {
    const mockOnClose = jest.fn();
    render(<BreathingCoach onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('← Back'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
