const mongoose = require('mongoose');
const eventService = require('../services/eventService');
const { isDbConnected } = require('../config/db');
const {
  validateEventInput,
  validateUpdateEventInput,
  validateNearbyQueryParams
} = require('../validators/eventValidator');

/**
 * @desc    Create a new event
 * @route   POST /api/events
 * @access  Private (Authenticated User / Organizer)
 */
const createEvent = async (req, res, next) => {
  try {
    const validation = validateEventInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validation.errors
      });
    }

    // Set organizer identity directly from trusted server-side authenticated user
    const eventPayload = {
      ...req.body,
      organizer: req.user ? req.user.id : (req.body.organizer || new mongoose.Types.ObjectId())
    };

    const event = await eventService.createEvent(eventPayload, req.user);

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get nearby events via 2dsphere geospatial search
 * @route   GET /api/events/nearby
 * @access  Public
 */
const getNearbyEvents = async (req, res, next) => {
  try {
    const validation = validateNearbyQueryParams(req.query);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid nearby search parameters',
        errors: validation.errors
      });
    }

    const { lat, lng, radiusKm } = validation.parsed;
    const { search, category, date, price, featured, page, limit } = req.query;

    const result = await eventService.getNearbyEvents({
      lat,
      lng,
      radiusKm,
      search,
      category,
      date,
      price,
      featured,
      page,
      limit
    });


    return res.status(200).json({
      success: true,
      data: result.events,
      pagination: result.pagination,
      query: {
        center: { latitude: lat, longitude: lng },
        radiusKm
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all events with filters, search & pagination
 * @route   GET /api/events
 * @access  Public
 */
const getEvents = async (req, res, next) => {
  try {
    const { search, category, date, price, featured, status, page, limit } = req.query;

    const result = await eventService.getAllEvents({
      search,
      category,
      date,
      price,
      featured,
      status,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      data: result.events,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single event by ID
 * @route   GET /api/events/:id
 * @access  Public
 */
const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isDbConnected() && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Event ID format'
      });
    }

    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;
    const event = await eventService.getEventById(id, userId, userRole);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${id}`
      });
    }

    return res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel event by Host or Admin
 * @route   POST /api/events/:id/cancel
 * @access  Private (Owner / Admin)
 */
const cancelEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isDbConnected() && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Event ID format'
      });
    }

    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : 'USER';
    const event = await eventService.cancelEvent(id, userId, userRole);

    return res.status(200).json({
      success: true,
      message: 'Event has been cancelled successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update event details
 * @route   PUT /api/events/:id
 * @access  Private (Owner / Admin)
 */
const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isDbConnected() && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Event ID format'
      });
    }

    const validation = validateUpdateEventInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validation.errors
      });
    }

    const event = await eventService.updateEvent(id, req.body);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${id}`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete event
 * @route   DELETE /api/events/:id
 * @access  Private (Owner / Admin)
 */
const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isDbConnected() && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Event ID format'
      });
    }

    const event = await eventService.deleteEvent(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${id}`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvent,
  getNearbyEvents,
  getEvents,
  getEventById,
  cancelEvent,
  updateEvent,
  deleteEvent
};
