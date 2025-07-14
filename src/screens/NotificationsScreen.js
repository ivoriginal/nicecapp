import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationsContext';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import NotificationPermissionCard from '../components/NotificationPermissionCard';
import { shouldShowPermissionCard, registerForPushNotifications } from '../utils/pushNotifications';

const NotificationItem = ({ notification, onPress, isLast, theme }) => {
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
      case 'rate_recipe_reminder':
        return <Ionicons name="star-outline" size={12} color="#FFFFFF" />;
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
      case 'rate_recipe_reminder':
        return `Recipe: ${notification.recipeName}`;
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
        { 
          backgroundColor: notification.read ? theme.background : theme.cardBackground, 
          borderBottomColor: theme.divider 
        },
        !notification.read && [styles.unreadNotification, { backgroundColor: theme.secondaryBackground || (theme.isDarkMode ? '#1C1C1E' : '#F2F2F7') }],
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
        <Text style={[styles.notificationMessage, { color: theme.primaryText }]}>
          {getNotificationMessage()}
        </Text>
        {secondaryText && <Text style={[styles.secondaryText, { color: theme.secondaryText }]}>{secondaryText}</Text>}
        <Text style={[styles.notificationTime, { color: theme.secondaryText }]}>{formatDate(notification.date)}</Text>
      </View>
      {!notification.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );
};

const NotificationsScreen = ({ navigation }) => {
  const { notifications, markAsRead, markAllAsRead, getNotificationData } = useNotifications();
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [screenFocused, setScreenFocused] = useState(false);
  const [showPermissionCard, setShowPermissionCard] = useState(false);

  // Ensure header configuration is maintained
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'Notifications',
      headerBackTitle: 'Back',
      headerStyle: {
        backgroundColor: theme.background,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: theme.divider,
      },
      headerTintColor: theme.primaryText,
    });
  }, [navigation, theme]);

  // Mark notifications as read when navigating away and restore header when focusing
  useFocusEffect(
    React.useCallback(() => {
      // When screen comes into focus
      setScreenFocused(true);
      
      // Force header to be shown and reset any conflicting options
      navigation.setOptions({
        headerShown: true,
        title: 'Notifications',
        headerBackTitle: 'Back',
        headerStyle: {
          backgroundColor: theme.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.divider,
        },
        headerTintColor: theme.primaryText,
      });
      
      return () => {
        // When screen loses focus (navigating away)
        setScreenFocused(false);
        
        // Mark all notifications as read when navigating away
        markAllAsRead();
      };
    }, [navigation, theme, markAllAsRead])
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

  // Check if we should show permission card
  useEffect(() => {
    const checkPermissionCard = async () => {
      const shouldShow = await shouldShowPermissionCard();
      setShowPermissionCard(shouldShow);
    };

    checkPermissionCard();
  }, []);

  const handleEnableNotifications = async () => {
    try {
      const result = await registerForPushNotifications();
      
      if (result.status === 'granted') {
        setShowPermissionCard(false);
        Alert.alert(
          'Notifications Enabled',
          'You\'ll now receive push notifications when people interact with your content.',
          [{ text: 'OK' }]
        );
      } else if (result.status === 'denied') {
        Alert.alert(
          'Notifications Denied',
          'You can enable notifications later in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      Alert.alert(
        'Error',
        'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDismissPermissionCard = () => {
    setShowPermissionCard(false);
  };

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
        
      case 'rate_recipe_reminder':
        // Navigate to recipe detail screen with rating prompt
        const recipe = recipeData || require('../data/mockRecipes.json').recipes.find(r => r.id === notification.recipeId);
        navigation.navigate('RecipeDetail', { 
          recipeId: notification.recipeId,
          recipe: recipe || {
            id: notification.recipeId,
            name: notification.recipeName || 'Recipe',
            deleted: !recipe
          },
          coffeeName: notification.coffeeName,
          showRatingPrompt: true, // Signal to show rating modal
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={48} color={theme.secondaryText} />
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No notifications yet</Text>
          <Text style={[styles.emptySubtext, { color: theme.secondaryText }]}>You'll see notifications here when people interact with your content</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item, index }) => (
            <NotificationItem 
              notification={item} 
              onPress={handleNotificationPress} 
              isLast={index === notifications.length - 1}
              theme={theme}
            />
          )}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.notificationsList, notifications.length === 0 && styles.emptyList]}
          ListHeaderComponent={
            showPermissionCard ? (
              <NotificationPermissionCard
                onPress={handleEnableNotifications}
                onDismiss={handleDismissPermissionCard}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={48} color={theme.secondaryText} />
              <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No notifications yet</Text>
              <Text style={[styles.emptySubtext, { color: theme.secondaryText }]}>You'll see notifications here when people interact with your content</Text>
            </View>
          }
        />
      )}
    </View>
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
    backgroundColor: '#F2F2F7', // Light gray background for unread notifications
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
  container: {
    flex: 1,
  },
  notificationsList: {
    paddingVertical: 0,
  },
  emptyList: {
    paddingVertical: 0,
  },
});

export default NotificationsScreen; 