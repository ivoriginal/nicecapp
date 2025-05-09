import React, { createContext, useState, useContext, useEffect } from 'react';
import { getMockUser } from '../data/dataService';

// Create context with default values
const UserContext = createContext({
  currentUser: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

// Custom hook to use the user context
export const useUser = () => useContext(UserContext);

// Provider component
export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Initialize with mock user data in development
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // In a real app, you would check local storage or secure store for tokens
        // and then fetch the user data from your API
        const mockUser = await getMockUser(1); // Get first mock user as the current user
        if (mockUser) {
          setCurrentUser(mockUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };
    
    initializeUser();
  }, []);
  
  // Log in user
  const login = async (username, password) => {
    try {
      // Simulate API call - in a real app, you would call your auth endpoint
      const mockUser = await getMockUser(1);
      
      if (mockUser) {
        setCurrentUser(mockUser);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };
  
  // Log out user
  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };
  
  // Update user data (e.g., after profile edit)
  const updateUser = (userData) => {
    setCurrentUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
  };
  
  const value = {
    currentUser,
    isAuthenticated,
    login,
    logout,
    updateUser,
  };
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext; 