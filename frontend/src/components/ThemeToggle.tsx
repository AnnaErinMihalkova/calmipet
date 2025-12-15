import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
      <svg
        className="theme-icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {theme === 'dark' ? (
          // Sun icon for light mode
          <>
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 1v3M12 20v3M23 12h-3M4 12H1M20.364 3.636l-2.121 2.121M5.757 18.243l-2.121 2.121M20.364 20.364l-2.121-2.121M5.757 5.757l-2.121-2.121" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </>
        ) : (
          // Moon icon for dark mode
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </svg>
    </button>
  );
};

export default ThemeToggle;

