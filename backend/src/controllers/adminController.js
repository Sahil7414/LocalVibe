const mongoose = require('mongoose');
const User = require('../models/User');
const { Event } = require('../models/Event');
const { isDbConnected } = require('../config/db');
const inMemoryStore = require('../services/inMemoryStore');

/**
 * @desc    Get all registered users with metrics for Admin Dashboard
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
const getRegisteredUsers = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      const users = await inMemoryStore.getAllUsers();
      return res.status(200).json({
        success: true,
        data: users,
        total: users.length
      });
    }

    const users = await User.find({})
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    // Aggregate event counts per user
    const usersWithMetrics = await Promise.all(
      users.map(async (u) => {
        const userId = u._id.toString();
        const eventsCount = await Event.countDocuments({ organizer: u._id });
        const isSuspended = !!u.isSuspended || u.status === 'SUSPENDED';

        return {
          id: userId,
          _id: userId,
          name: u.name,
          email: u.email,
          role: u.role,
          city: u.location?.city || 'India',
          status: isSuspended ? 'SUSPENDED' : (u.status || 'ACTIVE'),
          isSuspended,
          eventsCount,
          createdAt: u.createdAt
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: usersWithMetrics,
      total: usersWithMetrics.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a user's account status (ACTIVE / SUSPENDED)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private (Admin only)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const normalizedStatus = (status || 'ACTIVE').toUpperCase().trim();
    if (!['ACTIVE', 'SUSPENDED'].includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'ACTIVE' or 'SUSPENDED'"
      });
    }

    const isSuspended = normalizedStatus === 'SUSPENDED';

    if (!isDbConnected() || !mongoose.Types.ObjectId.isValid(id)) {
      const updated = await inMemoryStore.updateUserStatus(id, normalizedStatus);
      if (!updated) {
        return res.status(404).json({ success: false, message: `User not found with ID ${id}` });
      }
      return res.status(200).json({
        success: true,
        message: `User account set to ${normalizedStatus}`,
        data: updated
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status: normalizedStatus, isSuspended },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      const memoryUser = await inMemoryStore.updateUserStatus(id, normalizedStatus);
      if (memoryUser) {
        return res.status(200).json({
          success: true,
          message: `User account set to ${normalizedStatus}`,
          data: memoryUser
        });
      }
      return res.status(404).json({
        success: false,
        message: `User not found with ID ${id}`
      });
    }

    return res.status(200).json({
      success: true,
      message: `User account set to ${normalizedStatus}`,
      data: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        status: user.status,
        isSuspended: user.isSuspended
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an event's moderation status (ACTIVE / SUSPENDED / CANCELLED)
 * @route   PATCH /api/admin/events/:id/status
 * @access  Private (Admin only)
 */
const updateEventStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, isFeatured } = req.body;

    const updatePayload = {};
    if (status) {
      const normalizedStatus = status.toUpperCase().trim();
      if (!['ACTIVE', 'SUSPENDED', 'CANCELLED', 'DRAFT'].includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid event status. Must be ACTIVE, SUSPENDED, CANCELLED, or DRAFT."
        });
      }
      updatePayload.status = normalizedStatus;
    }

    if (typeof isFeatured === 'boolean') {
      updatePayload.isFeatured = isFeatured;
    }

    if (!isDbConnected() || !mongoose.Types.ObjectId.isValid(id)) {
      const updated = await inMemoryStore.updateEvent(id, updatePayload);
      if (!updated) {
        return res.status(404).json({ success: false, message: `Event not found with ID ${id}` });
      }
      return res.status(200).json({
        success: true,
        message: 'Event status updated',
        data: updated
      });
    }

    const event = await Event.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true }
    ).populate('organizer', 'name email');

    if (!event) {
      const memoryEvent = await inMemoryStore.updateEvent(id, updatePayload);
      if (memoryEvent) {
        return res.status(200).json({
          success: true,
          message: `Event status updated to ${memoryEvent.status}`,
          data: memoryEvent
        });
      }
      return res.status(404).json({
        success: false,
        message: `Event not found with ID ${id}`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Event status updated to ${event.status}`,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRegisteredUsers,
  updateUserStatus,
  updateEventStatus
};
