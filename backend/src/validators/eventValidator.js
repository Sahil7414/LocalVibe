const { EVENT_CATEGORIES } = require('../models/Event');

/**
 * Validates whether given coordinates fall within the geographic bounds of India
 * Latitude: 6.0°N to 38.0°N
 * Longitude: 68.0°E to 98.0°E
 */
const isLocationInIndia = (lng, lat) => {
  return typeof lat === 'number' && typeof lng === 'number' &&
    lat >= 6.0 && lat <= 38.0 &&
    lng >= 68.0 && lng <= 98.0;
};

/**
 * Validates Event creation payload data
 */
const validateEventInput = (data) => {
  const errors = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push('Title is required and must be a non-empty string');
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
    errors.push('Description is required and must be a non-empty string');
  }

  if (!data.category || !EVENT_CATEGORIES.includes(data.category)) {
    errors.push(`Category must be one of: ${EVENT_CATEGORIES.join(', ')}`);
  }

  if (!data.startDate || isNaN(Date.parse(data.startDate))) {
    errors.push('Valid startDate ISO string is required');
  }

  if (!data.endDate || isNaN(Date.parse(data.endDate))) {
    errors.push('Valid endDate ISO string is required');
  }

  if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
    errors.push('End date cannot be prior to start date');
  }

  if (typeof data.price !== 'number' || data.price < 0) {
    errors.push('Price must be a non-negative number');
  }

  if (!data.location || typeof data.location !== 'object') {
    errors.push('Location object is required');
  } else {
    if (!data.location.address || typeof data.location.address !== 'string' || data.location.address.trim() === '') {
      errors.push('Location address string is required');
    }

    if (!Array.isArray(data.location.coordinates) || data.location.coordinates.length !== 2) {
      errors.push('Location coordinates must be an array of [longitude, latitude]');
    } else {
      const [lng, lat] = data.location.coordinates;
      if (typeof lng !== 'number' || lng < -180 || lng > 180) {
        errors.push('Longitude must be a number between -180 and 180');
      }
      if (typeof lat !== 'number' || lat < -90 || lat > 90) {
        errors.push('Latitude must be a number between -90 and 90');
      }
      if (typeof lng === 'number' && typeof lat === 'number' && !isLocationInIndia(lng, lat)) {
        errors.push('Event location must be within India (Latitude: 6.0°N to 38.0°N, Longitude: 68.0°E to 98.0°E)');
      }
    }
  }

  if (!data.image || typeof data.image !== 'string' || data.image.trim() === '') {
    errors.push('Cover image is required to publish your event');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates Event update payload data
 */
const validateUpdateEventInput = (data) => {
  const errors = [];

  if (data.title !== undefined && (typeof data.title !== 'string' || data.title.trim() === '')) {
    errors.push('Title must be a non-empty string');
  }

  if (data.description !== undefined && (typeof data.description !== 'string' || data.description.trim() === '')) {
    errors.push('Description must be a non-empty string');
  }

  if (data.category !== undefined && !EVENT_CATEGORIES.includes(data.category)) {
    errors.push(`Category must be one of: ${EVENT_CATEGORIES.join(', ')}`);
  }

  if (data.startDate !== undefined && isNaN(Date.parse(data.startDate))) {
    errors.push('Valid startDate ISO string is required');
  }

  if (data.endDate !== undefined && isNaN(Date.parse(data.endDate))) {
    errors.push('Valid endDate ISO string is required');
  }

  if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
    errors.push('End date cannot be prior to start date');
  }

  if (data.price !== undefined && (typeof data.price !== 'number' || data.price < 0)) {
    errors.push('Price must be a non-negative number');
  }

  if (data.location !== undefined) {
    if (typeof data.location !== 'object' || data.location === null) {
      errors.push('Location must be an object');
    } else {
      if (data.location.address !== undefined && (typeof data.location.address !== 'string' || data.location.address.trim() === '')) {
        errors.push('Location address must be a non-empty string');
      }
      if (data.location.coordinates !== undefined) {
        if (!Array.isArray(data.location.coordinates) || data.location.coordinates.length !== 2) {
          errors.push('Location coordinates must be an array of [longitude, latitude]');
        } else {
          const [lng, lat] = data.location.coordinates;
          if (typeof lng !== 'number' || lng < -180 || lng > 180) {
            errors.push('Longitude must be a number between -180 and 180');
          }
          if (typeof lat !== 'number' || lat < -90 || lat > 90) {
            errors.push('Latitude must be a number between -90 and 90');
          }
          if (typeof lng === 'number' && typeof lat === 'number' && !isLocationInIndia(lng, lat)) {
            errors.push('Event location must be within India (Latitude: 6.0°N to 38.0°N, Longitude: 68.0°E to 98.0°E)');
          }
        }
      }
    }
  }

  if (data.image !== undefined && (typeof data.image !== 'string' || data.image.trim() === '')) {
    errors.push('Cover image must be a non-empty string');
  }

  if (data.status !== undefined) {
    const validStatuses = ['ACTIVE', 'DRAFT', 'CANCELLED', 'SUSPENDED'];
    if (typeof data.status !== 'string' || !validStatuses.includes(data.status.toUpperCase().trim())) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates parameters for GET /api/events/nearby
 */
const validateNearbyQueryParams = (query) => {
  const errors = [];
  const lat = parseFloat(query.lat);
  const lng = parseFloat(query.lng);
  const rawRadius = query.radiusKm !== undefined ? query.radiusKm : (query.radius !== undefined ? query.radius : 15);
  const radius = parseFloat(rawRadius);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    errors.push('Query parameter "lat" (latitude) must be a number between -90 and 90');
  }

  if (isNaN(lng) || lng < -180 || lng > 180) {
    errors.push('Query parameter "lng" (longitude) must be a number between -180 and 180');
  }

  if (isNaN(radius) || radius <= 0 || radius > 100) {
    errors.push('Query parameter "radius" must be a positive number in kilometers (max 100km)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsed: {
      lat,
      lng,
      radiusKm: radius
    }
  };
};

module.exports = {
  isLocationInIndia,
  validateEventInput,
  validateUpdateEventInput,
  validateNearbyQueryParams
};
