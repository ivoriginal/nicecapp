import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import mockEvents from '../data/mockEvents.json';
import { useInAppNotification } from './InAppNotificationContext';

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
  const [currentUserId, setCurrentUserId] = useState(null);
  const inAppNotification = useInAppNotification();

  // Get current user ID from auth
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          setCurrentUserId(session.user.id);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };

    getCurrentUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
      } else {
        setCurrentUserId(null);
        setNotifications([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load notifications from Supabase when user changes
  useEffect(() => {
    if (!currentUserId) return;

    const loadNotifications = async () => {
      try {
        console.log('Loading notifications for user:', currentUserId);
        
        // Get notifications from Supabase
        const { data: supabaseNotifications, error } = await supabase
          .from('notifications')
          .select(`
            *,
            actor:profiles!notifications_actor_id_fkey(
              id,
              full_name,
              username,
              avatar_url
            )
          `)
          .eq('user_id', currentUserId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error loading notifications:', error);
          return;
        }

        // Transform Supabase notifications to match expected format
        const transformedNotifications = (supabaseNotifications || []).map(notification => ({
          id: notification.id,
          type: notification.type,
          userId: notification.actor_id,
          userName: notification.actor?.full_name || notification.actor?.username || 'User',
          userAvatar: notification.actor?.avatar_url || 'https://via.placeholder.com/40',
          date: notification.created_at,
          read: notification.read,
          targetUserId: notification.user_id,
          // Add specific fields based on notification type
          ...(notification.type === 'follow' && {
            message: `${notification.actor?.full_name || notification.actor?.username || 'Someone'} started following you`
          }),
          // Add other notification type specific fields as needed
          ...notification.data // Include any additional data stored in the notification
        }));

        // Also load some mock notifications for other types (saved_recipe, etc.)
        const relevantTypes = ['saved_recipe', 'added_to_gear_wishlist', 'remixed_recipe'];
        const mockNotifications = mockEvents.notifications.filter(
          notification => notification.targetUserId === 'user1' && relevantTypes.includes(notification.type)
        ).slice(0, 2); // Just take 2 mock notifications

        // Combine real and mock notifications
        const allNotifications = [...transformedNotifications, ...mockNotifications];

        // Sort by date (newest first)
        const sortedNotifications = allNotifications.sort((a, b) => {
          const dateA = new Date(a.date || a.created_at);
          const dateB = new Date(b.date || b.created_at);
          return dateB - dateA;
        });

        console.log(`Loaded ${sortedNotifications.length} notifications (${transformedNotifications.length} real, ${mockNotifications.length} mock)`);
        setNotifications(sortedNotifications);

      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();

    // Set up real-time subscription for new notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        }, 
        (payload) => {
          console.log('New notification received:', payload);
          
          // Show in-app notification for new follow notifications
          if (payload.new.type === 'follow' && inAppNotification) {
            // Get actor profile for the notification
            const fetchActorAndShowNotification = async () => {
              try {
                const { data: actorProfile, error } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', payload.new.actor_id)
                  .single();

                if (!error && actorProfile) {
                  const notification = {
                    id: payload.new.id,
                    type: payload.new.type,
                    userId: payload.new.actor_id,
                    userName: actorProfile.full_name || actorProfile.username || 'Someone',
                    userAvatar: actorProfile.avatar_url || 'https://via.placeholder.com/40',
                    message: `${actorProfile.full_name || actorProfile.username || 'Someone'} started following you`,
                    date: payload.new.created_at,
                  };

                  inAppNotification.showNotification(notification);
                }
              } catch (error) {
                console.error('Error fetching actor profile for notification:', error);
              }
            };

            fetchActorAndShowNotification();
          }
          
          // Reload notifications to get complete data with joins
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUserId]);

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
  const markAsRead = useCallback(async (id) => {
    // Update local state immediately
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );

    // Update in database (only for real notifications, not mock ones)
    try {
      if (typeof id === 'string' && id.includes('uuid')) {
        // This is a real notification from Supabase
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', id);

        if (error) {
          console.error('Error marking notification as read:', error);
        }
      }
    } catch (error) {
      console.error('Error updating notification read status:', error);
    }
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