import React from 'react';

export type AnimalType = 'raccoon' | 'cat' | 'fox' | 'owl';
export type Mood = 'calm' | 'focused' | 'stressed';

interface Props {
  animal?: AnimalType;
  mood?: Mood;
  size?: number;
}

const getEmoji = (animal: AnimalType, mood: Mood) => {
  switch (animal) {
    case 'cat':
      return mood === 'stressed' ? '🙀' : mood === 'focused' ? '😼' : '😺';
    case 'fox':
      return mood === 'stressed' ? '🦊💢' : mood === 'focused' ? '🦊✨' : '🦊';
    case 'owl':
      return mood === 'stressed' ? '🦉💤' : mood === 'focused' ? '🦉🎯' : '🦉';
    case 'raccoon':
    default:
      return mood === 'stressed' ? '🦝💦' : mood === 'focused' ? '🦝🔍' : '🦝';
  }
};

const PetGraphic: React.FC<Props> = ({ animal = 'raccoon', mood = 'calm', size = 160 }) => {
  const accent = mood === 'stressed' ? '#ef4444' : mood === 'focused' ? '#f59e0b' : '#6366f1';
  const emoji = getEmoji(animal, mood);

  return (
    <div 
      aria-label={`${animal}-${mood}`} 
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        background: 'var(--bg-primary)', 
        border: `3px solid ${accent}`, 
        boxShadow: `0 0 ${Math.floor(size * 0.25)}px ${accent}22 inset`, 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative', 
        overflow: 'hidden',
        fontSize: size * 0.5,
        userSelect: 'none'
      }}
    >
      <div style={{
        animation: mood === 'stressed' 
          ? 'shake 0.5s infinite' 
          : mood === 'calm' 
            ? 'float 3s ease-in-out infinite' 
            : 'none',
      }}>
        {emoji}
      </div>

      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          @keyframes shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
          }
        `}
      </style>
    </div>
  );
};

export default PetGraphic;