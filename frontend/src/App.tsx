import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider } from './contexts/ThemeContext';
import SignUp from './components/SignUp';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ReadingList from './components/ReadingList';
import ProgressView from './components/ProgressView';
import { authService, UserProfile } from './services/auth';
import './App.css';

const IconBtn: React.FC<{ onClick: () => void; emoji: string; label: string; active: boolean }> = ({
  onClick,
  emoji,
  label,
  active,
}) => (
  <button
    className="ghost-cta"
    onClick={onClick}
    aria-label={label}
    style={{
      padding: 8,
      borderRadius: 12,
      border: 'none',
      background: 'transparent',
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
      >
        {label}
      </span>
    </div>
  </button>
);

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  return (
    <div
      style={{
        flex: '0 0 auto',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
        padding: 12,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        zIndex: 1000,
        position: 'sticky',
        bottom: 0,
      }}
    >
      <IconBtn onClick={() => navigate('/dashboard')} emoji="🏠" label="Home" active={path === '/dashboard'} />
      <IconBtn onClick={() => navigate('/readings')} emoji="📊" label="Readings" active={path === '/readings'} />
      <IconBtn onClick={() => navigate('/progress')} emoji="🌱" label="Progress" active={path === '/progress'} />
      <IconBtn onClick={() => navigate('/account')} emoji="👤" label="Account" active={path === '/account'} />
    </div>
  );
};

// Extracted stable AccountView component (#21)
const AccountView: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [petType, setPetType] = React.useState<string>('raccoon');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    authService.getMe()
      .then((u) => {
        setUser(u);
        setPetType(u.pet_type || 'raccoon');
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const handleSavePet = async () => {
    try {
      await authService.updatePet(petType);
      alert('Companion updated successfully!');
    } catch (e) {
      alert('Failed to update companion');
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading account...</div>;

  return (
    <div className="content" style={{ padding: 20, paddingBottom: 100 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Your Account</h2>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Username</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{user?.username}</div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Email</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{user?.email}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Choose Your Companion</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { id: 'raccoon', icon: '🦝', name: 'Raccoon' },
            { id: 'cat', icon: '🐱', name: 'Cat' },
            { id: 'fox', icon: '🦊', name: 'Fox' },
            { id: 'owl', icon: '🦉', name: 'Owl' },
          ].map(animal => (
            <div 
              key={animal.id}
              onClick={() => setPetType(animal.id)}
              style={{
                padding: 16,
                borderRadius: 16,
                border: `2px solid ${petType === animal.id ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                background: petType === animal.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-tertiary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 32 }}>{animal.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: petType === animal.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {animal.name}
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={handleSavePet}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 12,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Save Companion
        </button>
      </div>

      <button 
        onClick={handleLogout}
        style={{
          width: '100%',
          padding: 16,
          borderRadius: 12,
          background: 'transparent',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Log Out
      </button>
    </div>
  );
};

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<number>(0);

  React.useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  React.useEffect(() => {
    const id = setInterval(() => setStep((p) => p + 1), 6000);
    return () => clearInterval(id);
  }, []);

  const slides = [
    { animal: '🦝', text: 'Track your mood with a caring buddy' },
    { animal: '🐱', text: 'Breathe together to downshift stress' },
    { animal: '🦊', text: 'Build streaks and unlock cozy rewards' },
    { animal: '🦉', text: 'See progress with a simple mood meter' },
  ];
  const s = slides[step % slides.length];

  return (
    <div className="app-shell">
      <div className="screen-header">
        <div style={{ fontSize: 24 }}>🐾</div>
        <div className="skip" onClick={() => navigate('/login')}>Log In</div>
      </div>

      <div className="onboarding-card">
        <div className="onboarding-visual">
          <div className="pet">
            <div style={{ fontSize: 90 }}>{s.animal}</div>
          </div>
        </div>
        <div className="onboarding-title">CalmiPet</div>
        <div className="onboarding-subtitle">{s.text}</div>
        <div className="progress-dots">
          {slides.map((_, i) => (
            <div key={i} className={`dot ${i === (step % slides.length) ? 'active' : ''}`} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <button className="ghost-cta" onClick={() => setStep((p) => (p - 1 + slides.length) % slides.length)}>Back</button>
          <button className="ghost-cta" onClick={() => setStep((p) => (p + 1) % slides.length)}>Next</button>
        </div>
      </div>

      <div className="primary-bottom-cta">
        <button className="cta" onClick={() => navigate('/signup')} style={{ width: '100%', padding: 16, borderRadius: 16, background: 'var(--accent-primary)', color: 'white', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
          Create Account
        </button>
      </div>
    </div>
  );
};

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <ThemeToggle />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/signup" element={<SignUpRoute />} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/readings" element={<ProtectedRoute><ReadingList /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><ProgressView /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><AccountView /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;

const LoginRoute: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Login
      onAuthSuccess={() => navigate('/dashboard')}
      onNavigateToSignup={() => navigate('/signup')}
    />
  );
};

const SignUpRoute: React.FC = () => {
  const navigate = useNavigate();
  return (
    <SignUp
      onAuthSuccess={() => navigate('/dashboard')}
      onNavigateToLogin={() => navigate('/login')}
    />
  );
};
