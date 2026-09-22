import React from 'react';

export const Textarea = ({
  label,
  error,
  helperText,
  placeholder,
  value,
  onChange,
  rows = 4,
  required = false,
  disabled = false,
  id,
  name,
  className = '',
  style = {},
  ...props
}) => {
  const inputId = id || name || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...style }} className={className}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-main)' }}>
          {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
        </label>
      )}

      <textarea
        id={inputId}
        name={name}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="focus-ring"
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-main)',
          backgroundColor: disabled ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)',
          border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border-subtle)'}`,
          borderRadius: 'var(--radius-md)',
          outline: 'none',
          resize: 'vertical',
          transition: 'border-color var(--transition-fast)'
        }}
        {...props}
      />

      {error ? (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-error)', fontWeight: 500 }}>
          {error}
        </span>
      ) : helperText ? (
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
