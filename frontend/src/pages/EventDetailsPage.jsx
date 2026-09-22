import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/common/AuthModal';
import { eventService } from '../services/eventService';
import { MiniEventMap } from '../components/map/MiniEventMap';
import { RSVPControl } from '../components/events/RSVPControl';
import { CompactEventCard } from '../components/events/CompactEventCard';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { Avatar } from '../components/common/Avatar';
import { useToast } from '../context/ToastContext';

export const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [event, setEvent] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const defaultHeroImage = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80';
  const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80';

  // Load Event Data from Backend
  const loadEvent = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setFetchError(null);

    try {
      const response = await eventService.fetchById(id);
      if (response && response.data) {
        setEvent(response.data);

        // Fetch related events in the same category
        if (response.data.category) {
          try {
            const relatedRes = await eventService.fetchAll({
              category: response.data.category,
              limit: 4
            });
            if (relatedRes && relatedRes.data) {
              setRelatedEvents(relatedRes.data.filter((e) => (e._id || e.id) !== id));
            }
          } catch (relErr) {
            console.warn('Could not load related events:', relErr);
          }
        }
      } else {
        setFetchError('Event not found');
      }
    } catch (err) {
      console.error('Failed to load event details:', err);
      setFetchError(err.message || 'Failed to load event details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEvent();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadEvent]);

  // Format Dates
  const formatFullDate = (startDate, endDate) => {
    try {
      const start = new Date(startDate);
      const startStr = start.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const startTime = start.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });

      if (!endDate) return `${startStr} at ${startTime}`;

      const end = new Date(endDate);
      const endTime = end.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });

      return `${startStr} • ${startTime} - ${endTime}`;
    } catch {
      return startDate;
    }
  };

  // Preferred Calendar Helper
  const getPreferredCalendar = () => {
    try {
      return localStorage.getItem('localvibe_calendar_pref') || 'google';
    } catch {
      return 'google';
    }
  };

  // Google Calendar Export Link Generator
  const getGoogleCalendarUrl = () => {
    if (!event) return '#';
    try {
      const startIso = new Date(event.startDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
      const endIso = event.endDate
        ? new Date(event.endDate).toISOString().replace(/-|:|\.\d\d\d/g, '')
        : startIso;

      const title = encodeURIComponent(event.title || 'LocalVibe Event');
      const details = encodeURIComponent(event.description || '');
      const location = encodeURIComponent(event.location?.address || '');

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
    } catch {
      return '#';
    }
  };

  // Add to Calendar Action (Supports Google, Apple iCal .ics, Outlook)
  const handleAddToCalendar = (e) => {
    e.preventDefault();
    if (event?.status === 'SUSPENDED' || event?.status === 'CANCELLED') {
      toastError('Cannot export a suspended or cancelled gathering to calendar.');
      return;
    }

    if (!isAuthenticated) {
      info('Please log in to add events to your calendar');
      setIsAuthModalOpen(true);
      return;
    }

    const pref = getPreferredCalendar();

    if (pref === 'apple') {
      try {
        const startIso = new Date(event.startDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
        const endIso = event.endDate
          ? new Date(event.endDate).toISOString().replace(/-|:|\.\d\d\d/g, '')
          : startIso;

        const icsContent = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//LocalVibe//Event Calendar//EN',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'BEGIN:VEVENT',
          `UID:localvibe-${event._id || event.id || Date.now()}@localvibe.app`,
          `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d\d\d/g, '')}`,
          `DTSTART:${startIso}`,
          `DTEND:${endIso}`,
          `SUMMARY:${event.title || 'LocalVibe Event'}`,
          `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
          `LOCATION:${event.location?.address || ''}`,
          'STATUS:CONFIRMED',
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${(event.title || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        success('Exported Apple iCal (.ics) calendar file! 🍏');
      } catch (err) {
        console.error('iCal error:', err);
        toastError('Failed to generate iCal file');
      }
      return;
    }

    if (pref === 'outlook') {
      try {
        const startIso = new Date(event.startDate).toISOString();
        const endIso = event.endDate ? new Date(event.endDate).toISOString() : startIso;
        const title = encodeURIComponent(event.title || 'LocalVibe Event');
        const details = encodeURIComponent(event.description || '');
        const location = encodeURIComponent(event.location?.address || '');
        const outlookUrl = `https://outlook.live.com/calendar/0/action/compose?subject=${title}&startdt=${startIso}&enddt=${endIso}&body=${details}&location=${location}`;
        window.open(outlookUrl, '_blank', 'noopener,noreferrer');
        success('Opening Outlook Calendar in a new tab... 📬');
      } catch (err) {
        console.error('Outlook export error:', err);
        toastError('Failed to open Outlook calendar');
      }
      return;
    }

    // Default: Google Calendar
    const calUrl = getGoogleCalendarUrl();
    if (calUrl && calUrl !== '#') {
      window.open(calUrl, '_blank', 'noopener,noreferrer');
      success('Opening Google Calendar in a new tab... 📅');
    }
  };

  // Share Event Action
  const handleShare = async () => {
    const shareData = {
      title: event?.title || 'LocalVibe Event',
      text: `Check out ${event?.title} on LocalVibe!`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        success('Shared successfully!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    success('Event link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Skeleton height="380px" borderRadius="var(--radius-xl)" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Skeleton width="30%" height="24px" />
            <Skeleton width="80%" height="40px" />
            <Skeleton height="140px" />
          </div>
          <Skeleton height="280px" />
        </div>
      </div>
    );
  }

  if (fetchError || !event) {
    return (
      <div className="container" style={{ padding: '64px 24px', maxWidth: '600px', margin: '0 auto' }}>
        <EmptyState
          icon="📅"
          title="Event Not Found"
          description={fetchError === 'Event not found' ? 'This event may have expired, been removed, or the link is invalid.' : fetchError}
          actionLabel="← Back to Discover"
          onAction={() => navigate('/discover')}
        />
      </div>
    );
  }

  const isSuspended = event.status === 'SUSPENDED';
  const isCancelled = event.status === 'CANCELLED';

  const isHost = Boolean(
    user && event?.organizer && (
      (typeof event.organizer === 'string' && (event.organizer === user._id || event.organizer === user.id)) ||
      (typeof event.organizer === 'object' && (
        event.organizer._id === user._id ||
        event.organizer.id === user._id ||
        event.organizer._id === user.id ||
        event.organizer.id === user.id ||
        (user.email && event.organizer.email === user.email)
      )) ||
      user.role === 'ADMIN'
    )
  );

  const handleCancelEvent = async () => {
    if (!window.confirm('Are you sure you want to cancel this event? This action will notify all attendees and cannot be undone.')) {
      return;
    }

    setIsCancelling(true);
    try {
      await eventService.cancel(event._id || event.id);
      setEvent((prev) => ({ ...prev, status: 'CANCELLED' }));
      success('Gathering has been cancelled successfully.');
    } catch (err) {
      console.error('Failed to cancel event:', err);
      toastError(err.message || 'Failed to cancel event');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '80px', backgroundColor: 'var(--color-bg-app)' }}>
      {/* Breadcrumbs & Navigation Header */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderBottom: '1px solid var(--color-border-subtle)',
          padding: '12px 0'
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            <Link to="/discover" style={{ color: 'var(--color-text-secondary)', fontWeight: 600, textDecoration: 'none' }}>
              Discover
            </Link>
            <span>/</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{event.category || 'Events'}</span>
            <span>/</span>
            <span style={{ color: 'var(--color-text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.title}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isHost && !isCancelled && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEvent}
                disabled={isCancelling}
                style={{
                  borderRadius: 'var(--radius-full)',
                  borderColor: 'var(--color-error)',
                  color: 'var(--color-error)',
                  fontWeight: 700
                }}
              >
                {isCancelling ? 'Cancelling...' : '🚫 Cancel Event'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              iconLeft="🔗"
              onClick={handleShare}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              Share Event
            </Button>
          </div>
        </div>
      </div>

      {/* Admin Suspension Warning Alert */}
      {isSuspended && (
        <div className="container" style={{ marginTop: '20px' }}>
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-xl)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              color: 'var(--color-error, #EF4444)'
            }}
          >
            <span style={{ fontSize: '1.6rem' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.01em' }}>
                {isHost
                  ? 'Notice: Your gathering has been suspended by platform administration.'
                  : 'Sorry, this event has been suspended.'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {isHost
                  ? 'RSVPs, admissions, and public discovery are disabled. Only you and platform moderators can view this event page.'
                  : 'RSVPs, bookings, and public attendance are currently frozen for this gathering.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Host Cancellation Notice */}
      {isCancelled && (
        <div className="container" style={{ marginTop: '20px' }}>
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-xl)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              color: 'var(--color-error, #EF4444)'
            }}
          >
            <span style={{ fontSize: '1.6rem' }}>🚫</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Notice: This event has been cancelled by the host.
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                This gathering will no longer take place. All registrations and admissions are discontinued.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Cover Banner with Ambient Tint */}
      <div className="container" style={{ marginTop: isSuspended ? '16px' : '24px' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(280px, 42vw, 440px)',
            borderRadius: 'var(--radius-2xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
            backgroundColor: 'var(--color-bg-subtle)'
          }}
        >
          <img
            src={event.image || defaultHeroImage}
            alt={event.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: isSuspended ? 'grayscale(0.4) brightness(0.9)' : 'none'
            }}
            onError={(e) => { e.target.src = defaultHeroImage; }}
          />

          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)'
          }} />

          {/* Badges Overlay */}
          <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', gap: '8px', zIndex: 2, flexWrap: 'wrap' }}>
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              color: 'var(--color-primary)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: 'var(--shadow-sm)'
            }}>
              {event.category || 'General'}
            </span>
            {isSuspended && (
              <span style={{
                backgroundColor: 'var(--color-error, #EF4444)',
                color: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                ⚠️ Suspended by Admin
              </span>
            )}
            {isCancelled && (
              <span style={{
                backgroundColor: 'var(--color-error, #EF4444)',
                color: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)'
              }}>
                🚫 Cancelled
              </span>
            )}
            {event.isFeatured && !isSuspended && !isCancelled && (
              <span style={{
                backgroundColor: 'var(--color-secondary)',
                color: '#FFFFFF',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                ⭐ Featured Event
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="container" style={{ marginTop: '32px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 380px)',
            gap: '36px',
            alignItems: 'start'
          }}
          className="event-details-grid"
        >
          {/* Left Column: Core Event Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Title & Timing Header */}
            <div style={{ backgroundColor: 'var(--color-bg-surface)', padding: '24px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 700, backgroundColor: 'rgba(15, 118, 110, 0.08)', padding: '4px 12px', borderRadius: 'var(--radius-full)', marginBottom: '12px' }}>
                <span>📅</span>
                <span>{formatFullDate(event.startDate, event.endDate)}</span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                  fontWeight: 800,
                  color: 'var(--color-text-main)',
                  lineHeight: 1.25,
                  margin: '0 0 16px 0',
                  letterSpacing: '-0.02em'
                }}
              >
                {event.title}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '14px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>📍</span>
                  <strong style={{ color: 'var(--color-text-main)' }}>{event.location?.address}</strong>
                </span>
                {event.location?.city && <span>• {event.location.city}</span>}
              </div>
            </div>

            {/* Description Section */}
            <Card variant="default" padding="lg">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text-main)' }}>
                About this Event
              </h3>
              <div
                style={{
                  fontSize: '15px',
                  lineHeight: 1.75,
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'pre-line'
                }}
              >
                {event.description}
              </div>
            </Card>

            {/* Organizer Profile Card */}
            {event.organizer && (() => {
              const isCreator = user && (
                user._id === event.organizer._id ||
                user.id === event.organizer._id ||
                user._id === event.organizer.id ||
                user.id === event.organizer.id ||
                user.email === event.organizer.email
              );

              return (
                <Card variant="default" padding="lg">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Avatar
                      name={event.organizer.name}
                      size={54}
                      border="2px solid var(--color-primary)"
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Hosted by
                        </span>
                        {isCreator && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: 'var(--color-primary-subtle, rgba(15, 118, 110, 0.12))',
                            color: 'var(--color-primary)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            letterSpacing: '0.02em'
                          }}>
                            You (Host)
                          </span>
                        )}
                      </div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)', margin: '2px 0' }}>
                        {event.organizer.name}
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                        {event.organizer.bio || 'Verified Event Curator on LocalVibe'}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })()}

            {/* Related Events Section */}
            {relatedEvents.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    More Events in {event.category}
                  </h3>
                  <Link to="/discover" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}>
                    View all →
                  </Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  {relatedEvents.slice(0, 3).map((rel) => (
                    <CompactEventCard key={rel._id || rel.id} event={rel} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Booking & Location Card */}
          <div
            style={{
              position: 'sticky',
              top: '84px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <Card variant="default" padding="lg" style={{ boxShadow: 'var(--shadow-lg)' }}>
              {/* Pricing Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Admission
                </span>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: event.price === 0 || !event.price ? 'var(--color-success)' : 'var(--color-text-main)' }}>
                  {event.price === 0 || !event.price ? 'Free Entry' : `₹${event.price}`}
                </span>
              </div>

              {/* RSVP Controls Foundation */}
              <RSVPControl
                eventId={event._id || event.id}
                userRSVPStatus={event.userRSVPStatus || null}
                attendeeCount={event.attendeesCount || 0}
                goingCount={event.goingCount || 0}
                interestedCount={event.interestedCount || 0}
                disabled={isSuspended || isCancelled}
                onRSVPChange={(eventId, newStatus, updatedData) => {
                  if (updatedData) {
                    setEvent((prev) => ({
                      ...prev,
                      userRSVPStatus: updatedData.status,
                      goingCount: updatedData.goingCount,
                      interestedCount: updatedData.interestedCount,
                      attendeesCount: updatedData.attendeesCount
                    }));
                  }
                }}
                style={{ marginBottom: '20px' }}
              />

              {/* Add to Google Calendar Action (Authenticated Only) */}
              <button
                type="button"
                onClick={handleAddToCalendar}
                disabled={isSuspended || isCancelled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: isSuspended || isCancelled ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                  padding: '11px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-subtle)',
                  marginBottom: '20px',
                  textAlign: 'center',
                  border: '1px solid var(--color-border-subtle)',
                  cursor: isSuspended || isCancelled ? 'not-allowed' : 'pointer',
                  opacity: isSuspended || isCancelled ? 0.6 : 1,
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  if (!isSuspended && !isCancelled) {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-muted)';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSuspended && !isCancelled) {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                <span>{getPreferredCalendar() === 'apple' ? '🍏' : getPreferredCalendar() === 'outlook' ? '📬' : '📆'}</span>{' '}
                {getPreferredCalendar() === 'apple'
                  ? 'Export to Apple iCal (.ics)'
                  : getPreferredCalendar() === 'outlook'
                  ? 'Add to Outlook Calendar'
                  : 'Add to Google Calendar'}
              </button>

              {/* Mini Leaflet Location Map */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
                  Location & Map
                </span>
                <MiniEventMap
                  coordinates={event.location?.coordinates}
                  title={event.title}
                  address={event.location?.address}
                  category={event.category}
                  isFeatured={event.isFeatured}
                  height="180px"
                />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Sticky RSVP Bar */}
      <div
        className="mobile-sticky-rsvp mobile-only"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 90,
          backgroundColor: 'var(--color-bg-surface)',
          borderTop: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-xl)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', textTransform: 'uppercase' }}>Admission</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: event.price === 0 || !event.price ? 'var(--color-success)' : 'var(--color-text-main)' }}>
            {event.price === 0 || !event.price ? 'Free' : `₹${event.price}`}
          </span>
        </div>

        <Button
          variant={isSuspended || isCancelled ? 'outline' : event.userRSVPStatus ? 'secondary' : 'primary'}
          size="md"
          disabled={isSuspended || isCancelled}
          onClick={() => {
            const rsvpElement = document.querySelector('.event-details-grid');
            if (rsvpElement) rsvpElement.scrollIntoView({ behavior: 'smooth' });
          }}
          style={{ flex: 1, maxWidth: '220px', fontWeight: 700 }}
        >
          {isSuspended
            ? '🚫 Event Suspended'
            : isCancelled
            ? '🚫 Cancelled'
            : event.userRSVPStatus === 'GOING'
            ? '✓ Going (Manage)'
            : event.userRSVPStatus === 'INTERESTED'
            ? '★ Interested (Manage)'
            : 'RSVP / Register →'}
        </Button>
      </div>

      {/* Auth Modal for Guests */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
      />
    </div>
  );
};
