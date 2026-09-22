import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocationState } from '../../context/LocationContext';
import { LocationModal } from './LocationModal';
import { AuthModal } from './AuthModal';
import { UserMenu } from './UserMenu';
import { Button } from './Button';

export const Header = () => {
  const { user, isAuthenticated } = useAuth();
  const { selectedLocation, selectCity, useCurrentGpsLocation, currentLocation } = useLocationState();
  const location = useLocation();
  const navigate = useNavigate();

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [searchHeaderQuery, setSearchHeaderQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const isActive = (path) => {
    if (path === '/discover' && location.pathname === '/discover') return true;
    if (path === '/my-events' && location.pathname === '/my-events') return true;
    if (path === '/create-event' && location.pathname === '/create-event') return true;
    if (path === '/admin' && location.pathname === '/admin') return true;
    return false;
  };

  const handleOpenAuth = (mode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchHeaderQuery.trim()) {
      navigate(`/discover?search=${encodeURIComponent(searchHeaderQuery.trim())}`);
    }
  };

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: '72px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
          boxShadow: '0 1px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-6)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexShrink: 0 }}>
          {/* Brand Logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 800,
              fontSize: 'var(--font-size-xl)',
              color: 'var(--color-primary)',
              letterSpacing: '-0.02em',
              textDecoration: 'none'
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>📍</span>
            <span>LocalVibe</span>
          </Link>

          {/* Location Badge */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-bg-surface-secondary)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-subtle)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            className="desktop-only"
            title="Click to change location or use GPS"
          >
            <span style={{ color: 'var(--color-primary)' }}>📍</span>
            <span>{selectedLocation.name}</span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>▼</span>
          </button>
        </div>

        {/* Global Search Bar (Center Desktop) */}
        <div
          style={{
            display: 'none',
            flex: '1',
            maxWidth: '400px',
            margin: '0 var(--space-4)',
            position: 'relative'
          }}
          className="desktop-only"
        >
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              fontSize: '15px'
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Search events, artists, or venues..."
            value={searchHeaderQuery}
            onChange={(e) => setSearchHeaderQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-bg-surface-secondary)',
              border: '1px solid transparent',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-primary)',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--color-primary)';
              e.target.style.backgroundColor = '#FFFFFF';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'transparent';
              e.target.style.backgroundColor = 'var(--color-bg-surface-secondary)';
            }}
          />
        </div>

        {/* Desktop Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '6px'
            }}
            className="desktop-nav"
          >
            <Link
              to="/discover"
              className={`header-nav-link ${isActive('/discover') ? 'active' : ''}`}
            >
              Discover
            </Link>

            {isAuthenticated && (
              <Link
                to="/my-events"
                className={`header-nav-link ${isActive('/my-events') ? 'active' : ''}`}
              >
                My Events
              </Link>
            )}

            {isAuthenticated && (
              <Link
                to="/create-event"
                className={`header-nav-link ${isActive('/create-event') ? 'active' : ''}`}
              >
                Create Event
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className={`header-nav-link ${isActive('/admin') ? 'active' : ''}`}
              >
                Admin Dashboard
              </Link>
            )}
          </nav>

          {/* User Auth Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isAuthenticated ? (
              <UserMenu user={user} onOpenLocation={() => setIsLocationModalOpen(true)} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenAuth('login')}
                >
                  Log In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenAuth('register')}
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              className="mobile-hamburger"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                display: 'none',
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-surface-secondary)',
                color: 'var(--color-text-primary)',
                fontSize: '18px',
                border: 'none',
                cursor: 'pointer'
              }}
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '72px',
            left: 0,
            right: 0,
            backgroundColor: 'var(--color-bg-surface)',
            borderBottom: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
            padding: 'var(--space-4)',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div
            onClick={() => {
              setIsLocationModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-bg-surface-secondary)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer'
            }}
          >
            <span>📍 City: <strong>{selectedLocation.name}</strong></span>
            <span>Change ↗</span>
          </div>

          <Link
            to="/discover"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 600,
              color: isActive('/discover') ? 'var(--color-primary)' : 'var(--color-text-primary)',
              backgroundColor: isActive('/discover') ? 'var(--color-primary-light)' : 'transparent'
            }}
          >
            🗺️ Discover Events
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/my-events"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 600,
                  color: isActive('/my-events') ? 'var(--color-primary)' : 'var(--color-text-primary)'
                }}
              >
                🎟️ My Events & RSVPs
              </Link>
              <Link
                to="/create-event"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 600,
                  color: isActive('/create-event') ? 'var(--color-primary)' : 'var(--color-text-primary)'
                }}
              >
                ➕ Create Event
              </Link>
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 600
                }}
              >
                👤 Profile & Preferences
              </Link>
              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: 600,
                    color: 'var(--color-primary)'
                  }}
                >
                  ⚡ Admin Dashboard
                </Link>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Button
                variant="outline"
                size="md"
                fullWidth
                onClick={() => handleOpenAuth('login')}
              >
                Log In
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => handleOpenAuth('register')}
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentCity={selectedLocation.name}
        onSelectLocation={(cityObj) => {
          selectCity(cityObj);
          setIsLocationModalOpen(false);
          navigate(`/discover?city=${encodeURIComponent(cityObj.name)}&lat=${cityObj.coords[1]}&lng=${cityObj.coords[0]}`);
        }}
        onDetectLocation={() => {
          useCurrentGpsLocation(
            (gpsData) => {
              setIsLocationModalOpen(false);
              const cityParam = gpsData?.city ? `&city=${encodeURIComponent(gpsData.city)}` : '';
              navigate(`/discover?lat=${gpsData.lat}&lng=${gpsData.lng}${cityParam}`);
            },
            (err) => {
              console.warn('GPS location error:', err);
              setIsLocationModalOpen(false);
            }
          );
        }}
        isDetecting={currentLocation.isDetecting}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};
