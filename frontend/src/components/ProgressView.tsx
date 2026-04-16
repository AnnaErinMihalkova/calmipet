import React, { useEffect, useState } from 'react';
import { breathingService } from '../services/api';
import './ProgressView.css';

type ProgressProps = {
  getStreak?: () => Promise<any>;
};

const ProgressView: React.FC<ProgressProps> = ({ getStreak }) => {
  const [streak, setStreak] = useState<any>(null);
  const [rituals, setRituals] = useState([
    { id: 1, label: 'Morning biofeedback', completed: true },
    { id: 2, label: 'Evening reflection', completed: false },
    { id: 3, label: 'Drink water', completed: false },
  ]);

  useEffect(() => {
    const fn = getStreak ?? breathingService.getStreak;
    Promise.resolve()
      .then(() => fn())
      .then(setStreak)
      .catch(() => setStreak(null));
  }, []);

  const toggleRitual = (id: number) => {
    setRituals(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  return (
    <div className="content" style={{ padding: 20 }}>
      <div className="progress-view">
        <div className="streak-card">
        <div className="streak-info">
          <h2>{streak ? `${streak.streak ?? 0} Day Streak` : 'Loading...'}</h2>
          <div style={{ color: 'var(--text-secondary)' }}>Keep the momentum going!</div>
        </div>
        <div className="streak-icon">🔥</div>
      </div>

      <div className="grid-container">
        <div className="interactive-card">
          <h3>Evolution Progress</h3>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: '75%' }} />
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            75/100 XP to next level
          </p>
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
