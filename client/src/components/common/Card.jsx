import React from 'react';

export const Card = ({
  children,
  className = '',
  variant = 'glass',
  hover = false,
  padding = 'p-6',
  onClick,
  ...props
}) => {
  const baseClasses = 'rounded-2xl transition-all duration-300';
  
  const variantClasses = {
    glass: 'bg-[#13151b]/80 backdrop-blur-md border border-white/10 shadow-xl',
    elevated: 'bg-[#1a1e28] border border-white/5 shadow-2xl',
    bordered: 'bg-[#0f1117] border border-amber-500/20 shadow-lg',
    flat: 'bg-[#141721] border border-transparent'
  }[variant] || 'bg-[#13151b]/80 border border-white/10';

  const hoverClasses = hover
    ? 'hover:-translate-y-1 hover:border-amber-400/40 hover:shadow-[0_12px_30px_rgba(230,175,93,0.15)] cursor-pointer'
    : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${hoverClasses} ${padding} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};
