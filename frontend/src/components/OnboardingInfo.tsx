import React, { useMemo, useState } from 'react';
import '../components/SignUp.css';

type Gender = 'male' | 'female' | 'prefer_not_to_say';

type InfoData = {
  age?: number;
  gender?: Gender;
  baselineHr?: number;
};

const OnboardingInfo: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<Gender>('prefer_not_to_say');
  const [baselineHr, setBaselineHr] = useState<string>('');
  const [stress, setStress] = useState<number>(5);
  const [error, setError] = useState<string | null>(null);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const saveInfo = () => {
    setError(null);
    const parsedAge = age.trim() ? Math.max(5, Math.min(120, Number(age))) : undefined;
    const parsedHr = baselineHr.trim() ? Math.max(30, Math.min(200, Number(baselineHr))) : undefined;
    const info: InfoData = { age: parsedAge, gender, baselineHr: parsedHr };
    localStorage.setItem('hb_user_info', JSON.stringify(info));
    const ratingsRaw = localStorage.getItem('hb_stress_ratings');
    const ratings = ratingsRaw ? JSON.parse(ratingsRaw) as Record<string, number> : {};
    ratings[todayKey] = stress;
    localStorage.setItem('hb_stress_ratings', JSON.stringify(ratings));
    localStorage.setItem('hb_onboarded', '1');
    onComplete();
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="logo-container">
          <h1 className="logo-text">Tell us a bit about you</h1>
          <p className="logo-tagline">This helps your HeartBuddy respond thoughtfully. Optional fields are okay.</p>
        </div>

        {error && <div className="success-message" style={{ background: 'var(--error-color)' }}>{error}</div>}

        <form className="signup-form" onSubmit={(e) => { e.preventDefault(); saveInfo(); }}>
          <div className="form-group">
            <label htmlFor="age">Age (optional)</label>
            <input
              id="age"
              name="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g., 16"
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender">Gender (optional)</label>
            <select
              id="gender"
              name="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="baselineHr">Baseline Heart Rate (optional)</label>
            <input
              id="baselineHr"
              name="baselineHr"
              type="number"
              value={baselineHr}
              onChange={(e) => setBaselineHr(e.target.value)}
              placeholder="e.g., 70"
            />
          </div>

          <div className="form-group">
            <label htmlFor="stress">How stressed do you feel today? (1–10)</label>
            <input
              id="stress"
              name="stress"
              type="range"
              min={1}
              max={10}
              value={stress}
              onChange={(e) => setStress(parseInt(e.target.value, 10))}
            />
            <div style={{ color: 'var(--text-secondary)' }}>Current: {stress}/10</div>
          </div>

          <button type="submit" className="signup-button">Save and continue</button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingInfo;