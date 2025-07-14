import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_PERMISSION_KEY = 'push_notifications_permission';
const PUSH_PERMISSION_ASKED_KEY = 'push_notifications_asked';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Check if push notifications are supported
export const isPushNotificationSupported = () => {
  return Device.isDevice && (Platform.OS === 'android' || Platform.OS === 'ios');
};

// Get current permission status
export const getPermissionStatus = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error getting notification permissions:', error);
    return 'undetermined';
  }
};

// Request permission for push notifications
export const requestPermission = async () => {
  try {
    if (!isPushNotificationSupported()) {
      console.log('Push notifications not supported on this device');
      return 'unsupported';
    }

    // Check current permission status
    const currentStatus = await getPermissionStatus();
    
    if (currentStatus === 'granted') {
      await AsyncStorage.setItem(PUSH_PERMISSION_KEY, 'granted');
      return 'granted';
    }

    // Request permission
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: false,
      },
    });

    // Store the permission status and that we've asked
    await AsyncStorage.setItem(PUSH_PERMISSION_KEY, status);
    await AsyncStorage.setItem(PUSH_PERMISSION_ASKED_KEY, 'true');

    return status;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return 'denied';
  }
};

// Check if we've already asked for permission
export const hasAskedForPermission = async () => {
  try {
    const asked = await AsyncStorage.getItem(PUSH_PERMISSION_ASKED_KEY);
    return asked === 'true';
  } catch (error) {
    console.error('Error checking if permission was asked:', error);
    return false;
  }
};

// Get stored permission preference
export const getStoredPermissionStatus = async () => {
  try {
    const stored = await AsyncStorage.getItem(PUSH_PERMISSION_KEY);
    return stored || 'undetermined';
  } catch (error) {
    console.error('Error getting stored permission:', error);
    return 'undetermined';
  }
};

// Check if we should show the permission card
export const shouldShowPermissionCard = async () => {
  try {
    const currentStatus = await getPermissionStatus();
    const hasAsked = await hasAskedForPermission();
    
    // Show card if:
    // 1. Device supports push notifications
    // 2. Permission is not granted
    // 3. We haven't asked before OR user denied but could still change in settings
    return (
      isPushNotificationSupported() && 
      currentStatus !== 'granted' && 
      (!hasAsked || currentStatus === 'denied')
    );
  } catch (error) {
    console.error('Error checking if should show permission card:', error);
    return false;
  }
};

// Get push token for the device
export const getPushToken = async () => {
  try {
    if (!isPushNotificationSupported()) {
      return null;
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
};

// Register for push notifications and get token
export const registerForPushNotifications = async () => {
  try {
    const status = await requestPermission();
    
    if (status === 'granted') {
      const token = await getPushToken();
      console.log('Push token:', token);
      return { status: 'granted', token };
    }
    
    return { status, token: null };
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return { status: 'error', token: null };
  }
}; 