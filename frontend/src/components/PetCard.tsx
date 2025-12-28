import React from 'react';
import { wellnessService } from '../services/api';

const PetCard: React.FC = () => {
  const [pet, setPet] = React.useState<any>(null);
  const [streak, setStreak] = React.useState<any>(null);
  const [ready, setReady] = React.useState(false);

  const load = async () => {
    try {
      const p = await wellnessService.getPet();
      setPet(p);
    } catch {}
    try {
      const s = await wellnessService.getStreak();
      setStreak(s);
    } catch {}
  };

  React.useEffect(() => { load(); }, []);
  React.useEffect(() => {
    const t = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 600 }}>Your Pet</div>
        <div>{streak ? `Streak: ${streak.current_streak}d` : ''}</div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="240" height="240" viewBox="0 0 240 240">
          <style>
            {`
              .breathe { animation: breathe 10s ease-in-out infinite; transform-origin: 120px 150px; }
              .tail { animation: tail 3s ease-in-out infinite; transform-origin: 85px 175px; }
              .arm-left { animation: arm 3.5s ease-in-out infinite; transform-origin: 110px 165px; }
              .arm-right { animation: arm 3.5s ease-in-out infinite; transform-origin: 135px 165px; animation-delay: 1.75s; }
              .ear { animation: ear 5s ease-in-out infinite; transform-origin: 100px 85px; }
              .blink { animation: blink 6s ease-in-out infinite; transform-origin: 120px 120px; }
              @keyframes breathe { 0% { transform: scale(1.0); } 40% { transform: scale(1.08); } 60% { transform: scale(1.08); } 100% { transform: scale(1.0); } }
              @keyframes tail { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(12deg); } }
              @keyframes arm { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(10deg); } }
              @keyframes ear { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(5deg); } }
              @keyframes blink { 0%, 47%, 53%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.2); } }
            `}
          </style>
          <g className="breathe">
            <ellipse cx="120" cy="165" rx="60" ry="40" fill="#e8ecef" />
            <ellipse cx="120" cy="168" rx="50" ry="30" fill="#f4f6f8" />
          </g>
          <g transform="rotate(6 120 150)">
            <rect x="72" y="74" width="96" height="68" rx="34" fill="#f9fafb" stroke="#2b2b2b" strokeWidth="5" />
            <g className="ear">
              <ellipse cx="92" cy="76" rx="16" ry="18" fill="#f9fafb" stroke="#2b2b2b" strokeWidth="5" />
              <ellipse cx="148" cy="76" rx="16" ry="18" fill="#f9fafb" stroke="#2b2b2b" strokeWidth="5" />
            </g>
            <path d="M86 96 C 98 84, 112 80, 120 80 C 128 80, 142 84, 154 96 L 154 118 C 142 106, 128 102, 120 102 C 112 102, 98 106, 86 118 Z" fill="#2b2b2b" />
            <g className="blink">
              <circle cx="106" cy="112" r="10" fill="#fff" stroke="#2b2b2b" strokeWidth="4" />
              <circle cx="134" cy="112" r="10" fill="#fff" stroke="#2b2b2b" strokeWidth="4" />
              <circle cx="106" cy="112" r="4.5" fill="#1f1f1f" />
              <circle cx="134" cy="112" r="4.5" fill="#1f1f1f" />
            </g>
            <path d="M120 124 q13 9 0 18 q-13 -9 0 -18" fill="#1f1f1f" />
            <rect x="94" y="136" width="52" height="38" rx="22" fill="#f9fafb" stroke="#2b2b2b" strokeWidth="5" />
            <rect x="90" y="148" width="20" height="12" rx="6" className="arm-left" fill="#f9fafb" stroke="#2b2b2b" strokeWidth="5" />
            <rect x="130" y="148" width="20" height="12" rx="6" className="arm-right" fill="#f9fafb" stroke="#2b2b2b" strokeWidth="5" />
            <rect x="106" y="180" width="18" height="24" rx="9" fill="#f9fafb" stroke="#2b2b2b" strokeWidth="5" />
            <rect x="128" y="180" width="18" height="24" rx="9" fill="#f9fafb" stroke="#2b2b2b" strokeWidth="5" />
          </g>
          <g className="tail">
            <ellipse cx="86" cy="182" rx="30" ry="20" fill="#f9fafb" stroke="#2b2b2b" strokeWidth="5" />
            <path d="M66 180 C 54 194, 56 210, 80 216 C 104 222, 122 200, 104 188 C 92 179, 76 176, 66 180 Z" fill="#f9fafb" stroke="#2b2b2b" strokeWidth="5" />
            <path d="M74 192 C 70 198, 74 204, 88 208 C 100 211, 114 202, 108 194" stroke="#2b2b2b" strokeWidth="9" fill="none" />
            <path d="M70 202 C 68 206, 74 210, 90 212" stroke="#2b2b2b" strokeWidth="9" fill="none" />
          </g>
        </svg>
      </div>
      <div style={{ marginTop: 8 }}>{pet ? `Mood: ${pet.mood}` : ready ? 'No pet yet' : 'Loading...'}</div>
      <div style={{ marginTop: 4 }}>{pet ? `Mood score: ${(pet.mood_score * 100).toFixed(0)}%` : ''}</div>
    </div>
  );
};

export default PetCard;
