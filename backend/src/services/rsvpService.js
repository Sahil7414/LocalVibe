const mongoose = require('mongoose');
const RSVP = require('../models/RSVP');
const { Event } = require('../models/Event');
const { isDbConnected } = require('../config/db');
const inMemoryStore = require('./inMemoryStore');

/**
 * Service handling RSVP business logic and attendance persistence
 */
const rsvpService = {
  /**
   * Set or update a user's RSVP status for an event (GOING or INTERESTED)
   * Enforces database-level uniqueness compound index (user + event)
   */
  async setRSVP(userId, eventId, status) {
    const normalizedStatus = status.toUpperCase().trim();

    if (!isDbConnected()) {
      const event = await inMemoryStore.getEventById(eventId);
      if (!event) {
        const error = new Error(`Event not found with ID ${eventId}`);
        error.statusCode = 404;
        throw error;
      }
      if (event.status === 'CANCELLED' || event.status === 'SUSPENDED') {
        const error = new Error('Cannot RSVP to a suspended or cancelled event');
        error.statusCode = 400;
        throw error;
      }
      return await inMemoryStore.upsertRSVP(userId, eventId, normalizedStatus);
    }

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      const error = new Error(`Event not found with ID ${eventId}`);
      error.statusCode = 404;
      throw error;
    }

    if (event.status === 'CANCELLED' || event.status === 'SUSPENDED') {
      const error = new Error('Cannot RSVP to a suspended or cancelled event');
      error.statusCode = 400;
      throw error;
    }

    // Atomic findOneAndUpdate with upsert ensures exactly one RSVP record per user/event
    await RSVP.findOneAndUpdate(
      { user: userId, event: eventId },
      { status: normalizedStatus },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Compute updated counts
    const goingCount = await RSVP.countDocuments({ event: eventId, status: 'GOING' });
    const interestedCount = await RSVP.countDocuments({ event: eventId, status: 'INTERESTED' });

    return {
      status: normalizedStatus,
      goingCount,
      interestedCount,
      attendeesCount: goingCount + interestedCount,
      eventId
    };
  },

  /**
   * Remove a user's RSVP for an event
   */
  async removeRSVP(userId, eventId) {
    if (!isDbConnected()) {
      const event = await inMemoryStore.getEventById(eventId);
      if (!event) {
        const error = new Error(`Event not found with ID ${eventId}`);
        error.statusCode = 404;
        throw error;
      }
      return await inMemoryStore.deleteRSVP(userId, eventId);
    }

    const event = await Event.findById(eventId);
    if (!event) {
      const error = new Error(`Event not found with ID ${eventId}`);
      error.statusCode = 404;
      throw error;
    }

    await RSVP.findOneAndDelete({ user: userId, event: eventId });

    const goingCount = await RSVP.countDocuments({ event: eventId, status: 'GOING' });
    const interestedCount = await RSVP.countDocuments({ event: eventId, status: 'INTERESTED' });

    return {
      status: null,
      goingCount,
      interestedCount,
      attendeesCount: goingCount + interestedCount,
      eventId
    };
  },

  /**
   * Get RSVP status for user and aggregate counts for an event
   */
  async getRSVPStatus(userId, eventId) {
    if (!isDbConnected()) {
      return await inMemoryStore.getRSVPStatus(userId, eventId);
    }

    const goingCount = await RSVP.countDocuments({ event: eventId, status: 'GOING' });
    const interestedCount = await RSVP.countDocuments({ event: eventId, status: 'INTERESTED' });

    let status = null;
    if (userId) {
      const userRSVP = await RSVP.findOne({ user: userId, event: eventId });
      status = userRSVP ? userRSVP.status : null;
    }

    return {
      status,
      goingCount,
      interestedCount,
      attendeesCount: goingCount + interestedCount
    };
  },

  /**
   * Get categorized events for current authenticated user (GOING, INTERESTED, CREATED)
   */
  async getUserEvents(userId) {
    if (!isDbConnected()) {
      return await inMemoryStore.getUserEvents(userId);
    }

    // Retrieve user's RSVPs populated with event and organizer data
    const rsvps = await RSVP.find({ user: userId })
      .populate({
        path: 'event',
        populate: { path: 'organizer', select: 'name email profileImage bio' }
      })
      .sort({ updatedAt: -1 });

    const goingEvents = [];
    const interestedEvents = [];

    for (const rsvp of rsvps) {
      if (rsvp.event && rsvp.event.status !== 'DELETED') {
        const eventObj = rsvp.event.toObject ? rsvp.event.toObject() : rsvp.event;
        const counts = await this.getRSVPCountsForEvent(eventObj._id || eventObj.id);
        const isSuspended = eventObj.status === 'SUSPENDED';
        const isCancelled = eventObj.status === 'CANCELLED';

        const enriched = {
          ...eventObj,
          userRSVPStatus: rsvp.status,
          isSuspended,
          isCancelled,
          suspendedMessage: isSuspended ? 'sorry, this event has been suspended' : null,
          cancelledMessage: isCancelled ? 'This event has been cancelled by the host.' : null,
          ...counts
        };

        if (rsvp.status === 'GOING') {
          goingEvents.push(enriched);
        } else if (rsvp.status === 'INTERESTED') {
          interestedEvents.push(enriched);
        }
      }
    }

    // Retrieve events created by user
    const createdRaw = await Event.find({ organizer: userId })
      .populate('organizer', 'name email profileImage bio')
      .sort({ createdAt: -1 });

    const createdEvents = [];
    for (const ev of createdRaw) {
      const eventObj = ev.toObject ? ev.toObject() : ev;
      const counts = await this.getRSVPCountsForEvent(eventObj._id || eventObj.id);
      const isSuspended = eventObj.status === 'SUSPENDED';
      const isCancelled = eventObj.status === 'CANCELLED';

      createdEvents.push({
        ...eventObj,
        isHost: true,
        isSuspended,
        isCancelled,
        suspendedMessage: isSuspended ? 'Your event has been suspended by administration. Only you and platform admins can view this event.' : null,
        cancelledMessage: isCancelled ? 'This event has been cancelled by the host.' : null,
        ...counts
      });
    }

    return {
      going: goingEvents,
      interested: interestedEvents,
      created: createdEvents,
      counts: {
        going: goingEvents.length,
        interested: interestedEvents.length,
        created: createdEvents.length
      }
    };
  },

  /**
   * Helper to retrieve aggregate counts for an event
   */
  async getRSVPCountsForEvent(eventId) {
    if (!isDbConnected()) {
      return inMemoryStore.getEventRSVPCounts(eventId);
    }

    const goingCount = await RSVP.countDocuments({ event: eventId, status: 'GOING' });
    const interestedCount = await RSVP.countDocuments({ event: eventId, status: 'INTERESTED' });
    return {
      goingCount,
      interestedCount,
      attendeesCount: goingCount + interestedCount
    };
  },

  /**
   * Get public attendee list for an event
   */
  async getEventAttendees(eventId, page = 1, limit = 20) {
    if (!isDbConnected()) {
      return await inMemoryStore.getEventAttendees(eventId, page, limit);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const rsvps = await RSVP.find({ event: eventId, status: 'GOING' })
      .populate('user', 'name profileImage bio')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const attendees = rsvps
      .filter(r => r.user)
      .map(r => ({
        _id: r.user._id,
        name: r.user.name,
        profileImage: r.user.profileImage,
        bio: r.user.bio
      }));

    const counts = await this.getRSVPCountsForEvent(eventId);

    return {
      attendees,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: counts.goingCount
      },
      ...counts
    };
  }
};

module.exports = rsvpService;
