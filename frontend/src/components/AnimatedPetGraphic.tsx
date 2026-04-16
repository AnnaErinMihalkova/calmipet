import React from 'react';

type Mood = 'calm' | 'focused' | 'stressed';

interface AnimatedPetGraphicProps {
  animal?: string;
  mood?: Mood;
  size?: number;
}

const AnimatedPetGraphic: React.FC<AnimatedPetGraphicProps> = ({ 
  animal = 'raccoon', 
  mood = 'calm', 
  size = 168 
}) => {
  const accent = mood === 'stressed' ? '#E74C3C' : mood === 'focused' ? '#F39C12' : '#7C3AED';
  
  const Raccoon: React.FC<{ size: number; mood: Mood }> = ({ size, mood }) => {
    const scale = size / 168;
    const isStressed = mood === 'stressed';
    
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 168 168"
        style={{ animation: isStressed ? 'shake 0.5s infinite' : 'breathing 3s ease-in-out infinite' }}
      >
        <defs>
          <style>
            {`
              @keyframes breathing {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
              }
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-2px); }
                75% { transform: translateX(2px); }
              }
              @keyframes blink {
                0%, 90%, 100% { transform: scaleY(1); }
                95% { transform: scaleY(0.1); }
              }
              .eye { animation: blink 4s infinite; }
            `}
          </style>
        </defs>
        
        {/* Outer circle background */}
        <circle cx="84" cy="84" r="80" fill="#E5E7EB" />
        
        {/* Ears */}
        <polygon points="40,35 50,15 60,35" fill="#9CA3AF" />
        <polygon points="108,35 118,15 128,35" fill="#9CA3AF" />
        
        {/* Face */}
        <ellipse cx="84" cy="100" rx="65" ry="50" fill="#F3F4F6" />
        
        {/* Eye patches */}
        <ellipse cx="55" cy="85" rx="18" ry="22" fill="#2F3B4A" />
        <ellipse cx="113" cy="85" rx="18" ry="22" fill="#2F3B4A" />
        
        {/* Eyes */}
        <circle cx="55" cy="85" r="8" fill="white" />
        <circle cx="113" cy="85" r="8" fill="white" />
        <circle cx="55" cy="85" r="4" fill="#7C3AED" className="eye" />
        <circle cx="113" cy="85" r="4" fill="#7C3AED" className="eye" />
        
        {/* Nose */}
        <ellipse cx="84" cy="110" rx="4" ry="3" fill="#1F2937" />
        
        {/* Mouth */}
        <path d="M 70 115 Q 84 125 98 115" stroke="#2F3B4A" strokeWidth="2" fill="none" />
        
        {/* Shadow */}
        <ellipse cx="84" cy="160" rx="40" ry="8" fill="rgba(0,0,0,0.1)" />
      </svg>
    );
  };

  const Cat: React.FC<{ size: number; mood: Mood }> = ({ size, mood }) => {
    const scale = size / 168;
    const isStressed = mood === 'stressed';
    
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 168 168"
        style={{ animation: isStressed ? 'shake 0.5s infinite' : 'breathing 3s ease-in-out infinite' }}
      >
        <defs>
          <style>
            {`
              @keyframes breathing {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
              }
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-2px); }
                75% { transform: translateX(2px); }
              }
              @keyframes blink {
                0%, 90%, 100% { transform: scaleY(1); }
                95% { transform: scaleY(0.1); }
              }
              .eye { animation: blink 4s infinite; }
              @keyframes tailWag {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(10deg); }
              }
              .tail { transform-origin: 140px 120px; animation: tailWag 2s ease-in-out infinite; }
            `}
          </style>
        </defs>
        
        {/* Outer circle background */}
        <circle cx="84" cy="84" r="80" fill="#E5E7EB" />
        
        {/* Ears */}
        <polygon points="35,40 45,10 55,40" fill="#FFA500" />
        <polygon points="113,40 123,10 133,40" fill="#FFA500" />
        <polygon points="40,35 47,20 54,35" fill="#FFB366" />
        <polygon points="114,35 121,20 128,35" fill="#FFB366" />
        
        {/* Face */}
        <ellipse cx="84" cy="100" rx="60" ry="45" fill="#FFA500" />
        
        {/* Eyes */}
        <ellipse cx="60" cy="85" rx="12" ry="15" fill="#2F3B4A" />
        <ellipse cx="108" cy="85" rx="12" ry="15" fill="#2F3B4A" />
        <ellipse cx="60" cy="85" rx="6" ry="8" fill="#7C3AED" className="eye" />
        <ellipse cx="108" cy="85" rx="6" ry="8" fill="#7C3AED" className="eye" />
        
        {/* Nose */}
        <polygon points="84,105 79,110 89,110" fill="#FF69B4" />
        
        {/* Mouth */}
        <path d="M 70 115 Q 84 125 98 115" stroke="#2F3B4A" strokeWidth="2" fill="none" />
        
        {/* Whiskers */}
        <line x1="20" y1="95" x2="50" y2="90" stroke="#2F3B4A" strokeWidth="1.5" />
        <line x1="20" y1="105" x2="50" y2="105" stroke="#2F3B4A" strokeWidth="1.5" />
        <line x1="118" y1="90" x2="148" y2="95" stroke="#2F3B4A" strokeWidth="1.5" />
        <line x1="118" y1="105" x2="148" y2="105" stroke="#2F3B4A" strokeWidth="1.5" />
        
        {/* Tail */}
        <path d="M 140 120 Q 155 110 150 90" stroke="#FFA500" strokeWidth="12" fill="none" className="tail" />
        
        {/* Shadow */}
        <ellipse cx="84" cy="160" rx="40" ry="8" fill="rgba(0,0,0,0.1)" />
      </svg>
    );
  };

  const Fox: React.FC<{ size: number; mood: Mood }> = ({ size, mood }) => {
    const scale = size / 168;
    const isStressed = mood === 'stressed';
    
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 168 168"
        style={{ animation: isStressed ? 'shake 0.5s infinite' : 'breathing 3s ease-in-out infinite' }}
      >
        <defs>
          <style>
            {`
              @keyframes breathing {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
              }
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-2px); }
                75% { transform: translateX(2px); }
              }
              @keyframes blink {
                0%, 90%, 100% { transform: scaleY(1); }
                95% { transform: scaleY(0.1); }
              }
              .eye { animation: blink 4s infinite; }
              @keyframes earTwitch {
                0%, 100% { transform: rotate(0deg); }
                50% { transform: rotate(-5deg); }
              }
              .ear { transform-origin: 45px 30px; animation: earTwitch 3s ease-in-out infinite; }
              .ear2 { transform-origin: 123px 30px; animation: earTwitch 3s ease-in-out infinite 0.5s; }
            `}
          </style>
        </defs>
        
        {/* Outer circle background */}
        <circle cx="84" cy="84" r="80" fill="#E5E7EB" />
        
        {/* Ears */}
        <polygon points="30,40 50,15 60,45" fill="#FF6B35" className="ear" />
        <polygon points="108,40 128,15 138,45" fill="#FF6B35" className="ear2" />
        <polygon points="35,38 48,25 55,42" fill="#FFD4A3" />
        <polygon points="113,38 126,25 133,42" fill="#FFD4A3" />
        
        {/* Face */}
        <ellipse cx="84" cy="100" rx="62" ry="48" fill="#FF6B35" />
        
        {/* White muzzle */}
        <ellipse cx="84" cy="115" rx="35" ry="25" fill="#FFFFFF" />
        
        {/* Eyes */}
        <ellipse cx="60" cy="85" rx="10" ry="12" fill="#2F3B4A" />
        <ellipse cx="108" cy="85" rx="10" ry="12" fill="#2F3B4A" />
        <ellipse cx="60" cy="85" rx="5" ry="6" fill="#7C3AED" className="eye" />
        <ellipse cx="108" cy="85" rx="5" ry="6" fill="#7C3AED" className="eye" />
        
        {/* Nose */}
        <ellipse cx="84" cy="110" rx="3" ry="2" fill="#1F2937" />
        
        {/* Mouth */}
        <path d="M 70 115 Q 84 125 98 115" stroke="#2F3B4A" strokeWidth="2" fill="none" />
        
        {/* Shadow */}
        <ellipse cx="84" cy="160" rx="40" ry="8" fill="rgba(0,0,0,0.1)" />
      </svg>
    );
  };

  const Owl: React.FC<{ size: number; mood: Mood }> = ({ size, mood }) => {
    const scale = size / 168;
    const isStressed = mood === 'stressed';
    
    return (
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 168 168"
        style={{ animation: isStressed ? 'shake 0.5s infinite' : 'breathing 3s ease-in-out infinite' }}
      >
        <defs>
          <style>
            {`
              @keyframes breathing {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
              }
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-2px); }
                75% { transform: translateX(2px); }
              }
              @keyframes blink {
                0%, 90%, 100% { transform: scaleY(1); }
                95% { transform: scaleY(0.1); }
              }
              .eye { animation: blink 5s infinite; }
              @keyframes headTurn {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-10deg); }
                75% { transform: rotate(10deg); }
              }
              .head { transform-origin: 84px 84px; animation: headTurn 4s ease-in-out infinite; }
            `}
          </style>
        </defs>
        
        {/* Outer circle background */}
        <circle cx="84" cy="84" r="80" fill="#E5E7EB" />
        
        {/* Head */}
        <ellipse cx="84" cy="90" rx="65" ry="55" fill="#8B7355" className="head" />
        
        {/* Ear tufts */}
        <polygon points="35,45 40,20 45,45" fill="#6B5D4F" />
        <polygon points="123,45 128,20 133,45" fill="#6B5D4F" />
        
        {/* Face circle */}
        <ellipse cx="84" cy="95" rx="50" ry="45" fill="#D2B48C" />
        
        {/* Eye rings */}
        <circle cx="60" cy="85" r="18" fill="#FFFFFF" />
        <circle cx="108" cy="85" r="18" fill="#FFFFFF" />
        <circle cx="60" cy="85" r="15" fill="#F5DEB3" />
        <circle cx="108" cy="85" r="15" fill="#F5DEB3" />
        
        {/* Eyes */}
        <circle cx="60" cy="85" r="8" fill="#7C3AED" className="eye" />
        <circle cx="108" cy="85" r="8" fill="#7C3AED" className="eye" />
        <circle cx="62" cy="83" r="2" fill="#FFFFFF" />
        <circle cx="110" cy="83" r="2" fill="#FFFFFF" />
        
        {/* Beak */}
        <polygon points="84,100 78,108 90,108" fill="#FFA500" />
        
        {/* Feather pattern */}
        <ellipse cx="84" cy="125" rx="25" ry="15" fill="#8B7355" />
        <path d="M 70 125 Q 84 130 98 125" stroke="#6B5D4F" strokeWidth="1" fill="none" />
        <path d="M 75 120 Q 84 123 93 120" stroke="#6B5D4F" strokeWidth="1" fill="none" />
        
        {/* Shadow */}
        <ellipse cx="84" cy="160" rx="40" ry="8" fill="rgba(0,0,0,0.1)" />
      </svg>
    );
  };

  const renderPet = () => {
    switch (animal) {
      case 'cat':
        return <Cat size={size} mood={mood} />;
      case 'fox':
        return <Fox size={size} mood={mood} />;
      case 'owl':
        return <Owl size={size} mood={mood} />;
      case 'raccoon':
      default:
        return <Raccoon size={size} mood={mood} />;
    }
  };

  return (
    <div 
      aria-label={`${animal}-${mood}`} 
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        background: '#fff', 
        border: `3px solid ${accent}`, 
        boxShadow: `0 0 ${Math.floor(size * 0.25)}px ${accent}22 inset`, 
        display: 'grid', 
        placeItems: 'center', 
        position: 'relative', 
        overflow: 'hidden' 
      }}
    >
      {renderPet()}
    </div>
  );
};

export default AnimatedPetGraphic;
