import React from 'react';
import { authService, UserProfile } from '../services/auth';
import { breathingService } from '../services/api';
import PetGraphic from './PetGraphic';

interface PetCardProps {
  hrv: number | null;
  heartRate: number | null;
}

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

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 18,
      padding: 20,
      boxShadow: 'var(--shadow-lg)',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Your Companion</div>
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
          width: 200, height: 200,
          background: isStressed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
          borderRadius: '50%',
          filter: 'blur(30px)',
          zIndex: 0,
          transition: 'background 0.5s ease',
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <PetGraphic animal={animal as any} mood={mood} size={160} />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Calmness Score</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: isStressed ? '#ef4444' : 'var(--accent-primary)' }}>
            {calmnessScore}%
          </div>
        </div>
        <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            width: `${calmnessScore}%`,
            height: '100%',
            background: isStressed ? '#ef4444' : 'var(--accent-primary)',
            borderRadius: 4,
            transition: 'width 0.5s ease, background 0.5s ease',
          }} />
        </div>
      </div>
    </div>
  );
};

export default PetCard;