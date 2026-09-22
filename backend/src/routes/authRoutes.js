const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getMe, updateMe } = require('../controllers/authController');
const { getUserEvents } = require('../controllers/rsvpController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);

router.route('/me')
  .get(authenticateToken, getMe)
  .put(authenticateToken, updateMe)
  .patch(authenticateToken, updateMe);

router.get('/me/events', authenticateToken, getUserEvents);

module.exports = router;


