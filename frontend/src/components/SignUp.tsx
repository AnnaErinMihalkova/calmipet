import React, { useState, useEffect } from 'react';
import { authService, validateEmail } from '../services/auth';
import CircularLogo from './CircularLogo';
import PasswordStrength from './PasswordStrength';
import './SignUp.css';

interface SignUpProps {
  onNavigateToLogin?: () => void;
  onAuthSuccess?: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onNavigateToLogin, onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | 'prefer_not_to_say'>('prefer_not_to_say');
  const [baselineHr, setBaselineHr] = useState<string>('');
  const [stress, setStress] = useState<number>(5);

  // Load saved user info from localStorage on component mount
  useEffect(() => {
    try {
      const savedInfo = localStorage.getItem('hb_user_info');
      if (savedInfo) {
        const info = JSON.parse(savedInfo);
        if (info.age) setAge(String(info.age));
        if (info.gender) setGender(info.gender);
        if (info.baselineHr) setBaselineHr(String(info.baselineHr));
      }
      // Load today's stress rating if available
      const todayKey = new Date().toISOString().slice(0, 10);
      const ratingsRaw = localStorage.getItem('hb_stress_ratings');
      if (ratingsRaw) {
        const ratings = JSON.parse(ratingsRaw) as Record<string, number>;
        if (ratings[todayKey]) {
          setStress(ratings[todayKey]);
        }
      }
    } catch (error) {
      // Silently fail if localStorage is not available or data is corrupted
      console.error('Failed to load saved user info:', error);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    setSuccessMessage('');
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else {
      // Check password strength requirements
      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasLowerCase = /[a-z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);
      const hasSpecial = /[^a-zA-Z0-9]/.test(formData.password);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
        newErrors.password = 'Password must include uppercase, lowercase, number, and special character';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Save user info and stress rating before signup
      const todayKey = new Date().toISOString().slice(0, 10);
      const parsedAge = age.trim() ? Math.max(5, Math.min(120, Number(age))) : undefined;
      const parsedHr = baselineHr.trim() ? Math.max(30, Math.min(200, Number(baselineHr))) : undefined;
      const info = { age: parsedAge, gender, baselineHr: parsedHr } as any;
      localStorage.setItem('hb_user_info', JSON.stringify(info));
      const ratingsRaw = localStorage.getItem('hb_stress_ratings');
      const ratings = ratingsRaw ? JSON.parse(ratingsRaw) as Record<string, number> : {};
      ratings[todayKey] = stress;
      localStorage.setItem('hb_stress_ratings', JSON.stringify(ratings));

      const response = await authService.signUp({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      
      try {
        if (response.accessToken) {
          localStorage.setItem('accessToken', response.accessToken);
        }
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        if (response.user) {
          localStorage.setItem('hb_user', JSON.stringify(response.user));
        }
      } catch {}
      
      setSuccessMessage('Account created successfully! Redirecting...');
      setTimeout(() => {
        if (onAuthSuccess) {
          onAuthSuccess();
        } else {
          window.location.hash = 'dashboard';
        }
      }, 1000);
    } catch (error: any) {
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.email) {
          setErrors({ email: Array.isArray(errorData.email) ? errorData.email[0] : errorData.email });
        } else if (errorData.username) {
          setErrors({ username: Array.isArray(errorData.username) ? errorData.username[0] : errorData.username });
        } else if (errorData.password) {
          setErrors({ password: Array.isArray(errorData.password) ? errorData.password[0] : errorData.password });
        } else {
          setErrors({ email: 'An error occurred. Please try again.' });
        }
      } else if (error.message) {
        setErrors({ email: error.message });
      } else {
        setErrors({ email: 'An error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="logo-container">
          <CircularLogo size={120} />
          <h1 className="logo-text">CalmiPet</h1>
          <p className="logo-tagline">Your Pet's Wellness Companion</p>
        </div>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <button type="button" className="ghost-cta" style={{ opacity: 0.8 }} onClick={() => onNavigateToLogin ? onNavigateToLogin() : (window.location.hash = 'login')}>Log In</button>
          <button type="button" className="ghost-cta" style={{ fontWeight: 700 }}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Choose a username"
              className={errors.username ? 'error' : ''}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a password"
                className={errors.password ? 'error' : ''}
              />
              <button
                type="button"
                className="visibility-btn"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {formData.password && <PasswordStrength password={formData.password} />}
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrap">
              <input
                type={showConfirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                className={errors.confirmPassword ? 'error' : ''}
              />
              <button
                type="button"
                className="visibility-btn"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            <div className="form-group">
              <label htmlFor="age">Age (optional)</label>
              <input id="age" name="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g., 16" />
            </div>
            <div className="form-group">
              <label htmlFor="gender">Gender (optional)</label>
              <select id="gender" name="gender" value={gender} onChange={(e) => setGender(e.target.value as any)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="stress">Daily stress (1–10): {stress}</label>
              <input id="stress" name="stress" type="range" min={1} max={10} value={stress} onChange={(e) => setStress(parseInt(e.target.value, 10))} />
            </div>
            <div className="form-group">
              <label htmlFor="baselineHr">Regular heart rate (optional)</label>
              <input id="baselineHr" name="baselineHr" type="number" value={baselineHr} onChange={(e) => setBaselineHr(e.target.value)} placeholder="e.g., 70" />
            </div>
          </div>

          <button type="submit" className="signup-button" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="login-link">
            Already have an account?{' '}
            <a
              href="#login"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigateToLogin) {
                  onNavigateToLogin();
                } else {
                  window.location.hash = 'login';
                  window.location.reload();
                }
              }}
            >
              Sign in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
