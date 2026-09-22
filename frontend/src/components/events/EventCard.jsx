import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AuthModal } from '../common/AuthModal';
import { rsvpService } from '../../services/rsvpService';

export const EventCard = ({
  event,
  onRSVP,
  userRSVPStatus,
  className = '',
  style = {}
}) => {
  if (!event) return null;

  const { isAuthenticated, user } = useAuth();
  const { success, info, error: toastError } = useToast();

  const [status, setStatus] = useState(userRSVPStatus || event.userRSVPStatus || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isOrganizer = Boolean(
    user && event.organizer && (
      (typeof event.organizer === 'string' && (event.organizer === user._id || event.organizer === user.id)) ||
      (typeof event.organizer === 'object' && (
        event.organizer._id === user._id ||
        event.organizer.id === user._id ||
        event.organizer._id === user.id ||
        event.organizer.id === user.id ||
        (user.email && event.organizer.email === user.email)
      ))
    )
  );

  useEffect(() => {
    setStatus(userRSVPStatus !== undefined ? userRSVPStatus : event.userRSVPStatus || null);
  }, [userRSVPStatus, event.userRSVPStatus]);

  const handleCardRSVP = async (targetStatus) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    if (isSubmitting) return;

    const eventId = event._id || event.id;

    if (onRSVP) {
      onRSVP(eventId, targetStatus === status ? null : targetStatus);
      return;
    }

    // Direct autonomous handling
    const previousStatus = status;
    const isCancelling = status === targetStatus;
    const nextStatus = isCancelling ? null : targetStatus;

    setStatus(nextStatus);
    setIsSubmitting(true);

    try {
      if (isCancelling) {
        await rsvpService.removeRSVP(eventId);
        info('RSVP removed');
      } else {
        await rsvpService.setRSVP(eventId, targetStatus);
        success(targetStatus === 'GOING' ? "You're marked as Going! 🎉" : "You're marked as Interested! ⭐");
      }
    } catch (err) {
      setStatus(previousStatus);
      toastError(err.message || 'Failed to update RSVP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const defaultImage = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80';

  return (
    <>
      <div
        className={`hover-lift ${className}`}
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: `1px solid ${event.isFeatured ? 'rgba(253, 118, 26, 0.4)' : 'var(--color-border-subtle)'}`,
          boxShadow: event.isFeatured ? '0 4px 20px -2px rgba(253, 118, 26, 0.15)' : 'var(--shadow-sm)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'all var(--transition-normal)',
          ...style
        }}
      >
        {/* Event Thumbnail */}
        <Link to={`/events/${event._id || event.id}`} style={{ position: 'relative', display: 'block', overflow: 'hidden', height: '190px' }}>
          <img
            src={event.image || defaultImage}
            alt={event.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform var(--transition-normal)'
            }}
            onError={(e) => {
              e.target.src = defaultImage;
            }}
          />

          {/* Floating Category & Featured/Suspended Badges */}
          <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px', zIndex: 2, flexWrap: 'wrap' }}>
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              color: 'var(--color-primary)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {event.category || 'General'}
            </span>
            {event.status === 'SUSPENDED' && (
              <span style={{
                backgroundColor: 'var(--color-error, #EF4444)',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                ⚠️ Suspended by Admin
              </span>
            )}
            {event.status === 'CANCELLED' && (
              <span style={{
                backgroundColor: 'var(--color-error, #EF4444)',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)'
              }}>
                🚫 Cancelled
              </span>
            )}
            {event.isFeatured && event.status !== 'SUSPENDED' && event.status !== 'CANCELLED' && (
              <span style={{
                backgroundColor: 'var(--color-secondary)',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                ⭐ Featured
              </span>
            )}
          </div>

          {/* Price Tag Overlay */}
          <div style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 2 }}>
            <span style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              color: '#FFFFFF',
              padding: '4px 10px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 700
            }}>
              {event.price === 0 || !event.price ? 'Free Entry' : `₹${event.price}`}
            </span>
          </div>
        </Link>

        {/* Card Content */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
          {/* Date / Time */}
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📅</span>
            <span>{formatDate(event.startDate)}</span>
          </div>

          {/* Title */}
          <Link to={`/events/${event._id || event.id}`}>
            <h3 style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--color-text-main)',
              lineHeight: 1.35,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              lineClamp: 2,
              WebkitBoxOrient: 'vertical',
              margin: 0
            }}>
              {event.title}
            </h3>
          </Link>

          {/* Location & Distance */}
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📍</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
              {event.location?.address || event.location?.city || 'Local Venue'}
            </span>
            {event.distanceKm && (
              <span style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>
                • {event.distanceKm} km away
              </span>
            )}
          </div>

          {/* Action Bar */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '12px',
            borderTop: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}>
            {event.status === 'SUSPENDED' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: 'var(--color-error, #EF4444)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {isOrganizer ? '⚠️ Suspended (Visible only to you)' : '⚠️ Sorry, this event has been suspended'}
                </span>
              </div>
            ) : event.status === 'CANCELLED' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--color-error, #EF4444)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🚫 Cancelled by Host
                </span>
              </div>
            ) : isOrganizer ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(15, 118, 110, 0.1)',
                  color: 'var(--color-primary)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  📢 Hosted by You
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  👥 {event.goingCount || event.attendeesCount || 0} Going
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleCardRSVP('GOING')}
                  disabled={isSubmitting}
                  className="focus-ring"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: status === 'GOING' ? 'var(--color-success)' : 'var(--color-bg-subtle)',
                    color: status === 'GOING' ? '#FFFFFF' : 'var(--color-text-main)',
                    border: '1px solid var(--color-border-subtle)',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {status === 'GOING' ? '✓ Going' : '+ Going'}
                </button>

                <button
                  type="button"
                  onClick={() => handleCardRSVP('INTERESTED')}
                  disabled={isSubmitting}
                  className="focus-ring"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: status === 'INTERESTED' ? 'var(--color-secondary)' : 'var(--color-bg-subtle)',
                    color: status === 'INTERESTED' ? '#FFFFFF' : 'var(--color-text-main)',
                    border: '1px solid var(--color-border-subtle)',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {status === 'INTERESTED' ? '★ Interested' : '☆ Interested'}
                </button>
              </div>
            )}

            <Link
              to={`/events/${event._id || event.id}`}
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Details →
            </Link>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
      />
    </>
  );
};
