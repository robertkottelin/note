import axios from 'axios';

// Define API base URL from environment variable when possible
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const API = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
    timeout: 10000, // Add request timeout
});

// Add auth token to requests if available
API.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor for handling common errors
API.interceptors.response.use(
  response => response,
  error => {
    // Handle authentication errors consistently
    if (error.response && error.response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('access_token');
      
      // Redirect to login if needed
      if (window.location.pathname !== '/login') {
        // Optional: redirect to login page
        // window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth service
const AuthService = {
  // Register new user
  register: async (email, password) => {
    try {
      const response = await API.post('/register', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  // Login existing user
  login: async (email, password) => {
    try {
      const response = await API.post('/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  // Logout user
  logout: async () => {
    try {
      const response = await API.post('/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
  
  // Get current user info
  getCurrentUser: async () => {
    try {
      const response = await API.get('/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

// Note service
const NoteService = {
  // Get all notes
  getNotes: async (filters = {}) => {
    try {
      // Convert filters to query params
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.isPinned !== undefined) params.append('isPinned', filters.isPinned);
      
      const url = '/notes/' + (params.toString() ? `?${params.toString()}` : '');
      const response = await API.get(url);
      return response.data.notes || [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  },
  
  // Get a specific note
  getNote: async (noteId) => {
    try {
      const response = await API.get(`/notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching note:', error);
      throw error;
    }
  },
  
  // Create a new note
  createNote: async (noteData) => {
    try {
      const response = await API.post('/notes/', noteData);
      return response.data.note;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  },
  
  // Update existing note
  updateNote: async (noteId, noteData) => {
    try {
      const response = await API.put(`/notes/${noteId}`, noteData);
      return response.data.note;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },
  
  // Delete note
  deleteNote: async (noteId) => {
    try {
      await API.delete(`/notes/${noteId}`);
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  },
  
  // Get all unique categories
  getCategories: async () => {
    try {
      const response = await API.get('/notes/categories');
      return response.data.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }
};

export { API, AuthService, NoteService };