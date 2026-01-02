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
              <div style={{
                fontSize: 100,
                transform: `scale(${running ? scale : 1})`,
                transition: 'transform 1s ease-in-out',
                lineHeight: 1
              }}>🦝</div>
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
