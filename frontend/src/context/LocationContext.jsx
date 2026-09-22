import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import { geocodingService } from '../services/geocodingService';

// Default development / fallback location (Bandra West, Mumbai)
export const DEFAULT_SELECTED_LOCATION = {
  name: 'Bandra West, Mumbai',
  city: 'Mumbai',
  state: 'Maharashtra',
  coords: [72.8777, 19.0760] // [longitude, latitude]
};

const STORAGE_KEY = 'localvibe_selected_location';

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  // 1. SELECTED / DISPLAY LOCATION
  // Only changes when explicitly selected by the user via LocationModal / City selection.
  const [selectedLocation, setSelectedLocationState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name && parsed.coords) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved location:', e);
    }
    return DEFAULT_SELECTED_LOCATION;
  });

  // 2. CURRENT GPS LOCATION
  // Hardware / browser GPS position. Used for map center, current-location pin, and nearby queries.
  // NEVER automatically overwrites selectedLocation.
  const [currentLocation, setCurrentLocation] = useState({
    lat: null,
    lng: null,
    accuracy: null,
    name: null,
    city: null,
    state: null,
    address: null,
    isGps: false,
    isDetecting: false,
    isDenied: false,
    error: null
  });

  // Active discovery coordinates (either selected city coords or GPS coords if user clicked "Use my current location")
  const [activeCoordinates, setActiveCoordinates] = useState({
    lat: selectedLocation.coords[1],
    lng: selectedLocation.coords[0],
    source: 'selected' // 'selected' | 'gps'
  });

  const [isGpsActive, setIsGpsActive] = useState(false);

  const setSelectedLocation = useCallback((locationObj) => {
    if (!locationObj) return;
    const formatted = {
      name: locationObj.name || 'Bandra West, Mumbai',
      city: locationObj.city || 'Mumbai',
      state: locationObj.state || '',
      coords: locationObj.coords || [72.8777, 19.0760]
    };
    setSelectedLocationState(formatted);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
    } catch (e) {
      console.warn('Failed to persist selected location:', e);
    }
  }, []);

  // Explicitly select a city from modal / search / popular cities
  const selectCity = useCallback((cityObj) => {
    if (!cityObj || !cityObj.coords) return;
    const displayName = cityObj.state ? `${cityObj.name}, ${cityObj.state}` : cityObj.name;
    const newLoc = {
      name: displayName,
      city: cityObj.name,
      state: cityObj.state || '',
      coords: cityObj.coords // [lng, lat]
    };

    setSelectedLocation(newLoc);
    setActiveCoordinates({
      lat: cityObj.coords[1],
      lng: cityObj.coords[0],
      source: 'selected'
    });
    setIsGpsActive(false);
  }, [setSelectedLocation]);

  // Request browser GPS position and activate GPS coordinates for discovery/map.
  // Reverse geocodes the exact location to get suburb, city, and state.
  const useCurrentGpsLocation = useCallback((onSuccess, onError, setAsSelected = true) => {
    if (!navigator.geolocation) {
      const errMessage = 'Geolocation is not supported by your browser';
      setCurrentLocation(prev => ({
        ...prev,
        isDetecting: false,
        error: errMessage
      }));
      if (onError) onError(errMessage);
      return;
    }

    setCurrentLocation(prev => ({
      ...prev,
      isDetecting: true,
      error: null
    }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Perform reverse geocoding to resolve real city and neighborhood
        let locationDetails = null;
        try {
          locationDetails = await geocodingService.reverseGeocode(latitude, longitude);
        } catch (err) {
          console.warn('[LocationContext] Reverse geocoding error:', err);
        }

        const resolvedCity = locationDetails?.city || 'Mumbai';
        const resolvedState = locationDetails?.state || '';
        const resolvedName = locationDetails?.name || (locationDetails?.suburb ? `${locationDetails.suburb}, ${resolvedCity}` : `${resolvedCity}`);

        const gpsData = {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy || null,
          name: resolvedName,
          city: resolvedCity,
          state: resolvedState,
          address: locationDetails?.address || '',
          isGps: true,
          isDetecting: false,
          isDenied: false,
          error: null
        };

        setCurrentLocation(gpsData);
        setActiveCoordinates({
          lat: latitude,
          lng: longitude,
          source: 'gps'
        });
        setIsGpsActive(true);

        if (setAsSelected) {
          setSelectedLocation({
            name: resolvedName,
            city: resolvedCity,
            state: resolvedState,
            coords: [longitude, latitude]
          });
        }

        if (onSuccess) {
          onSuccess(gpsData);
        }
      },
      (err) => {
        let msg = 'Unable to retrieve location.';
        let denied = false;
        if (err.code === err.PERMISSION_DENIED) {
          denied = true;
          msg = 'Location access was denied. Showing selected city.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out.';
        }

        setCurrentLocation(prev => ({
          ...prev,
          isDetecting: false,
          isDenied: denied,
          error: msg
        }));

        if (onError) onError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // Fetch fresh position for maximum GPS accuracy
      }
    );
  }, [setSelectedLocation]);

  return (
    <LocationContext.Provider
      value={{
        selectedLocation,
        setSelectedLocation,
        currentLocation,
        activeCoordinates,
        isGpsActive,
        selectCity,
        useCurrentGpsLocation
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationState = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationState must be used within a LocationProvider');
  }
  return context;
};
