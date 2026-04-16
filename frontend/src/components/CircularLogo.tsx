import React, { useState, useEffect } from 'react';
import './CircularLogo.css';

interface CircularLogoProps {
  size?: number;
  className?: string;
}

const CircularLogo: React.FC<CircularLogoProps> = ({ size = 120, className = '' }) => {
  const [selected, setSelected] = useState<string>('raccoon');
  
  const getSelected = () => {
    try {
      const raw = localStorage.getItem('hb_user_info');
      const info = raw ? JSON.parse(raw) : {};
      return info?.petAnimal || 'raccoon';
    } catch {
      return 'raccoon';
    }
  };
useEffect(() => {
    setSelected(getSelected());
    
    const handleStorageChange = () => {
      setSelected(getSelected());
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(() => {
      setSelected(getSelected());
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
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
