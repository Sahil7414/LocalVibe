import React from 'react';
import { Link } from 'react-router-dom';

export const CompactEventCard = ({
  event,
  className = '',
  style = {}
}) => {
  if (!event) return null;

  const defaultImage = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=400&q=80';

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <Link
      to={`/events/${event._id || event.id}`}
      className={`hover-lift ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        backgroundColor: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        textDecoration: 'none',
        ...style
      }}
    >
      <img
        src={event.image || defaultImage}
        alt={event.title}
        style={{
          width: '72px',
          height: '72px',
          borderRadius: 'var(--radius-md)',
          objectFit: 'cover',
          flexShrink: 0
        }}
        onError={(e) => { e.target.src = defaultImage; }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)' }}>
            {formatDate(event.startDate)}
          </span>
          {event.status === 'SUSPENDED' ? (
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-error, #EF4444)' }}>
              ⚠️ Suspended
            </span>
          ) : (
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-main)' }}>
              {event.price === 0 || !event.price ? 'Free' : `₹${event.price}`}
            </span>
          )}
        </div>

        <h4 style={{
          fontSize: '0.9rem',
          fontWeight: 700,
          color: 'var(--color-text-main)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          margin: 0
        }}>
          {event.title}
        </h4>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '180px'
          }}>
            📍 {event.location?.address || event.location?.city || 'Local Venue'}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)' }}>
            View →
          </span>
        </div>
      </div>
    </Link>
  );
};
