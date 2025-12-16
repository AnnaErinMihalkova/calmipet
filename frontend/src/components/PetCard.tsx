import React from 'react';
import { wellnessService } from '../services/api';

const PetCard: React.FC = () => {
  const [pet, setPet] = React.useState<any>(null);
  const [streak, setStreak] = React.useState<any>(null);

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

  return (
    <div style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 600 }}>Your Pet</div>
        <div>{streak ? `Streak: ${streak.current_streak}d` : ''}</div>
      </div>
      <div style={{ marginTop: 8 }}>{pet ? `Mood: ${pet.mood}` : 'Loading...'}</div>
      <div style={{ marginTop: 4 }}>{pet ? `Mood score: ${(pet.mood_score * 100).toFixed(0)}%` : ''}</div>
    </div>
  );
};

export default PetCard;