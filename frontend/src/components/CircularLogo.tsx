import React from 'react';
import './CircularLogo.css';

interface CircularLogoProps {
  size?: number;
  className?: string;
}

const CircularLogo: React.FC<CircularLogoProps> = ({ size = 120, className = '' }) => {
  return (
    <div className={`circular-logo ${className}`} style={{ width: size, height: size }}>
      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--logo-bg)', border: '3px solid var(--border-color)', display: 'grid', placeItems: 'center' }}>
        <div style={{ fontSize: Math.floor(size * 0.6) }}>🦝</div>
      </div>
    </div>
  );
};

export default CircularLogo;

