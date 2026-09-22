import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocationState } from '../context/LocationContext';
import { authService } from '../services/authService';
import { rsvpService } from '../services/rsvpService';
import { geocodingService } from '../services/geocodingService';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';

const AVAILABLE_VIBES = [
  { id: 'Music', label: 'Indie Music & Gigs', icon: '🎵' },
  { id: 'Food & Drink', label: 'Street Food & Dining', icon: '🍔' },
  { id: 'Arts & Culture', label: 'Arts & Exhibitions', icon: '🎨' },
  { id: 'Sports', label: 'Sports & Fitness', icon: '🏃' },
  { id: 'Workshops', label: 'Creative Workshops', icon: '🛠️' },
  { id: 'Community', label: 'Community & Open Mic', icon: '🎙️' },
  { id: 'Markets', label: 'Weekend Pop-Up Markets', icon: '🛍️' },
  { id: 'Nightlife', label: 'Nightlife & DJ Sets', icon: '🍸' }
];

const METRO_SUGGESTIONS = [
  'Mumbai',
  'Delhi NCR',
  'Bengaluru',
  'Pune',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Jaipur',
  'Goa',
  'Chandigarh',
  'Ahmedabad',
  'Kochi'
];

export const ProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const { selectCity, selectedLocation } = useLocationState();
  const { success, error: toastError, info } = useToast();

  const locationDebounceRef = useRef(null);
  const locationDropdownRef = useRef(null);

  const tabParam = searchParams.get('tab') || 'vibes';
  const [activeTab, setActiveTab] = useState(tabParam); // 'vibes' | 'calendar' | 'host' | 'security'

  // User Stats State
  const [userActivity, setUserActivity] = useState({
    going: [],
    interested: [],
    created: [],
    counts: { going: 0, interested: 0, created: 0 }
  });
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  // Edit Profile Form State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingCalendar, setIsSavingCalendar] = useState(false);
  const [isSavingVibes, setIsSavingVibes] = useState(false);
  const [calendarSavedRecently, setCalendarSavedRecently] = useState(false);
  const [vibesSavedRecently, setVibesSavedRecently] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    city: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Location Autocomplete & GPS State
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Preferences & Personalization State
  const [selectedVibes, setSelectedVibes] = useState(() => {
    try {
      const saved = localStorage.getItem('localvibe_user_vibes');
      return saved ? JSON.parse(saved) : (user?.interests || ['Music', 'Food & Drink', 'Arts & Culture']);
    } catch {
      return ['Music', 'Food & Drink', 'Arts & Culture'];
    }
  });

  const [preferredRadius, setPreferredRadius] = useState(() => {
    try {
      const saved = localStorage.getItem('localvibe_preferred_radius');
      return saved ? parseInt(saved, 10) : 15;
    } catch {
      return 15;
    }
  });

  const [preferredCalendar, setPreferredCalendar] = useState(() => {
    try {
      return localStorage.getItem('localvibe_calendar_pref') || 'google';
    } catch {
      return 'google';
    }
  });

  const [remindersEnabled, setRemindersEnabled] = useState(() => {
    try {
      return localStorage.getItem('localvibe_reminders_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const [publicRsvpVisibility, setPublicRsvpVisibility] = useState(() => {
    try {
      return localStorage.getItem('localvibe_public_rsvp') !== 'false';
    } catch {
      return true;
    }
  });

  // Keep URL in sync with active tab
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // Close location dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Sync form data with current authenticated user
  const resetFormToUser = useCallback(() => {
    if (user) {
      const userCity = user.location?.city || user.city || 'Mumbai';
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        city: userCity
      });
      setLocationSearchQuery(userCity);
      setValidationErrors({});
      setShowLocationDropdown(false);
    }
  }, [user]);

  useEffect(() => {
    resetFormToUser();
  }, [resetFormToUser]);

  // Handle location search input in profile edit
  const handleLocationSearchChange = (e) => {
    const val = e.target.value;
    setLocationSearchQuery(val);

    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);

    if (val.trim().length >= 2) {
      setIsSearchingLocation(true);
      locationDebounceRef.current = setTimeout(async () => {
        const results = await geocodingService.searchAddresses(val);
        setLocationSuggestions(results);
        setIsSearchingLocation(false);
        setShowLocationDropdown(true);
      }, 300);
    } else {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
      setIsSearchingLocation(false);
    }
  };

  // Select location from suggestions (Auto-detects and extracts City)
  const handleSelectProfileLocation = (item) => {
    const normalizedCity = geocodingService.normalizeCity(item.city || item.rawCity, item.lat, item.lng);
    setFormData(prev => ({
      ...prev,
      city: normalizedCity
    }));
    setLocationSearchQuery(item.address.split(',').slice(0, 2).join(', '));
    setShowLocationDropdown(false);
    if (validationErrors.city) setValidationErrors(prev => ({ ...prev, city: null }));
    success(`City auto-selected: ${normalizedCity} 📍`);
  };

  // 1-Click GPS Auto-Detect Location for Profile
  const handleDetectGpsForProfile = () => {
    if (!navigator.geolocation) {
      toastError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const details = await geocodingService.reverseGeocode(latitude, longitude);
          const detectedCity = details.city || 'Mumbai';
          const displayLabel = details.suburb ? `${details.suburb}, ${detectedCity}` : details.name || detectedCity;

          setFormData(prev => ({
            ...prev,
            city: detectedCity
          }));
          setLocationSearchQuery(displayLabel);
          if (validationErrors.city) setValidationErrors(prev => ({ ...prev, city: null }));
          success(`GPS Position resolved: ${displayLabel} (City: ${detectedCity}) 🎯`);
        } catch (err) {
          console.warn('GPS location error in Profile:', err);
          toastError('Failed to resolve city from GPS.');
        } finally {
          setIsDetectingGps(false);
        }
      },
      (err) => {
        setIsDetectingGps(false);
        let msg = 'Unable to access your current GPS location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please select your city from the list.';
        }
        toastError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 1-Click Quick Metro selection
  const handleSelectMetro = (metroName) => {
    const normalized = geocodingService.normalizeCity(metroName);
    setFormData(prev => ({
      ...prev,
      city: normalized
    }));
    setLocationSearchQuery(normalized);
    if (validationErrors.city) setValidationErrors(prev => ({ ...prev, city: null }));
    success(`Selected City: ${normalized} 📍`);
  };

  // Load real user activity counts
  const loadUserActivity = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoadingActivity(false);
      return;
    }

    setIsLoadingActivity(true);
    try {
      const res = await rsvpService.getMyEvents();
      if (res && res.data) {
        setUserActivity(res.data);
      }
    } catch (err) {
      console.warn('Failed to load user activity:', err);
    } finally {
      setIsLoadingActivity(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadUserActivity();
  }, [loadUserActivity]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCancelEdit = () => {
    resetFormToUser();
    setIsEditing(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Name cannot exceed 100 characters';
    }

    if (formData.bio && formData.bio.trim().length > 500) {
      errors.bio = 'Bio cannot exceed 500 characters';
    }

    if (formData.city && formData.city.trim().length > 100) {
      errors.city = 'City cannot exceed 100 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const finalCity = formData.city.trim() || 'Mumbai';
      const payload = {
        name: formData.name.trim(),
        bio: formData.bio.trim(),
        location: {
          city: finalCity
        },
        interests: selectedVibes
      };

      const res = await authService.updateProfile(payload);
      if (res && res.data) {
        updateUser(res.data);
      } else if (res && res.user) {
        updateUser(res.user);
      }

      // Sync active app location context if city is in known hub
      try {
        const hub = geocodingService.getIndianCitiesHub();
        const matchedCity = hub.find(c => c.name.toLowerCase() === finalCity.toLowerCase());
        if (matchedCity && selectCity) {
          selectCity({ name: matchedCity.name, state: matchedCity.state, coords: [matchedCity.lng, matchedCity.lat] });
        }
      } catch (syncErr) {
        console.warn('LocationContext sync error:', syncErr);
      }

      success('Profile updated successfully! 🎉');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      toastError(err.message || 'Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVibePreferences = async () => {
    setIsSavingVibes(true);
    try {
      localStorage.setItem('localvibe_user_vibes', JSON.stringify(selectedVibes));
      localStorage.setItem('localvibe_preferred_radius', String(preferredRadius));

      if (isAuthenticated) {
        const res = await authService.updateProfile({ interests: selectedVibes });
        if (res && res.data) {
          updateUser(res.data);
        } else if (res && res.user) {
          updateUser(res.user);
        }
      }

      setVibesSavedRecently(true);
      setTimeout(() => setVibesSavedRecently(false), 3000);
      success('Discovery vibes & radius preferences saved! 🌟');
    } catch (err) {
      console.error('Failed to save vibe preferences:', err);
      toastError(err.message || 'Failed to save vibe preferences');
    } finally {
      setIsSavingVibes(false);
    }
  };

  const handleSaveCalendarPreferences = async () => {
    setIsSavingCalendar(true);
    try {
      localStorage.setItem('localvibe_calendar_pref', preferredCalendar);
      localStorage.setItem('localvibe_reminders_enabled', String(remindersEnabled));
      localStorage.setItem('localvibe_public_rsvp', String(publicRsvpVisibility));

      // Visual feedback timing
      await new Promise((resolve) => setTimeout(resolve, 250));

      setCalendarSavedRecently(true);
      setTimeout(() => setCalendarSavedRecently(false), 3000);
      success('Calendar & sync preferences saved successfully! 🗓️');
    } catch (err) {
      console.error('Failed to save calendar preferences:', err);
      toastError(err.message || 'Failed to save calendar preferences');
    } finally {
      setIsSavingCalendar(false);
    }
  };

  const toggleVibe = (vibeId) => {
    setSelectedVibes((prev) => {
      const updated = prev.includes(vibeId)
        ? prev.filter((id) => id !== vibeId)
        : [...prev, vibeId];
      try {
        localStorage.setItem('localvibe_user_vibes', JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }
      return updated;
    });
  };

  const handleRadiusSave = (radiusVal) => {
    setPreferredRadius(radiusVal);
    try {
      localStorage.setItem('localvibe_preferred_radius', String(radiusVal));
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }
  };

  const handleCalendarSave = (calVal) => {
    setPreferredCalendar(calVal);
    try {
      localStorage.setItem('localvibe_calendar_pref', calVal);
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('localvibe_filters');
      localStorage.removeItem('localvibe_user_vibes');
      localStorage.removeItem('localvibe_preferred_radius');
      setSelectedVibes(['Music', 'Food & Drink', 'Arts & Culture']);
      setPreferredRadius(15);
      info('Local cache and discovery preferences reset to default.');
    } catch (err) {
      console.warn('Clear cache error:', err);
    }
  };

  const goingEvents = userActivity.going || [];
  const interestedEvents = userActivity.interested || [];
  const createdEvents = userActivity.created || [];

  // Calculate total community reach
  const totalReach = createdEvents.reduce((sum, ev) => sum + (ev.attendeesCount || ev.goingCount || 0), 0);

  const formatMemberSince = (dateStr) => {
    if (!dateStr) return 'September 2026';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return 'September 2026';
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-app)', minHeight: 'calc(100vh - 64px)', paddingBottom: '64px' }}>
      {/* Scenic Gradient Cover Banner */}
      <div
        style={{
          position: 'relative',
          height: '200px',
          width: '100%',
          backgroundImage: 'linear-gradient(135deg, #0F766E 0%, #005C55 50%, #FD761A 100%)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 60%)'
          }}
        />
      </div>

      {/* Profile Header Card */}
      <div className="container" style={{ marginTop: '-70px', position: 'relative', zIndex: 10 }}>
        <div
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderRadius: 'var(--radius-2xl)',
            padding: '28px',
            border: '1px solid var(--color-border-subtle)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            {/* User Details with Modern Initials Avatar */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Avatar
                  name={user?.name || 'Local Explorer'}
                  size={84}
                  fontSize="1.75rem"
                  border="4px solid #FFFFFF"
                  boxShadow="var(--shadow-md)"
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-success)',
                    border: '2.5px solid #FFFFFF'
                  }}
                  title="Active Explorer"
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>
                    {user?.name || 'Local Explorer'}
                  </h1>

                  {user?.role === 'ADMIN' ? (
                    <span style={{
                      backgroundColor: 'rgba(253, 118, 26, 0.12)',
                      color: 'var(--color-secondary)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      🛡️ Admin
                    </span>
                  ) : user?.role === 'ORGANIZER' || createdEvents.length > 0 ? (
                    <span style={{
                      backgroundColor: 'rgba(15, 118, 110, 0.12)',
                      color: 'var(--color-primary)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      ⭐ Verified Curator
                    </span>
                  ) : (
                    <span style={{
                      backgroundColor: 'rgba(15, 118, 110, 0.08)',
                      color: 'var(--color-primary)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      📍 Explorer
                    </span>
                  )}
                </div>

                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: '6px 0 10px 0', maxWidth: '580px', lineHeight: 1.5 }}>
                  {user?.bio || 'Local explorer and community gathering enthusiast.'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                  <span>📍 {user?.location?.city || user?.city || selectedLocation?.name || 'Mumbai'}</span>
                  <span>🗓️ Member since {formatMemberSince(user?.createdAt)}</span>
                  <span>✉️ {user?.email || 'explorer@localvibe.app'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Button
                variant={isEditing ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  if (isEditing) {
                    handleCancelEdit();
                  } else {
                    resetFormToUser();
                    setIsEditing(true);
                  }
                }}
                style={{ borderRadius: 'var(--radius-full)', fontWeight: 600 }}
              >
                {isEditing ? 'Cancel Edit' : '✏️ Edit Profile'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                style={{ color: 'var(--color-error)', borderRadius: 'var(--radius-full)', fontWeight: 600 }}
              >
                Log Out
              </Button>
            </div>
          </div>

          {/* 4-Stat Bento Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '16px',
              marginTop: '28px',
              paddingTop: '24px',
              borderTop: '1px solid var(--color-border-subtle)'
            }}
          >
            <div
              onClick={() => navigate('/my-events?tab=going')}
              style={{
                textAlign: 'center',
                padding: '14px',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              title="View in My Events"
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {goingEvents.length}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Confirmed Going ↗
              </div>
            </div>

            <div
              onClick={() => navigate('/my-events?tab=interested')}
              style={{
                textAlign: 'center',
                padding: '14px',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              title="View in My Events"
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                {interestedEvents.length}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Saved / Interested ↗
              </div>
            </div>

            <div
              onClick={() => navigate('/my-events?tab=created')}
              style={{
                textAlign: 'center',
                padding: '14px',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              title="View in My Events"
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {createdEvents.length}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Events Hosted ↗
              </div>
            </div>

            <div
              style={{
                textAlign: 'center',
                padding: '14px',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                {totalReach > 0 ? `${totalReach}+` : '0'}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Community Reach
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form Panel (NO Profile Image URL) */}
      {isEditing && (
        <div className="container" style={{ marginTop: '28px' }}>
          <Card variant="default" padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>
                  ✏️ Edit Your Profile
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Your identity updates across all your hosted gatherings and attendee interactions.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
              {/* Full Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                  Full Name <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (validationErrors.name) setValidationErrors({ ...validationErrors, name: null });
                  }}
                  placeholder="e.g. Sahil Sharma"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${validationErrors.name ? 'var(--color-error)' : 'var(--color-border-subtle)'}`,
                    backgroundColor: 'var(--color-bg-app)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                {validationErrors.name && (
                  <span style={{ fontSize: '12px', color: 'var(--color-error)', fontWeight: 600 }}>
                    {validationErrors.name}
                  </span>
                )}
              </div>

              {/* Smart Location & Auto City Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} ref={locationDropdownRef}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    Home City & Neighborhood <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  {formData.city && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      backgroundColor: 'rgba(0, 92, 85, 0.08)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid rgba(0, 92, 85, 0.15)'
                    }}>
                      ✓ Auto-selected City: {formData.city}
                    </span>
                  )}
                </div>

                {/* 1-Click GPS Button & Location Search Input */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1, zIndex: showLocationDropdown ? 1050 : 2 }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '18px' }}>
                      search
                    </span>
                    <input
                      type="text"
                      value={locationSearchQuery}
                      onChange={handleLocationSearchChange}
                      placeholder="Search street, cafe, neighborhood (e.g. Bandra, Indiranagar)..."
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 34px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${validationErrors.city ? 'var(--color-error)' : 'var(--color-border-subtle)'}`,
                        backgroundColor: 'var(--color-bg-app)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    {isSearchingLocation && (
                      <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        Searching...
                      </span>
                    )}

                    {/* Autocomplete Dropdown */}
                    {showLocationDropdown && locationSuggestions.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '6px',
                          backgroundColor: '#FFFFFF',
                          borderRadius: 'var(--radius-lg)',
                          boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
                          border: '1.5px solid var(--color-border)',
                          zIndex: 2000,
                          maxHeight: '240px',
                          overflowY: 'auto'
                        }}
                      >
                        {locationSuggestions.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectProfileLocation(item)}
                            style={{
                              padding: '11px 14px',
                              borderBottom: idx < locationSuggestions.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
                          >
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '18px', marginTop: '2px', flexShrink: 0 }}>
                              pin_drop
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                                {item.address}
                              </div>
                              {item.city && (
                                <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>🎯 Auto-selects City:</span>
                                  <span>{item.city}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 1-Click GPS Detect Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDetectGpsForProfile}
                    disabled={isDetectingGps}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      borderColor: 'var(--color-primary)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{isDetectingGps ? '⏳' : '🎯'}</span>
                    <span>{isDetectingGps ? 'Detecting...' : 'Use GPS'}</span>
                  </Button>
                </div>

                {/* Finalized City Readout / Edit Field */}
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px', alignItems: 'center', backgroundColor: 'var(--color-bg-subtle)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                    Active City Name:
                  </span>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, city: e.target.value }));
                      if (validationErrors.city) setValidationErrors(prev => ({ ...prev, city: null }));
                    }}
                    placeholder="e.g. Mumbai"
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid transparent',
                      backgroundColor: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--color-text-main)',
                      outline: 'none'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'transparent'; }}
                  />
                </div>

                {/* Quick Metro Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Quick Metros:</span>
                  {METRO_SUGGESTIONS.map((metro) => {
                    const isSelected = (formData.city || '').toLowerCase() === metro.toLowerCase();
                    return (
                      <button
                        key={metro}
                        type="button"
                        onClick={() => handleSelectMetro(metro)}
                        style={{
                          padding: '3px 9px',
                          fontSize: '11px',
                          borderRadius: 'var(--radius-full)',
                          border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                          color: isSelected ? '#FFFFFF' : 'var(--color-text-secondary)',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {metro}
                      </button>
                    );
                  })}
                </div>

                {validationErrors.city && (
                  <span style={{ fontSize: '12px', color: 'var(--color-error)', fontWeight: 600 }}>
                    {validationErrors.city}
                  </span>
                )}
              </div>

              {/* Bio */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    About & Bio
                  </label>
                  <span style={{ fontSize: '11px', color: formData.bio.length > 450 ? 'var(--color-secondary)' : 'var(--color-text-muted)' }}>
                    {formData.bio.length}/500 chars
                  </span>
                </div>
                <textarea
                  value={formData.bio}
                  onChange={(e) => {
                    setFormData({ ...formData, bio: e.target.value });
                    if (validationErrors.bio) setValidationErrors({ ...validationErrors, bio: null });
                  }}
                  rows={3}
                  placeholder="Tell the local community what events, music, workshops, and hobbies you love..."
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${validationErrors.bio ? 'var(--color-error)' : 'var(--color-border-subtle)'}`,
                    backgroundColor: 'var(--color-bg-app)',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
                {validationErrors.bio && (
                  <span style={{ fontSize: '12px', color: 'var(--color-error)', fontWeight: 600 }}>
                    {validationErrors.bio}
                  </span>
                )}
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSaving}
                  style={{ fontWeight: 700 }}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={isSaving}
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Feature Navigation Tabs */}
      <div className="container" style={{ marginTop: '32px' }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          backgroundColor: 'var(--color-bg-surface)',
          padding: '6px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--color-border-subtle)',
          width: '100%',
          maxWidth: 'fit-content',
          marginBottom: '24px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          <button
            type="button"
            onClick={() => handleTabChange('vibes')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: activeTab === 'vibes' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'vibes' ? '#FFFFFF' : 'var(--color-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            🌟 My Vibe & Discovery
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('calendar')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: activeTab === 'calendar' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'calendar' ? '#FFFFFF' : 'var(--color-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            🗓️ Calendar & Alerts
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('host')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: activeTab === 'host' ? 'var(--color-secondary)' : 'transparent',
              color: activeTab === 'host' ? '#FFFFFF' : 'var(--color-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            📢 Host & Community Hub
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('security')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: activeTab === 'security' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'security' ? '#FFFFFF' : 'var(--color-text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            🛡️ Account & Security
          </button>
        </div>

        {/* TAB 1: MY VIBE & DISCOVERY PREFERENCES */}
        {activeTab === 'vibes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card variant="default" padding="lg">
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 4px 0' }}>
                  🌟 Customize Your Favorite Vibes
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                  Select the types of local gatherings you are most interested in. These guide your curated recommendations.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '12px' }}>
                {AVAILABLE_VIBES.map((vibe) => {
                  const isSelected = selectedVibes.includes(vibe.id);
                  return (
                    <button
                      key={vibe.id}
                      type="button"
                      onClick={() => toggleVibe(vibe.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-lg)',
                        border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
                        backgroundColor: isSelected ? 'var(--color-primary-subtle, rgba(15, 118, 110, 0.08))' : 'var(--color-bg-surface)',
                        color: isSelected ? 'var(--color-primary)' : 'var(--color-text-main)',
                        fontWeight: isSelected ? 700 : 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{vibe.icon}</span>
                      <span style={{ flex: 1 }}>{vibe.label}</span>
                      {isSelected && <span style={{ fontSize: '14px', fontWeight: 800 }}>✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Discovery Radius Calibration */}
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--color-border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    Default Discovery Radar Radius
                  </label>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-primary)' }}>
                    Within {preferredRadius} km
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {[1, 5, 10, 15, 25, 50].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRadiusSave(r)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: `1px solid ${preferredRadius === r ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
                        backgroundColor: preferredRadius === r ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                        color: preferredRadius === r ? '#FFFFFF' : 'var(--color-text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {r} km {r === 15 ? '(Default)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Save Preferences & Explore */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginTop: '28px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--color-border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {selectedVibes.length} vibe{selectedVibes.length === 1 ? '' : 's'} selected • Within {preferredRadius} km
                  </span>
                  {vibesSavedRecently && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--color-success)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      ✓ Saved
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    disabled={isSavingVibes}
                    onClick={handleSaveVibePreferences}
                    style={{ fontWeight: 700 }}
                  >
                    {isSavingVibes ? 'Saving Preferences...' : '💾 Save Preferences'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => navigate(`/discover?radius=${preferredRadius}&category=${selectedVibes[0] || 'All'}`)}
                    style={{ fontWeight: 600 }}
                  >
                    🚀 Explore Nearby Events →
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: CALENDAR & ALERTS */}
        {activeTab === 'calendar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card variant="default" padding="lg">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 4px 0' }}>
                🗓️ Calendar & Sync Preferences
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 20px 0' }}>
                Configure how LocalVibe handles your RSVPs and calendar exports.
              </p>

              {/* Preferred Calendar Platform */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)', display: 'block', marginBottom: '8px' }}>
                  Default Calendar Service for 1-Click Sync
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  {[
                    { id: 'google', label: 'Google Calendar', icon: '📅' },
                    { id: 'apple', label: 'Apple iCal / iOS', icon: '🍏' },
                    { id: 'outlook', label: 'Outlook / Office 365', icon: '📬' }
                  ].map((cal) => (
                    <button
                      key={cal.id}
                      type="button"
                      onClick={() => handleCalendarSave(cal.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-lg)',
                        border: `1.5px solid ${preferredCalendar === cal.id ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
                        backgroundColor: preferredCalendar === cal.id ? 'var(--color-primary-subtle, rgba(15, 118, 110, 0.08))' : 'var(--color-bg-surface)',
                        color: preferredCalendar === cal.id ? 'var(--color-primary)' : 'var(--color-text-main)',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <span>{cal.icon}</span>
                      <span>{cal.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reminders & Privacy Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)', display: 'block' }}>
                      Pre-Event Neighborhood Digest
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Receive curated recommendations for upcoming weekend gatherings within {preferredRadius} km.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={remindersEnabled}
                    onChange={(e) => {
                      setRemindersEnabled(e.target.checked);
                      try { localStorage.setItem('localvibe_reminders_enabled', String(e.target.checked)); } catch {}
                    }}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)', display: 'block' }}>
                      Public Attendee Profile Visibility
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Show your name and verified badge in the public attendees list on events you RSVP to.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={publicRsvpVisibility}
                    onChange={(e) => {
                      setPublicRsvpVisibility(e.target.checked);
                      try { localStorage.setItem('localvibe_public_rsvp', String(e.target.checked)); } catch {}
                    }}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Save Calendar & Sync Preferences Action Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginTop: '28px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--color-border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    Active 1-Click Sync:
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: 'var(--color-primary-subtle, rgba(15, 118, 110, 0.12))',
                      color: 'var(--color-primary)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    {preferredCalendar === 'google' ? '📅 Google Calendar' : preferredCalendar === 'apple' ? '🍏 Apple iCal / iOS' : '📬 Outlook 365'}
                  </span>
                  {calendarSavedRecently && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--color-success)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      ✓ Saved & Active
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    disabled={isSavingCalendar}
                    onClick={handleSaveCalendarPreferences}
                    style={{ fontWeight: 700, minWidth: '160px' }}
                  >
                    {isSavingCalendar ? 'Saving Changes...' : '💾 Save Changes'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3: HOST & COMMUNITY HUB */}
        {activeTab === 'host' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card variant="default" padding="lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 4px 0' }}>
                    📢 Community Organizer Toolkit
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                    Manage your hosted events, check-in attendees, and publish new gatherings.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate('/create-event')}
                  style={{ fontWeight: 700 }}
                >
                  + Host a New Event
                </Button>
              </div>

              {/* Host Performance Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {createdEvents.length}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Published Gatherings
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                    {totalReach}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Total Attendees Reached
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                    100%
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Geo-Verified India Scope
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid var(--color-border-subtle)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/my-events?tab=created')}
                  style={{ fontWeight: 600 }}
                >
                  📋 View My Hosted Events in Detail →
                </Button>
                {user?.role === 'ADMIN' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin')}
                    style={{ fontWeight: 700, color: 'var(--color-secondary)' }}
                  >
                    🛡️ Open Admin Dashboard
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: ACCOUNT & SECURITY */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card variant="default" padding="lg">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 4px 0' }}>
                🛡️ Account Overview & Security
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '0 0 20px 0' }}>
                Account credentials and security integrity.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '14px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Email Address</span>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-main)', margin: '4px 0 0 0' }}>{user?.email}</p>
                </div>

                <div style={{ padding: '14px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Account Role</span>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', margin: '4px 0 0 0' }}>{user?.role || 'USER'}</p>
                </div>

                <div style={{ padding: '14px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Account Status</span>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-success)', margin: '4px 0 0 0' }}>✓ Verified & Active</p>
                </div>
              </div>

              {/* Maintenance Tools */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)', display: 'block' }}>
                    Reset Local Storage & Discovery Cache
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Clears cached filter presets, vibe tags, and recent searches from this browser.
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCache}
                  style={{ fontWeight: 600 }}
                >
                  🔄 Reset Discovery Cache
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
