import React, { createContext, useState, useEffect } from 'react';
import { AuthService } from '../services/api';

// Validate JWT token format
const isValidJWT = (token) => {
  if (!token) return false;
  
  try {
    // Basic format validation
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return false;
    
    // Decode payload
    const base64Url = tokenParts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    // Check token expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    
    return Boolean(payload);
  } catch (e) {
    console.error("JWT validation error:", e);
    return false;
  }
};

// Create the auth context
export const AuthContext = createContext({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  token: null,
  login: () => Promise.resolve({ success: false }),
  register: () => Promise.resolve({ success: false }),
  logout: () => Promise.resolve({ success: false })
});

// Create the auth provider component
export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    currentUser: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    token: localStorage.getItem('access_token') || null
  });

  // Check authentication status on mount
  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      // Validate token format before attempting to use it
      if (!state.token || !isValidJWT(state.token)) {
        localStorage.removeItem('access_token');
        if (mounted) {
          setState(prev => ({
            ...prev,
            token: null,
            isAuthenticated: false,
            isLoading: false
          }));
        }
        return;
      }
      
      try {
        const userData = await AuthService.getCurrentUser();
        
        if (!mounted) return;
        
        setState(prev => ({
          ...prev,
          currentUser: userData,
          isAuthenticated: true,
          isLoading: false
        }));
      } catch (error) {
        if (!mounted) return;
        
        // Handle auth errors
        if (error.response?.status === 401 || error.response?.status === 422) {
          // Clear invalid token
          localStorage.removeItem('access_token');
          
          setState(prev => ({
            ...prev,
            token: null,
            currentUser: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          }));
          return;
        }
        
        // Unexpected error
        console.error("Authentication check failed:", error);
        setState(prev => ({
          ...prev,
          currentUser: null,
          isAuthenticated: false,
          isLoading: false,
          error: error.message || "Authentication check failed"
        }));
      }
    };

    checkAuth();
    return () => { mounted = false; };
  }, [state.token]);

  // Login function
  const login = async (email, password) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await AuthService.login(email, password);
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('access_token', response.token);
      }
      
      setState(prev => ({
        ...prev,
        token: response.token,
        currentUser: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }));
      
      return { success: true };
    } catch (error) {  
      console.error("Login error:", error);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error.error || "Login failed"
      }));
      
      return { 
        success: false, 
        error: error.error || "Login failed" 
      };
    }
  };

  // Register function
  const register = async (email, password) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await AuthService.register(email, password);
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('access_token', response.token);
      }
      
      setState(prev => ({
        ...prev,
        token: response.token,
        currentUser: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }));
      
      return { success: true };
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error.error || "Registration failed"
      }));
      
      return { 
        success: false, 
        error: error.error || "Registration failed" 
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await AuthService.logout();
      
      // Remove token from localStorage
      localStorage.removeItem('access_token');
      
      setState({
        currentUser: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        token: null
      });
      
      return { success: true };
    } catch (error) {
      // Even if server logout fails, clear client-side auth state
      localStorage.removeItem('access_token');
      
      setState({
        currentUser: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        token: null
      });
      
      return { success: true };
    }
  };

  // Return auth context provider
  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};