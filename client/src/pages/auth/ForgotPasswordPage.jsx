import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [serverError, setServerError] = useState('');

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setServerError('');
    setMessage('');
    setResetToken('');

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Please enter your email address.');
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError('Please enter a valid email address (e.g. guest@savoria.com).');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(trimmed);
      setMessage(res.message || 'If an account exists, a reset link has been dispatched.');
      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (err) {
      setServerError(err.message || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-3xl font-serif font-bold text-amber-400">SAVORIA</h1>
        <p className="mt-1 text-xs tracking-widest text-slate-400 uppercase font-serif">Haute Cuisine</p>
        <h2 className="mt-6 text-2xl font-serif font-bold text-white">Reset Account Password</h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter your registered email address to receive a secure, one-time password reset token.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          {message && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
              <p className="font-semibold">{message}</p>
              {resetToken && (
                <div className="mt-3 p-3 bg-slate-950/80 rounded-lg border border-emerald-500/20 text-xs">
                  <p className="text-slate-300 mb-1">One-Time Reset Token (valid 15 mins):</p>
                  <code className="text-amber-400 font-mono break-all font-bold">{resetToken}</code>
                  <div className="mt-3">
                    <Link
                      to={`/reset-password/${resetToken}`}
                      className="inline-block px-3 py-1.5 rounded-full bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors"
                    >
                      Proceed to Reset Password &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <FormField
              label="Email Address"
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              placeholder="guest@savoria.com"
              error={emailError}
              disabled={loading}
              required
            />

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : 'Send Reset Token'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium">
              &larr; Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
