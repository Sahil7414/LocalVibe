import React from 'react';

const CATEGORY_ICONS = {
  'Music': '🎵',
  'Food & Drink': '🍔',
  'Sports': '⚽',
  'Arts & Culture': '🎨',
  'Community': '🤝',
  'Markets': '🛍️',
  'Workshops': '🛠️',
  'Entertainment': '🎭',
  'Shopping': '🏷️',
  'Education': '📚',
  'Social': '🎉',
  'Other': '📍'
};

export const CategoryChip = ({
  category,
  isSelected = false,
  onClick,
  showIcon = true,
  className = '',
  style = {}
}) => {
  const icon = CATEGORY_ICONS[category] || '📍';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-bg-surface)',
        color: isSelected ? 'var(--color-text-inverse)' : 'var(--color-text-main)',
        border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
        boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        ...style
      }}
    >
      {showIcon && <span>{icon}</span>}
      <span>{category}</span>
    </button>
  );
};
