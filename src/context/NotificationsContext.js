import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import mockEvents from '../data/mockEvents.json';

// Create the context
const NotificationsContext = createContext();

// Custom hook to use the notifications context
export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

// Provider component
export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize notifications from mock data
  useEffect(() => {
    // Get relevant notifications for user1 (Ivo Vilches)
    // Include only: saved_recipe, added_to_gear_wishlist, followed, remixed_recipe
    const relevantTypes = ['saved_recipe', 'added_to_gear_wishlist', 'followed', 'remixed_recipe'];
    
    const userNotifications = mockEvents.notifications.filter(
      notification => notification.targetUserId === 'user1' && relevantTypes.includes(notification.type)
    );
    
    // Sort notifications by date (newest first)
    const sortedNotifications = [...userNotifications].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    // Take 4 notifications and set read status
    // The first 3 (newest) should be unread, the rest read
    const processedNotifications = sortedNotifications.slice(0, 4).map((notification, index) => {
      // First 3 (newest) notifications should be unread
      if (index < 3) {
        return { ...notification, read: false };
      } else {
        return { ...notification, read: true };
      }
    });
    
    setNotifications(processedNotifications);
  }, []);

  // Calculate unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(notification => !notification.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Add a new notification - memoized to prevent re-renders
  const addNotification = useCallback((notification) => {
    // Check for duplicate rate_recipe_reminder notifications for the same recipe
    if (notification.type === 'rate_recipe_reminder' && notification.recipeId) {
      setNotifications(prevNotifications => {
        // Check if there's already a rate_recipe_reminder for this recipe
        const existingReminder = prevNotifications.find(
          existing => existing.type === 'rate_recipe_reminder' && 
                     existing.recipeId === notification.recipeId &&
                     existing.targetUserId === notification.targetUserId
        );
        
        if (existingReminder) {
          console.log(`Duplicate rate reminder prevented for recipe ${notification.recipeId}`);
          return prevNotifications; // Don't add duplicate, return existing notifications
        }
        
        // No duplicate found, add the new notification
        const newNotification = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          read: false,
          ...notification
        };
        return [newNotification, ...prevNotifications];
      });
    } else {
      // For all other notification types, add normally
      const newNotification = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
        ...notification
      };
      setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
    }
  }, []);

  // Mark a notification as read - memoized to prevent re-renders
  const markAsRead = useCallback((id) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  // Mark all notifications as read - memoized to prevent re-renders
  const markAllAsRead = useCallback(() => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  // Delete a notification - memoized to prevent re-renders
  const deleteNotification = useCallback((id) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  }, []);

  // Clear all notifications - memoized to prevent re-renders
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Remove rate recipe reminders for a specific recipe - memoized to prevent re-renders
  const removeRateReminder = useCallback((recipeId, targetUserId) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => 
        !(notification.type === 'rate_recipe_reminder' && 
          notification.recipeId === recipeId &&
          notification.targetUserId === targetUserId)
      )
    );
  }, []);

  // New function to get complete recipe and user data for a notification - memoized to prevent re-renders
  const getNotificationData = useCallback((notification) => {
    // Load mock data only once
    const mockRecipes = require('../data/mockRecipes.json').recipes;
    const mockUsers = require('../data/mockUsers.json').users;
    
    let recipeData = null;
    let userData = null;
    
    // Find user data
    if (notification.userId) {
      userData = mockUsers.find(u => u.id === notification.userId) || {
        id: notification.userId,
        name: notification.userName || 'User',
        avatar: notification.userAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg'
      };
    }
    
    // Find recipe data based on notification type
    if (notification.type === 'saved_recipe' && notification.recipeId) {
      recipeData = mockRecipes.find(r => r.id === notification.recipeId);
    } else if (notification.type === 'remixed_recipe') {
      // For remixed recipes, we need the original recipe and the new recipe
      const originalRecipe = mockRecipes.find(r => r.id === notification.originalRecipeId) || {
        id: notification.originalRecipeId || 'recipe-coffee-0-1',
        name: notification.originalRecipeName || 'Villa Rosario V60',
        method: 'V60'
      };
      
      // Create the remixed recipe (either find it or create a placeholder)
      const remixedRecipe = mockRecipes.find(r => r.id === notification.newRecipeId) || {
        id: notification.newRecipeId || `remix-${Date.now()}`,
        name: notification.newRecipeName || `${notification.userName}'s Remix`,
        method: originalRecipe?.method || 'V60',
        coffeeId: originalRecipe?.coffeeId || 'coffee-villa-rosario',
        coffeeName: originalRecipe?.coffeeName || 'Villa Rosario',
        roaster: originalRecipe?.roaster || 'Kima Coffee',
        imageUrl: originalRecipe?.imageUrl || "https://kimacoffee.com/cdn/shop/files/CE2711AA-BBF7-4D8D-942C-F9568B66871F_1296x.png?v=1741927728",
        userId: notification.userId,
        userName: notification.userName
      };
      
      // For Lucas Brown's specific notification
      if (notification.id === 'notification-10' || notification.userName === 'Lucas Brown') {
        recipeData = {
          recipe: {
            id: 'recipe-new-1',
            name: "Lucas's Villa Rosario Method",
            method: 'V60',
            coffeeId: 'coffee-villa-rosario',
            coffeeName: 'Villa Rosario',
            roaster: 'Kima Coffee',
            imageUrl: "https://kimacoffee.com/cdn/shop/files/CE2711AA-BBF7-4D8D-942C-F9568B66871F_1296x.png?v=1741927728",
            userId: 'user10',
            userName: 'Lucas Brown',
            userAvatar: 'https://randomuser.me/api/portraits/men/55.jpg'
          },
          basedOnRecipe: {
            id: 'recipe-coffee-0-1',
            name: 'Villa Rosario V60',
            userName: 'Ivo Vilches',
            userAvatar: 'assets/users/ivo-vilches.jpg'
          }
        };
      } else {
        recipeData = {
          recipe: remixedRecipe,
          basedOnRecipe: {
            id: originalRecipe.id,
            name: originalRecipe.name,
            userName: 'Ivo Vilches', // Original creator (user1)
            userAvatar: 'assets/users/ivo-vilches.jpg'
          }
        };
      }
    }
    
    return { recipeData, userData };
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
    removeRateReminder,
    getNotificationData
  }), [
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
    removeRateReminder,
    getNotificationData
  ]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
} 