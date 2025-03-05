import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for token in localStorage on initialization
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Verify token expiration
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp > currentTime) {
          // Set up axios headers for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get user data
          fetchUserData();
        } else {
          // Token expired, remove it
          localStorage.removeItem('token');
          setCurrentUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        // Invalid token
        localStorage.removeItem('token');
        setCurrentUser(null);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fetch user data from the API
  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/me`);
      setCurrentUser(response.data);
      setIsLoading(false);
    } catch (error) {
      setError('Failed to fetch user data');
      setCurrentUser(null);
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set axios default headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set current user
      setCurrentUser(user);
      return user;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  // OAuth login function
  const oauthLogin = async (provider, accessToken) => {
    try {
      setError(null);
      const response = await axios.post(`${API_BASE_URL}/auth/${provider}`, { access_token: accessToken });
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set axios default headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set current user
      setCurrentUser(user);
      return user;
    } catch (error) {
      setError(error.response?.data?.message || `${provider} login failed`);
      throw error;
    }
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!currentUser || !currentUser.permissions) return false;
    return currentUser.permissions.includes(permission);
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await axios.put(`${API_BASE_URL}/users/me`, profileData);
      setCurrentUser(response.data);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Profile update failed');
      throw error;
    }
  };

  const value = {
    currentUser,
    isLoading,
    error,
    login,
    logout,
    register,
    oauthLogin,
    hasPermission,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
