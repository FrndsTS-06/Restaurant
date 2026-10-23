import React from 'react';

export const LoadingSpinner = ({ size = 'md', message = 'Preparing culinary delights...' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      gap: '1rem'
    }}>
      <div style={{
        width: size === 'lg' ? '56px' : '36px',
        height: size === 'lg' ? '56px' : '36px',
        border: '3px solid rgba(230, 175, 93, 0.2)',
        borderTopColor: 'var(--accent-gold)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      {message && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{message}</p>}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
