import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './ThemeContext';
import { waitFor } from '@testing-library/react';

function ToggleButton() {
  const { theme, toggleTheme } = useTheme();
  return <button aria-label="toggle" onClick={toggleTheme}>{theme}</button>;
}

test('ThemeProvider toggles data-theme attribute', () => {
  const { getByLabelText } = render(
    <ThemeProvider>
      <ToggleButton />
    </ThemeProvider>
  );

  expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  const btn = getByLabelText('toggle');
  userEvent.click(btn);
  return waitFor(() => {
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
