import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useCoffee } from '../context/CoffeeContext';
import mockCafes from '../data/mockCafes.json';
import mockUsers from '../data/mockUsers.json';
import mockGear from '../data/mockGear.json';
import gearDetails from '../data/gearDetails';
import UserProfileScreen from './UserProfileScreen';

export default function UserProfileBridge() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { currentAccount } = useCoffee();
  const { 
    userId, 
    userName, 
    skipAuth = false, 
    isLocation = false, 
    parentBusinessId = null,
    isBusinessAccount = false,
    isRoaster = false,
    location
  } = route.params || {};
  
  const [error, setError] = useState(null);
  const hasNavigatedRef = useRef(false);

  // Show a proper header with loading state
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Loading...',
      headerStyle: {
        backgroundColor: theme.background,
      },
      headerTintColor: theme.primaryText,
    });
  }, [navigation, theme]);

  useEffect(() => {
    // Reset navigation state
    hasNavigatedRef.current = false;
    
    // Don't proceed if no user info provided
    if (!userId && !userName) {
      console.error('UserProfileBridge: No userId or userName provided');
      navigation.goBack();
      return;
    }

    // Check if this is the current user - if so, navigate to their profile tab
    if (userId === currentAccount) {
      console.log('UserProfileBridge: Current user detected, navigating to Profile tab');
      hasNavigatedRef.current = true;
      // Navigate to the main tabs and then to the Profile tab
      navigation.navigate('MainTabs', { screen: 'Profile' });
      return;
    }

    // Process navigation immediately
    const navigateToProfile = () => {
      if (hasNavigatedRef.current) {
        return;
      }

      try {
        console.log('UserProfileBridge received params:', route.params);
        console.log('UserProfileBridge processing navigation for userId:', userId, 'userName:', userName);
        
        // Handle location-specific cafes first (e.g., Toma Café 1)
        if (isLocation && handleLocationProfile()) {
          return;
        }

        // Handle cafe businesses
        if (handleCafeProfile()) {
          return;
        }
        
        // Handle user profiles
        if (handleUserProfile()) {
          return;
        }

        // Fallback for unknown profiles
        handleUnknownProfile();
      } catch (error) {
        console.error("Error in UserProfileBridge:", error);
        setError(error.message);
      }
    };
    
    const handleLocationProfile = () => {
      console.log(`Handling location: ${userId}, parentBusinessId: ${parentBusinessId}`);
      
      // Special handling for Toma Café locations
      if (userId && userId.includes('toma-cafe')) {
        let locationNumber = "1";
        if (userId === 'toma-cafe-1' || userName === 'Toma Café 1') locationNumber = "1";
        if (userId === 'toma-cafe-2' || userName === 'Toma Café 2') locationNumber = "2";
        if (userId === 'toma-cafe-3' || userName === 'Toma Café 3 / Proper Sound') locationNumber = "3";
        
        const locationCoverImage = `assets/businesses/toma-${locationNumber}-cover.jpg`;
        
        console.log(`UserProfileBridge: Navigating to Toma Café ${locationNumber} with userId: ${userId}`);
        navigateToUserProfile({
          userId: userId || `toma-cafe-${locationNumber}`,
          userName: userName || `Toma Café ${locationNumber}`,
          userAvatar: 'assets/businesses/toma-logo.jpg',
          coverImage: locationCoverImage,
          isBusinessAccount: true,
          isLocation: true,
          parentBusinessId,
          parentBusinessName: 'Toma Café',
          skipAuth
        });
        return true;
      }
      
      // General handling for other locations
      const parentCafe = mockCafes.roasters.find(b => b.id === parentBusinessId);
      const locationData = mockCafes.cafes.find(loc => loc.id === userId || loc.name === userName);
      
      if (locationData) {
        console.log(`UserProfileBridge: Navigating to general location: ${locationData.name}`);
        navigateToUserProfile({
          userId: locationData.id,
          userName: locationData.name,
          userAvatar: locationData.avatar || locationData.logo || (parentCafe ? parentCafe.avatar : null),
          coverImage: locationData.coverImage,
          isBusinessAccount: true,
          isLocation: true,
          parentBusinessId,
          parentBusinessName: parentCafe ? parentCafe.name : null,
          skipAuth
        });
        return true;
      }
      
      return false;
    };
    
    const handleCafeProfile = () => {
      console.log('UserProfileBridge: Searching for café with userId:', userId, 'userName:', userName);
      
      // Special handling for Nomad Coffee Roasters (from Supabase)
      if (userId === '3cde3f00-8f96-46c8-85f8-9d95dff113d8' || 
          userId === 'nomad-coffee' || 
          userName === 'Nomad Coffee Roasters' || 
          userName === 'Nomad Coffee' || 
          userName === 'Nomad') {
        console.log("Found Nomad Coffee Roasters - handling as special case");
        navigateToUserProfile({
          userId: userId || '3cde3f00-8f96-46c8-85f8-9d95dff113d8',
          userName: userName || 'Nomad Coffee Roasters',
          userAvatar: route.params?.userAvatar || 'https://wzawsiaanhriocxrabft.supabase.co/storage/v1/object/public/businesses/nomad_avatar.jpeg',
          coverImage: route.params?.coverImage || null,
          isBusinessAccount: true,
          isRoaster: true,
          location: location || 'Barcelona',
          skipAuth
        });
        return true;
      }
      
      // First check roasters (for main business profiles)
      const roaster = mockCafes.roasters.find(r => r.id === userId || r.name === userName);
      if (roaster) {
        console.log("Found roaster:", roaster.name);
        navigateToUserProfile({
          userId: roaster.id,
          userName: roaster.name,
          userAvatar: roaster.avatar || roaster.logo,
          coverImage: roaster.coverImage,
          isBusinessAccount: true,
          isRoaster: true,
          location: location || roaster.location,
          skipAuth
        });
        return true;
      }
      
      // If it's marked as a roaster but not found in mock data, create a basic roaster profile
      if (isRoaster && userId && userName) {
        console.log("Creating basic roaster profile for:", userName);
        console.log("UserProfileBridge: roaster params received:", {
          userId,
          userName,
          userAvatar: route.params?.userAvatar,
          coverImage: route.params?.coverImage,
          location
        });
        navigateToUserProfile({
          userId: userId,
          userName: userName,
          userAvatar: route.params?.userAvatar || null,
          coverImage: route.params?.coverImage || null,
          isBusinessAccount: true,
          isRoaster: true,
          location: location,
          skipAuth
        });
        return true;
      }
      
      // Then check cafes (for specific café locations)
      const cafe = mockCafes.cafes.find(c => c.id === userId || c.name === userName);
      if (cafe) {
        console.log("Found cafe:", cafe.name);
        
        // Get roaster info if available
        const parentRoaster = cafe.roasterId ? mockCafes.roasters.find(r => r.id === cafe.roasterId) : null;
        
        // Special handling for Toma Café locations
        if (cafe.id && cafe.id.startsWith('toma-cafe')) {
          let locationNumber = "1";
          if (cafe.id === 'toma-cafe-1') locationNumber = "1";
          if (cafe.id === 'toma-cafe-2') locationNumber = "2";
          if (cafe.id === 'toma-cafe-3') locationNumber = "3";
          
          const locationCoverImage = `assets/businesses/toma-${locationNumber}-cover.jpg`;
          
          console.log(`UserProfileBridge: Found Toma Café ${locationNumber}, navigating with special handling`);
          navigateToUserProfile({
            userId: cafe.id,
            userName: cafe.name,
            userAvatar: 'assets/businesses/toma-logo.jpg',
            coverImage: locationCoverImage,
            isBusinessAccount: true,
            isLocation: true,
            parentBusinessId: 'business-toma',
            parentBusinessName: 'Toma Café',
            location: location || cafe.location,
            skipAuth
          });
          return true;
        }
        
        // Use image paths from mockCafes.json for other cafes
        console.log(`UserProfileBridge: Found regular cafe ${cafe.name}, navigating normally`);
        navigateToUserProfile({
          userId: cafe.id,
          userName: cafe.name,
          userAvatar: cafe.avatar,
          coverImage: cafe.coverImage,
          isBusinessAccount: true,
          isLocation: !!cafe.roasterId,
          parentBusinessId: cafe.roasterId,
          parentBusinessName: parentRoaster ? parentRoaster.name : null,
          location: location || cafe.location,
          skipAuth
        });
        return true;
      }
      
      console.log('UserProfileBridge: No café found with userId:', userId, 'userName:', userName);
      return false;
    };
    
    const handleUserProfile = () => {
      const user = mockUsers.users.find(u => u.id === userId || u.userName === userName);
      if (user) {
        console.log("Found user:", user.userName);
        
        // Special handling for specific users
        if (user.userName === 'Carlos Hernández' || user.id === 'user3') {
          navigateToUserProfile({
            userId: user.id,
            userName: user.userName,
            userAvatar: user.userAvatar || 'assets/users/carlos-hernandez.jpg',
            isBusinessAccount: false,
            skipAuth
          });
          return true;
        }
        
        // For all other users
        navigateToUserProfile({
          userId: user.id,
          userName: user.userName,
          userAvatar: user.userAvatar,
          isBusinessAccount: !!user.isBusinessAccount || isBusinessAccount,
          isRoaster: isRoaster,
          location: location || user.location,
          skipAuth
        });
        return true;
      }
      
      return false;
    };
    
    const handleUnknownProfile = () => {
      console.warn(`User/Cafe not found for ID: ${userId} or name: ${userName}`);
      console.log('Available users in mockUsers:', mockUsers.users.map(u => ({ id: u.id, userName: u.userName })));
      
      // Try to create a basic profile with the provided info
      if (userId && userName) {
        console.log('Creating basic profile for unknown user/business');
        navigateToUserProfile({
          userId: userId,
          userName: userName,
          userAvatar: route.params?.userAvatar || null,
          coverImage: route.params?.coverImage || null,
          isBusinessAccount: isBusinessAccount,
          isRoaster: isRoaster,
          location: location,
          skipAuth: true
        });
        return;
      }
      
      // Navigate back as last resort
      navigation.goBack();
      return;
    };

    const navigateToUserProfile = (params) => {
      if (hasNavigatedRef.current) {
        console.log('Navigation already attempted, skipping...');
        return;
      }
      
      hasNavigatedRef.current = true;
      console.log('UserProfileBridge: Navigating with params:', params);
      
      // Use replace to remove the bridge from the navigation stack
      navigation.replace('UserProfileScreen', params);
    };

    // Execute navigation immediately
    navigateToProfile();
  }, [navigation, userId, userName, currentAccount]);

  // Show loading state while processing
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.primaryText }]}>
          Error: {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primaryText} />
      <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
        Loading profile...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    padding: 20,
  },
}); 