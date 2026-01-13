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
    <div style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 600 }}>Your Pet</div>
        <div>{streak ? `Streak: ${streak.current_streak}d` : ''}</div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 240, height: 240, borderRadius: 24, display: 'grid', placeItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 120, lineHeight: 1 }}>{emojiMap[selected]}</div>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>{pet ? `Mood: ${pet.mood}` : ready ? 'Mood: calm' : 'Loading...'}</div>
      <div style={{ marginTop: 4 }}>{pet ? `Mood score: ${(pet.mood_score * 100).toFixed(0)}%` : ''}</div>
    </div>
  );
};

export default PetCard;
