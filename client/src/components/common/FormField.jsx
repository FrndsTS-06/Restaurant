import React from 'react';

export const FormField = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  children,
  ...rest
}) => {
  return (
    <div className={`flex flex-col gap-1.5 mb-4 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300 flex items-center gap-1">
          {label}
          {required && <span className="text-amber-400" aria-hidden="true">*</span>}
        </label>
      )}
      {children ? (
        children
      ) : (
        <input
          id={id}
          name={rest.name || id}
          type={type}
          value={value !== undefined ? value : ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors text-sm ${
            error ? 'border-red-500/80 ring-1 ring-red-500/50' : 'border-slate-800 focus:border-amber-500/80'
          } ${inputClassName}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...rest}
        />
      )}
      {error && (
        <span id={`${id}-error`} role="alert" className="text-xs text-rose-400 mt-0.5 flex items-center gap-1">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={`${id}-helper`} className="text-xs text-slate-400 mt-0.5">
          {helperText}
        </span>
      )}
    </div>
  );
};

