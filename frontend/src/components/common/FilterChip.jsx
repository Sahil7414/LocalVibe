import React from 'react';

export const FilterChip = ({
  label,
  isActive = false,
  onClick,
  onClear,
  icon,
  className = '',
  style = {}
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 500,
        borderRadius: 'var(--radius-full)',
        backgroundColor: isActive ? 'var(--color-primary-light)' : 'var(--color-bg-surface)',
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-main)',
        border: `1px solid ${isActive ? 'rgba(255, 90, 95, 0.4)' : 'var(--color-border-subtle)'}`,
        boxShadow: 'var(--shadow-sm)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all var(--transition-fast)',
        userSelect: 'none',
        ...style
      }}
      className={className}
      onClick={onClick}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
      {isActive && onClear && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          style={{
            marginLeft: '2px',
            color: 'var(--color-primary)',
            fontWeight: 'bold',
            lineHeight: 1
          }}
          aria-label={`Clear ${label} filter`}
        >
          &times;
        </button>
      )}
    </div>
  );
};
