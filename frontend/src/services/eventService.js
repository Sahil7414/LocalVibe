import { apiClient } from './apiClient';

export const eventService = {
  /**
   * Fetch events within radius of given GPS coordinates
   */
  async fetchNearby({ lat, lng, radiusKm = 10, search, category, date, price, featured, page = 1, limit = 50 }) {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radiusKm: String(radiusKm),
      page: String(page),
      limit: String(limit)
    });

    if (search && search.trim() !== '') params.append('search', search.trim());
    if (category && category !== 'All') params.append('category', category);
    if (date && date !== 'all') params.append('date', date);
    if (price && price !== 'all') params.append('price', price);
    if (featured) params.append('featured', 'true');

    return await apiClient.get(`/events/nearby?${params.toString()}`);
  },

  /**
   * Fetch all events with query filters
   */
  async fetchAll({ search, category, date, price, featured, page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });

    if (search && search.trim() !== '') params.append('search', search.trim());
    if (category && category !== 'All') params.append('category', category);
    if (date && date !== 'all') params.append('date', date);
    if (price && price !== 'all') params.append('price', price);
    if (featured) params.append('featured', 'true');

    return await apiClient.get(`/events?${params.toString()}`);
  },

  /**
   * Fetch single event details by MongoDB ID
   */
  async fetchById(id) {
    return await apiClient.get(`/events/${id}`);
  },

  /**
   * Create a new event (Authenticated)
   */
  async create(eventData) {
    return await apiClient.post('/events', eventData);
  },

  /**
   * Update existing event (Owner / Admin)
   */
  async update(id, eventData) {
    return await apiClient.put(`/events/${id}`, eventData);
  },

  /**
   * Cancel an event (Host / Admin)
   */
  async cancel(id) {
    return await apiClient.post(`/events/${id}/cancel`);
  },

  /**
   * Delete an event (Owner / Admin)
   */
  async delete(id) {
    return await apiClient.delete(`/events/${id}`);
  }
};
