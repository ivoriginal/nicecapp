import React, { useEffect } from 'react';

const UserProfileBridge = ({ route, navigation }) => {
  // Get userId, userName, and other params from route
  const { userId, userName, skipAuth = false, isLocation = false, parentBusinessId = null } = route.params || {};

  // For debug purposes, log the parameters
  console.log('UserProfileBridge received params:', { userId, userName, skipAuth, isLocation, parentBusinessId });

  useEffect(() => {
    // SPECIAL CASE FOR THE FIX AND CAFELAB
    if (userId === 'café-fixcoffeemadrid' || userId === 'cafe-fixcoffeemadrid') {
      console.log('Special case: navigating to The Fix profile');
      navigation.replace('UserProfile', {
        userId: 'business-fixcoffeemadrid',
        userName: 'The Fix',
        skipAuth: true
      });
      return;
    }
    
    // SPECIAL CASE FOR CARLOS
    if (userId === 'user-carlos') {
      console.log('Special case: navigating to Carlos Rodriguez profile');
      navigation.replace('UserProfile', {
        userId: 'user-carlos',
        userName: 'Carlos Rodriguez',
        skipAuth: true
      });
      return;
    }
    
    // SPECIAL CASE FOR VÉRTIGO
    if (userId === 'user-vertigoycalambre' || userId.includes('vertigo')) {
      console.log('Special case: navigating to Vértigo y Calambre profile');
      
      // Handle café-vertigo-calambre as a café, not a user
      if (userId === 'cafe-vertigo-calambre' || userId.includes('cafe-vertigo')) {
        navigation.replace('UserProfile', {
          userId: 'vertigo-calambre',
          userName: 'Vértigo y Calambre',
          skipAuth: true,
          isBusinessAccount: true
        });
      } else {
        // For direct user identifier, use user2 (backwards compatibility)
        navigation.replace('UserProfile', {
          userId: 'user-vertigoycalambre',
          userName: 'Vértigo y Calambre',
          skipAuth: true
        });
      }
      return;
    }
    
    // SPECIAL CASE FOR CAFELAB CARTAGENA AND MURCIA
    const isCafeLabLocation = 
      (userId === 'cafe-cafelab-cartagena' || userId.includes('cafelab') && userId.includes('cartagena')) ||
      (userId === 'cafe-cafelab-murcia' || userId.includes('cafelab') && userId.includes('murcia'));
    
    if (isCafeLabLocation) {
      // Determine which CaféLab location
      let locationId, locationName;
      
      if (userId.includes('cartagena') || userName?.includes('Cartagena')) {
        console.log('Special case: navigating to CaféLab Cartagena profile');
        locationId = 'cafelab-cartagena';
        locationName = 'CaféLab Cartagena';
      } else if (userId.includes('murcia') || userName?.includes('Murcia')) {
        console.log('Special case: navigating to CaféLab Murcia profile');
        locationId = 'cafelab-murcia';
        locationName = 'CaféLab Murcia';
      }
      
      if (locationId) {
        // Bypass the UserProfileBridge and go directly to UserProfile
        // This ensures the right info is displayed instead of an empty profile
        navigation.replace('UserProfile', {
          userId: locationId,
          userName: locationName,
          skipAuth: true,
          isLocation: true,
          parentBusinessId: 'business-cafelab'
        });
        return;
      }
    }
    
    // SPECIAL CASE FOR TOMA CAFÉ
    // Handle main Toma Café roaster profile
    if (userId === 'business-business-toma' || userId === 'business-toma' || 
        (userName && userName === 'Toma Café' && !isLocation)) {
      console.log('Special case: navigating to Toma Café main profile');
      navigation.replace('UserProfile', {
        userId: 'business-toma',
        userName: 'Toma Café',
        skipAuth: true
      });
      return;
    }
    
    // Handle Toma Café location profiles
    const isTomaCafeLocation = 
      userId?.includes('toma-cafe-') || userId?.includes('tomacafe') || 
      (userName && userName.includes('Toma Café') && userName !== 'Toma Café');
    
    if (isTomaCafeLocation) {
      // Extract location identifier (like "1", "2", "3" or the full name)
      let locationId, locationName;
      
      // Parse from userId if available, otherwise from userName
      if (userId) {
        if (userId.includes('toma-cafe-1') || userId.includes('tomacafe1')) {
          locationId = 'toma-cafe-1';
          locationName = 'Toma Café 1';
        } else if (userId.includes('toma-cafe-2') || userId.includes('tomacafe2')) {
          locationId = 'toma-cafe-2';
          locationName = 'Toma Café 2';
        } else if (userId.includes('toma-cafe-3') || userId.includes('tomacafe3')) {
          locationId = 'toma-cafe-3';
          locationName = 'Toma Café 3';
        } else {
          // Default to location 1 if we can't determine
          locationId = 'toma-cafe-1';
          locationName = userName || 'Toma Café 1';
        }
      } else if (userName) {
        // Try to extract from userName like "Toma Café 1"
        if (userName.includes('1')) {
          locationId = 'toma-cafe-1';
          locationName = 'Toma Café 1';
        } else if (userName.includes('2')) {
          locationId = 'toma-cafe-2';
          locationName = 'Toma Café 2';
        } else if (userName.includes('3')) {
          locationId = 'toma-cafe-3';
          locationName = 'Toma Café 3';
        } else {
          // Default to location 1
          locationId = 'toma-cafe-1';
          locationName = userName;
        }
      }
      
      console.log(`Special case: navigating to Toma Café location: ${locationName}`);
      navigation.replace('UserProfile', {
        userId: locationId,
        userName: locationName,
        skipAuth: true,
        isLocation: true,
        parentBusinessId: 'business-toma'
      });
      return;
    }
    
    // Special case for Coffee IDs - redirect to CoffeeDetail
    if (userId && (userId.startsWith('coffee-') || userId.startsWith('coffee') || route.params?.coffeeId)) {
      const coffeeId = route.params?.coffeeId || userId.replace('coffee-', '');
      console.log(`Coffee ID detected: ${coffeeId}, redirecting to CoffeeDetail`);
      navigation.replace('CoffeeDetail', { 
        coffeeId: coffeeId
      });
      return;
    }

    // Default case - just navigate to the profile with provided params
    navigation.replace('UserProfile', {
      userId,
      userName,
      skipAuth,
      isLocation,
      parentBusinessId
    });
  }, [userId, userName, skipAuth, navigation, isLocation, parentBusinessId, route.params]);

  // Don't render a loading screen, simply return null
  return null;
};

export default UserProfileBridge; 