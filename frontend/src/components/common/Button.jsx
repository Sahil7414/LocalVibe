import React from 'react';

export const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'icon'
  size = 'md',        // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  iconLeft,
  iconRight,
  onClick,
  type = 'button',
  fullWidth = false,
  className = '',
  style = {},
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-text-inverse)',
          border: '1px solid transparent',
          boxShadow: 'var(--shadow-sm)'
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--color-secondary)',
          color: 'var(--color-text-inverse)',
          border: '1px solid transparent'
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-text-main)',
          border: '1px solid var(--color-border-medium)'
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-text-muted)',
          border: '1px solid transparent'
        };
      case 'destructive':
        return {
          backgroundColor: 'var(--color-error)',
          color: 'var(--color-text-inverse)',
          border: '1px solid transparent'
        };
      case 'icon':
        return {
          backgroundColor: 'var(--color-bg-subtle)',
          color: 'var(--color-text-main)',
          border: '1px solid var(--color-border-subtle)',
          padding: size === 'sm' ? '6px' : '10px',
          borderRadius: 'var(--radius-full)'
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    if (variant === 'icon') return {};
    switch (size) {
      case 'sm':
        return {
          padding: '6px 12px',
          fontSize: 'var(--font-size-xs)',
          borderRadius: 'var(--radius-md)'
        };
      case 'lg':
        return {
          padding: '14px 24px',
          fontSize: 'var(--font-size-base)',
          borderRadius: 'var(--radius-lg)'
        };
      case 'md':
      default:
        return {
          padding: '10px 18px',
          fontSize: 'var(--font-size-sm)',
          borderRadius: 'var(--radius-md)'
        };
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`focus-ring ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 600,
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        width: fullWidth ? '100%' : 'auto',
        transition: 'all var(--transition-fast)',
        userSelect: 'none',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style
      }}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
      ) : (
        <>
          {iconLeft && <span>{iconLeft}</span>}
          {children}
          {iconRight && <span>{iconRight}</span>}
        </>
      )}
    </button>
  );
};
