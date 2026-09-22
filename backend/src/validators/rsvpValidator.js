const mongoose = require('mongoose');

const VALID_RSVP_STATUSES = ['GOING', 'INTERESTED'];

/**
 * Validates RSVP creation/update request payload
 * @param {Object} data { status: 'GOING' | 'INTERESTED' }
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
const validateRSVPInput = (data) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('Request body is required');
    return { isValid: false, errors };
  }

  if (!data.status || typeof data.status !== 'string') {
    errors.push('RSVP status is required and must be a string');
  } else {
    const normalizedStatus = data.status.toUpperCase().trim();
    if (!VALID_RSVP_STATUSES.includes(normalizedStatus)) {
      errors.push(`RSVP status must be one of: ${VALID_RSVP_STATUSES.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates Event ID parameter
 * @param {string} eventId 
 * @returns {Object} { isValid: boolean, error?: string }
 */
const validateEventIdParam = (eventId) => {
  if (!eventId || typeof eventId !== 'string') {
    return { isValid: false, error: 'Event ID parameter is required' };
  }

  // Accept MongoDB ObjectId format or in-memory custom IDs
  if (!mongoose.Types.ObjectId.isValid(eventId) && !eventId.startsWith('event_') && !eventId.startsWith('67000000000000000000010')) {
    return { isValid: false, error: 'Invalid Event ID format' };
  }

  return { isValid: true };
};

module.exports = {
  VALID_RSVP_STATUSES,
  validateRSVPInput,
  validateEventIdParam
};
