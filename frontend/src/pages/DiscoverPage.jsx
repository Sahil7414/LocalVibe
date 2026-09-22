import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocationState, DEFAULT_SELECTED_LOCATION } from '../context/LocationContext';
import { eventService } from '../services/eventService';
import { FilterBar } from '../components/events/FilterBar';
import { LeafletMap } from '../components/map/LeafletMap';
import { EventCard } from '../components/events/EventCard';
import { CompactEventCard } from '../components/events/CompactEventCard';
import { EventCardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { SearchInput } from '../components/common/SearchInput';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';

export const DiscoverPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    selectedLocation,
    currentLocation,
    activeCoordinates,
    selectCity,
    useCurrentGpsLocation
  } = useLocationState();
  const { error: toastError, info: toastInfo } = useToast();

  // Initialize filters from URL parameters if provided
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialDate = searchParams.get('date') || 'all';
  const initialPrice = searchParams.get('price') || 'all';
  const initialRadius = searchParams.get('radius') ? parseInt(searchParams.get('radius'), 10) : 15;

  // Filters State
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedRadius, setSelectedRadius] = useState(initialRadius);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedPrice, setSelectedPrice] = useState(initialPrice);

  // Events Data State
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Selection & Sync State
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [mapCenter, setMapCenter] = useState([activeCoordinates.lat, activeCoordinates.lng]);
  const [mapZoom, setMapZoom] = useState(13);

  // Mobile View Switcher State ('split' on desktop, 'map' | 'list' on mobile)
  const [mobileView, setMobileView] = useState('map'); // 'map' | 'list'
  const [selectedEventDrawer, setSelectedEventDrawer] = useState(null);

  const cardListRef = useRef(null);

  // Sync URL parameters when searchParams change externally (e.g. Back/Forward navigation)
  useEffect(() => {
    const paramLat = searchParams.get('lat');
    const paramLng = searchParams.get('lng');
    const paramCity = searchParams.get('city');
    if (paramLat && paramLng && paramCity) {
      selectCity({
        name: paramCity,
        coords: [parseFloat(paramLng), parseFloat(paramLat)]
      });
      setMapCenter([parseFloat(paramLat), parseFloat(paramLng)]);
    }

    const paramCategory = searchParams.get('category');
    if (paramCategory && paramCategory !== selectedCategory) {
      setSelectedCategory(paramCategory);
    }

    const paramSearch = searchParams.get('search');
    if (paramSearch !== null && paramSearch !== undefined && paramSearch !== searchQuery) {
      setSearchQuery(paramSearch);
      setDebouncedSearch(paramSearch);
    }

    const paramDate = searchParams.get('date');
    if (paramDate && paramDate !== selectedDate) {
      setSelectedDate(paramDate);
    }

    const paramPrice = searchParams.get('price');
    if (paramPrice && paramPrice !== selectedPrice) {
      setSelectedPrice(paramPrice);
    }

    const paramRadius = searchParams.get('radius');
    if (paramRadius) {
      const r = parseInt(paramRadius, 10);
      if (!isNaN(r) && r !== selectedRadius) {
        setSelectedRadius(r);
      }
    }
  }, [searchParams, selectCity]);

  // Debounce search query input (300ms) and sync to URL
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (searchQuery && searchQuery.trim() !== '') {
          next.set('search', searchQuery.trim());
        } else {
          next.delete('search');
        }
        return next;
      }, { replace: true });
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, setSearchParams]);

  // Filter change handlers that sync to URL params
  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (cat && cat !== 'All') next.set('category', cat);
      else next.delete('category');
      return next;
    }, { replace: true });
  };

  const handleRadiusChange = (r) => {
    setSelectedRadius(r);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (r && r !== 15) next.set('radius', String(r));
      else next.delete('radius');
      return next;
    }, { replace: true });
  };

  const handleDateChange = (d) => {
    setSelectedDate(d);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (d && d !== 'all') next.set('date', d);
      else next.delete('date');
      return next;
    }, { replace: true });
  };

  const handlePriceChange = (p) => {
    setSelectedPrice(p);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (p && p !== 'all') next.set('price', p);
      else next.delete('price');
      return next;
    }, { replace: true });
  };

  // Fetch nearby events from backend
  const loadNearbyEvents = useCallback(async () => {
    const queryLat = activeCoordinates.lat;
    const queryLng = activeCoordinates.lng;
    if (!queryLat || !queryLng) return;

    setIsLoading(true);
    setFetchError(null);

    try {
      const response = await eventService.fetchNearby({
        lat: queryLat,
        lng: queryLng,
        radiusKm: selectedRadius,
        search: debouncedSearch,
        category: selectedCategory,
        date: selectedDate,
        price: selectedPrice,
        limit: 50
      });

      if (response && response.data) {
        setEvents(response.data);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Failed to load nearby events:', err);
      setFetchError(err.message || 'Unable to load nearby events');
    } finally {
      setIsLoading(false);
    }
  }, [activeCoordinates.lat, activeCoordinates.lng, selectedRadius, debouncedSearch, selectedCategory, selectedDate, selectedPrice]);

  // Update map center when active coordinates change
  useEffect(() => {
    if (activeCoordinates.lat && activeCoordinates.lng) {
      setMapCenter([activeCoordinates.lat, activeCoordinates.lng]);
    }
  }, [activeCoordinates.lat, activeCoordinates.lng]);

  // Fetch events when location or filters change
  useEffect(() => {
    loadNearbyEvents();
  }, [loadNearbyEvents]);

  // Notify user if geolocation permission is denied
  useEffect(() => {
    if (currentLocation.isDenied) {
      toastInfo('Location access denied. Displaying selected city.');
    }
  }, [currentLocation.isDenied, toastInfo]);

  // Handle Event Selection from Map or List
  const handleSelectEvent = useCallback((event) => {
    const eventId = event._id || event.id;
    setSelectedEventId(eventId);
    setSelectedEventDrawer(event);

    if (event.location?.coordinates) {
      // Leaflet center: [latitude, longitude]
      const [lng, lat] = event.location.coordinates;
      setMapCenter([lat, lng]);
      setMapZoom(15);
    }

    // Scroll to card in list view if on desktop
    const cardElem = document.getElementById(`event-card-${eventId}`);
    if (cardElem) {
      cardElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategory('All');
    setSelectedRadius(15);
    setSelectedDate('all');
    setSelectedPrice('all');
    setSelectedEventId(null);
    setSelectedEventDrawer(null);
    setSearchParams({});
  };

  const handleSelectLocation = (cityObj) => {
    selectCity(cityObj);
    const [lng, lat] = cityObj.coords;
    setMapCenter([lat, lng]);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('city', cityObj.name);
      next.set('lat', String(lat));
      next.set('lng', String(lng));
      return next;
    }, { replace: true });
    toastInfo(`Location changed to ${cityObj.name}`);
  };

  const handleRecenter = () => {
    if (currentLocation.lat && currentLocation.lng) {
      setMapCenter([currentLocation.lat, currentLocation.lng]);
      setMapZoom(14);
      toastInfo('Re-centered to your position');
    } else {
      useCurrentGpsLocation(
        ({ lat, lng }) => {
          setMapCenter([lat, lng]);
          toastInfo('Re-centered to your position');
        },
        (errMsg) => {
          toastInfo(errMsg || 'Unable to access GPS location');
        },
        true
      );
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'var(--color-bg-app)'
      }}
    >
      {/* Top Search & Filter Bar */}
      <div style={{ zIndex: 10, backgroundColor: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border-subtle)', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        {/* Search & Location Bar */}
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px', maxWidth: '640px' }}>
            <SearchInput
              placeholder="Search events, music, workshops, food, venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              {events.length} {events.length === 1 ? 'event' : 'events'} found
            </span>
          </div>
        </div>

        {/* Filters Bar */}
        <FilterBar
          category={selectedCategory}
          onCategoryChange={handleCategoryChange}
          radius={selectedRadius}
          onRadiusChange={handleRadiusChange}
          date={selectedDate}
          onDateChange={handleDateChange}
          price={selectedPrice}
          onPriceChange={handlePriceChange}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* Main Discover Split Viewport */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          height: '100%',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Left Column: Scrollable Event Feed (Desktop 440px - 500px) */}
        <div
          ref={cardListRef}
          className={`discover-feed ${mobileView === 'list' ? 'mobile-visible' : 'mobile-hidden'}`}
          style={{
            width: '460px',
            minWidth: '380px',
            height: '100%',
            overflowY: 'auto',
            padding: '20px',
            backgroundColor: 'var(--color-bg-app)',
            borderRight: '1px solid var(--color-border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {isLoading ? (
            <>
              <EventCardSkeleton />
              <EventCardSkeleton />
              <EventCardSkeleton />
            </>
          ) : fetchError ? (
            <ErrorState
              title="Unable to load events"
              message={fetchError}
              onRetry={loadNearbyEvents}
            />
          ) : events.length === 0 ? (
            <EmptyState
              icon={activeCoordinates.source === 'gps' && (activeCoordinates.lat < 6.0 || activeCoordinates.lat > 38.0 || activeCoordinates.lng < 68.0 || activeCoordinates.lng > 98.0) ? "📍" : "🔍"}
              title={activeCoordinates.source === 'gps' && (activeCoordinates.lat < 6.0 || activeCoordinates.lat > 38.0 || activeCoordinates.lng < 68.0 || activeCoordinates.lng > 98.0) ? "LocalVibe Supports Events in India" : "No events found nearby"}
              description={
                activeCoordinates.source === 'gps' && (activeCoordinates.lat < 6.0 || activeCoordinates.lat > 38.0 || activeCoordinates.lng < 68.0 || activeCoordinates.lng > 98.0)
                  ? "Your current GPS location is outside India. LocalVibe currently supports hyperlocal discovery in India."
                  : `We couldn't find any events matching your filters within ${selectedRadius} km of ${selectedLocation.name}.`
              }
              actionLabel={activeCoordinates.source === 'gps' && (activeCoordinates.lat < 6.0 || activeCoordinates.lat > 38.0 || activeCoordinates.lng < 68.0 || activeCoordinates.lng > 98.0) ? "Explore Mumbai Events" : "Expand to 50 km"}
              onAction={
                activeCoordinates.source === 'gps' && (activeCoordinates.lat < 6.0 || activeCoordinates.lat > 38.0 || activeCoordinates.lng < 68.0 || activeCoordinates.lng > 98.0)
                  ? () => handleSelectLocation({ name: 'Mumbai', state: 'Maharashtra', coords: [72.8777, 19.0760] })
                  : () => setSelectedRadius(50)
              }
              secondaryActionLabel="Reset all filters"
              onSecondaryAction={handleResetFilters}
            />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)', letterSpacing: '-0.01em' }}>
                  {events.length} Events Nearby
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Within {selectedRadius} km radius
                </span>
              </div>

              {events.map((event) => {
                const eventId = event._id || event.id;
                const isSelected = selectedEventId === eventId;
                return (
                  <div
                    key={eventId}
                    id={`event-card-${eventId}`}
                    onClick={() => handleSelectEvent(event)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-xl)',
                      outline: isSelected ? '2px solid var(--color-primary)' : 'none',
                      outlineOffset: '2px',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <EventCard
                      event={event}
                      className={isSelected ? 'selected-card' : ''}
                    />
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Right Column: Leaflet Map (Desktop Full remaining width / Mobile Full Canvas) */}
        <div
          className={`discover-map ${mobileView === 'map' ? 'mobile-visible' : 'mobile-hidden'}`}
          style={{
            flex: 1,
            height: '100%',
            position: 'relative'
          }}
        >
          <LeafletMap
            center={mapCenter}
            zoom={mapZoom}
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={handleSelectEvent}
            userLocation={currentLocation}
            radiusKm={selectedRadius}
            onRecenter={handleRecenter}
          />

          {/* Mobile Bottom Sheet Event Preview Card */}
          {selectedEventDrawer && (
            <div
              className="mobile-only animate-slide-up"
              style={{
                position: 'absolute',
                bottom: '80px',
                left: '16px',
                right: '16px',
                zIndex: 500,
                backgroundColor: 'var(--color-bg-surface)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-xl)',
                padding: '12px',
                border: '1px solid var(--color-border-subtle)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Selected Event
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedEventDrawer(null)}
                  style={{
                    fontSize: '1rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              </div>
              <CompactEventCard event={selectedEventDrawer} />
            </div>
          )}
        </div>
      </div>

      {/* Floating Mobile View Switcher FAB ([ 🗺️ Map ] ↔ [ 📋 List (N) ]) */}
      <div
        className="mobile-fab-container mobile-only"
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 600
        }}
      >
        <Button
          variant="primary"
          size="md"
          iconLeft={mobileView === 'map' ? '📋' : '🗺️'}
          onClick={() => setMobileView(mobileView === 'map' ? 'list' : 'map')}
          style={{
            borderRadius: 'var(--radius-full)',
            boxShadow: 'var(--shadow-xl)',
            padding: '12px 24px',
            backgroundColor: 'var(--color-primary)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '14px'
          }}
        >
          {mobileView === 'map' ? `Show List (${events.length})` : 'Show Map'}
        </Button>
      </div>
    </div>
  );
};
