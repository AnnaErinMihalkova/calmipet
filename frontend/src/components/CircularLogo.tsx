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
        {/* Circular background with gradient border */}
        <defs>
          <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--logo-border)" />
            <stop offset="100%" stopColor="var(--accent-light)" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="98" fill="var(--logo-bg)" stroke="url(#borderGradient)" strokeWidth="3" />
        
        {/* Rabbit looking into mirror - positioned to show the contemplative pose */}
        {/* Rabbit body/head - sitting pose */}
        <ellipse cx="100" cy="85" rx="30" ry="35" fill="var(--logo-rabbit)" opacity="0.95" />
        
        {/* Rabbit ears - upright */}
        <ellipse cx="80" cy="55" rx="10" ry="18" fill="var(--logo-rabbit)" />
        <ellipse cx="120" cy="55" rx="10" ry="18" fill="var(--logo-rabbit)" />
        <ellipse cx="80" cy="55" rx="5" ry="11" fill="var(--logo-rabbit-inner)" />
        <ellipse cx="120" cy="55" rx="5" ry="11" fill="var(--logo-rabbit-inner)" />
        
        {/* Rabbit eyes - looking right toward mirror */}
        <circle cx="90" cy="80" r="4" fill="var(--logo-eyes)" />
        <circle cx="110" cy="80" r="4" fill="var(--logo-eyes)" />
        <circle cx="92" cy="80" r="2" fill="var(--logo-eyes-pupil)" />
        <circle cx="112" cy="80" r="2" fill="var(--logo-eyes-pupil)" />
        
        {/* Rabbit nose - almost touching mirror */}
        <ellipse cx="100" cy="90" rx="2.5" ry="2" fill="var(--logo-nose)" />
        
        {/* Mirror frame - rectangular with rounded corners, positioned to the right */}
        <rect x="125" y="100" width="50" height="60" rx="6" fill="none" stroke="var(--logo-mirror)" strokeWidth="2.5" />
        <rect x="128" y="103" width="44" height="54" rx="3" fill="var(--logo-mirror-bg)" opacity="0.2" />
        
        {/* Rabbit reflection in mirror - mirrored version */}
        <ellipse cx="150" cy="125" rx="20" ry="18" fill="var(--logo-rabbit)" opacity="0.6" />
        <ellipse cx="140" cy="120" rx="6" ry="8" fill="var(--logo-rabbit)" opacity="0.6" />
        <ellipse cx="160" cy="120" rx="6" ry="8" fill="var(--logo-rabbit)" opacity="0.6" />
        <ellipse cx="150" cy="130" rx="2" ry="1.5" fill="var(--logo-nose)" opacity="0.6" />
        
        {/* Decorative text elements - subtle, positioned like in the image */}
        <text x="100" y="40" textAnchor="middle" fontSize="9" fill="var(--logo-text)" opacity="0.5" fontFamily="serif" fontStyle="italic" letterSpacing="1">
          Processing...
        </text>
      </svg>
    </div>
  );
};

export default CircularLogo;

