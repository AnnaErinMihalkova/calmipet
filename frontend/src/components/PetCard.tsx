import React from 'react';
import { breathingService } from '../services/api';
import AnimatedPetGraphic from './AnimatedPetGraphic';

const PetCard: React.FC = () => {
  const [pet, setPet] = React.useState<any>(null);
  const [streak, setStreak] = React.useState<any>(null);
  const [ready, setReady] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  const load = async () => {
    try {
      const s = await breathingService.getStreak();
      setStreak(s);
    } catch {}
    // Mock pet data since wellnessService doesn't exist
    setPet({
      mood: 'calm',
      mood_score: 0.7
    });
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

  const getPetTheme = (animal: string, isStressed: boolean) => {
    if (isStressed) {
      return {
        bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.15) 100%)',
        glowColor: 'rgba(239, 68, 68, 0.25)',
        accent: '#ef4444',
        border: 'rgba(239, 68, 68, 0.3)',
        titleColor: '#f87171'
      };
    }

    switch (animal) {
      case 'cat':
        return {
          bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(219, 39, 119, 0.15) 100%)',
          glowColor: 'rgba(236, 72, 153, 0.25)',
          accent: '#ec4899',
          border: 'rgba(236, 72, 153, 0.3)',
          titleColor: '#f472b6'
        };
      case 'fox':
        return {
          bgGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(234, 88, 12, 0.15) 100%)',
          glowColor: 'rgba(249, 115, 22, 0.25)',
          accent: '#f97316',
          border: 'rgba(249, 115, 22, 0.3)',
          titleColor: '#fb923c'
        };
      case 'owl':
        return {
          bgGradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(2, 132, 199, 0.15) 100%)',
          glowColor: 'rgba(14, 165, 233, 0.25)',
          accent: '#0ea5e9',
          border: 'rgba(14, 165, 233, 0.3)',
          titleColor: '#38bdf8'
        };
      case 'raccoon':
      default:
        return {
          bgGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(79, 70, 229, 0.15) 100%)',
          glowColor: 'rgba(99, 102, 241, 0.25)',
          accent: '#6366f1',
          border: 'rgba(99, 102, 241, 0.3)',
          titleColor: '#818cf8'
        };
    }
  };

  const getPetTitle = (animal: string) => {
    switch (animal) {
      case 'cat': return 'Your Feline Friend';
      case 'fox': return 'Your Cunning Companion';
      case 'owl': return 'Your Wise Guardian';
      case 'raccoon':
      default: return 'Your Masked Buddy';
    }
  };

  const theme = getPetTheme(selected, stressed);
  const title = getPetTitle(selected);

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      backgroundImage: theme.bgGradient,
      border: `1px solid ${theme.border}`,
      borderRadius: 24,
      padding: 24,
      boxShadow: 'var(--shadow-lg)',
      marginBottom: 16,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.5s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: theme.titleColor, transition: 'color 0.5s ease' }}>{title}</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)'
          }}>
            Lvl {streak?.level ?? 1}
          </div>
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, color: '#f59e0b'
          }}>
            🔥 {streak?.current_streak || 0} Day Streak
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '30px 0',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          width: 240, height: 240,
          background: theme.glowColor,
          borderRadius: '50%',
          filter: 'blur(40px)',
          zIndex: 0,
          transition: 'background 0.5s ease',
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <AnimatedPetGraphic animal={selected as any} mood={mood} size={160} />
        </div>
      </div>

      <div style={{ marginTop: 20, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Calmness Score</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.accent, transition: 'color 0.5s ease' }}>
            {calmness}%
          </div>
        </div>
        <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            width: `${calmness}%`,
            height: '100%',
            background: theme.accent,
            borderRadius: 4,
            transition: 'width 0.5s ease, background 0.5s ease',
          }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: theme.accent }}>
          {pet ? `Mood: ${pet.mood}` : ready ? 'Mood: calm' : 'Loading...'}
        </div>
      </div>
    </div>
  );
};

export default PetCard;
