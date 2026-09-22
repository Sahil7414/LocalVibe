import React from 'react';

export const Card = ({
  children,
  variant = 'default', // 'default' | 'interactive' | 'selected' | 'admin' | 'subtle'
  padding = 'md',      // 'none' | 'sm' | 'md' | 'lg'
  onClick,
  className = '',
  style = {},
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'interactive':
        return {
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          cursor: 'pointer'
        };
      case 'selected':
        return {
          backgroundColor: 'var(--color-bg-surface)',
          border: '2px solid var(--color-primary)',
          boxShadow: 'var(--shadow-md)'
        };
      case 'admin':
        return {
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderLeft: '4px solid var(--color-primary)',
          boxShadow: 'var(--shadow-sm)'
        };
      case 'subtle':
        return {
          backgroundColor: 'var(--color-bg-subtle)',
          border: '1px solid var(--color-border-subtle)'
        };
      case 'default':
      default:
        return {
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        };
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: '12px' };
      case 'lg':
        return { padding: '24px' };
      case 'md':
      default:
        return { padding: '16px' };
    }
  };

  const isInteractive = variant === 'interactive' || Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`${isInteractive ? 'hover-lift' : ''} ${className}`}
      style={{
        borderRadius: 'var(--radius-lg)',
        transition: 'all var(--transition-normal)',
        ...getVariantStyles(),
        ...getPaddingStyles(),
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};
