import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { User, Mail, Lock, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[-0-9\s().]{7,30}$/;

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const validateField = (name, value) => {
    let error = '';
    const trimmed = (value || '').trim();

    if (name === 'name') {
      if (!trimmed) {
        error = 'Full legal name is required.';
      } else if (trimmed.length < 2) {
        error = 'Name must be at least 2 characters.';
      } else if (trimmed.length > 100) {
        error = 'Name cannot exceed 100 characters.';
      }
    }

    if (name === 'email') {
      if (!trimmed) {
        error = 'Email address is required.';
      } else if (!EMAIL_REGEX.test(trimmed)) {
        error = 'Please enter a valid email address (e.g. name@domain.com).';
      }
    }

    if (name === 'password') {
      if (!value) {
        error = 'Password is required.';
      } else if (value.length < 6) {
        error = 'Password must be at least 6 characters long.';
      } else if (value.length > 128) {
        error = 'Password cannot exceed 128 characters.';
      }
    }

    if (name === 'confirmPassword') {
      if (!value) {
        error = 'Please confirm your password.';
      } else if (value !== formData.password) {
        error = 'Passwords do not match.';
      }
    }

    if (name === 'phone' && trimmed) {
      if (!PHONE_REGEX.test(trimmed)) {
        error = 'Please enter a valid phone number (e.g. +1 555-0199).';
      } else if (trimmed.length > 30) {
        error = 'Phone number cannot exceed 30 characters.';
      }
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    if (err) {
      setFieldErrors(prev => ({ ...prev, [name]: err }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    // Run complete validation on all fields
    const errors = {};
    Object.keys(formData).forEach(key => {
      const err = validateField(key, formData[key]);
      if (err) errors[key] = err;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const res = await register(
      formData.name.trim(),
      formData.email.trim(),
      formData.password,
      formData.phone.trim()
    );

    if (res.success) {
      navigate('/');
    } else {
      setServerError(res.message || 'Registration failed. Please check your information and try again.');
    }
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
        maxWidth: '500px',
        width: '100%',
        padding: '2.5rem',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Badge variant="gold">Guest Membership</Badge>
          <h1 className="heading-md" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
            Create Your <span className="gradient-text-gold">Account</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Join Savoria's private patrons circle for bespoke culinary experiences.
          </p>
        </div>

        {serverError && (
          <div
            id="register-error-alert"
            role="alert"
            style={{
              backgroundColor: 'rgba(255, 99, 71, 0.1)',
              border: '1px solid rgba(255, 99, 71, 0.3)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              color: '#ff8a75',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="reg-name" className="form-label">Full Name *</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="reg-name"
                type="text"
                name="name"
                autoComplete="name"
                required
                aria-invalid={!!fieldErrors.name}
                aria-describedby={fieldErrors.name ? "name-error" : undefined}
                placeholder="Lord Julian Sterling"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className="form-input"
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  borderColor: fieldErrors.name ? 'rgba(239, 68, 68, 0.6)' : undefined
                }}
              />
            </div>
            {fieldErrors.name && (
              <span id="name-error" className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                {fieldErrors.name}
              </span>
            )}
          </div>

          {/* Email Address */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="reg-email" className="form-label">Email Address *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="reg-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                placeholder="julian@example.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className="form-input"
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  borderColor: fieldErrors.email ? 'rgba(239, 68, 68, 0.6)' : undefined
                }}
              />
            </div>
            {fieldErrors.email && (
              <span id="email-error" className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Password & Confirmation Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="reg-password" className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="reg-password"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  placeholder="Min 6 chars"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="form-input"
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    borderColor: fieldErrors.password ? 'rgba(239, 68, 68, 0.6)' : undefined
                  }}
                />
              </div>
              {fieldErrors.password && (
                <span id="password-error" className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                  {fieldErrors.password}
                </span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="reg-confirm-password" className="form-label">Confirm *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="reg-confirm-password"
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  aria-invalid={!!fieldErrors.confirmPassword}
                  aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="form-input"
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    borderColor: fieldErrors.confirmPassword ? 'rgba(239, 68, 68, 0.6)' : undefined
                  }}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <span id="confirmPassword-error" className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>
          </div>

          {/* Mobile Contact */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="reg-phone" className="form-label">Mobile Contact (Optional)</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="reg-phone"
                type="tel"
                name="phone"
                placeholder="+1 (555) 728-1940"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className="form-input"
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  borderColor: fieldErrors.phone ? 'rgba(239, 68, 68, 0.6)' : undefined
                }}
              />
            </div>
            {fieldErrors.phone && (
              <span className="field-error-text" style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                {fieldErrors.phone}
              </span>
            )}
          </div>

          <Button
            id="register-submit-btn"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? 'Creating Membership...' : 'Complete Registration'}
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
