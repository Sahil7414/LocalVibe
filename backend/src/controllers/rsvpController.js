const rsvpService = require('../services/rsvpService');
const { validateRSVPInput, validateEventIdParam } = require('../validators/rsvpValidator');

/**
 * @desc    Create or update user RSVP status (GOING / INTERESTED)
 * @route   POST /api/events/:id/rsvp
 * @access  Private (Authenticated User)
 */
const setRSVP = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idValidation = validateEventIdParam(id);
    if (!idValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: idValidation.error
      });
    }

    const inputValidation = validateRSVPInput(req.body);
    if (!inputValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: inputValidation.errors
      });
    }

    const result = await rsvpService.setRSVP(req.user.id, id, req.body.status);

    return res.status(200).json({
      success: true,
      message: `RSVP updated to ${result.status}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove user RSVP for an event
 * @route   DELETE /api/events/:id/rsvp
 * @access  Private (Authenticated User)
 */
const removeRSVP = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idValidation = validateEventIdParam(id);
    if (!idValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: idValidation.error
      });
    }

    const result = await rsvpService.removeRSVP(req.user.id, id);

    return res.status(200).json({
      success: true,
      message: 'RSVP removed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user RSVP status and aggregate counts for an event
 * @route   GET /api/events/:id/rsvp
 * @access  Public / Optional Auth
 */
const getRSVPStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idValidation = validateEventIdParam(id);
    if (!idValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: idValidation.error
      });
    }

    const userId = req.user ? req.user.id : null;
    const result = await rsvpService.getRSVPStatus(userId, id);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's RSVP'd and created events
 * @route   GET /api/events/user/my-events, GET /api/users/me/events
 * @access  Private (Authenticated User)
 */
const getUserEvents = async (req, res, next) => {
  try {
    const result = await rsvpService.getUserEvents(req.user.id);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public attendee list for an event
 * @route   GET /api/events/:id/attendees
 * @access  Public
 */
const getEventAttendees = async (req, res, next) => {
  try {
    const { id } = req.params;
    const idValidation = validateEventIdParam(id);
    if (!idValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: idValidation.error
      });
    }

    const { page, limit } = req.query;
    const result = await rsvpService.getEventAttendees(id, page, limit);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  setRSVP,
  removeRSVP,
  getRSVPStatus,
  getUserEvents,
  getEventAttendees
};
