import React from 'react';
import './CircularLogo.css';

interface CircularLogoProps {
  size?: number;
  className?: string;
}

const CircularLogo: React.FC<CircularLogoProps> = ({ size = 120, className = '' }) => {
  return (
    <div className={`circular-logo ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-svg"
      >
        <defs>
          <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--logo-border)" />
            <stop offset="100%" stopColor="var(--accent-light)" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="98" fill="var(--logo-bg)" stroke="url(#borderGradient)" strokeWidth="3" />
        <circle cx="100" cy="110" r="46" fill="#2c2c2c" />
        <path d="M60 110c8-24 30-40 40-40c10 0 32 16 40 40" fill="#1f1f1f" />
        <path d="M75 120c12-8 22-8 25-8s13 0 25 8" fill="#ffffff" />
        <circle cx="85" cy="118" r="12" fill="#ffffff" />
        <circle cx="115" cy="118" r="12" fill="#ffffff" />
        <circle cx="85" cy="118" r="6" fill="#1a1a1a" />
        <circle cx="115" cy="118" r="6" fill="#1a1a1a" />
        <circle cx="87" cy="116" r="2" fill="#7c3aed" />
        <circle cx="117" cy="116" r="2" fill="#7c3aed" />
        <ellipse cx="100" cy="128" rx="8" ry="6" fill="#1a1a1a" />
        <path d="M80 88l16-16" stroke="#2c2c2c" strokeWidth="8" strokeLinecap="round" />
        <path d="M120 88l-16-16" stroke="#2c2c2c" strokeWidth="8" strokeLinecap="round" />
        <circle cx="85" cy="118" r="12" fill="none">
          <animate attributeName="r" values="12;11;12" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="115" cy="118" r="12" fill="none">
          <animate attributeName="r" values="12;11;12" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
};

export default CircularLogo;

