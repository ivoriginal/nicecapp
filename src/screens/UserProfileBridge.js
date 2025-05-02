import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import UserProfileScreen from './UserProfileScreen';

export default function UserProfileBridge() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, userName, skipAuth, isCurrentUser, isLocation, parentBusinessId } = route.params || {};

  console.log('UserProfileBridge params:', route.params);
  console.log('UserProfileBridge redirecting to profile for:', userId, userName);

  useEffect(() => {
    // Set options to ensure header is shown for this bridge screen
    navigation.setOptions({
      headerShown: true
    });

    // This component will automatically redirect to the UserProfileScreen
    // with the correct parameters
    if (userId) {
      console.log('Navigating to UserProfile with userId:', userId);
      
      // Handle special cases
      if (['business-toma', 'business-kima', 'business-cafelab'].includes(userId)) {
        console.log('Loading business/roaster profile for', userId);
      }
      
      // Log for location-specific profiles
      if (isLocation) {
        console.log('Loading location-specific profile:', userId, 'parent business:', parentBusinessId);
      }
      
      // Special logging for Vértigo to debug avatar issues
      if (userId === 'user2' || userId === 'business1') {
        console.log('Loading Vértigo y Calambre profile, avatar should be assets/businesses/vertigo-logo.jpg');
      }
      
      // Special logging for Carlos to debug avatar issues
      if (userId === 'user3') {
        console.log('Loading Carlos Hernández profile, avatar should be assets/users/carlos-hernandez.jpg');
      }
      
      // Replace the current screen with UserProfile, preserving navigation stack
      navigation.replace('UserProfile', { 
        userId, 
        userName,
        skipAuth,
        isCurrentUser,
        isLocation,
        parentBusinessId,
        ensureHeaderShown: true
      });
      
    } else {
      console.error('Missing userId in UserProfileBridge');
      navigation.goBack();
    }
  }, [navigation, userId, userName, skipAuth, isCurrentUser, isLocation, parentBusinessId]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#000000" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 