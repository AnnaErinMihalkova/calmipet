import React from 'react';

type Mood = 'calm' | 'focused' | 'stressed';
type Animal = 'raccoon' | 'cat' | 'dog' | 'fox' | 'rabbit' | 'panda' | 'koala' | 'owl';

const emojiMap: Record<Animal, string> = {
  raccoon: '🦝',
  cat: '🐱',
  dog: '🐶',
  fox: '🦊',
  rabbit: '🐇',
  panda: '🐼',
  koala: '🐨',
  owl: '🦉',
};

const PetGraphic: React.FC<{ animal?: Animal; mood?: Mood; size?: number }> = ({ animal = 'raccoon', mood = 'calm', size = 160 }) => {
  const fill = mood === 'stressed' ? '#E74C3C' : mood === 'focused' ? '#F39C12' : '#2ECC71';
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60);
    return () => clearInterval(id);
  }, []);
  const scale = 1 + 0.04 * Math.sin(tick / 12);
  const glow = `radial-gradient(60% 60% at 50% 50%, ${fill}33, transparent)`;
  const emoji = emojiMap[(animal as Animal) || 'raccoon'] || '🦝';

  return (
    <div aria-label={`${animal}-${mood}`} style={{ width: size, height: size }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: '#fff',
          border: `2px solid ${fill}`,
          boxShadow: `0 0 ${Math.floor(size * 0.25)}px ${fill}22 inset`,
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: glow,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            transform: `scale(${scale})`,
            transition: 'transform 60ms linear',
            willChange: 'transform',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div style={{ fontSize: Math.floor(size * 0.6), lineHeight: 1 }}>{emoji}</div>
        </div>
      </div>
    </div>
  );
};

export default PetGraphic;
