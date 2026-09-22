import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../common/Badge';

export const MapPopupCard = ({ event }) => {
  if (!event) return null;

  const defaultImage = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=400&q=80';

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      style={{
        width: '220px',
        fontFamily: 'var(--font-family)',
        backgroundColor: 'var(--color-bg-surface)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '110px' }}>
        <img
          src={event.image || defaultImage}
          alt={event.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.target.src = defaultImage; }}
        />
        <div style={{ position: 'absolute', top: '6px', left: '6px', display: 'flex', gap: '4px' }}>
          <Badge variant={event.isFeatured ? 'featured' : 'default'} size="sm">
            {event.category || 'General'}
          </Badge>
          {event.status === 'SUSPENDED' && (
            <span style={{
              backgroundColor: 'var(--color-error, #EF4444)',
              color: '#FFFFFF',
              padding: '2px 6px',
              borderRadius: 'var(--radius-full)',
              fontSize: '10px',
              fontWeight: 700
            }}>
              ⚠️ Suspended
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-xs)' }}>
          <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            {formatDate(event.startDate)}
          </span>
          <span style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
            {event.price === 0 ? 'Free' : `₹${event.price}`}
          </span>
        </div>

        <h4 style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          color: 'var(--color-text-main)',
          lineHeight: 1.2,
          margin: '2px 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {event.title}
        </h4>

        <span style={{
          fontSize: '11px',
          color: 'var(--color-text-muted)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          📍 {event.location?.address || event.location?.city}
        </span>

        <Link
          to={`/events/${event._id || event.id}`}
          style={{
            marginTop: '6px',
            textAlign: 'center',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            padding: '5px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            display: 'block'
          }}
        >
          View Details →
        </Link>
      </div>
    </div>
  );
};
