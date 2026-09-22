const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const {
  getRegisteredUsers,
  updateUserStatus,
  updateEventStatus
} = require('../controllers/adminController');

// All admin routes require authentication and ADMIN role
router.use(authenticateToken, requireRole('ADMIN'));

// User moderation routes
router.get('/users', getRegisteredUsers);
router.patch('/users/:id/status', updateUserStatus);

// Event moderation routes
router.patch('/events/:id/status', updateEventStatus);

module.exports = router;
