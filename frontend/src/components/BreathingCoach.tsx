import React, { useState, useEffect } from 'react';
import { breathingService } from '../services/api';
import PetGraphic from './PetGraphic';
import { authService, UserProfile } from '../services/auth';
import './BreathingCoach.css';

interface Props {
  onClose: () => void;
}

const BreathingCoach: React.FC<Props> = ({ onClose }) => {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  
  React.useEffect(() => {
    authService.getMe().then(setUser).catch(() => {});
  }, []);

  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [timeLeft, setTimeLeft] = useState(60);
  const [sessionId, setSessionId] = useState<number | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (phase !== 'idle' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1);
        
        // 4-7-8 breathing pattern
        const cycleTime = 19;
        const currentSecond = (60 - timeLeft + 1) % cycleTime;
        
        if (currentSecond < 4) setPhase('inhale');
        else if (currentSecond < 11) setPhase('hold');
        else setPhase('exhale');
      }, 1000);
    } else if (timeLeft === 0 && sessionId) {
      breathingService.completeSession(sessionId).then(() => {
        onClose();
      });
    }
    return () => clearInterval(interval);
  }, [phase, timeLeft, sessionId, onClose]);

  const startSession = async () => {
    try {
      const res = await breathingService.startSession();
      setSessionId(res.id);
      setPhase('inhale');
    } catch (e) {
      console.error('Failed to start breathing session');
    }
  };

  const getInstruction = () => {
    switch (phase) {
      case 'idle': return 'Ready to relax?';
      case 'inhale': return 'Breathe in...';
      case 'hold': return 'Hold...';
      case 'exhale': return 'Breathe out...';
    }
  };

  const getScale = () => {
    switch (phase) {
      case 'idle': return 1;
      case 'inhale': return 1.3;
      case 'hold': return 1.3;
      case 'exhale': return 1;
    }
  };

  return (
    <div className="breathing-coach-container">
      <div className="breathing-header">
        <button className="back-button" onClick={onClose}>
          ← Back
        </button>
        <h2>Calming Breath</h2>
        <div style={{ width: 40 }} /> {/* Spacer for centering */}
      </div>

      <div className="breathing-content">
        <div className="timer">{timeLeft}s</div>
        
        <div className="instruction">{getInstruction()}</div>

        <div className="pet-container">
          <div 
            className="breathing-circle"
            style={{ 
              transform: `scale(${getScale()})`,
              transition: phase === 'idle' ? 'none' : 
                          phase === 'inhale' ? 'transform 4s ease-out' :
                          phase === 'hold' ? 'none' :
                          'transform 8s ease-in-out'
            }}
          />
          <div className="pet-wrapper">
            <PetGraphic 
              animal={(user?.pet_type as any) || 'raccoon'} 
              mood={phase === 'idle' ? 'focused' : 'calm'} 
              size={140} 
            />
          </div>
        </div>

        {phase === 'idle' ? (
          <button className="start-button" onClick={startSession}>
            Begin Session
          </button>
        ) : (
          <button className="stop-button" onClick={onClose}>
            End Early
          </button>
        )}
      </div>
    </div>
  );
};

export default BreathingCoach;