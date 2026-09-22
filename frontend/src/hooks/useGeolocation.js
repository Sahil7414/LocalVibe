import { useState, useEffect, useCallback } from 'react';
import { geocodingService } from '../services/geocodingService';

// Default development / fallback location (Mumbai)
export const DEFAULT_LOCATION = {
  lat: 19.0760,
  lng: 72.8777,
  city: 'Mumbai',
  isFallback: true
};

export const useGeolocation = (defaultCity = DEFAULT_LOCATION) => {
  const [location, setLocation] = useState({
    lat: defaultCity.lat,
    lng: defaultCity.lng,
    city: defaultCity.city || 'Mumbai',
    isGps: false,
    isFallback: true
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [error, setError] = useState(null);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsDetecting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let resolvedCity = 'Mumbai';
        try {
          const rev = await geocodingService.reverseGeocode(latitude, longitude);
          if (rev?.city) resolvedCity = rev.city;
        } catch (e) {
          console.warn('Geolocation reverse geocode error:', e);
        }

        setLocation({
          lat: latitude,
          lng: longitude,
          city: resolvedCity,
          isGps: true,
          isFallback: false
        });
        setIsDetecting(false);
        setIsDenied(false);
      },
      (err) => {
        setIsDetecting(false);
        if (err.code === err.PERMISSION_DENIED) {
          setIsDenied(true);
          setError('Location access was denied. Showing default city.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Location information is currently unavailable.');
        } else if (err.code === err.TIMEOUT) {
          setError('Location request timed out.');
        } else {
          setError(err.message || 'Unable to retrieve location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, []);

  const setManualLocation = useCallback(({ lat, lng, city }) => {
    setLocation({
      lat,
      lng,
      city: city || 'Custom Location',
      isGps: false,
      isFallback: false
    });
    setError(null);
  }, []);

  // Request location once on initial mount
  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  return {
    location,
    isDetecting,
    isDenied,
    error,
    detectLocation,
    setManualLocation
  };
};
