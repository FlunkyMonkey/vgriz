import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  googleLogin: (accessToken) => api.post('/auth/google', { access_token: accessToken }),
  facebookLogin: (accessToken) => api.post('/auth/facebook', { access_token: accessToken }),
  appleLogin: (accessToken) => api.post('/auth/apple', { access_token: accessToken }),
};

// User API
const userAPI = {
  getCurrentUser: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/me', userData),
  updatePassword: (passwords) => api.put('/users/me/password', passwords),
};

// Calendar API
const calendarAPI = {
  getEvents: () => api.get('/calendar'),
  createEvent: (eventData) => api.post('/calendar', eventData),
  updateEvent: (eventId, eventData) => api.put(`/calendar/${eventId}`, eventData),
  deleteEvent: (eventId) => api.delete(`/calendar/${eventId}`),
};

// Notice API
const noticeAPI = {
  getNotices: () => api.get('/notices'),
  createNotice: (noticeData) => api.post('/notices', noticeData),
  updateNotice: (noticeId, noticeData) => api.put(`/notices/${noticeId}`, noticeData),
  deleteNotice: (noticeId) => api.delete(`/notices/${noticeId}`),
};

// Document API
const documentAPI = {
  getDocuments: () => api.get('/documents'),
  uploadDocument: (formData) => api.post('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  updateDocument: (documentId, documentData) => api.put(`/documents/${documentId}`, documentData),
  deleteDocument: (documentId) => api.delete(`/documents/${documentId}`),
  downloadDocument: (documentId) => api.get(`/documents/${documentId}/download`, {
    responseType: 'blob',
  }),
};

// Message API
const messageAPI = {
  getMessages: () => api.get('/messages'),
  createMessage: (formData) => api.post('/messages', formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // for messages with photos
    },
  }),
  updateMessage: (messageId, messageData) => api.put(`/messages/${messageId}`, messageData),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};

// Guest Book API
const guestBookAPI = {
  getEntries: () => api.get('/guestbook'),
  createEntry: (entryData) => api.post('/guestbook', entryData),
  createGuestEntry: (pinCode, entryData) => api.post(`/guestbook/guest/${pinCode}`, entryData),
  updateEntry: (entryId, entryData) => api.put(`/guestbook/${entryId}`, entryData),
  deleteEntry: (entryId) => api.delete(`/guestbook/${entryId}`),
  verifyPin: (pinCode) => api.post('/guestbook/verify-pin', { pinCode }),
};

export {
  api,
  authAPI,
  userAPI,
  calendarAPI,
  noticeAPI,
  documentAPI,
  messageAPI,
  guestBookAPI,
};
