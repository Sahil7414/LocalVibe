import React from 'react';

export const Alert = ({
  children,
  variant = 'info', // 'success' | 'warning' | 'error' | 'info'
  title,
  icon,
  onClose,
  className = '',
  style = {}
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: 'var(--color-success-light)',
          borderColor: 'rgba(56, 161, 105, 0.3)',
          color: 'var(--color-success)',
          defaultIcon: '✓'
        };
      case 'warning':
        return {
          backgroundColor: 'var(--color-warning-light)',
          borderColor: 'rgba(221, 107, 32, 0.3)',
          color: 'var(--color-warning)',
          defaultIcon: '⚠️'
        };
      case 'error':
        return {
          backgroundColor: 'var(--color-error-light)',
          borderColor: 'rgba(229, 62, 62, 0.3)',
          color: 'var(--color-error)',
          defaultIcon: '✕'
        };
      case 'info':
      default:
        return {
          backgroundColor: 'var(--color-info-light)',
          borderColor: 'rgba(49, 130, 206, 0.3)',
          color: 'var(--color-info)',
          defaultIcon: 'ℹ️'
        };
    }
  };

  const { backgroundColor, borderColor, color, defaultIcon } = getVariantStyles();

  return (
    <div
      role="alert"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${borderColor}`,
        backgroundColor,
        fontSize: 'var(--font-size-sm)',
        ...style
      }}
    >
      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon || defaultIcon}</span>
      <div style={{ flex: 1 }}>
        {title && (
          <h4 style={{ fontWeight: 700, color, marginBottom: '2px', fontSize: 'var(--font-size-sm)' }}>
            {title}
          </h4>
        )}
        <div style={{ color: 'var(--color-text-main)', opacity: 0.9 }}>
          {children}
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
            lineHeight: 1,
            padding: '2px 4px'
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};
