import React from 'react';
import { wellnessService } from '../services/api';
import PetGraphic from './PetGraphic';

const PetCard: React.FC = () => {
  const [pet, setPet] = React.useState<any>(null);
  const [streak, setStreak] = React.useState<any>(null);
  const [ready, setReady] = React.useState(false);
  const [tick, setTick] = React.useState(0);

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
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60);
    return () => clearInterval(id);
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
  const calmness = pet && typeof pet.mood_score === 'number' ? Math.max(0, Math.min(100, Math.round(pet.mood_score * 100))) : 0;
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
        <div style={{ width: 280, height: 280, borderRadius: '50%', background: stressed ? 'radial-gradient(60% 60% at 50% 50%, rgba(231,76,60,0.28), transparent)' : 'radial-gradient(60% 60% at 50% 50%, rgba(124,58,237,0.25), transparent)', display: 'grid', placeItems: 'center', boxShadow: stressed ? '0 0 40px rgba(231,76,60,0.3) inset' : '0 0 40px rgba(124,58,237,0.3) inset' }}>
          <PetGraphic animal={selected as any} mood={mood} size={168} />
        </div>
      </div>
      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: stressed ? 'var(--accent-color)' : 'inherit' }}>
        {pet ? `Mood: ${pet.mood}` : ready ? 'Mood: calm' : 'Loading...'}
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
        {pet ? `Mood score ${(pet.mood_score * 100).toFixed(0)}%` : ''}
      </div>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        <div style={{ color: 'var(--text-secondary)' }}>Calmness Level</div>
        <div style={{ height: 8, background: 'var(--border-color)', borderRadius: 4 }}>
          <div style={{
            width: `${calmness}%`,
            height: 8,
            borderRadius: 4,
            background: stressed
              ? 'linear-gradient(90deg, #E74C3C, #C0392B)'
              : 'linear-gradient(90deg, var(--accent-color), var(--accent-hover))'
          }} />
        </div>
        <div style={{ color: stressed ? '#E74C3C' : 'var(--accent-color)', fontSize: 12 }}>
          {pet ? (stressed ? 'Stressed' : 'Calm') : ''}
        </div>
      </div>
    </div>
  );
};

export default PetCard;
