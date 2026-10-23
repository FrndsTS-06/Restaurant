import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  id,
  ...props
}) => {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline-gold',
    ghost: 'btn-outline-gold'
  }[variant] || 'btn-primary';

  const sizeClass = size === 'sm' ? 'btn-sm' : '';

  return (
    <button
      id={id}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {icon && <span className="btn-icon-wrapper">{icon}</span>}
      {children}
    </button>
  );
};
