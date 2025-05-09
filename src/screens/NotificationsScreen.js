import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationsContext';
import { useFocusEffect } from '@react-navigation/native';

const NotificationItem = ({ notification, onPress, isLast }) => {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffTime / (1000 * 60));

      if (diffDays > 0) {
        return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
      } else if (diffHours > 0) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
      } else {
        return 'Just now';
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'saved_recipe':
        return <Ionicons name="bookmark" size={12} color="#FFFFFF" />;
      case 'added_to_gear_wishlist':
        return <Ionicons name="cart" size={12} color="#FFFFFF" />;
      case 'followed':
        return <Ionicons name="person" size={12} color="#FFFFFF" />;
      case 'remixed_recipe':
        return <Ionicons name="git-branch" size={12} color="#FFFFFF" />;
      default:
        return <Ionicons name="notifications" size={12} color="#FFFFFF" />;
    }
  };

  const getNotificationMessage = () => {
    // If a custom message is provided, use it
    if (notification.message) {
      return notification.message;
    }
    
    // Otherwise, generate a message based on notification type
    switch (notification.type) {
      case 'saved_recipe':
        return `${notification.userName} saved your recipe for ${notification.recipeName}`;
      case 'added_to_gear_wishlist':
        return `Your friend ${notification.userName} added ${notification.gearName} to their wishlist`;
      case 'followed':
        return `${notification.userName} started following you`;
      case 'remixed_recipe':
        return `${notification.userName} created a recipe based on your ${notification.originalRecipeName}`;
      default:
        return 'You have a new notification';
    }
  };

  const getSecondaryText = () => {
    switch (notification.type) {
      case 'saved_recipe':
        return `Recipe: ${notification.recipeName}`;
      case 'added_to_gear_wishlist':
        return `Gear: ${notification.gearName}`;
      case 'remixed_recipe':
        return `New recipe: ${notification.newRecipeName}`;
      default:
        return null;
    }
  };

  const secondaryText = getSecondaryText();

  // Handle avatar press separately to navigate to user profile
  const handleAvatarPress = () => {
    onPress(notification, true); // Pass true to indicate avatar press
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadNotification,
        isLast && { borderBottomWidth: 0 }
      ]}
      onPress={() => onPress(notification)}
    >
      <TouchableOpacity 
        style={styles.notificationIconContainer}
        onPress={handleAvatarPress}
      >
        <Image
          source={{ uri: notification.userAvatar }}
          style={styles.userAvatar}
        />
        <View style={styles.notificationTypeIconContainer}>
          {getNotificationIcon()}
        </View>
      </TouchableOpacity>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationMessage}>
          {getNotificationMessage()}
        </Text>
        {secondaryText && <Text style={styles.secondaryText}>{secondaryText}</Text>}
        <Text style={styles.notificationTime}>{formatDate(notification.date)}</Text>
      </View>
      {!notification.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );
};

const NotificationsScreen = ({ navigation }) => {
  const { notifications, markAsRead, markAllAsRead, getNotificationData } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [screenFocused, setScreenFocused] = useState(false);

  // Mark notifications as read when navigating away
  useFocusEffect(
    React.useCallback(() => {
      // When screen comes into focus
      setScreenFocused(true);
      
      return () => {
        // When screen loses focus (navigating away)
        setScreenFocused(false);
        
        // Mark all notifications as read when navigating away
        markAllAsRead();
      };
    }, [markAllAsRead])
  );

  useEffect(() => {
    // Set loading to false once we have notifications
    setLoading(false);
    
    // Debug log to check notifications
    console.log('Current notifications:', 
      notifications.map(n => ({
        id: n.id,
        type: n.type,
        user: n.userName,
        message: n.message || `${n.type} notification`,
        read: n.read
      }))
    );
    
  }, [notifications]);

  const handleNotificationPress = (notification, isAvatarPress = false) => {
    // Mark the notification as read
    markAsRead(notification.id);

    if (isAvatarPress) {
      // Navigate to user profile when avatar is pressed
      navigation.navigate('UserProfileBridge', { 
        userId: notification.userId, 
        skipAuth: true 
      });
      return;
    }

    // Use the getNotificationData function to get complete data
    const { recipeData, userData } = getNotificationData(notification);

    // Navigate based on notification type
    switch (notification.type) {
      case 'saved_recipe':
        // Always navigate to RecipeDetail, even if recipe not found
        navigation.navigate('RecipeDetail', { 
          recipeId: notification.recipeId,
          recipe: recipeData || {
            id: notification.recipeId,
            name: notification.recipeName || 'Deleted Recipe',
            deleted: true
          },
          userId: userData?.id,
          userName: userData?.name || notification.userName,
          userAvatar: userData?.avatar || notification.userAvatar,
          skipAuth: true
        });
        break;
        
      case 'added_to_gear_wishlist':
        // Navigate to GearDetailScreen with proper parameters
        navigation.navigate('GearDetail', { 
          gearId: notification.gearId,
          gearName: notification.gearName,
          skipAuth: true
        });
        break;
        
      case 'followed':
        navigation.navigate('UserProfileBridge', { 
          userId: notification.userId,
          skipAuth: true
        });
        break;
        
      case 'remixed_recipe':
        // Always navigate, showing fallback recipe if needed
        navigation.navigate('RecipeDetail', { 
          recipeId: recipeData?.recipe?.id || notification.newRecipeId,
          recipe: recipeData?.recipe || {
            id: notification.newRecipeId,
            name: notification.newRecipeName || 'Deleted Recipe',
            deleted: true
          },
          basedOnRecipe: recipeData?.basedOnRecipe,
          userId: userData?.id || notification.userId,
          userName: userData?.name || notification.userName,
          userAvatar: userData?.avatar || notification.userAvatar,
          skipAuth: true
        });
        break;
        
      default:
        // Handle custom notification types with message field
        if (notification.message && notification.message.includes("recipe based on your")) {
          // Always navigate to recipe detail
          navigation.navigate('RecipeDetail', { 
            recipeId: recipeData?.recipe?.id || 'recipe-not-found',
            recipe: recipeData?.recipe || {
              id: 'recipe-not-found',
              name: `${notification.userName}'s Recipe`,
              deleted: true,
              userId: notification.userId,
              userName: notification.userName,
              userAvatar: notification.userAvatar
            },
            basedOnRecipe: recipeData?.basedOnRecipe,
            userId: userData?.id || notification.userId,
            userName: userData?.name || notification.userName,
            userAvatar: userData?.avatar || notification.userAvatar,
            skipAuth: true
          });
        } else if (notification.recipeId) {
          // Use mockRecipes directly without redundant require
          const mockRecipes = require('../data/mockRecipes.json').recipes;
          const recipe = mockRecipes.find(r => r.id === notification.recipeId);
          
          // Always navigate to recipe screen
          navigation.navigate('RecipeDetail', { 
            recipeId: notification.recipeId,
            recipe: recipe || {
              id: notification.recipeId,
              name: 'Deleted Recipe',
              deleted: true,
              userId: notification.userId,
              userName: notification.userName,
              userAvatar: notification.userAvatar
            },
            userId: notification.userId,
            userName: notification.userName,
            userAvatar: notification.userAvatar,
            skipAuth: true
          });
        } else if (notification.userId) {
          // Navigate to user profile as fallback
          navigation.navigate('UserProfileBridge', { 
            userId: notification.userId,
            skipAuth: true
          });
        }
        break;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading notifications...</Text>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-off-outline" size={64} color="#CCCCCC" />
        <Text style={styles.emptyText}>No Notifications</Text>
        <Text style={styles.emptySubtext}>
          You don't have any notifications yet.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <NotificationItem 
          notification={item} 
          onPress={handleNotificationPress} 
          isLast={index === notifications.length - 1}
        />
      )}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 0,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  unreadNotification: {
    backgroundColor: '#E6F2FF', // Light blue background for unread notifications
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    marginRight: 12,
    position: 'relative',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  notificationTypeIconContainer: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '400',
    marginBottom: 4,
  },
  secondaryText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999999',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    alignSelf: 'center',
    marginLeft: 8,
  },
});

export default NotificationsScreen; 