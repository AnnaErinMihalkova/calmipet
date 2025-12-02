import React, { useState } from 'react';
import { authService, validateEmail } from '../services/auth';
import './Login.css';

interface LoginProps {
  onNavigateToSignup?: () => void;
}

const Login: React.FC<LoginProps> = ({ onNavigateToSignup }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
      // Here you would typically redirect to the main app or store the user
      // For now, we'll just show a success message
      setTimeout(() => {
        // Redirect logic would go here
        window.location.href = '/';
      }, 1500);
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
          <svg
            className="logo"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Pet head */}
            <circle cx="100" cy="80" r="50" fill="#4CAF50" opacity="0.9" />
            {/* Pet ears */}
            <ellipse cx="70" cy="50" rx="15" ry="25" fill="#4CAF50" />
            <ellipse cx="130" cy="50" rx="15" ry="25" fill="#4CAF50" />
            {/* Inner ears */}
            <ellipse cx="70" cy="50" rx="8" ry="15" fill="#66BB6A" />
            <ellipse cx="130" cy="50" rx="8" ry="15" fill="#66BB6A" />
            {/* Eyes */}
            <circle cx="85" cy="75" r="8" fill="#FFFFFF" />
            <circle cx="115" cy="75" r="8" fill="#FFFFFF" />
            <circle cx="85" cy="75" r="4" fill="#333333" />
            <circle cx="115" cy="75" r="4" fill="#333333" />
            {/* Nose */}
            <ellipse cx="100" cy="90" rx="6" ry="5" fill="#333333" />
            {/* Mouth */}
            <path
              d="M 100 95 Q 90 100 85 95"
              stroke="#333333"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 100 95 Q 110 100 115 95"
              stroke="#333333"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Heart symbol */}
            <g transform="translate(100, 130)">
              <path
                d="M 0 -10 C -8 -18, -18 -18, -18 -8 C -18 2, 0 20, 0 20 C 0 20, 18 2, 18 -8 C 18 -18, 8 -18, 0 -10 Z"
                fill="#FF6B6B"
              />
            </g>
            {/* Decorative circles */}
            <circle cx="50" cy="140" r="8" fill="#81C784" opacity="0.6" />
            <circle cx="150" cy="140" r="8" fill="#81C784" opacity="0.6" />
          </svg>
          <h1 className="logo-text">CalmiPet</h1>
          <p className="logo-tagline">Welcome Back!</p>
        </div>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

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
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Sign In'}
          </button>

          <p className="signup-link">
            Don't have an account?{' '}
            <a
              href="#signup"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigateToSignup) {
                  onNavigateToSignup();
                } else {
                  window.location.hash = 'signup';
                  window.location.reload();
                }
              }}
            >
              Sign up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;

