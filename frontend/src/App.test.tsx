import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
jest.mock('./components/SignUp', () => () => <div>SignUp</div>);
jest.mock('./components/Login', () => () => <div>Login</div>);
jest.mock('./services/auth', () => ({
  authService: {
    me: jest.fn().mockResolvedValue({ id: 1, username: 'demo' }),
  },
}));
jest.mock('./services/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
  readingService: {},
  fastapiService: { analyze: jest.fn(), getData: jest.fn() },
  backendMode: { get: () => 'fastapi', set: jest.fn() },
}));

test('renders Create Account CTA', () => {
  render(<App />);
  const cta = screen.getByText(/Create Account/i);
  expect(cta).toBeInTheDocument();
});
