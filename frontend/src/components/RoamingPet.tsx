import React, { useState, useEffect } from 'react';
import './RoamingPet.css';

const RoamingPet: React.FC = () => {
  const [animationClass, setAnimationClass] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
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
      <div className="pet-emoji">🦝</div>
      {animationClass === 'peek-bottom' && (
        <div className="speech-bubble">Remember to breathe!</div>
      )}
    </div>
  );
};

export default RoamingPet;
