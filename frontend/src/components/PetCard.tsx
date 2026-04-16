import React from 'react';
import { authService, UserProfile } from '../services/auth';
import { breathingService } from '../services/api';
import PetGraphic from './PetGraphic';

interface PetCardProps {
  hrv: number | null;
  heartRate: number | null;
}

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
        bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(219, 39, 119, 0.15) 100%)', // Pink
        glowColor: 'rgba(236, 72, 153, 0.25)',
        accent: '#ec4899',
        border: 'rgba(236, 72, 153, 0.3)',
        titleColor: '#f472b6'
      };
    case 'fox':
      return {
        bgGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(234, 88, 12, 0.15) 100%)', // Orange
        glowColor: 'rgba(249, 115, 22, 0.25)',
        accent: '#f97316',
        border: 'rgba(249, 115, 22, 0.3)',
        titleColor: '#fb923c'
      };
    case 'owl':
      return {
        bgGradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(2, 132, 199, 0.15) 100%)', // Cyan
        glowColor: 'rgba(14, 165, 233, 0.25)',
        accent: '#0ea5e9',
        border: 'rgba(14, 165, 233, 0.3)',
        titleColor: '#38bdf8'
      };
    case 'raccoon':
    default:
      return {
        bgGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(79, 70, 229, 0.15) 100%)', // Indigo
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

const PetCard: React.FC<PetCardProps> = ({ hrv, heartRate }) => {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [streakData, setStreakData] = React.useState<any>(null);

  React.useEffect(() => {
    authService.getMe().then(setUser).catch(() => {});
    breathingService.getStreak().then(setStreakData).catch(() => {});
  }, []);

  const animal = user?.pet_type || 'raccoon';
  
  // Improved algorithm taking both HR and HRV into account
  let stressScore = 50;
  if (hrv !== null && heartRate !== null) {
    const hrFactor = Math.max(0, Math.min(1, (heartRate - 60) / 40.0));
    const hrvFactor = Math.max(0, Math.min(1, (80 - hrv) / 60.0));
    stressScore = Math.round((0.4 * hrFactor + 0.6 * hrvFactor) * 100);
  } else if (hrv !== null) {
    // Fallback if only HRV is provided (e.g. from tests)
    stressScore = Math.max(0, Math.min(100, Math.round(((80 - hrv) / 60) * 100)));
  }

  const isStressed = stressScore > 65;
  const mood = isStressed ? 'stressed' : 'calm';

  // Calmness is the inverse of stress
  const calmnessScore = 100 - stressScore;

  const theme = getPetTheme(animal, isStressed);
  const title = getPetTitle(animal);

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
            Lvl {Math.floor((streakData?.xp || 0) / 100) + 1}
          </div>
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)', padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, color: '#f59e0b'
          }}>
            🔥 {streakData?.streak || 0} Day Streak
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '30px 0',
        position: 'relative',
      }}>
        {/* Glow effect behind the pet */}
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
          <PetGraphic animal={animal as any} mood={mood} size={160} />
        </div>
      </div>

      <div style={{ marginTop: 20, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Calmness Score</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.accent, transition: 'color 0.5s ease' }}>
            {calmnessScore}%
          </div>
        </div>
        <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            width: `${calmnessScore}%`,
            height: '100%',
            background: theme.accent,
            borderRadius: 4,
            transition: 'width 0.5s ease, background 0.5s ease',
          }} />
        </div>
      </div>
    </div>
  );
};

export default PetCard;