import React, { useEffect, useState } from 'react';
import { breathingService } from '../services/api';
import './ProgressView.css';

type ProgressProps = {
  getStreak?: () => Promise<any>;
};

const ProgressView: React.FC<ProgressProps> = ({ getStreak }) => {
  const [streak, setStreak] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rituals, setRituals] = useState([
    { id: 1, label: 'Morning biofeedback', completed: true },
    { id: 2, label: 'Evening reflection', completed: false },
    { id: 3, label: 'Drink water', completed: false },
  ]);

  useEffect(() => {
    console.log('[ProgressView] Component mounted, fetching streak...');
    const fn = getStreak ?? breathingService.getStreak;
    setIsLoading(true);
    Promise.resolve()
      .then(() => fn())
      .then((data) => {
        console.log('[ProgressView] Streak data received:', data);
        setStreak(data);
      })
      .catch((err) => {
        console.error('[ProgressView] Failed to fetch streak:', err);
        setStreak(null);
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optional injected streak loader
  }, []);

  const toggleRitual = (id: number) => {
    setRituals(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  return (
    <div className="content" style={{ padding: 20, minHeight: '100vh' }}>
      <div className="progress-view">
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Your Progress</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Track your wellness journey</p>
        </header>

        <div className="streak-card">
          <div className="streak-info">
            <h2>{isLoading ? 'Loading...' : (streak ? `${streak.streak ?? 0} Day Streak` : '0 Day Streak')}</h2>
            <div style={{ color: 'var(--text-secondary)' }}>
              {isLoading ? 'Checking your progress...' : (streak?.streak > 0 ? 'Keep the momentum going!' : 'Start your first session today!')}
            </div>
          </div>
          <div className="streak-icon">{streak?.streak > 0 ? '🔥' : '🌱'}</div>
        </div>

        <div className="grid-container">
          <div className="interactive-card">
            <h3>Evolution Progress</h3>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: streak ? `${Math.min(100, (streak.xp || 0) % 100)}%` : '0%' }} />
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
              {streak ? `${(streak.xp || 0) % 100}/100 XP to next level` : '0/100 XP to next level'}
            </p>
          </div>
          
          <div className="interactive-card">
            <h3>Stats Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total XP</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{streak?.xp || 0}</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: 12, borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Today</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{streak?.sessions_today || 0}</div>
              </div>
            </div>
          </div>
          
          <div className="interactive-card">
            <h3>Daily Rituals</h3>
            <div className="rituals-list">
              {rituals.map(r => (
                <div 
                  key={r.id} 
                  className={`ritual-item ${r.completed ? 'completed' : ''}`}
                  onClick={() => toggleRitual(r.id)}
                >
                  <div className="ritual-checkbox">
                    {r.completed && <span>✓</span>}
                  </div>
                  <span className="ritual-text">{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="interactive-card">
            <h3>Milestones</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              <div className="milestone-badge">🏆 Early Riser</div>
              <div className="milestone-badge">🧘 Zen Master</div>
              <div className="milestone-badge" style={{ opacity: 0.5, filter: 'grayscale(1)' }}>🔒 7-Day Streak</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressView;
