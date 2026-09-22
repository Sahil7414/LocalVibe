import React from 'react';
import { Skeleton } from '../common/Skeleton';

export const MapContainerSkeleton = ({ height = '100%', className = '', style = {} }) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: '100%',
        height,
        minHeight: '300px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-subtle)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...style
      }}
    >
      <div style={{ textAlign: 'center', zIndex: 1, padding: '20px' }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🗺️</div>
        <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          Loading interactive map...
        </p>
      </div>
    </div>
  );
};
