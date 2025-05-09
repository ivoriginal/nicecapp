import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import mockCafes from '../data/mockCafes.json';
import mockUsers from '../data/mockUsers.json';
import mockGear from '../data/mockGear.json';
import gearDetails from '../data/gearDetails';
import UserProfileScreen from './UserProfileScreen';

export default function UserProfileBridge() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, userName, skipAuth = false, isLocation = false, parentBusinessId = null } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function navigateToProfile() {
      try {
        // Handle location-specific cafes first (e.g., Toma Café 1)
        if (isLocation) {
          console.log(`Handling location: ${userId}, parentBusinessId: ${parentBusinessId}`);
          
          // Special handling for Toma Café locations
          if (userId && userId.includes('toma-cafe')) {
            let locationNumber = "1";
            if (userId === 'toma-cafe-1' || userName === 'Toma Café 1') locationNumber = "1";
            if (userId === 'toma-cafe-2' || userName === 'Toma Café 2') locationNumber = "2";
            if (userId === 'toma-cafe-3' || userName === 'Toma Café 3 / Proper Sound') locationNumber = "3";
            
            const locationCoverImage = `assets/businesses/toma-${locationNumber}-cover.jpg`;
            
            navigation.replace('UserProfileScreen', {
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
            return;
          }
          
          // General handling for other locations
          const parentCafe = mockCafes.businesses.find(b => b.id === parentBusinessId);
          const location = mockCafes.locations.find(loc => loc.id === userId || loc.name === userName)
                       || mockCafes.trendingCafes.find(loc => loc.id === userId || loc.name === userName);
          
          if (location) {
            navigation.replace('UserProfileScreen', {
              userId: location.id,
              userName: location.name,
              userAvatar: location.avatar || location.logo || (parentCafe ? parentCafe.avatar : null),
              coverImage: location.coverImage,
              isBusinessAccount: true,
              isLocation: true,
              parentBusinessId,
              parentBusinessName: parentCafe ? parentCafe.name : null,
              skipAuth
            });
            return;
          }
        }

        // Handle cafe businesses
        const foundCafe = handleCafeProfile();
        if (foundCafe) return;
        
        // Handle user profiles
        const foundUser = handleUserProfile();
        if (foundUser) return;

        // Fallback for unknown profiles
        handleUnknownProfile();
      } catch (error) {
        console.error("Error in UserProfileBridge:", error);
        setError(error.message);
        setLoading(false);
      }
    }
    
    function handleCafeProfile() {
      // Check businesses data in mockCafes
      const cafe = mockCafes.businesses.find(b => b.id === userId || b.name === userName);
      if (cafe) {
        console.log("Found cafe:", cafe.name);
        
        // Special cases for different cafes
        if (cafe.name === 'The Fix' || cafe.id === 'business-thefix') {
          navigation.replace('UserProfileScreen', {
            userId: cafe.id,
            userName: cafe.name,
            userAvatar: 'assets/businesses/thefix-logo.jpg',
            coverImage: 'assets/businesses/thefix-cover.jpg',
            isBusinessAccount: true,
            skipAuth
          });
          return true;
        }
        
        if (cafe.name === 'Vértigo y Calambre' || cafe.id === 'business-vertigo') {
          navigation.replace('UserProfileScreen', {
            userId: cafe.id,
            userName: cafe.name,
            userAvatar: 'assets/businesses/vertigo-logo.jpg',
            coverImage: cafe.coverImage || 'assets/businesses/vertigo-cover.jpg',
            isBusinessAccount: true,
            skipAuth
          });
          return true;
        }
        
        if (cafe.name === 'CaféLab' || cafe.id === 'business-cafelab') {
          navigation.replace('UserProfileScreen', {
            userId: cafe.id,
            userName: cafe.name,
            userAvatar: 'assets/businesses/cafelab-logo.jpg',
            coverImage: 'assets/businesses/cafelab-cover.jpg',
            isBusinessAccount: true,
            skipAuth
          });
          return true;
        }
        
        // Check in trendingCafes for missing cafe data
        if (!cafe.avatar && !cafe.logo) {
          const trendingCafe = mockCafes.trendingCafes.find(tc => tc.id === userId || tc.name === userName);
          if (trendingCafe && (trendingCafe.avatar || trendingCafe.logo || trendingCafe.coverImage)) {
            navigation.replace('UserProfileScreen', {
              userId: trendingCafe.id,
              userName: trendingCafe.name,
              userAvatar: trendingCafe.avatar || trendingCafe.logo,
              coverImage: trendingCafe.coverImage,
              isBusinessAccount: true,
              skipAuth
            });
            return true;
          }
        }
        
        // For all other cafes
        navigation.replace('UserProfileScreen', {
          userId: cafe.id,
          userName: cafe.name,
          userAvatar: cafe.avatar || cafe.logo,
          coverImage: cafe.coverImage,
          isBusinessAccount: true,
          skipAuth
        });
        return true;
      }
      
      // Check trending cafes
      const trendingCafe = mockCafes.trendingCafes.find(tc => tc.id === userId || tc.name === userName);
      if (trendingCafe) {
        console.log("Found trending cafe:", trendingCafe.name);
        navigation.replace('UserProfileScreen', {
          userId: trendingCafe.id,
          userName: trendingCafe.name,
          userAvatar: trendingCafe.avatar || trendingCafe.logo,
          coverImage: trendingCafe.coverImage,
          isBusinessAccount: true,
          skipAuth
        });
        return true;
      }
      
      return false;
    }
    
    function handleUserProfile() {
      const user = mockUsers.users.find(u => u.id === userId || u.userName === userName);
      if (user) {
        console.log("Found user:", user.userName);
        
        // Special handling for specific users
        if (user.userName === 'Carlos Hernández' || user.id === 'user3') {
          navigation.replace('UserProfileScreen', {
            userId: user.id,
            userName: user.userName,
            userAvatar: user.userAvatar || 'assets/users/carlos-hernandez.jpg',
            isBusinessAccount: false,
            skipAuth
          });
          return true;
        }
        
        // For all other users
        navigation.replace('UserProfileScreen', {
          userId: user.id,
          userName: user.userName,
          userAvatar: user.userAvatar,
          isBusinessAccount: !!user.isBusinessAccount,
          skipAuth
        });
        return true;
      }
      
      return false;
    }
    
    function handleUnknownProfile() {
      console.warn(`User/Cafe not found for ID: ${userId} or name: ${userName}`);
      navigation.replace('UserProfileScreen', {
        userId: userId || 'unknown',
        userName: userName || 'Unknown User',
        skipAuth
      });
    }

    navigateToProfile();
  }, [navigation, userId, userName, skipAuth, isLocation, parentBusinessId]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return null;  // Return null to avoid showing the intermediate loading screen
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