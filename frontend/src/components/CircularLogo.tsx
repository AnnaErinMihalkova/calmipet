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
  const [selected, setSelected] = React.useState<string>(getSelected());

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'hb_user_info') setSelected(getSelected());
    };
    const onPetChanged = () => setSelected(getSelected());
    window.addEventListener('storage', onStorage);
    window.addEventListener('calmipet-pet-changed', onPetChanged as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('calmipet-pet-changed', onPetChanged as EventListener);
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
