import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../common/Badge';

export const FeaturedEventCard = ({
  event,
  className = '',
  style = {}
}) => {
  if (!event) return null;

  const defaultImage = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80';

  return (
    <div
      className={`hover-lift ${className}`}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        border: '2px solid rgba(255, 180, 0, 0.5)',
        minHeight: '260px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        ...style
      }}
    >
      {/* Background Image & Gradient */}
      <img
        src={event.image || defaultImage}
        alt={event.title}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
        onError={(e) => { e.target.src = defaultImage; }}
      />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%)'
      }} />

      {/* Floating Featured Badge */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 2 }}>
        <Badge variant="featured" size="md" icon="⭐">
          Featured Event
        </Badge>
      </div>

      {/* Content Container */}
      <div style={{ position: 'relative', zIndex: 2, padding: '20px', color: 'var(--color-text-inverse)' }}>
        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-featured)' }}>
          {event.category} • {event.location?.city || 'Local'}
        </span>

        <h3 style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 700,
          color: 'var(--color-text-inverse)',
          marginTop: '4px',
          marginBottom: '8px'
        }}>
          {event.title}
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9 }}>
            📍 {event.location?.address}
          </span>
          <Link
            to={`/events/${event._id || event.id}`}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700
            }}
          >
            Explore →
          </Link>
        </div>
      </div>
    </div>
  );
};
