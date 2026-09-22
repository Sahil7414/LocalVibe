const mongoose = require('mongoose');
const User = require('../models/User');
const { Event } = require('../models/Event');
const { verifyToken } = require('../utils/jwt');
const { isDbConnected } = require('../config/db');
const inMemoryStore = require('../services/inMemoryStore');

/**
 * Middleware to authenticate requests via JWT Bearer token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Malformed token.'
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.'
      });
    }

    let user;
    if (!isDbConnected() || !mongoose.Types.ObjectId.isValid(decoded.id)) {
      user = await inMemoryStore.findUserById(decoded.id);
    } else {
      user = await User.findById(decoded.id);
      if (!user) {
        user = await inMemoryStore.findUserById(decoded.id);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user account no longer exists.'
      });
    }

    if (user.status === 'SUSPENDED' || user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
        isSuspended: true
      });
    }

    // Attach user payload to request object
    req.user = {
      id: (user._id || user.id).toString(),
      _id: (user._id || user.id).toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status || 'ACTIVE'
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to enforce role-based access control
 * @param  {...string} allowedRoles Roles allowed to access endpoint
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRole = (req.user.role || '').toUpperCase();

    // Admin role (and Curator) possesses superset moderation permissions
    if (userRole === 'ADMIN' || userRole === 'CURATOR') {
      return next();
    }

    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

    // Support role aliases (USER = EVENT_EXPLORER, ORGANIZER = EVENT_ORGANIZER)
    const matchesRole =
      normalizedAllowed.includes(userRole) ||
      (userRole === 'USER' && normalizedAllowed.includes('EVENT_EXPLORER')) ||
      (userRole === 'EVENT_EXPLORER' && normalizedAllowed.includes('USER')) ||
      (userRole === 'ORGANIZER' && normalizedAllowed.includes('EVENT_ORGANIZER')) ||
      (userRole === 'EVENT_ORGANIZER' && normalizedAllowed.includes('ORGANIZER'));

    if (!matchesRole) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden: Role '${req.user.role}' is not authorized for this resource.`
      });
    }

    next();
  };
};

/**
 * Middleware to verify that authenticated user owns the target event (or is ADMIN)
 */
const requireEventOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    let event;
    if (!isDbConnected() || !mongoose.Types.ObjectId.isValid(id)) {
      event = await inMemoryStore.getEventById(id);
    } else {
      event = await Event.findById(id);
      if (!event) {
        event = await inMemoryStore.getEventById(id);
      }
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${id}`
      });
    }

    const organizerId = (event.organizer?._id || event.organizer?.id || event.organizer || '').toString();
    const isOwner = organizerId === req.user.id;
    const userRole = (req.user.role || '').toUpperCase();
    const isAdmin = userRole === 'ADMIN' || userRole === 'CURATOR';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not have permission to modify or delete this event.'
      });
    }

    req.event = event;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware for optional JWT authentication (attaches req.user if token is valid, otherwise continues as unauthenticated)
 */
const optionalAuthenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      req.user = null;
      return next();
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      req.user = null;
      return next();
    }

    let user;
    if (!isDbConnected() || !mongoose.Types.ObjectId.isValid(decoded.id)) {
      user = await inMemoryStore.findUserById(decoded.id);
    } else {
      user = await User.findById(decoded.id);
      if (!user) {
        user = await inMemoryStore.findUserById(decoded.id);
      }
    }

    if (user) {
      req.user = {
        id: (user._id || user.id).toString(),
        _id: (user._id || user.id).toString(),
        email: user.email,
        name: user.name,
        role: user.role
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuthenticateToken,
  requireRole,
  requireEventOwnership
};

