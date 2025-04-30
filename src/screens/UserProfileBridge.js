import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import UserProfileScreen from './UserProfileScreen';

export default function UserProfileBridge() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, userName, skipAuth } = route.params || {};

  console.log('UserProfileBridge params:', route.params);

  useEffect(() => {
    // This component will automatically redirect to the UserProfileScreen
    // with the correct parameters
    if (userId) {
      console.log('Navigating to UserProfile with userId:', userId);
      
      // Special logging for Carlos to debug avatar issues
      if (userId === 'user3') {
        console.log('Loading Carlos Hernández profile, avatar should be assets/users/carlos-hernandez.jpg');
      }
      
      navigation.replace('UserProfile', { 
        userId, 
        userName,
        skipAuth
      });
    } else {
      console.error('Missing userId in UserProfileBridge');
      navigation.goBack();
    }
  }, [navigation, userId, userName, skipAuth]);

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