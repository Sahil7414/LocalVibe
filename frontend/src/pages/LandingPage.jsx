import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocationState } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';
import { eventService } from '../services/eventService';
import { rsvpService } from '../services/rsvpService';
import { LocationModal } from '../components/common/LocationModal';
import { AuthModal } from '../components/common/AuthModal';

const POPULAR_INDIAN_CITIES = [
  { name: 'Mumbai', state: 'Maharashtra', coords: [72.8777, 19.0760] },
  { name: 'Pune', state: 'Maharashtra', coords: [73.8567, 18.5204] },
  { name: 'Bengaluru', state: 'Karnataka', coords: [77.5946, 12.9716] },
  { name: 'Delhi NCR', state: 'Delhi', coords: [77.1025, 28.7041] },
  { name: 'Hyderabad', state: 'Telangana', coords: [78.4867, 17.3850] },
  { name: 'Chennai', state: 'Tamil Nadu', coords: [80.2707, 13.0827] },
  { name: 'Kolkata', state: 'West Bengal', coords: [88.3639, 22.5726] },
  { name: 'Ahmedabad', state: 'Gujarat', coords: [72.5714, 23.0225] },
  { name: 'Jaipur', state: 'Rajasthan', coords: [75.7873, 26.9124] }
];

const CATEGORY_CIRCLES = [
  { label: 'Music', icon: 'music_note', count: '42 events', tag: 'Music', bg: 'var(--color-primary-fixed)', color: '#00201d' },
  { label: 'Food & Markets', icon: 'storefront', count: '28 events', tag: 'Food & Drink', bg: 'var(--color-secondary-fixed)', color: '#341100' },
  { label: 'Arts & Culture', icon: 'palette', count: '19 events', tag: 'Arts & Culture', bg: 'var(--color-tertiary-fixed)', color: '#00201c' },
  { label: 'Sports & Fitness', icon: 'fitness_center', count: '14 events', tag: 'Sports', bg: 'var(--color-primary-fixed)', color: '#00201d' },
  { label: 'Open Mic', icon: 'mic', count: '12 events', tag: 'Music', bg: 'var(--color-secondary-fixed)', color: '#341100' },
  { label: 'Workshops', icon: 'school', count: '22 events', tag: 'Workshops', bg: 'var(--color-tertiary-fixed)', color: '#00201c' },
  { label: 'Community', icon: 'groups', count: '35 events', tag: 'Community', bg: 'var(--color-primary-fixed)', color: '#00201d' },
  { label: 'Tech & Meetups', icon: 'terminal', count: '16 events', tag: 'Tech', bg: 'var(--color-secondary-fixed)', color: '#341100' },
  { label: 'Pop-Up Shopping', icon: 'shopping_bag', count: '15 events', tag: 'Markets', bg: 'var(--color-primary-fixed)', color: '#00201d' },
  { label: 'Education', icon: 'auto_stories', count: '8 events', tag: 'Education', bg: 'var(--color-tertiary-fixed)', color: '#00201c' }
];

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { selectedLocation, selectCity, useCurrentGpsLocation, currentLocation } = useLocationState();
  const { success, error: toastError, info } = useToast();

  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRadius, setSelectedRadius] = useState(5);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [rsvpingEventId, setRsvpingEventId] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const res = await eventService.fetchAll({ limit: 10 });
        if (res && res.data) {
          setEvents(res.data);
        }
      } catch (err) {
        console.warn('Failed to load landing events:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [selectedLocation.city]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/discover');
    }
  };

  const handleRadiusClick = (radius) => {
    setSelectedRadius(radius);
    navigate(`/discover?radius=${radius}`);
  };

  const handleGPSDetect = () => {
    useCurrentGpsLocation(
      (pos) => {
        success('GPS Location detected!');
      },
      (err) => {
        toastError(err || 'Failed to detect GPS location');
      }
    );
  };

  const handleCardRSVP = async (event, e) => {
    if (e) e.stopPropagation();
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    const eventId = event._id || event.id;
    setRsvpingEventId(eventId);
    try {
      await rsvpService.setRSVP(eventId, 'GOING');
      success(`RSVP confirmed for ${event.title}! 🎉`);
      // Update local attendee count
      setEvents(prev =>
        prev.map(ev => {
          if ((ev._id || ev.id) === eventId) {
            return {
              ...ev,
              attendeesCount: (ev.attendeesCount || (ev.attendees ? ev.attendees.length : 0)) + 1,
              userRSVPStatus: 'GOING'
            };
          }
          return ev;
        })
      );
    } catch (err) {
      toastError(err.message || 'Failed to RSVP');
    } finally {
      setRsvpingEventId(null);
    }
  };

  const featuredHeroEvent = events.find(e => e.isFeatured) || events[0] || {
    title: 'Bandra Sunset Acoustic Jam & Pop-up',
    location: { address: 'Carter Road Amphitheatre', city: 'Mumbai' },
    price: 0,
    attendeesCount: 45,
    category: 'Music',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80'
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return 'Today • 7:30 PM';
    try {
      const d = new Date(dateString);
      const isToday = new Date().toDateString() === d.toDateString();
      if (isToday) {
        return `Today • ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      }
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return 'Upcoming';
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-app)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ========================================================================= */}
      {/* SECTION 1 & 2: HERO SECTION                                               */}
      {/* ========================================================================= */}
      <section
        style={{
          position: 'relative',
          backgroundColor: 'var(--color-bg-app)',
          paddingTop: '2.5rem',
          paddingBottom: '4.5rem',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(189, 201, 198, 0.25)'
        }}
      >
        {/* Soft Ambient Radial Blur Accents */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '40px',
            width: '420px',
            height: '420px',
            borderRadius: '50%',
            backgroundColor: 'rgba(156, 242, 232, 0.3)',
            filter: 'blur(90px)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '-80px',
            width: '380px',
            height: '380px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 219, 202, 0.3)',
            filter: 'blur(80px)',
            pointerEvents: 'none'
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2.5rem',
              alignItems: 'center'
            }}
          >
            {/* Left Content Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Badge Pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(0, 92, 85, 0.08)',
                  border: '1px solid rgba(0, 92, 85, 0.2)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  width: 'fit-content'
                }}
              >
                <span
                  className="material-symbols-outlined material-symbols-filled"
                  style={{ color: 'var(--color-primary)', fontSize: '18px' }}
                >
                  explore
                </span>
                <span
                  style={{
                    color: 'var(--color-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.02em'
                  }}
                >
                  Hyperlocal Event Discovery Across Indian Metros
                </span>
              </div>

              {/* Main Headline */}
              <h1
                style={{
                  fontSize: 'clamp(2.25rem, 4.5vw, 3.25rem)',
                  fontWeight: 800,
                  color: 'var(--color-text-main)',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.16,
                  margin: 0
                }}
              >
                Find what's happening{' '}
                <span
                  style={{
                    color: 'var(--color-primary)',
                    textDecoration: 'underline',
                    textDecorationColor: 'var(--color-primary-fixed-dim, #80d5cb)',
                    textDecorationThickness: '4px',
                    textUnderlineOffset: '8px'
                  }}
                >
                  around you
                </span>
                .
              </h1>

              {/* Subheading */}
              <p
                style={{
                  fontSize: '1rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                  maxWidth: '560px'
                }}
              >
                Discover local events, experiences, and communities happening near you across India. No endless feeds—just what's active in your neighborhood right now.
              </p>

              {/* Interactive Discovery Bar */}
              <form
                onSubmit={handleSearchSubmit}
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '8px',
                  borderRadius: 'var(--radius-2xl)',
                  boxShadow: '0 8px 30px rgba(0, 92, 85, 0.08)',
                  border: '1px solid rgba(189, 201, 198, 0.4)',
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: '8px',
                  alignItems: 'center'
                }}
              >
                {/* Location Pill */}
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'var(--color-bg-surface-secondary)',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-text-main)',
                    border: '1px solid rgba(189, 201, 198, 0.3)',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Change Location"
                >
                  <span
                    className="material-symbols-outlined material-symbols-filled"
                    style={{ color: 'var(--color-primary)', fontSize: '18px' }}
                  >
                    near_me
                  </span>
                  <span>{selectedLocation.name || 'Mumbai, India'}</span>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}
                  >
                    expand_more
                  </span>
                </button>

                {/* Live Search Input */}
                <div style={{ flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: 'absolute',
                      left: '10px',
                      color: 'var(--color-text-muted)',
                      fontSize: '18px',
                      pointerEvents: 'none'
                    }}
                  >
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search indie gigs, farmers markets, workshops..."
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 34px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '13px',
                      color: 'var(--color-text-main)'
                    }}
                  />
                </div>

                {/* Action CTAs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: '#FFFFFF',
                      padding: '10px 18px',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <span>Explore Events</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      arrow_forward
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/discover')}
                    style={{
                      backgroundColor: 'var(--color-bg-surface-secondary)',
                      color: 'var(--color-text-main)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-lg)',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      border: '1px solid rgba(189, 201, 198, 0.3)'
                    }}
                    title="Open Map Explorer"
                  >
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '18px' }}>
                      map
                    </span>
                    <span>Map</span>
                  </button>
                </div>
              </form>

              {/* Trending Vibe Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--color-text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)', fontSize: '15px' }}>
                    trending_up
                  </span>
                  Trending:
                </span>
                {[
                  { tag: '#LiveMusic', q: 'Live Music' },
                  { tag: '#FarmersMarket', q: 'Market' },
                  { tag: '#OpenMicBandra', q: 'Open Mic' },
                  { tag: '#ArtWalk', q: 'Art' },
                  { tag: '#WeekendPopUp', q: 'Pop-Up' }
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => navigate(`/discover?search=${encodeURIComponent(item.q)}`)}
                    style={{
                      backgroundColor: 'var(--color-bg-surface-secondary)',
                      color: 'var(--color-text-secondary)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '12px',
                      fontWeight: 500,
                      border: '1px solid rgba(189, 201, 198, 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                      e.currentTarget.style.color = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-surface-secondary)';
                      e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }}
                  >
                    {item.tag}
                  </button>
                ))}
              </div>

              {/* Social Proof Indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  paddingTop: '8px'
                }}
              >
                <div style={{ display: 'flex', marginLeft: '6px' }}>
                  {['AM', 'RS', 'TN', '+18k'].map((initial, i) => (
                    <div
                      key={i}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor:
                          i === 0
                            ? 'var(--color-primary-fixed)'
                            : i === 1
                            ? 'var(--color-secondary-fixed)'
                            : i === 2
                            ? 'var(--color-tertiary-fixed)'
                            : 'var(--color-bg-surface-high)',
                        color: 'var(--color-text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        marginLeft: i === 0 ? 0 : '-8px',
                        border: '2px solid #FFFFFF',
                        boxShadow: 'var(--shadow-xs)'
                      }}
                    >
                      {initial}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  <strong style={{ color: 'var(--color-text-main)', fontWeight: 700 }}>18,500+ Indian locals</strong>{' '}
                  exploring 400+ weekly city gatherings
                </p>
              </div>
            </div>

            {/* Right Hero Visual Card */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4 / 4.8',
                  borderRadius: 'var(--radius-2xl)',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px -10px rgba(0, 92, 85, 0.2)',
                  border: '1px solid rgba(189, 201, 198, 0.3)',
                  backgroundImage: `url('${featuredHeroEvent.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=80'}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Gradient Scrim */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(to top, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '24px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'var(--color-secondary-container, #fd761a)',
                        color: '#FFFFFF',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px',
                        fontWeight: 700,
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#EF4444'
                        }}
                        className="animate-ping-slow"
                      />
                      Happening Tonight
                    </span>

                    <span
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.45)',
                        backdropFilter: 'blur(8px)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ color: 'var(--color-primary-fixed)', fontSize: '14px' }}
                      >
                        near_me
                      </span>
                      1.2 km away
                    </span>
                  </div>

                  <div style={{ color: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        margin: 0,
                        lineHeight: 1.2
                      }}
                    >
                      {featuredHeroEvent.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '13px',
                        color: '#E2E8F0',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ color: 'var(--color-primary-fixed)', fontSize: '15px' }}
                      >
                        location_on
                      </span>
                      {featuredHeroEvent.location?.address || 'Carter Road Amphitheatre'} • {featuredHeroEvent.location?.city || selectedLocation.city || 'Mumbai'}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(4px)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: 700
                          }}
                        >
                          {featuredHeroEvent.price === 0 ? 'Free Entry' : `₹${featuredHeroEvent.price}`}
                        </span>
                        <span style={{ fontSize: '12px', color: '#CBD5E1' }}>
                          {featuredHeroEvent.attendeesCount || 45} people going
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          if (featuredHeroEvent._id) {
                            navigate(`/events/${featuredHeroEvent._id}`);
                          } else {
                            navigate('/discover');
                          }
                        }}
                        style={{
                          backgroundColor: 'var(--color-primary)',
                          color: '#FFFFFF',
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-lg)',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <span>Explore Event</span>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                          chevron_right
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: HAPPENING NEAR YOU (Visual Event Discovery Grid)               */}
      {/* ========================================================================= */}
      <section
        id="happening-near-you"
        style={{
          padding: '4.5rem 0',
          backgroundColor: 'var(--color-bg-app)'
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--color-primary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '4px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  pin_drop
                </span>
                Hyperlocal Recommendations
              </div>
              <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                Happening near you
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                Explore curated events based on your neighborhood in {selectedLocation.city || 'Mumbai'} & beyond.
              </p>
            </div>

            <Link
              to="/discover"
              style={{
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Explore all events in {selectedLocation.city || 'Mumbai'}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                arrow_forward
              </span>
            </Link>
          </div>

          {/* 5-Card Dynamic Indian Events Grid */}
          {isLoading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  style={{
                    height: '320px',
                    borderRadius: 'var(--radius-xl)',
                    backgroundColor: 'var(--color-bg-surface-secondary)',
                    animation: 'pulseGlow 1.5s infinite'
                  }}
                />
              ))}
            </div>
          ) : events.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {events.slice(0, 5).map((ev) => (
                <div
                  key={ev._id || ev.id}
                  onClick={() => navigate(`/events/${ev._id || ev.id}`)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid rgba(189, 201, 198, 0.35)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.25s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0, 92, 85, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  <div>
                    {/* Event Image */}
                    <div style={{ position: 'relative', height: '160px', overflow: 'hidden', backgroundColor: 'var(--color-bg-surface-secondary)' }}>
                      <img
                        src={ev.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80'}
                        alt={ev.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      {/* Top Category Badge */}
                      <span
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.92)',
                          backdropFilter: 'blur(4px)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--color-text-main)'
                        }}
                      >
                        {ev.category || 'Music'}
                      </span>
                      {/* Top Price Badge */}
                      <span
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          backgroundColor: ev.price === 0 ? 'var(--color-primary)' : 'var(--color-secondary-container)',
                          color: '#FFFFFF',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        {ev.price === 0 ? 'Free Entry' : `₹${ev.price}`}
                      </span>
                    </div>

                    {/* Event Body */}
                    <div style={{ padding: '14px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--color-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          display: 'block',
                          marginBottom: '4px'
                        }}
                      >
                        {formatEventDate(ev.date)}
                      </span>
                      <h3
                        className="line-clamp-1"
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: 'var(--color-text-main)',
                          margin: '0 0 6px 0',
                          lineHeight: 1.3
                        }}
                      >
                        {ev.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-secondary)',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                          location_on
                        </span>
                        <span className="line-clamp-1">
                          {ev.location?.address || 'Local Venue'}, {ev.location?.city || selectedLocation.city || 'India'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div
                    style={{
                      padding: '10px 14px 12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(189, 201, 198, 0.2)',
                      fontSize: '12px'
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--color-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 500
                      }}
                    >
                      <span
                        className="material-symbols-outlined material-symbols-filled"
                        style={{ color: 'var(--color-primary)', fontSize: '15px' }}
                      >
                        group
                      </span>
                      {ev.attendeesCount || (ev.attendees ? ev.attendees.length : 12)} Going
                    </span>

                    <button
                      type="button"
                      disabled={rsvpingEventId === (ev._id || ev.id)}
                      onClick={(e) => handleCardRSVP(ev, e)}
                      style={{
                        backgroundColor: 'rgba(0, 92, 85, 0.1)',
                        color: 'var(--color-primary)',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                        e.currentTarget.style.color = '#FFFFFF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 92, 85, 0.1)';
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }}
                    >
                      {ev.userRSVPStatus === 'GOING' ? 'Going ✓' : 'RSVP'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(189, 201, 198, 0.3)'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--color-primary)' }}>
                festival
              </span>
              <h3 style={{ marginTop: '0.75rem', fontSize: '1.2rem', fontWeight: 700 }}>
                No events found in {selectedLocation.city || 'your city'}
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '1.25rem' }}>
                Try exploring our full Indian map radar or host the first event in your neighborhood!
              </p>
              <Link to="/discover">
                <button
                  type="button"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF',
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Open Map Explorer
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: EXPLORE BY INTEREST (10 Curated Circles)                       */}
      {/* ========================================================================= */}
      <section
        id="categories"
        style={{
          padding: '3.5rem 0 4.5rem 0',
          borderTop: '1px solid rgba(189, 201, 198, 0.25)',
          backgroundColor: 'var(--color-bg-app)'
        }}
      >
        <div className="container">
          <div style={{ marginBottom: '2rem' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: '4px'
              }}
            >
              Browse Curated Circles
            </span>
            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
              Explore by interest
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Tap a vibe to discover community events happening near you.
            </p>
          </div>

          {/* 10 Interactive Category Tiles Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '1rem'
            }}
          >
            {CATEGORY_CIRCLES.map((cat) => (
              <div
                key={cat.label}
                onClick={() => navigate(`/discover?category=${encodeURIComponent(cat.tag)}`)}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(189, 201, 198, 0.3)',
                  padding: '1.25rem 1rem',
                  borderRadius: 'var(--radius-2xl)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-xs)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                  e.currentTarget.style.boxShadow = '0 8px 20px -2px rgba(0, 92, 85, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(189, 201, 198, 0.3)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-xl)',
                    backgroundColor: cat.bg,
                    color: cat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}
                >
                  <span
                    className="material-symbols-outlined material-symbols-filled"
                    style={{ fontSize: '24px' }}
                  >
                    {cat.icon}
                  </span>
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text-main)' }}>
                  {cat.label}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    backgroundColor: 'rgba(0, 92, 85, 0.08)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {cat.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: DISCOVER YOUR CITY ON THE LIVE MAP (Map-First Radar Experience) */}
      {/* ========================================================================= */}
      <section
        id="live-map"
        style={{
          padding: '4.5rem 0',
          backgroundColor: 'var(--color-bg-app)'
        }}
      >
        <div className="container">
          <div
            style={{
              backgroundColor: 'var(--color-bg-surface-secondary)',
              borderRadius: 'var(--radius-2xl)',
              padding: '2rem',
              border: '1px solid rgba(189, 201, 198, 0.35)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.75rem'
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--color-primary)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '4px'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    radar
                  </span>
                  Real-Time Proximity View
                </div>
                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                  Discover your city on the live map
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--color-text-secondary)', maxWidth: '580px' }}>
                  See what's happening around you in real time with interactive proximity pins across top Indian metros.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/discover')}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  padding: '12px 22px',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  map
                </span>
                <span>Open Interactive Map</span>
              </button>
            </div>

            {/* Stylized Indian Metro Map Canvas Mockup */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '420px',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                backgroundColor: '#0c121e',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.4)'
              }}
            >
              {/* Radial Dot Grid */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.35,
                  backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />

              {/* Geographic Indian Subcontinent Stylized Vector Lines */}
              <svg
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 120 40 Q 280 80 340 160 T 480 320 T 600 400"
                  fill="none"
                  stroke="rgba(15, 118, 110, 0.35)"
                  strokeDasharray="6,6"
                  strokeWidth="2"
                />
                <path
                  d="M 220 180 Q 400 220 540 260 T 780 280"
                  fill="none"
                  stroke="rgba(15, 118, 110, 0.4)"
                  strokeWidth="1.5"
                />
                <path
                  d="M 680 80 Q 740 200 820 340"
                  fill="none"
                  stroke="rgba(253, 118, 26, 0.3)"
                  strokeDasharray="4,4"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Metro City Clusters & Interactive Pins */}
              {/* Mumbai Pin */}
              <div
                onClick={() => selectCity(POPULAR_INDIAN_CITIES[0])}
                style={{
                  position: 'absolute',
                  top: '48%',
                  left: '28%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  zIndex: 10
                }}
                title="Select Mumbai"
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span
                    style={{
                      position: 'absolute',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#2dd4bf'
                    }}
                    className="animate-ping-slow"
                  />
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-primary)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 10px rgba(45, 212, 191, 0.8)',
                      border: '2px solid #FFFFFF'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                      local_activity
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(6px)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    boxShadow: 'var(--shadow-md)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#0f172a',
                    border: '1px solid rgba(189, 201, 198, 0.4)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  📍 Mumbai (42 active)
                </div>
              </div>

              {/* Pune Pin */}
              <div
                onClick={() => selectCity(POPULAR_INDIAN_CITIES[1])}
                style={{
                  position: 'absolute',
                  top: '58%',
                  left: '34%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  zIndex: 10
                }}
                title="Select Pune"
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-secondary)',
                    border: '2px solid #FFFFFF'
                  }}
                />
                <div
                  style={{
                    marginTop: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#0f172a',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Pune (18)
                </div>
              </div>

              {/* Bengaluru Pin */}
              <div
                onClick={() => selectCity(POPULAR_INDIAN_CITIES[2])}
                style={{
                  position: 'absolute',
                  top: '72%',
                  left: '38%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  zIndex: 10
                }}
                title="Select Bengaluru"
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span
                    style={{
                      position: 'absolute',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#fbbf24'
                    }}
                    className="animate-ping-slow"
                  />
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-secondary-container)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #FFFFFF'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>
                      palette
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#0f172a',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Bengaluru (31)
                </div>
              </div>

              {/* Delhi NCR Pin */}
              <div
                onClick={() => selectCity(POPULAR_INDIAN_CITIES[3])}
                style={{
                  position: 'absolute',
                  top: '22%',
                  left: '34%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  zIndex: 10
                }}
                title="Select Delhi NCR"
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary-container)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #FFFFFF'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>
                    music_note
                  </span>
                </div>
                <div
                  style={{
                    marginTop: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#0f172a',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Delhi NCR (38)
                </div>
              </div>

              {/* Hyderabad Pin */}
              <div
                onClick={() => selectCity(POPULAR_INDIAN_CITIES[4])}
                style={{
                  position: 'absolute',
                  top: '56%',
                  left: '45%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  zIndex: 10
                }}
                title="Select Hyderabad"
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-tertiary)',
                    border: '2px solid #FFFFFF'
                  }}
                />
                <div
                  style={{
                    marginTop: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#0f172a',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Hyderabad (19)
                </div>
              </div>

              {/* Chennai Pin */}
              <div
                onClick={() => selectCity(POPULAR_INDIAN_CITIES[5])}
                style={{
                  position: 'absolute',
                  top: '74%',
                  left: '48%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  zIndex: 10
                }}
                title="Select Chennai"
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    border: '2px solid #FFFFFF'
                  }}
                />
                <div
                  style={{
                    marginTop: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#0f172a',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Chennai (15)
                </div>
              </div>

              {/* Kolkata Pin */}
              <div
                onClick={() => selectCity(POPULAR_INDIAN_CITIES[6])}
                style={{
                  position: 'absolute',
                  top: '44%',
                  left: '64%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  zIndex: 10
                }}
                title="Select Kolkata"
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-secondary)',
                    border: '2px solid #FFFFFF'
                  }}
                />
                <div
                  style={{
                    marginTop: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#0f172a',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Kolkata (21)
                </div>
              </div>

              {/* Floating Live Cluster Pills (Bottom Left) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  maxWidth: '520px',
                  pointerEvents: 'none'
                }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid rgba(189, 201, 198, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--color-text-main)'
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#10B981'
                    }}
                    className="animate-ping-slow"
                  />
                  <span>18 events nearby in {selectedLocation.city || 'Bandra'}</span>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid rgba(189, 201, 198, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--color-text-main)'
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: 'var(--color-primary)', fontSize: '16px' }}
                  >
                    graphic_eq
                  </span>
                  <span>Live acoustic gig at Carter Rd</span>
                </div>
              </div>

              {/* Map Controls UI Overlay (Top Right) */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid rgba(189, 201, 198, 0.3)'
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate('/discover')}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--color-text-main)'
                  }}
                  title="Zoom In"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    add
                  </span>
                </button>
                <div style={{ height: '1px', backgroundColor: 'rgba(189, 201, 198, 0.3)' }} />
                <button
                  type="button"
                  onClick={() => navigate('/discover')}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--color-text-main)'
                  }}
                  title="Zoom Out"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    remove
                  </span>
                </button>
                <div style={{ height: '1px', backgroundColor: 'rgba(189, 201, 198, 0.3)' }} />
                <button
                  type="button"
                  onClick={handleGPSDetect}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--color-primary)'
                  }}
                  title="Center on GPS"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    my_location
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: HOW LOCALVIBE WORKS (3 Value Proposition Steps)                */}
      {/* ========================================================================= */}
      <section
        id="how-it-works"
        style={{
          padding: '4.5rem 0',
          borderTop: '1px solid rgba(189, 201, 198, 0.25)',
          backgroundColor: 'var(--color-bg-app)'
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem auto' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: '4px'
              }}
            >
              Discover. Explore. Join.
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0 8px 0', color: 'var(--color-text-main)' }}>
              How LocalVibe Works
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
              Zero friction discovery. Connect with your neighborhood culture in three intuitive steps.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.75rem'
            }}
          >
            {[
              {
                step: 'Step 1',
                title: 'Choose your location',
                desc: 'Use your current location with one click or pick your preferred Indian city & neighborhood to calibrate local vibes.',
                icon: 'location_on',
                bg: 'var(--color-primary-fixed)',
                color: '#00201d'
              },
              {
                step: 'Step 2',
                title: 'Discover nearby',
                desc: 'Explore events within walking distance or a short drive on the interactive map with real-time crowd numbers.',
                icon: 'map',
                bg: 'var(--color-secondary-fixed)',
                color: '#341100'
              },
              {
                step: 'Step 3',
                title: 'Join the experience',
                desc: 'View full details as a guest, RSVP in 1-click, invite your friends, and seamlessly sync to your digital calendar.',
                icon: 'confirmation_number',
                bg: 'var(--color-tertiary-fixed)',
                color: '#00201c'
              }
            ].map((item) => (
              <div
                key={item.step}
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '2rem 1.5rem',
                  borderRadius: 'var(--radius-2xl)',
                  border: '1px solid rgba(189, 201, 198, 0.3)',
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-xl)',
                    backgroundColor: item.bg,
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                    {item.icon}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--color-primary)',
                    marginBottom: '4px'
                  }}
                >
                  {item.step}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--color-text-main)' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: HYPERLOCAL CALIBRATION & PROXIMITY RADIUS WIDGET               */}
      {/* ========================================================================= */}
      <section
        style={{
          padding: '3rem 0',
          backgroundColor: 'var(--color-bg-app)'
        }}
      >
        <div className="container">
          <div
            style={{
              background:
                'linear-gradient(to right, rgba(156, 242, 232, 0.35), var(--color-bg-surface-secondary), rgba(255, 219, 202, 0.3))',
              border: '1px solid rgba(189, 201, 198, 0.35)',
              borderRadius: 'var(--radius-2xl)',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '2rem'
            }}
          >
            <div style={{ maxWidth: '540px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                  marginBottom: '6px'
                }}
              >
                Hyperlocal Calibration
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
                Your city has more going on than you think.
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Filter neighborhood gigs and pop-ups by proximity radius. Explore what's down the street without altering your permanent default city.
              </p>
            </div>

            {/* Calibration Control Box */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                padding: '1.5rem',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(189, 201, 198, 0.35)',
                boxShadow: 'var(--shadow-md)',
                minWidth: '320px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <button
                type="button"
                onClick={handleGPSDetect}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  my_location
                </span>
                <span>Use my current location (GPS)</span>
              </button>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    marginBottom: '8px'
                  }}
                >
                  <span>Proximity Radius:</span>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                    {selectedRadius} km ({selectedRadius === 5 ? 'Default' : 'Custom'})
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {[1, 5, 10, 25].map((km) => {
                    const isSelected = selectedRadius === km;
                    return (
                      <button
                        key={km}
                        type="button"
                        onClick={() => handleRadiusClick(km)}
                        style={{
                          padding: '6px 0',
                          fontSize: '12px',
                          fontWeight: isSelected ? 700 : 600,
                          borderRadius: '6px',
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-bg-surface-secondary)',
                          color: isSelected ? '#FFFFFF' : 'var(--color-text-main)',
                          border: isSelected ? '1px solid var(--color-primary)' : '1px solid rgba(189, 201, 198, 0.3)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {km} km
                      </button>
                    );
                  })}
                </div>
              </div>

              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                Calculates distance instantly in your browser
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8: COMMUNITY ORGANIZERS (Host an Event Banner)                    */}
      {/* ========================================================================= */}
      <section
        style={{
          padding: '4rem 0',
          backgroundColor: 'var(--color-bg-app)'
        }}
      >
        <div className="container">
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(189, 201, 198, 0.35)',
              borderRadius: 'var(--radius-2xl)',
              padding: '2.5rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '2rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', maxWidth: '640px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--color-secondary-fixed)',
                  color: '#341100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <span className="material-symbols-outlined material-symbols-filled" style={{ fontSize: '32px' }}>
                  campaign
                </span>
              </div>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--color-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: '4px'
                  }}
                >
                  Community Organizers
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 6px 0' }}>
                  Something happening in your community?
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Host your acoustic gig, art meetup, pop-up market, or workshop on LocalVibe. Reach thousands of enthusiastic neighborhood locals looking for experiences.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    setIsAuthModalOpen(true);
                  } else {
                    navigate('/create-event');
                  }
                }}
                style={{
                  backgroundColor: 'var(--color-secondary)',
                  color: '#FFFFFF',
                  padding: '12px 22px',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(157, 67, 0, 0.2)',
                  transition: 'all 0.15s ease'
                }}
              >
                Create an Event
              </button>

              <button
                type="button"
                onClick={() => {
                  info('LocalVibe supports verified organizers across Indian metros. Publish events with full RSVP controls.');
                }}
                style={{
                  backgroundColor: 'var(--color-bg-surface-secondary)',
                  color: 'var(--color-text-main)',
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: '1px solid rgba(189, 201, 198, 0.3)',
                  cursor: 'pointer'
                }}
              >
                Organizer Guidelines
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 9: INDIA-FIRST IDENTITY & CITY SELECTOR                           */}
      {/* ========================================================================= */}
      <section
        style={{
          padding: '3.5rem 0',
          borderTop: '1px solid rgba(189, 201, 198, 0.25)',
          backgroundColor: 'var(--color-bg-app)',
          textAlign: 'center'
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-bg-surface-secondary)',
              border: '1px solid rgba(189, 201, 198, 0.35)',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              marginBottom: '1.25rem'
            }}
          >
            <span style={{ fontSize: '18px' }}>🇮🇳</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)' }}>
              Local events. Indian cities. Real communities.
            </span>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 1.5rem 0' }}>
            Currently active in major cultural hotspots across India
          </h3>

          {/* Quick City Selector Chips */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              maxWidth: '800px',
              margin: '0 auto'
            }}
          >
            {POPULAR_INDIAN_CITIES.map((city) => {
              const isSelected = selectedLocation.city?.toLowerCase() === city.name.toLowerCase();
              return (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => selectCity(city)}
                  style={{
                    backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-bg-surface-secondary)',
                    color: isSelected ? '#FFFFFF' : 'var(--color-text-main)',
                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid rgba(189, 201, 198, 0.35)',
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '13px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isSelected && <span>📍</span>}
                  <span>{city.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 10: FINAL CTA BANNER                                              */}
      {/* ========================================================================= */}
      <section
        style={{
          padding: '4.5rem 0',
          backgroundColor: 'var(--color-bg-app)'
        }}
      >
        <div className="container">
          <div
            style={{
              backgroundColor: 'var(--color-primary-container, #0f766e)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-2xl)',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(15, 118, 110, 0.25)'
            }}
          >
            {/* Ambient Radial Glows */}
            <div
              style={{
                position: 'absolute',
                bottom: '-60px',
                right: '-60px',
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 92, 85, 0.4)',
                filter: 'blur(70px)',
                pointerEvents: 'none'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '-60px',
                left: '-60px',
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                backgroundColor: 'rgba(156, 242, 232, 0.2)',
                filter: 'blur(70px)',
                pointerEvents: 'none'
              }}
            />

            <h2
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 800,
                color: '#FFFFFF',
                margin: '0 0 12px 0',
                letterSpacing: '-0.02em',
                zIndex: 2
              }}
            >
              There's always something happening nearby.
            </h2>
            <p
              style={{
                fontSize: '1rem',
                color: 'var(--color-primary-fixed-dim, #80d5cb)',
                maxWidth: '560px',
                margin: '0 0 2rem 0',
                lineHeight: 1.6,
                zIndex: 2
              }}
            >
              Step outside your regular routine and discover the authentic pulse of your neighborhood today.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '1rem', zIndex: 2 }}>
              <Link to="/discover">
                <button
                  type="button"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: 'var(--color-primary)',
                    padding: '12px 28px',
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: 700,
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  Explore Events
                </button>
              </Link>

              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    setIsAuthModalOpen(true);
                  } else {
                    navigate('/create-event');
                  }
                }}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#FFFFFF',
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: '1px solid rgba(156, 242, 232, 0.4)',
                  cursor: 'pointer'
                }}
              >
                Host an Event
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 11: COMPREHENSIVE FOOTER                                          */}
      {/* ========================================================================= */}
      <footer
        style={{
          backgroundColor: 'var(--color-bg-surface-secondary)',
          borderTop: '1px solid rgba(189, 201, 198, 0.3)',
          padding: '3rem 0 2rem 0',
          marginTop: 'auto'
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2.5rem',
              paddingBottom: '2.5rem',
              borderBottom: '1px solid rgba(189, 201, 198, 0.25)'
            }}
          >
            {/* Brand & India statement */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 900
                  }}
                >
                  LV
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  LocalVibe
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Discover what's happening around you. Hyperlocal event discovery, artisanal gatherings, and community circles across India.
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--color-bg-surface-high)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  width: 'fit-content'
                }}
              >
                <span>🇮🇳 Dedicated to Indian Cities</span>
              </div>
            </div>

            {/* Quick Explore Links */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 12px 0' }}>
                Explore
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                <li>
                  <Link to="/discover" style={{ color: 'inherit' }}>
                    Discover Events
                  </Link>
                </li>
                <li>
                  <a href="#categories" style={{ color: 'inherit' }}>
                    Categories
                  </a>
                </li>
                <li>
                  <a href="#live-map" style={{ color: 'inherit' }}>
                    Live Map
                  </a>
                </li>
                <li>
                  <Link to="/discover" style={{ color: 'inherit' }}>
                    Neighborhood Curations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Host & Community */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 12px 0' }}>
                Host & Community
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                <li>
                  <Link to="/create-event" style={{ color: 'inherit' }}>
                    Create Event
                  </Link>
                </li>
                <li>
                  <Link to="/my-events" style={{ color: 'inherit' }}>
                    My RSVPs & Bookmarks
                  </Link>
                </li>
                <li>
                  <Link to="/profile" style={{ color: 'inherit' }}>
                    Account Profile
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & City Links */}
          <div
            style={{
              paddingTop: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '12px',
              color: 'var(--color-text-muted)'
            }}
          >
            <span>© {new Date().getFullYear()} LocalVibe India. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {['Mumbai', 'Bengaluru', 'Delhi NCR', 'Pune'].map((cityName) => (
                <button
                  key={cityName}
                  type="button"
                  onClick={() => {
                    const found = POPULAR_INDIAN_CITIES.find(c => c.name === cityName);
                    if (found) selectCity(found);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {cityName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentCity={selectedLocation.city}
        onSelectLocation={(cityObj) => selectCity(cityObj)}
        onDetectLocation={handleGPSDetect}
        isDetecting={currentLocation.isDetecting}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
      />

    </div>
  );
};
