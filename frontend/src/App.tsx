import React from 'react';
import ThemeToggle from './components/ThemeToggle';
import CircularLogo from './components/CircularLogo';
import { ThemeProvider } from './contexts/ThemeContext';
import SignUp from './components/SignUp';
import Login from './components/Login';
import OnboardingInfo from './components/OnboardingInfo';
import './App.css';

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
  const [currentPage, setCurrentPage] = React.useState<'home' | 'signup' | 'login' | 'onboarding'>('home');

  React.useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'login' || hash === 'signup' || hash === 'home' || hash === 'onboarding') {
      setCurrentPage(hash as 'home' | 'signup' | 'login' | 'onboarding');
    }
  }, []);

  React.useEffect(() => {
    window.location.hash = currentPage;
  }, [currentPage]);

  const handleSignupSuccess = () => setCurrentPage('onboarding');
  const handleLoginSuccess = () => setCurrentPage('home');
  const goHome = () => setCurrentPage('home');
  const goLogin = () => setCurrentPage('login');
  const goSignup = () => setCurrentPage('signup');

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
          <OnboardingInfo onComplete={goHome} />
          <div className="ghost-cta" style={{ marginTop: 16, display: 'inline-flex' }} onClick={goHome} role="button">
            Skip for now →
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="App">
        <ThemeToggle />

        <header className="hero">
          <div className="hero-content">
            <div className="pill">HeartBuddy</div>
            <h1>Your stress-aware companion</h1>
            <p className="hero-subtitle">
              A caring virtual pet that notices when you’re tense, breathes with you,
              and celebrates every calm moment you create together.
            </p>
            <div className="hero-actions">
              <a className="primary-cta" href="#signup" onClick={(e) => { e.preventDefault(); goSignup(); }}>
                Start calming
              </a>
              <a className="ghost-cta" href="#login" onClick={(e) => { e.preventDefault(); goLogin(); }}>
                I already have an account
              </a>
            </div>
            <div className="meta-row">
              <span>Guided breathing</span>
              <span>Moodful pet reactions</span>
              <span>Daily calm streaks</span>
              <span>Gentle rewards</span>
            </div>
          </div>
          <div className="hero-visual">
            <CircularLogo size={220} />
            <div className="callout">
              <strong>Feel-seen buddy</strong>
              <p>Your pet mirrors your calm and worry, nudging you to breathe and reset.</p>
            </div>
          </div>
        </header>

        <main className="content">
          <section className="card-grid">
            {featureHighlights.map((feature) => (
              <div className="card" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </section>

          <section className="panel">
            <h2>What you’ll feel</h2>
            <ul className="bullet-grid">
              {feels.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h2>Daily flow</h2>
            <ul className="bullet-grid">
              {dailyFlow.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h2>3-month journey</h2>
            <div className="timeline">
              {timeline.map((block) => (
                <div className="timeline-card" key={block.title}>
                  <h3>{block.title}</h3>
                  <ul>
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
