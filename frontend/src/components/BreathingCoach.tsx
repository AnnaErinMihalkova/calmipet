import React from 'react';
import { wellnessService } from '../services/api';
import './Login.css';

type Props = {
  open: boolean;
  onClose: () => void;
  onCompleted: () => void;
};

const BreathingCoach: React.FC<Props> = ({ open, onClose, onCompleted }) => {
  const [sessionId, setSessionId] = React.useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = React.useState<number>(60);
  const [running, setRunning] = React.useState<boolean>(false);
  const progress = 60 - secondsLeft;
  const cycle = progress % 10;
  const phase = cycle < 4 ? 'Inhale…' : cycle < 6 ? 'Hold…' : 'Exhale…';
  const scale = cycle < 4 ? 1 + cycle * 0.06 : cycle < 6 ? 1.24 : 1.24 - (cycle - 6) * 0.06;

  React.useEffect(() => {
    if (!open) return;
    setSessionId(null);
    setSecondsLeft(60);
    setRunning(false);
  }, [open]);

  React.useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  React.useEffect(() => {
    if (secondsLeft === 0 && running && sessionId) {
      wellnessService.completeBreathingSession(sessionId).then(() => {
        setRunning(false);
        onCompleted();
        onClose();
      }).catch(() => {
        setRunning(false);
        onClose();
      });
    }
  }, [secondsLeft, running, sessionId, onClose, onCompleted]);

  const start = async () => {
    const res = await wellnessService.createBreathingSession();
    setSessionId(res.id);
    setRunning(true);
  };

  if (!open) return null;

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
  const emojiMap: Record<string, string> = { raccoon: '🦝', cat: '🐱', fox: '🦊', owl: '🦉' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div className="login-card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ marginTop: 0 }}>Calming Breath</h2>
          <div style={{ color: 'var(--text-secondary)' }}>{running ? 'Listening' : 'Idle'}</div>
        </div>

        <div style={{ display: 'grid', placeItems: 'center', margin: '16px 0 12px' }}>
          <div style={{
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(60% 60% at 50% 50%, rgba(124,58,237,0.25), transparent)',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 0 40px rgba(124,58,237,0.3) inset'
          }}>
            <div style={{ display: 'grid', placeItems: 'center', gap: 12 }}>
              {selected === 'raccoon' ? (
                <div style={{ transform: `scale(${running ? scale : 1})`, transition: 'transform 1s ease-in-out' }}>
                  <svg width="140" height="140" viewBox="0 0 240 240">
                    <defs>
                      <radialGradient id="furBC" cx="50%" cy="40%" r="70%">
                        <stop offset="0%" stopColor="#f9fafb" />
                        <stop offset="100%" stopColor="#e9edf2" />
                      </radialGradient>
                    </defs>
                    <g>
                      <rect x="72" y="74" width="96" height="68" rx="34" fill="url(#furBC)" stroke="#2b2b2b" strokeWidth="4" />
                      <g>
                        <ellipse cx="92" cy="76" rx="16" ry="18" fill="url(#furBC)" stroke="#2b2b2b" strokeWidth="4" />
                        <ellipse cx="148" cy="76" rx="16" ry="18" fill="url(#furBC)" stroke="#2b2b2b" strokeWidth="4" />
                      </g>
                      <path d="M92 100 C 104 90, 136 90, 148 100 L 148 114 C 136 106, 104 106, 92 114 Z" fill="#2b2b2b" />
                      <circle cx="106" cy="112" r="10" fill="#fff" stroke="#2b2b2b" strokeWidth="4" />
                      <circle cx="134" cy="112" r="10" fill="#fff" stroke="#2b2b2b" strokeWidth="4" />
                      <circle cx="106" cy="112" r="4.5" fill="#1f1f1f" />
                      <circle cx="134" cy="112" r="4.5" fill="#1f1f1f" />
                      <path d="M120 124 q13 9 0 18 q-13 -9 0 -18" fill="#1f1f1f" />
                    </g>
                  </svg>
                </div>
              ) : (
                <div style={{
                  fontSize: 100,
                  transform: `scale(${running ? scale : 1})`,
                  transition: 'transform 1s ease-in-out',
                  lineHeight: 1
                }}>{emojiMap[selected]}</div>
              )}
              <div style={{ fontSize: 32, fontWeight: 800 }}>{secondsLeft}s</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 18, fontWeight: 700 }}>
          {running ? phase : 'Press Start'}
        </div>

        <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
          <div style={{ color: 'var(--text-secondary)' }}>Calmness Level</div>
          <div style={{ height: 8, background: 'var(--border-color)', borderRadius: 4 }}>
            <div style={{ width: running ? `${Math.max(0, 100 - secondsLeft)}%` : '0%', height: 8, borderRadius: 4, background: 'linear-gradient(90deg, var(--accent-color), var(--accent-hover))' }} />
          </div>
          <div style={{ color: 'var(--accent-color)', fontSize: 12 }}>{running ? 'Rising' : 'Ready'}</div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {!running && <button className="login-button" onClick={start}>Start</button>}
          {running && <button className="login-button" onClick={onClose}>End</button>}
          {!running && <button className="ghost-cta" onClick={onClose}>Cancel</button>}
        </div>
      </div>
    </div>
  );
};

export default BreathingCoach;
