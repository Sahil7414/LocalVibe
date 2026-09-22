const { Event } = require('../models/Event');
const RSVP = require('../models/RSVP');
const { isDbConnected } = require('../config/db');
const inMemoryStore = require('./inMemoryStore');

/**
 * Build date filter condition based on preset or custom range
 */
const buildDateFilter = (dateQuery) => {
  if (!dateQuery) return null;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dateQuery === 'today') {
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    return { $gte: startOfDay, $lt: endOfDay };
  }

  if (dateQuery === 'tomorrow') {
    const startOfTomorrow = new Date(startOfDay);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    const endOfTomorrow = new Date(startOfTomorrow);
    endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
    return { $gte: startOfTomorrow, $lt: endOfTomorrow };
  }

  if (dateQuery === 'weekend') {
    // Current or upcoming Saturday to Sunday
    const dayOfWeek = startOfDay.getDay(); // 0 is Sunday, 6 is Saturday
    const daysUntilSaturday = dayOfWeek === 6 ? 0 : 6 - dayOfWeek;
    const startOfSaturday = new Date(startOfDay);
    startOfSaturday.setDate(startOfSaturday.getDate() + daysUntilSaturday);
    const endOfSunday = new Date(startOfSaturday);
    endOfSunday.setDate(endOfSunday.getDate() + 2);
    return { $gte: startOfSaturday, $lt: endOfSunday };
  }

  if (dateQuery === 'upcoming') {
    return { $gte: now };
  }

  return null;
};

/**
 * Service to handle Event business logic and geospatial MongoDB queries
 */
const createEvent = async (eventData, organizerUser) => {
  if (!isDbConnected()) {
    return await inMemoryStore.createEvent(eventData, organizerUser);
  }

  const event = new Event({
    ...eventData,
    location: {
      type: 'Point',
      coordinates: [
        parseFloat(eventData.location.coordinates[0]), // Longitude
        parseFloat(eventData.location.coordinates[1])  // Latitude
      ],
      address: eventData.location.address.trim(),
      city: eventData.location.city ? eventData.location.city.trim() : ''
    }
  });

  const savedEvent = await event.save();
  return await savedEvent.populate('organizer', 'name email profileImage bio');
};

// Haversine formula to compute great-circle distance in kilometers
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

const getNearbyEvents = async ({ lat, lng, radiusKm = 5, search, category, date, price, featured, page = 1, limit = 20 }) => {
  if (!isDbConnected()) {
    return await inMemoryStore.getNearbyEvents({ lat, lng, radiusKm, search, category, date, price, featured, page, limit });
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  // Base MongoDB $near geospatial filter
  const queryFilter = {
    status: 'ACTIVE',
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat] // [longitude, latitude]
        },
        $maxDistance: radiusKm * 1000 // Convert km to meters
      }
    }
  };

  if (search && search.trim() !== '') {
    queryFilter.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
      { 'location.address': { $regex: search.trim(), $options: 'i' } },
      { 'location.city': { $regex: search.trim(), $options: 'i' } }
    ];
  }

  if (category) {
    queryFilter.category = category;
  }

  if (price === 'free') {
    queryFilter.price = 0;
  } else if (price === 'paid') {
    queryFilter.price = { $gt: 0 };
  }

  if (featured === 'true' || featured === true) {
    queryFilter.isFeatured = true;
  }

  const dateCond = buildDateFilter(date);
  if (dateCond) {
    queryFilter.startDate = dateCond;
  }

  // Execute query with pagination and organizer population
  const events = await Event.find(queryFilter)
    .populate('organizer', 'name email profileImage')
    .skip(skip)
    .limit(limitNum);

  // MongoDB countDocuments requires $geoWithin instead of $near
  const countFilter = { ...queryFilter };
  countFilter.location = {
    $geoWithin: {
      $centerSphere: [[lng, lat], radiusKm / 6378.1]
    }
  };
  const total = await Event.countDocuments(countFilter);

  // Calculate real distance for each event
  const enrichedEvents = events.map(ev => {
    const eventObj = ev.toObject ? ev.toObject() : ev;
    const [eLng, eLat] = eventObj.location.coordinates;
    const distanceKm = calculateDistanceKm(lat, lng, eLat, eLng);
    return {
      ...eventObj,
      distanceKm
    };
  });

  return {
    events: enrichedEvents,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};


const getAllEvents = async ({ search, category, date, price, featured, status = 'ACTIVE', page = 1, limit = 20 }) => {
  if (!isDbConnected()) {
    return await inMemoryStore.getAllEvents({ search, category, date, price, featured, status, page, limit });
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const queryFilter = {};

  if (status) {
    queryFilter.status = status;
  }

  if (category) {
    queryFilter.category = category;
  }

  if (price === 'free') {
    queryFilter.price = 0;
  } else if (price === 'paid') {
    queryFilter.price = { $gt: 0 };
  }

  if (featured === 'true' || featured === true) {
    queryFilter.isFeatured = true;
  }

  const dateCond = buildDateFilter(date);
  if (dateCond) {
    queryFilter.startDate = dateCond;
  }

  if (search && search.trim() !== '') {
    queryFilter.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
      { 'location.address': { $regex: search.trim(), $options: 'i' } },
      { 'location.city': { $regex: search.trim(), $options: 'i' } }
    ];
  }

  const events = await Event.find(queryFilter)
    .populate('organizer', 'name email profileImage')
    .sort({ startDate: 1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Event.countDocuments(queryFilter);

  return {
    events,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1
    }
  };
};

const getEventById = async (id, currentUserId = null, currentUserRole = null) => {
  if (!isDbConnected()) {
    return await inMemoryStore.getEventById(id, currentUserId, currentUserRole);
  }
  const event = await Event.findById(id).populate('organizer', 'name email profileImage bio');
  if (!event) return null;

  const goingCount = await RSVP.countDocuments({ event: id, status: 'GOING' });
  const interestedCount = await RSVP.countDocuments({ event: id, status: 'INTERESTED' });

  let userRSVPStatus = null;
  if (currentUserId) {
    const userRSVP = await RSVP.findOne({ user: currentUserId, event: id });
    userRSVPStatus = userRSVP ? userRSVP.status : null;
  }

  const eventObj = event.toObject ? event.toObject() : event;
  const organizerId = (eventObj.organizer?._id || eventObj.organizer?.id || eventObj.organizer || '').toString();
  const isHost = currentUserId && organizerId === currentUserId.toString();
  const isAdmin = currentUserRole === 'ADMIN';
  const isSuspended = eventObj.status === 'SUSPENDED';
  const isCancelled = eventObj.status === 'CANCELLED';

  let suspendedMessage = null;
  if (isSuspended) {
    if (isHost) {
      suspendedMessage = 'Your event has been suspended by administration. Only you and platform admins can view this event.';
    } else {
      suspendedMessage = 'sorry, this event has been suspended';
    }
  }

  return {
    ...eventObj,
    goingCount,
    interestedCount,
    attendeesCount: goingCount + interestedCount,
    userRSVPStatus,
    isHost,
    isSuspended,
    isCancelled,
    suspendedMessage,
    cancelledMessage: isCancelled ? 'This event has been cancelled by the host.' : null
  };
};

const cancelEvent = async (id, requestingUserId, requestingUserRole = 'USER') => {
  if (!isDbConnected()) {
    return await inMemoryStore.cancelEvent(id, requestingUserId, requestingUserRole);
  }

  const event = await Event.findById(id);
  if (!event) {
    const error = new Error(`Event not found with ID ${id}`);
    error.statusCode = 404;
    throw error;
  }

  const organizerId = (event.organizer?._id || event.organizer || '').toString();
  const isOwner = requestingUserId && organizerId === requestingUserId.toString();
  const isAdmin = requestingUserRole === 'ADMIN';

  if (!isOwner && !isAdmin) {
    const error = new Error('Unauthorized: Only the host or an administrator can cancel this event.');
    error.statusCode = 403;
    throw error;
  }

  event.status = 'CANCELLED';
  await event.save();

  return await event.populate('organizer', 'name email profileImage');
};

const updateEvent = async (id, updateData) => {
  if (!isDbConnected()) {
    return await inMemoryStore.updateEvent(id, updateData);
  }

  if (updateData.location && updateData.location.coordinates) {
    updateData.location.type = 'Point';
    updateData.location.coordinates = [
      parseFloat(updateData.location.coordinates[0]),
      parseFloat(updateData.location.coordinates[1])
    ];
  }

  return await Event.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  }).populate('organizer', 'name email profileImage');
};

const deleteEvent = async (id) => {
  if (!isDbConnected()) {
    return await inMemoryStore.deleteEvent(id);
  }
  return await Event.findByIdAndDelete(id);
};

module.exports = {
  createEvent,
  getNearbyEvents,
  getAllEvents,
  getEventById,
  cancelEvent,
  updateEvent,
  deleteEvent
};

