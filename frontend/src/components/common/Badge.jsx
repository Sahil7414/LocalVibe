import React from 'react';

export const Badge = ({
  children,
  variant = 'default', // 'default' | 'primary' | 'featured' | 'success' | 'warning' | 'info' | 'error'
  size = 'md',        // 'sm' | 'md'
  icon,
  className = '',
  style = {}
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          border: '1px solid rgba(255, 90, 95, 0.2)'
        };
      case 'featured':
        return {
          backgroundColor: 'var(--color-featured-light)',
          color: '#B7791F',
          border: '1px solid rgba(255, 180, 0, 0.3)',
          fontWeight: 700
        };
      case 'success':
        return {
          backgroundColor: 'var(--color-success-light)',
          color: 'var(--color-success)',
          border: '1px solid rgba(56, 161, 105, 0.2)'
        };
      case 'warning':
        return {
          backgroundColor: 'var(--color-warning-light)',
          color: 'var(--color-warning)',
          border: '1px solid rgba(221, 107, 32, 0.2)'
        };
      case 'info':
        return {
          backgroundColor: 'var(--color-info-light)',
          color: 'var(--color-info)',
          border: '1px solid rgba(49, 130, 206, 0.2)'
        };
      case 'error':
        return {
          backgroundColor: 'var(--color-error-light)',
          color: 'var(--color-error)',
          border: '1px solid rgba(229, 62, 62, 0.2)'
        };
      case 'default':
      default:
        return {
          backgroundColor: 'var(--color-bg-subtle)',
          color: 'var(--color-text-main)',
          border: '1px solid var(--color-border-subtle)'
        };
    }
  };

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
        fontSize: size === 'sm' ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        lineHeight: 1.2,
        ...getVariantStyles(),
        ...style
      }}
    >
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
};
