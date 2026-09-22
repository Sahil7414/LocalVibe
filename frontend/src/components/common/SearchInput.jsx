import React from 'react';

export const SearchInput = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search events, categories, locations...',
  className = '',
  style = {},
  ...props
}) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        ...style
      }}
      className={className}
    >
      <span style={{ position: 'absolute', left: '14px', fontSize: '1rem', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
        🔍
      </span>

      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="focus-ring"
        style={{
          width: '100%',
          padding: '10px 38px 10px 42px',
          fontSize: 'var(--font-size-sm)',
          backgroundColor: 'var(--color-bg-surface)',
          color: 'var(--color-text-main)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-sm)',
          outline: 'none',
          transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)'
        }}
        {...props}
      />

      {value && (
        <button
          type="button"
          onClick={onClear}
          style={{
            position: 'absolute',
            right: '12px',
            color: 'var(--color-text-muted)',
            fontSize: '1.1rem',
            padding: '4px',
            lineHeight: 1
          }}
          aria-label="Clear search"
        >
          &times;
        </button>
      )}
    </div>
  );
};
