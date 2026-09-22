import React from 'react';

const GRADIENTS = [
  'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)', // Teal (Brand Primary)
  'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)', // Amber
  'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', // Indigo
  'linear-gradient(135deg, #EA580C 0%, #FB923C 100%)', // Orange (Brand Secondary)
  'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)', // Sky
  'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)', // Violet
  'linear-gradient(135deg, #059669 0%, #34D399 100%)'  // Emerald
];

export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'LV';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'LV';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getAvatarBg = (name) => {
  if (!name || typeof name !== 'string') return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
};

export const Avatar = ({
  name = 'User',
  size = 40,
  fontSize,
  borderRadius = 'var(--radius-full)',
  border = 'none',
  boxShadow = 'var(--shadow-xs)',
  className = '',
  style = {}
}) => {
  const initials = getInitials(name);
  const background = getAvatarBg(name);
  const calculatedFontSize = fontSize || `${Math.round(size * 0.4)}px`;

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius,
        background,
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: calculatedFontSize,
        letterSpacing: '0.04em',
        border,
        boxShadow,
        userSelect: 'none',
        flexShrink: 0,
        ...style
      }}
      title={name}
      aria-label={name}
    >
      {initials}
    </div>
  );
};
