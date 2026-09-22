import React from 'react';
import { Button } from './Button';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error while loading data. Please check your internet connection or try again.',
  onRetry,
  className = '',
  style = {}
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '36px 20px',
        backgroundColor: 'var(--color-error-light)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(229, 62, 62, 0.2)',
        ...style
      }}
    >
      <span style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</span>

      <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-error)', marginBottom: '6px' }}>
        {title}
      </h3>

      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-main)', maxWidth: '380px', marginBottom: '16px' }}>
        {message}
      </p>

      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
