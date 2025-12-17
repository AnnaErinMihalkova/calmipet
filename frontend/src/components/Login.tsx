import React, { useState } from 'react';
import { authService, validateEmail } from '../services/auth';
import CircularLogo from './CircularLogo';
import './Login.css';

interface LoginProps {
  onNavigateToSignup?: () => void;
  onAuthSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onNavigateToSignup, onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
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
      const response = await authService.login(formData);
      setSuccessMessage('Login successful! Redirecting...');
      console.log('Login successful:', response);
      // Navigate to home if provided, otherwise fallback to root
      setTimeout(() => {
        if (onAuthSuccess) {
          onAuthSuccess();
        } else {
          window.location.hash = 'onboarding';
        }
      }, 1000);
    } catch (error: any) {
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.email) {
          setErrors({ email: errorData.email[0] });
        } else if (errorData.password) {
          setErrors({ password: errorData.password[0] });
        } else if (errorData.non_field_errors) {
          setErrors({ email: errorData.non_field_errors[0] });
        } else {
          setErrors({ email: 'Invalid email or password' });
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
    <div className="login-container">
      <div className="login-card">
        <div className="logo-container">
          <CircularLogo size={120} />
          <h1 className="logo-text">Welcome back</h1>
          <p className="logo-tagline">Find your calm today</p>
        </div>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <button type="button" className="ghost-cta" style={{ fontWeight: 700 }}>Log In</button>
          <button type="button" className="ghost-cta" style={{ opacity: 0.8 }} onClick={() => onNavigateToSignup ? onNavigateToSignup() : (window.location.hash = 'signup')}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
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
                placeholder="Enter your password"
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
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16, alignItems: 'center' }}>
            <div style={{ height: 1, background: 'var(--border-color)' }} />
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>OR CONTINUE WITH</div>
            <div style={{ height: 1, background: 'var(--border-color)' }} />
            <button type="button" className="ghost-cta"></button>
            <button type="button" className="ghost-cta">G</button>
            <button type="button" className="ghost-cta">f</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

