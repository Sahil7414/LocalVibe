import React from 'react';

export const LocationBadge = ({
  city = 'Mumbai',
  onClick,
  className = '',
  style = {}
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        backgroundColor: 'var(--color-bg-subtle)',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--color-border-subtle)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 600,
        color: 'var(--color-text-main)',
        transition: 'all var(--transition-fast)',
        ...style
      }}
    >
      <span style={{ color: 'var(--color-primary)' }}>📍</span>
      <span>{city}</span>
      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>▼</span>
    </button>
  );
};
