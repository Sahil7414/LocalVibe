import { apiClient } from './apiClient';

export const authService = {
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    if (response.data && response.data.token) {
      localStorage.setItem('localvibe_token', response.data.token);
    }
    return response.data;
  },

  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.data && response.data.token) {
      localStorage.setItem('localvibe_token', response.data.token);
    }
    return response.data;
  },

  async googleLogin(credential) {
    const response = await apiClient.post('/auth/google', { credential });
    if (response.data && response.data.token) {
      localStorage.setItem('localvibe_token', response.data.token);
    }
    return response.data;
  },

  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async updateProfile(userData) {
    const response = await apiClient.put('/users/me', userData);
    return response.data;
  },


  logout() {
    localStorage.removeItem('localvibe_token');
  },

  getToken() {
    return localStorage.getItem('localvibe_token');
  },

  isAuthenticated() {
    return !!localStorage.getItem('localvibe_token');
  }
};
