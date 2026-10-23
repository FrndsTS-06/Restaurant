import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';

export const ResetPasswordPage = () => {
  const { token: urlToken } = useParams();
  const navigate = useNavigate();

  const [token, setToken] = useState(urlToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errors = {};

    const trimmedToken = (token || '').trim();
    if (!trimmedToken) {
      errors.token = 'Please provide the reset token.';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters.';
    } else if (newPassword.length > 128) {
      errors.newPassword = 'Password must not exceed 128 characters.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      await resetPassword(trimmedToken, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Password reset failed. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-3xl font-serif font-bold text-amber-400">SAVORIA</h1>
        <p className="mt-1 text-xs tracking-widest text-slate-400 uppercase font-serif">Haute Cuisine</p>
        <h2 className="mt-6 text-2xl font-serif font-bold text-white">Create New Password</h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter your new credentials below to finalize your account security reset.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          {success ? (
            <div className="text-center p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Password Reset Complete</h3>
              <p className="text-sm text-slate-300 mb-4">
                Your password has been successfully updated. Redirecting you to sign in...
              </p>
              <Link
                to="/login"
                className="inline-block px-5 py-2 rounded-full bg-amber-400 text-slate-950 font-bold text-sm hover:bg-amber-300 transition-colors"
              >
                Sign In Now
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {!urlToken && (
                  <FormField
                    label="Reset Token"
                    id="token-field"
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      if (fieldErrors.token) setFieldErrors(prev => ({ ...prev, token: '' }));
                    }}
                    placeholder="Paste 64-character token"
                    error={fieldErrors.token}
                    disabled={loading}
                    required
                  />
                )}

                <FormField
                  label="New Password"
                  id="reset-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (fieldErrors.newPassword) setFieldErrors(prev => ({ ...prev, newPassword: '' }));
                  }}
                  placeholder="••••••••"
                  error={fieldErrors.newPassword}
                  helperText="Minimum 6 characters, max 128 characters."
                  disabled={loading}
                  required
                />

                <FormField
                  label="Confirm New Password"
                  id="reset-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }}
                  placeholder="••••••••"
                  error={fieldErrors.confirmPassword}
                  disabled={loading}
                  required
                />

                <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                  {loading ? 'Resetting Password...' : 'Save New Password'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium">
                  &larr; Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
