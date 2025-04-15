import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import UserProfileScreen from './UserProfileScreen';

export default function UserProfileBridge() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, userName, skipAuth } = route.params || {};

  useEffect(() => {
    // This component will automatically redirect to the UserProfileScreen
    // with the correct parameters
    navigation.replace('UserProfile', { userId, userName, skipAuth });
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