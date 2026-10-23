import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, initialLoading } = useAuth();
  const location = useLocation();

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-slate-400 font-serif tracking-widest text-sm uppercase">
          Verifying Savoria Credentials...
        </p>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role verification check
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900 border border-red-500/30 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mb-2">Restricted Access</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your account ({user.email}) with role <span className="text-amber-400 font-bold uppercase">{user.role}</span> does not have authorization to view this section.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/"
              className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
            >
              Return Home
            </a>
            {user.role === 'customer' && (
              <a
                href="/profile"
                className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold transition-colors"
              >
                My Account
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return children;
};
