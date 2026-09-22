import React from 'react';

export const Skeleton = ({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-md)',
  className = '',
  style = {}
}) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
};

export const EventCardSkeleton = () => {
  return (
    <div style={{
      backgroundColor: 'var(--color-bg-surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--color-border-subtle)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      paddingBottom: '14px'
    }}>
      <Skeleton height="180px" borderRadius="0" />
      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Skeleton width="40%" height="14px" />
        <Skeleton width="85%" height="20px" />
        <Skeleton width="60%" height="14px" />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <Skeleton width="30%" height="28px" />
          <Skeleton width="20%" height="28px" />
        </div>
      </div>
    </div>
  );
};
