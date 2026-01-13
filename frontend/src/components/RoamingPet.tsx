import React, { useState, useEffect } from 'react';
import './RoamingPet.css';

const RoamingPet: React.FC = () => {
  const [animationClass, setAnimationClass] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [petEmoji, setPetEmoji] = useState('https://twemoji.maxcdn.com/v/latest/svg/1f99d.svg');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('hb_user_info');
      const info = raw ? JSON.parse(raw) : {};
      const map: Record<string, string> = { raccoon: '1f99d', cat: '1f431', fox: '1f98a', owl: '1f989' };
      const sel = info?.petAnimal || 'raccoon';
      const cp = map[sel] || '1f99d';
      setPetEmoji(`https://twemoji.maxcdn.com/v/latest/svg/${cp}.svg`);
    } catch {}
    // Randomly trigger animations
    const triggerAnimation = () => {
      const animations = ['peek-bottom', 'walk-across', 'bounce-corner'];
      const randomAnim = animations[Math.floor(Math.random() * animations.length)];
      
      setAnimationClass(randomAnim);
      setIsVisible(true);

      // Hide after animation completes (approximate durations)
      let duration = 4000;
      if (randomAnim === 'walk-across') duration = 8000;
      
      setTimeout(() => {
        setIsVisible(false);
        setAnimationClass('');
      }, duration);
    };

    // Initial trigger after a short delay
    const initialTimer = setTimeout(triggerAnimation, 2000);

    // Set up interval for random appearances (every 10-20 seconds)
    const interval = setInterval(() => {
      if (!isVisible && Math.random() > 0.3) { // 70% chance to trigger if not visible
        triggerAnimation();
      }
    }, 15000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className={`roaming-pet-container ${animationClass}`}>
      <img className="pet-emoji" src={petEmoji} alt="pet" style={{ width: 60, height: 60 }} />
      {animationClass === 'peek-bottom' && (
        <div className="speech-bubble">Remember to breathe!</div>
      )}
    </div>
  );
};

export default RoamingPet;
