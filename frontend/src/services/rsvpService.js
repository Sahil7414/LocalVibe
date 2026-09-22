import { apiClient } from './apiClient';

export const rsvpService = {
  /**
   * Set or update user RSVP (GOING or INTERESTED)
   * @param {string} eventId
   * @param {'GOING' | 'INTERESTED'} status
   */
  async setRSVP(eventId, status) {
    return await apiClient.post(`/events/${eventId}/rsvp`, { status });
  },

  /**
   * Remove user RSVP for an event
   * @param {string} eventId
   */
  async removeRSVP(eventId) {
    return await apiClient.delete(`/events/${eventId}/rsvp`);
  },

  /**
   * Fetch current user's RSVP status and counts for an event
   * @param {string} eventId
   */
  async getStatus(eventId) {
    return await apiClient.get(`/events/${eventId}/rsvp`);
  },

  /**
   * Fetch user's categorized RSVPs and created events
   */
  async getMyEvents() {
    return await apiClient.get('/events/user/my-events');
  },

  /**
   * Fetch public attendee list for an event
   * @param {string} eventId
   * @param {number} page
   * @param {number} limit
   */
  async getAttendees(eventId, page = 1, limit = 20) {
    return await apiClient.get(`/events/${eventId}/attendees?page=${page}&limit=${limit}`);
  }
};
