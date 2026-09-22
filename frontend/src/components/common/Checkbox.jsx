import React from 'react';

export const Checkbox = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  id,
  name,
  className = '',
  style = {},
  ...props
}) => {
  const checkboxId = id || name || (label ? `cb-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <label
      htmlFor={checkboxId}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        userSelect: 'none',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-main)',
        ...style
      }}
    >
      <input
        id={checkboxId}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="focus-ring"
        style={{
          width: '18px',
          height: '18px',
          accentColor: 'var(--color-primary)',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  );
};
