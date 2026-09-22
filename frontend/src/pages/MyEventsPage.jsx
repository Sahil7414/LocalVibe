import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { rsvpService } from '../services/rsvpService';
import { EventCard } from '../components/events/EventCard';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { Skeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';
import { AuthModal } from '../components/common/AuthModal';

export const MyEventsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { info, success, error: toastError } = useToast();

  const tabParam = searchParams.get('tab');
  const initialTab = (tabParam === 'hosted' || tabParam === 'created')
    ? 'created'
    : tabParam === 'interested'
    ? 'interested'
    : 'going';

  const [activeTab, setActiveTab] = useState(initialTab); // 'going' | 'interested' | 'created'
  const [userEventsData, setUserEventsData] = useState({
    going: [],
    interested: [],
    created: [],
    counts: { going: 0, interested: 0, created: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync activeTab with URL param if it changes
  useEffect(() => {
    if (tabParam === 'hosted' || tabParam === 'created') {
      setActiveTab('created');
    } else if (tabParam === 'interested') {
      setActiveTab('interested');
    } else if (tabParam === 'going') {
      setActiveTab('going');
    }
  }, [tabParam]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName === 'created' ? 'hosted' : tabName }, { replace: true });
  };

  const loadUserEvents = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await rsvpService.getMyEvents();
      if (response && response.data) {
        setUserEventsData(response.data);
        // Smart initial switch: if user has 0 going events but has created events and no tab specified in URL
        if (!tabParam && response.data.going?.length === 0 && response.data.created?.length > 0) {
          setActiveTab('created');
        }
      }
    } catch (err) {
      console.error('Failed to load user events:', err);
      toastError(err.message || 'Unable to load your saved events.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, tabParam, toastError]);

  useEffect(() => {
    loadUserEvents();
  }, [loadUserEvents]);

  // Handle direct RSVP status toggle from MyEvents card list
  const handleCardRSVP = async (eventId, newStatus) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      if (!newStatus) {
        await rsvpService.removeRSVP(eventId);
        info('RSVP removed');
      } else {
        await rsvpService.setRSVP(eventId, newStatus);
        success(newStatus === 'GOING' ? "Marked as Going! 🎉" : "Marked as Interested! ⭐");
      }
      // Refresh user events list to reflect exact server state
      loadUserEvents();
    } catch (err) {
      toastError(err.message || 'Failed to update RSVP');
    }
  };

  const goingEvents = userEventsData.going || [];
  const interestedEvents = userEventsData.interested || [];
  const createdEvents = userEventsData.created || [];

  const currentTabEvents = activeTab === 'going' 
    ? goingEvents 
    : activeTab === 'interested' 
    ? interestedEvents 
    : createdEvents;

  const filteredEvents = currentTabEvents.filter(e => 
    e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.category && e.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (e.location?.address && e.location.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ backgroundColor: 'var(--color-bg-app)', minHeight: 'calc(100vh - 64px)', paddingBottom: '60px' }}>
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderBottom: '1px solid var(--color-border-subtle)',
          padding: '36px 0 24px 0'
        }}
      >
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(15, 118, 110, 0.08)', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
                <span>🎟️</span>
                <span>My Gatherings & Calendar</span>
              </div>
              <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--color-text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                {user?.name ? `Welcome back, ${user.name}` : 'My Events & RSVPs'}
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginTop: '6px', maxWidth: '640px' }}>
                Track your confirmed admissions, bookmarked gatherings, and events you are hosting in your local community.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/discover')}
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                🗺️ Explore Map
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/create-event')}
                style={{ borderRadius: 'var(--radius-full)', fontWeight: 700 }}
              >
                + Create Gathering
              </Button>
            </div>
          </div>

          {/* 3 Interactive Tab Selector Bento Cards */}
          <div
            role="tablist"
            aria-label="My Events Sections"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginTop: '28px'
            }}
          >
            {/* Tab 1: Confirmed Going */}
            <div
              role="tab"
              tabIndex={0}
              aria-selected={activeTab === 'going'}
              onClick={() => handleTabChange('going')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTabChange('going'); }}
              className="hover-lift"
              style={{
                backgroundColor: activeTab === 'going' ? 'rgba(15, 118, 110, 0.08)' : 'var(--color-bg-subtle)',
                border: `2px solid ${activeTab === 'going' ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
                borderRadius: 'var(--radius-xl)',
                padding: '18px 20px',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: activeTab === 'going' ? '0 4px 16px rgba(15, 118, 110, 0.15)' : 'none',
                transition: 'all var(--transition-normal)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Confirmed Going
                </span>
                <span style={{ fontSize: '1.25rem' }}>🎉</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '4px' }}>
                {goingEvents.length}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Upcoming admissions
                </span>
                {activeTab === 'going' && (
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-primary)', backgroundColor: '#FFFFFF', padding: '2px 8px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(15, 118, 110, 0.2)' }}>
                    ● Selected
                  </span>
                )}
              </div>
            </div>

            {/* Tab 2: Saved / Interested */}
            <div
              role="tab"
              tabIndex={0}
              aria-selected={activeTab === 'interested'}
              onClick={() => handleTabChange('interested')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTabChange('interested'); }}
              className="hover-lift"
              style={{
                backgroundColor: activeTab === 'interested' ? 'rgba(253, 118, 26, 0.08)' : 'var(--color-bg-subtle)',
                border: `2px solid ${activeTab === 'interested' ? 'var(--color-secondary)' : 'var(--color-border-subtle)'}`,
                borderRadius: 'var(--radius-xl)',
                padding: '18px 20px',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: activeTab === 'interested' ? '0 4px 16px rgba(253, 118, 26, 0.15)' : 'none',
                transition: 'all var(--transition-normal)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Saved / Interested
                </span>
                <span style={{ fontSize: '1.25rem' }}>⭐</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '4px' }}>
                {interestedEvents.length}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Bookmarked gatherings
                </span>
                {activeTab === 'interested' && (
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-secondary)', backgroundColor: '#FFFFFF', padding: '2px 8px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(253, 118, 26, 0.2)' }}>
                    ● Selected
                  </span>
                )}
              </div>
            </div>

            {/* Tab 3: Hosting & Created */}
            <div
              role="tab"
              tabIndex={0}
              aria-selected={activeTab === 'created'}
              onClick={() => handleTabChange('created')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTabChange('created'); }}
              className="hover-lift"
              style={{
                backgroundColor: activeTab === 'created' ? 'rgba(15, 118, 110, 0.08)' : 'var(--color-bg-subtle)',
                border: `2px solid ${activeTab === 'created' ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
                borderRadius: 'var(--radius-xl)',
                padding: '18px 20px',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: activeTab === 'created' ? '0 4px 16px rgba(15, 118, 110, 0.15)' : 'none',
                transition: 'all var(--transition-normal)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Hosting & Created
                </span>
                <span style={{ fontSize: '1.25rem' }}>📢</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '4px' }}>
                {createdEvents.length}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Organized by you
                </span>
                {activeTab === 'created' && (
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-primary)', backgroundColor: '#FFFFFF', padding: '2px 8px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(15, 118, 110, 0.2)' }}>
                    ● Selected
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container" style={{ marginTop: '28px' }}>
        {/* Clean Filter Header & Quick Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          {/* Active Section Title & Event Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0, letterSpacing: '-0.01em' }}>
              {activeTab === 'going' ? 'Confirmed Going' : activeTab === 'interested' ? 'Saved & Interested Gatherings' : 'Your Hosted Gatherings'}
            </h2>
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-bg-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-subtle)' }}>
              {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {/* Search Filter Input */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '12px', fontSize: '13px', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                🔍
              </span>
              <input
                type="text"
                placeholder="Filter by title, venue or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '9px 14px 9px 34px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-border-subtle)',
                  backgroundColor: 'var(--color-bg-surface)',
                  fontSize: '13px',
                  outline: 'none',
                  minWidth: '240px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    fontSize: '12px',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer'
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Event Cards Grid */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            <Skeleton height="320px" borderRadius="var(--radius-xl)" />
            <Skeleton height="320px" borderRadius="var(--radius-xl)" />
            <Skeleton height="320px" borderRadius="var(--radius-xl)" />
          </div>
        ) : !isAuthenticated ? (
          <div style={{ backgroundColor: 'var(--color-bg-surface)', padding: '48px 24px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-subtle)', textAlign: 'center' }}>
            <EmptyState
              icon="🔒"
              title="Sign in to view your gatherings"
              description="Log in to your LocalVibe account to access your confirmed RSVPs, bookmarked gatherings, and hosted events."
              actionLabel="Sign In / Register →"
              onAction={() => setIsAuthModalOpen(true)}
            />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ backgroundColor: 'var(--color-bg-surface)', padding: '48px 24px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-subtle)', textAlign: 'center' }}>
            <EmptyState
              icon={activeTab === 'going' ? '🎟️' : activeTab === 'interested' ? '⭐' : '📢'}
              title={
                activeTab === 'going'
                  ? 'No confirmed RSVPs yet'
                  : activeTab === 'interested'
                  ? 'No saved events'
                  : 'You haven\'t hosted an event yet'
              }
              description={
                activeTab === 'going'
                  ? 'Explore the interactive map and RSVP to live concerts, workshops, or coffee pop-ups nearby!'
                  : activeTab === 'interested'
                  ? 'Click "Interested" on events in your feed to save them for later.'
                  : 'Have a talent, pop-up cafe, or rooftop session? Host your first gathering today!'
              }
              actionLabel={activeTab === 'created' ? '+ Host an Event' : 'Explore Discover Map →'}
              onAction={() => navigate(activeTab === 'created' ? '/create-event' : '/discover')}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {filteredEvents.map((ev) => (
              <EventCard
                key={ev._id || ev.id}
                event={ev}
                userRSVPStatus={activeTab === 'going' ? 'GOING' : activeTab === 'interested' ? 'INTERESTED' : ev.userRSVPStatus || null}
                onRSVP={handleCardRSVP}
              />
            ))}
          </div>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          loadUserEvents();
        }}
        initialMode="login"
      />
    </div>
  );
};
