import React from 'react';
import './CircularLogo.css';

interface CircularLogoProps {
  size?: number;
  className?: string;
}

const CircularLogo: React.FC<CircularLogoProps> = ({ size = 120, className = '' }) => {
  const getSelected = () => {
    try {
      const raw = localStorage.getItem('hb_user_info');
      const info = raw ? JSON.parse(raw) : {};
      return info?.petAnimal || 'raccoon';
    } catch {
      return 'raccoon';
    }
  };
  const selected = getSelected();
  const emojiMap: Record<string, string> = { raccoon: '🦝', cat: '🐱', fox: '🦊', owl: '🦉' };
  return (
    <div className={`circular-logo ${className}`} style={{ width: size, height: size }}>
      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--logo-bg)', border: '3px solid var(--border-color)', display: 'grid', placeItems: 'center' }}>
        <div style={{ fontSize: Math.floor(size * 0.6) }}>{emojiMap[selected]}</div>
      </div>
    </div>
  );
};

export default CircularLogo;
