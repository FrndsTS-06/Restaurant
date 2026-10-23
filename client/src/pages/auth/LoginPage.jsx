import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Lock, Mail, Shield, User, Briefcase, AlertCircle } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const errors = {};

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address (e.g. name@savoria.com).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({ email: '', password: '' });

    const result = await login(trimmedEmail, password);
    if (result.success) {
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else if (result.user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      if (result.status === 429) {
        setError('Too many sign-in attempts. Please wait 15 minutes or reset your password.');
      } else {
        setError(result.message || 'Invalid credentials. Please verify email and password.');
      }
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setFieldErrors({ email: '', password: '' });
    setError(null);
  };

  return (
    <div style={{
      padding: '5rem 1.5rem',
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Badge variant="gold">Authentication Portal</Badge>
          <h1 className="heading-md" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
            Welcome to <span className="gradient-text-gold">Savoria</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Sign in to access reservations, order history, or administrative controls.
          </p>
        </div>

        {error && (
          <div
            id="login-error-alert"
            role="alert"
            style={{
              backgroundColor: 'rgba(255, 99, 71, 0.1)',
              border: '1px solid rgba(255, 99, 71, 0.3)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              color: '#ff8a75',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-email-input" className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-email-input"
                type="email"
                autoComplete="username"
                placeholder="name@savoria.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                }}
                className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  borderColor: fieldErrors.email ? '#ef4444' : undefined
                }}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              />
            </div>
            {fieldErrors.email && (
              <span id="login-email-error" role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label htmlFor="login-password-input" className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-password-input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                }}
                className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  borderColor: fieldErrors.password ? '#ef4444' : undefined
                }}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
              />
            </div>
            {fieldErrors.password && (
              <span id="login-password-error" role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                {fieldErrors.password}
              </span>
            )}
          </div>

          <Button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.75rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', textAlign: 'center' }}>
            1-Click Demo Credentials
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <button
              id="demo-admin-btn"
              type="button"
              onClick={() => handleQuickLogin('admin@savoria.com', 'Admin@123')}
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 99, 71, 0.1)',
                border: '1px solid rgba(255, 99, 71, 0.25)',
                color: '#ff8a75',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}
            >
              <Shield size={12} /> Admin
            </button>
            <button
              id="demo-staff-btn"
              type="button"
              onClick={() => handleQuickLogin('staff@savoria.com', 'Staff@123')}
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}
            >
              <Briefcase size={12} /> Staff
            </button>
            <button
              id="demo-customer-btn"
              type="button"
              onClick={() => handleQuickLogin('guest@savoria.com', 'Guest@123')}
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(230, 175, 93, 0.1)',
                border: '1px solid rgba(230, 175, 93, 0.25)',
                color: 'var(--accent-gold)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem'
              }}
            >
              <User size={12} /> Customer
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
