import React from 'react';
import ThemeToggle from './components/ThemeToggle';
import CircularLogo from './components/CircularLogo';
import { ThemeProvider } from './contexts/ThemeContext';
import SignUp from './components/SignUp';
import Login from './components/Login';
import OnboardingInfo from './components/OnboardingInfo';
import './App.css';
import Dashboard from './components/Dashboard';

type TimelineItem = {
  title: string;
  items: string[];
};

const featureHighlights = [
  {
    title: 'Stress-aware pet',
    description: 'Your companion mirrors your mood—concerned when you’re tense, calm when you recover.',
  },
  {
    title: 'Guided breathing',
    description: 'Soft cues and visuals walk you through slow, steady breaths to downshift stress.',
  },
  {
    title: 'Streaks & rewards',
    description: 'Daily calm streaks unlock cozy dens, accessories, and playful mini-missions.',
  },
  {
    title: 'Mood meter',
    description: 'See your progress at a glance and watch your pet brighten as you stay balanced.',
  },
];

const feels = [
  'A gentle nudge when stress rises',
  'A pet that “worries” with you and relaxes beside you',
  'A quick breathing break you can finish in under two minutes',
  'A streak that grows when you keep showing up',
];

const dailyFlow = [
  'Check-in: notice how you feel and how your buddy looks',
  'Breathe together: follow slow inhale/exhale cues until your pet softens',
  'Celebrate: earn points, calm streaks, and unlock tiny rewards',
  'Repeat: short sessions across the day keep the mood meter glowing',
];

const timeline: TimelineItem[] = [
  {
    title: 'Month 1 • Imagine',
    items: [
      'Shape the pet’s personality and moods',
      'Sketch the calm/worried states',
      'Try early feel-good animations',
    ],
  },
  {
    title: 'Month 2 • Build & bond',
    items: [
      'Create the home screen and breathing flows',
      'Make the pet react to your calm checks',
      'Add streaks and small rewards',
    ],
  },
  {
    title: 'Month 3 • Polish & share',
    items: [
      'Tune the calm prompts and pacing',
      'Refine moods, sounds, and haptics',
      'Prep a friendly demo to show friends',
    ],
  },
];

function App() {
  const [currentPage, setCurrentPage] = React.useState<'home' | 'signup' | 'login' | 'onboarding' | 'readings' | 'dashboard' | 'progress' | 'account'>('home');
  const [step, setStep] = React.useState<number>(0);

  React.useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'login' || hash === 'signup' || hash === 'home' || hash === 'onboarding' || hash === 'readings' || hash === 'dashboard' || hash === 'progress' || hash === 'account') {
      setCurrentPage(hash as 'home' | 'signup' | 'login' | 'onboarding' | 'readings' | 'dashboard' | 'progress' | 'account');
    }
  }, []);

  React.useEffect(() => {
    const check = async () => {
      try {
        const { authService } = require('./services/auth');
        await authService.me();
        const onboarded = localStorage.getItem('hb_onboarded') === '1';
        setCurrentPage(onboarded ? 'dashboard' : 'onboarding');
      } catch {}
    };
    if (!window.location.hash || window.location.hash === '#home') {
      check();
    }
  }, []);

  React.useEffect(() => {
    window.location.hash = currentPage;
  }, [currentPage]);

  const handleSignupSuccess = () => setCurrentPage('onboarding');
  const handleLoginSuccess = () => setCurrentPage('onboarding');
  const goHome = () => setCurrentPage('home');
  const goLogin = () => setCurrentPage('login');
  const goSignup = () => setCurrentPage('signup');
  const goReadings = () => setCurrentPage('readings');
  const goDashboard = () => setCurrentPage('dashboard');
  const goProgress = () => setCurrentPage('progress');
  const goAccount = () => setCurrentPage('account');

  const IconBtn: React.FC<{ onClick: () => void; path: string }> = ({ onClick, path }) => (
    <button className="ghost-cta" onClick={onClick} aria-label="nav" style={{ padding: 10 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d={path} stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
  );

  const BottomNav: React.FC = () => (
    <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: 12, background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
      <IconBtn onClick={goAccount} path="M12 12a5 5 0 1 0 0-10a5 5 0 0 0 0 10zm-7 9a7 7 0 1 1 14 0H5z" />
      <IconBtn onClick={goDashboard} path="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
      <IconBtn onClick={goReadings} path="M4 19h16M4 12h16M4 5h16" />
      <IconBtn onClick={goProgress} path="M3 17l5-5 4 4 8-8" />
    </div>
  );

  if (currentPage === 'signup') {
    return (
      <ThemeProvider>
        <div className="App">
          <ThemeToggle />
          <SignUp onNavigateToLogin={goLogin} onAuthSuccess={handleSignupSuccess} />
          <div className="ghost-cta" style={{ marginTop: 16, display: 'inline-flex' }} onClick={goHome} role="button">
            ← Back to Home
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (currentPage === 'login') {
    return (
      <ThemeProvider>
        <div className="App">
          <ThemeToggle />
          <Login onNavigateToSignup={goSignup} onAuthSuccess={handleLoginSuccess} />
          <div className="ghost-cta" style={{ marginTop: 16, display: 'inline-flex' }} onClick={goHome} role="button">
            ← Back to Home
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (currentPage === 'onboarding') {
    return (
      <ThemeProvider>
        <div className="App">
          <ThemeToggle />
          <OnboardingInfo onComplete={goDashboard} />
          <div className="ghost-cta" style={{ marginTop: 16, display: 'inline-flex' }} onClick={goHome} role="button">
            Skip for now →
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (currentPage === 'readings') {
    const ReadingList = require('./components/ReadingList').default;
    return (
      <ThemeProvider>
        <div className="App">
          <ThemeToggle />
          <ReadingList />
          <div className="ghost-cta" style={{ marginTop: 16, display: 'inline-flex' }} onClick={goAccount} role="button">
            Account
          </div>
          <BottomNav />
        </div>
      </ThemeProvider>
    );
  }

  if (currentPage === 'dashboard') {
    return (
      <ThemeProvider>
        <div className="App">
          <ThemeToggle />
          <Dashboard />
          <BottomNav />
        </div>
      </ThemeProvider>
    );
  }

  if (currentPage === 'progress') {
    const ProgressView: React.FC = () => {
      const [streak, setStreak] = React.useState<any>(null);
      React.useEffect(() => {
        const { wellnessService } = require('./services/api');
        wellnessService.getStreak().then(setStreak).catch(() => setStreak(null));
      }, []);
      return (
        <div className="content" style={{ paddingBottom: 80 }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow-lg)', marginBottom: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Streak</div>
            <div style={{ color: 'var(--text-secondary)' }}>{streak ? `${streak.current_streak} days` : 'Loading…'}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div className="card">
              <h3>Evolution Progress</h3>
              <div style={{ height: 10, background: 'var(--border-color)', borderRadius: 6 }}>
                <div style={{ width: '75%', height: 10, borderRadius: 6, background: 'linear-gradient(90deg, var(--accent-color), var(--accent-hover))' }} />
              </div>
              <p style={{ marginTop: 8 }}>Perform more sessions to evolve</p>
            </div>
            <div className="card">
              <h3>Daily Rituals</h3>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                <li>Morning biofeedback ✓</li>
                <li>Evening reflection •</li>
              </ul>
            </div>
            <div className="card">
              <h3>Milestones</h3>
              <p>Early Riser, Zen Master unlocked</p>
            </div>
          </div>
        </div>
      );
    };

    return (
      <ThemeProvider>
        <div className="App">
          <ThemeToggle />
          <ProgressView />
          <div className="ghost-cta" style={{ marginTop: 16, display: 'inline-flex' }} onClick={goAccount} role="button">Account</div>
          <BottomNav />
        </div>
      </ThemeProvider>
    );
  }

  if (currentPage === 'account') {
    const AccountView: React.FC = () => {
      const [user, setUser] = React.useState<any>(null);
      const [info, setInfo] = React.useState<any>(null);
      React.useEffect(() => {
        const { authService } = require('./services/auth');
        authService.me().then(setUser).catch(() => setUser(null));
        try { const raw = localStorage.getItem('hb_user_info'); setInfo(raw ? JSON.parse(raw) : null); } catch { setInfo(null); }
      }, []);
      const logout = async () => { const { authService } = require('./services/auth'); try { await authService.logout(); } catch {} window.location.hash = 'home'; window.location.reload(); };
      const del = async () => { if (!window.confirm('Delete your account?')) return; const { authService } = require('./services/auth'); try { await authService.deleteAccount(); } catch {} try { localStorage.clear(); } catch {} window.location.hash = 'home'; window.location.reload(); };
      return (
        <div className="content" style={{ paddingBottom: 80 }}>
          <div className="card" style={{ marginBottom: 12 }}>
            <h3>Account</h3>
            <div>Username: {user?.username ?? '—'}</div>
            <div>Email: {user?.email ?? '—'}</div>
            <div>Joined: {user?.date_joined ? new Date(user.date_joined).toLocaleString() : '—'}</div>
          </div>
          <div className="card" style={{ marginBottom: 12 }}>
            <h3>Your Info</h3>
            <div>Age: {info?.age ?? '—'}</div>
            <div>Gender: {info?.gender ?? '—'}</div>
            <div>Baseline HR: {info?.baselineHr ?? '—'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ghost-cta" onClick={logout}>Log Out</button>
            <button className="ghost-cta" onClick={del} style={{ color: 'var(--accent-color)' }}>Delete Account</button>
          </div>
        </div>
      );
    };
    return (
      <ThemeProvider>
        <div className="App">
          <ThemeToggle />
          <AccountView />
          <BottomNav />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="App">
        <ThemeToggle />

        <div className="app-shell">
          <div className="screen-header">
            <div style={{ fontSize: 24 }}>🐾</div>
            <div className="skip" onClick={goDashboard}>Skip</div>
          </div>

          <div className="onboarding-card">
            {(() => {
              const slides = [
                { animal: '🦝', text: 'Track your mood with a caring buddy' },
                { animal: '🐱', text: 'Breathe together to downshift stress' },
                { animal: '🦊', text: 'Build streaks and unlock cozy rewards' },
                { animal: '🦉', text: 'See progress with a simple mood meter' },
              ];
              const s = slides[step % slides.length];
              return (
                <>
                  <div className="onboarding-visual">
                    <div className="pet" style={{ animation: 'float 3s ease-in-out infinite' }}>
                      <div style={{ fontSize: 90 }}>{s.animal}</div>
                    </div>
                  </div>
                  <div className="onboarding-title">Calmi Pet</div>
                  <div className="onboarding-subtitle">{s.text}</div>
                  <div className="progress-dots">
                    {slides.map((_, i) => (
                      <div key={i} className={`dot ${i === (step % slides.length) ? 'active' : ''}`} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button className="ghost-cta" onClick={() => setStep((p) => (p - 1 + slides.length) % slides.length)}>Back</button>
                    <button className="ghost-cta" onClick={() => setStep((p) => (p + 1) % slides.length)}>Next</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        <div className="primary-bottom-cta">
          <button className="cta" onClick={goSignup}>Create Account</button>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
