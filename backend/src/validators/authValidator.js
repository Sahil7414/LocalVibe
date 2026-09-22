/**
 * Validator for user registration payload
 */
const validateRegisterInput = (data) => {
  const errors = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters');
  }

  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/;
  if (!data.email || typeof data.email !== 'string' || !emailRegex.test(data.email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push('Password is required and must be at least 6 characters long');
  }

  // Security guardrail: Normal users cannot register directly as ADMIN
  if (data.role && data.role.toUpperCase() === 'ADMIN') {
    errors.push('Self-registration with ADMIN role is not permitted');
  }

  const allowedRoles = ['USER', 'ORGANIZER', 'EVENT_EXPLORER', 'EVENT_ORGANIZER'];
  if (data.role && !allowedRoles.includes(data.role.toUpperCase())) {
    errors.push(`Invalid role. Allowed registration roles: ${allowedRoles.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validator for user login payload
 */
const validateLoginInput = (data) => {
  const errors = [];

  if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
    errors.push('Email is required');
  }

  if (!data.password || typeof data.password !== 'string' || data.password === '') {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validator for profile update payload
 */
const validateUpdateProfileInput = (data) => {
  const errors = [];

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    } else if (data.name.trim().length > 100) {
      errors.push('Name cannot exceed 100 characters');
    }
  }

  if (data.bio !== undefined && typeof data.bio === 'string' && data.bio.trim().length > 500) {
    errors.push('Bio cannot exceed 500 characters');
  }

  if (data.location !== undefined) {
    if (typeof data.location === 'object' && data.location !== null) {
      if (data.location.city !== undefined && typeof data.location.city !== 'string') {
        errors.push('City must be a valid text string');
      }
      if (data.location.coordinates !== undefined) {
        if (!Array.isArray(data.location.coordinates) || data.location.coordinates.length !== 2) {
          errors.push('Location coordinates must be an array of [longitude, latitude]');
        }
      }
    } else if (typeof data.location !== 'string') {
      errors.push('Location must be a valid text string or location object');
    }
  }

  if (data.interests !== undefined && !Array.isArray(data.interests)) {
    errors.push('Interests must be an array of interest tags');
  }

  // Security guardrails: Reject explicit role, password, or googleId tampering in profile update
  if (data.role !== undefined) {
    errors.push('Role cannot be modified via profile update');
  }
  if (data.password !== undefined || data.passwordHash !== undefined) {
    errors.push('Password cannot be modified via profile update');
  }
  if (data.googleId !== undefined) {
    errors.push('Google ID cannot be modified via profile update');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validator for Google ID Token payload
 */
const validateGoogleAuthInput = (data) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('Request body is required');
    return { isValid: false, errors };
  }

  if (!data.credential || typeof data.credential !== 'string' || data.credential.trim() === '') {
    errors.push('Google ID token credential is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  validateUpdateProfileInput,
  validateGoogleAuthInput
};

