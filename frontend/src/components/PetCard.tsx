import React from 'react';
import { wellnessService } from '../services/api';
import AnimatedPetGraphic from './AnimatedPetGraphic';

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
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* Level and streak info positioned at top right */}
        <div style={{ position: 'absolute', top: 0, right: 0, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>
          <div>Lvl {streak?.level ?? 1}</div>
          <div>{streak ? `Streak ${streak.current_streak}d` : 'Streak 0d'}</div>
        </div>
        
        {/* Pet circle */}
        <div style={{ 
          width: 200, 
          height: 200, 
          borderRadius: '50%', 
          background: stressed ? 'radial-gradient(60% 60% at 50% 50%, rgba(231,76,60,0.28), transparent)' : 'radial-gradient(60% 60% at 50% 50%, rgba(124,58,237,0.25), transparent)', 
          display: 'grid', 
          placeItems: 'center', 
          boxShadow: stressed ? '0 0 40px rgba(231,76,60,0.3) inset' : '0 0 40px rgba(124,58,237,0.3) inset',
          border: '3px solid #7C3AED',
          position: 'relative'
        }}>
          <AnimatedPetGraphic animal={selected as any} mood={mood} size={140} />
        </div>
      </div>
      
      {/* Mood and happiness info */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: stressed ? 'var(--accent-color)' : 'inherit' }}>
          {pet ? `Mood: ${pet.mood}` : ready ? 'Mood: calm' : 'Loading...'}
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
          {pet ? `Mood score ${(pet.mood_score * 100).toFixed(0)}%` : ''}
        </div>
      </div>
      
      {/* Calmness level bar */}
      <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600 }}>Happiness Level</div>
        <div style={{ height: 8, background: 'var(--border-color)', borderRadius: 4 }}>
          <div style={{
            width: `${calmness}%`,
            height: 8,
            borderRadius: 4,
            background: stressed
              ? 'linear-gradient(90deg, #E74C3C, #C0392B)'
              : 'linear-gradient(90deg, var(--accent-color), var(--accent-hover))',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <div style={{ color: stressed ? '#E74C3C' : 'var(--accent-color)', fontSize: 12, fontWeight: 600 }}>
          {pet ? (stressed ? 'Stressed' : 'Calm') : ready ? 'Calm' : ''}
        </div>
      </div>
    </div>
  );
};

export default PetCard;
