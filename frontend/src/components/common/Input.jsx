import React from 'react';

export const Input = ({
  label,
  error,
  helperText,
  iconLeft,
  iconRight,
  type = 'text',
  placeholder,
  value,
  onChange,
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

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {iconLeft && (
          <span style={{ position: 'absolute', left: '12px', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
            {iconLeft}
          </span>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className="focus-ring"
          style={{
            width: '100%',
            padding: '10px 14px',
            paddingLeft: iconLeft ? '38px' : '14px',
            paddingRight: iconRight ? '38px' : '14px',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-main)',
            backgroundColor: disabled ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)',
            border: `1px solid ${error ? 'var(--color-error)' : 'var(--color-border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            transition: 'border-color var(--transition-fast)'
          }}
          {...props}
        />

        {iconRight && (
          <span style={{ position: 'absolute', right: '12px', color: 'var(--color-text-muted)' }}>
            {iconRight}
          </span>
        )}
      </div>

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
