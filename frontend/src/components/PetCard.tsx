import React from 'react';
import { wellnessService } from '../services/api';
import PetGraphic from './PetGraphic';

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
  const moodLabel = pet ? pet.mood : ready ? 'calm' : null;
  const stressed = (pet && pet.mood === 'stressed') || (pet && pet.mood_score !== undefined && pet.mood_score < 0.4);
  const mood: 'calm' | 'focused' | 'stressed' = stressed ? 'stressed' : moodLabel === 'focused' ? 'focused' : 'calm';
  return (
    <div style={{ padding: 16, border: '1px solid var(--border-color)', borderRadius: 18, background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(52,152,219,0.08))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 800 }}>Your Pet</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Lvl {streak?.level ?? 1}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{streak ? `Streak ${streak.current_streak}d` : ''}</div>
        </div>
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 240, height: 240, borderRadius: 120, display: 'grid', placeItems: 'center', background: stressed ? 'rgba(255,0,0,0.08)' : 'var(--bg-secondary)', border: '2px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
          <PetGraphic animal={selected as any} mood={mood} size={168} />
        </div>
      </div>
      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: stressed ? 'var(--accent-color)' : 'inherit' }}>
        {pet ? `Mood: ${pet.mood}` : ready ? 'Mood: calm' : 'Loading...'}
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
        {pet ? `Mood score ${(pet.mood_score * 100).toFixed(0)}%` : ''}
      </div>
    </div>
  );
};

export default PetCard;
