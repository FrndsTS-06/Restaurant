import React from 'react';

export const Badge = ({ children, variant = 'gold', icon, className = '' }) => {
  const variantClass = {
    gold: 'badge-gold',
    emerald: 'badge-emerald',
    coral: 'badge-coral',
    blue: 'badge-blue'
  }[variant] || 'badge-gold';

  return (
    <span className={`badge ${variantClass} ${className}`}>
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
};
