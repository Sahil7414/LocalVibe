const express = require('express');
const router = express.Router();
const {
  createEvent,
  getNearbyEvents,
  getEvents,
  getEventById,
  cancelEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');
const {
  setRSVP,
  removeRSVP,
  getRSVPStatus,
  getUserEvents,
  getEventAttendees
} = require('../controllers/rsvpController');
const {
  authenticateToken,
  optionalAuthenticateToken,
  requireEventOwnership
} = require('../middleware/authMiddleware');

// Public discovery endpoints
router.get('/nearby', getNearbyEvents);

// User-specific events & RSVPs (My Events)
router.get('/user/my-events', authenticateToken, getUserEvents);

router.route('/')
  .get(getEvents)
  .post(authenticateToken, createEvent);

// RSVP endpoints
router.route('/:id/rsvp')
  .get(optionalAuthenticateToken, getRSVPStatus)
  .post(authenticateToken, setRSVP)
  .delete(authenticateToken, removeRSVP);

// Public attendees endpoint
router.get('/:id/attendees', getEventAttendees);

// Host & Admin Cancellation endpoint
router.post('/:id/cancel', authenticateToken, cancelEvent);

router.route('/:id')
  .get(optionalAuthenticateToken, getEventById)
  .put(authenticateToken, requireEventOwnership, updateEvent)
  .delete(authenticateToken, requireEventOwnership, deleteEvent);

module.exports = router;
