import React from 'react';
import './PasswordStrength.css';

interface PasswordStrengthProps {
  password: string;
}

type StrengthLevel = 'weak' | 'medium' | 'strong' | 'very-strong';

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const calculateStrength = (pwd: string): StrengthLevel => {
    if (!pwd) return 'weak';
    
    let score = 0;
    
    // Length checks
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (pwd.length >= 16) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(pwd)) score += 1; // lowercase
    if (/[A-Z]/.test(pwd)) score += 1; // uppercase
    if (/[0-9]/.test(pwd)) score += 1; // numbers
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1; // special characters
    
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    if (score <= 6) return 'strong';
    return 'very-strong';
  };

  const getRequirements = (pwd: string) => {
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^a-zA-Z0-9]/.test(pwd),
    };
  };

  const strength = calculateStrength(password);
  const requirements = getRequirements(password);
  const allMet = Object.values(requirements).every(req => req);

  const strengthConfig = {
    weak: { label: 'Weak', color: 'var(--error-color)', width: '25%' },
    medium: { label: 'Medium', color: '#ff9800', width: '50%' },
    strong: { label: 'Strong', color: '#4caf50', width: '75%' },
    'very-strong': { label: 'Very Strong', color: 'var(--success-color)', width: '100%' },
  };

  const config = strengthConfig[strength];

  if (!password) return null;

  return (
    <div className="password-strength">
      <div className="strength-bar-container">
        <div className="strength-bar-bg">
          <div 
            className="strength-bar-fill" 
            style={{ 
              width: config.width, 
              backgroundColor: config.color 
            }}
          />
        </div>
        <span className="strength-label" style={{ color: config.color }}>
          {config.label}
        </span>
      </div>
      
      <div className="password-requirements">
        <div className={`requirement ${requirements.length ? 'met' : ''}`}>
          <span className="requirement-icon">
            {requirements.length ? '✓' : '○'}
          </span>
          <span>At least 8 characters</span>
        </div>
        <div className={`requirement ${requirements.uppercase ? 'met' : ''}`}>
          <span className="requirement-icon">
            {requirements.uppercase ? '✓' : '○'}
          </span>
          <span>One uppercase letter</span>
        </div>
        <div className={`requirement ${requirements.lowercase ? 'met' : ''}`}>
          <span className="requirement-icon">
            {requirements.lowercase ? '✓' : '○'}
          </span>
          <span>One lowercase letter</span>
        </div>
        <div className={`requirement ${requirements.number ? 'met' : ''}`}>
          <span className="requirement-icon">
            {requirements.number ? '✓' : '○'}
          </span>
          <span>One number</span>
        </div>
        <div className={`requirement ${requirements.special ? 'met' : ''}`}>
          <span className="requirement-icon">
            {requirements.special ? '✓' : '○'}
          </span>
          <span>One special character</span>
        </div>
      </div>
    </div>
  );
};

export default PasswordStrength;

