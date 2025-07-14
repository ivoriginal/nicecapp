import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AppImage from './common/AppImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const InAppNotification = ({ notification, onPress, onDismiss, visible }) => {
  const { theme, isDarkMode } = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in from top
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      // Slide out to top
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    handleDismiss();
    onPress(notification);
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'follow':
        return <Ionicons name="person-add" size={12} color="#FFFFFF" />;
      case 'saved_recipe':
        return <Ionicons name="bookmark" size={12} color="#FFFFFF" />;
      case 'added_to_gear_wishlist':
        return <Ionicons name="cart" size={12} color="#FFFFFF" />;
      case 'remixed_recipe':
        return <Ionicons name="git-branch" size={12} color="#FFFFFF" />;
      default:
        return <Ionicons name="notifications" size={12} color="#FFFFFF" />;
    }
  };

  const getNotificationMessage = () => {
    if (notification.message) {
      return notification.message;
    }
    
    switch (notification.type) {
      case 'follow':
        return `${notification.userName} started following you`;
      case 'saved_recipe':
        return `${notification.userName} saved your recipe`;
      case 'added_to_gear_wishlist':
        return `${notification.userName} added gear to their wishlist`;
      case 'remixed_recipe':
        return `${notification.userName} remixed your recipe`;
      default:
        return 'New notification';
    }
  };

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.notification,
          {
            backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
            borderColor: theme.divider,
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.content}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <View style={styles.avatarContainer}>
            <AppImage
              source={notification.userAvatar}
              style={styles.avatar}
              placeholder="person"
            />
            <View style={styles.notificationTypeIconContainer}>
              {getNotificationIcon()}
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.message, { color: theme.primaryText }]} numberOfLines={2}>
              {getNotificationMessage()}
            </Text>
            <Text style={[styles.timeAgo, { color: theme.secondaryText }]}>
              Just now
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={theme.secondaryText} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  notificationTypeIconContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
    color: '#000000',
  },
  timeAgo: {
    fontSize: 12,
    color: '#666666',
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default InAppNotification; 