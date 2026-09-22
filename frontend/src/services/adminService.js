import { apiClient } from './apiClient';

/**
 * Service for Admin operations (User and Event moderation)
 */
export const adminService = {
  /**
   * Fetch all registered users with metrics (Admin only)
   */
  async fetchUsers() {
    return await apiClient.get('/admin/users');
  },

  /**
   * Update a user's account status (ACTIVE / SUSPENDED)
   */
  async updateUserStatus(userId, statusOrPayload) {
    const body = typeof statusOrPayload === 'string' ? { status: statusOrPayload } : statusOrPayload;
    return await apiClient.patch(`/admin/users/${userId}/status`, body);
  },

  /**
   * Update event status or featured flag (ACTIVE / SUSPENDED / CANCELLED)
   */
  async updateEventStatus(eventId, statusOrPayload) {
    const body = typeof statusOrPayload === 'string' ? { status: statusOrPayload } : statusOrPayload;
    return await apiClient.patch(`/admin/events/${eventId}/status`, body);
  }
};
