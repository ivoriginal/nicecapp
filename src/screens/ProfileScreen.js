import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  StatusBar,
  Modal,
  Platform,
  ActionSheetIOS,
  Alert,
  ToastAndroid,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import ThemeCoffeeLogCard from '../components/ThemeCoffeeLogCard';
import eventEmitter from '../utils/EventEmitter';
import mockGear from '../data/mockGear.json';
import mockUsers from '../data/mockUsers.json';
import mockRecipes from '../data/mockRecipes.json';
import mockCoffeesData from '../data/mockCoffees.json';
import gearDetails from '../data/gearDetails';
import { businessCoffees } from '../data/businessProducts';
import AppImage from '../components/common/AppImage';
import RecipeCard from '../components/RecipeCard';
import { useTheme } from '../context/ThemeContext';
import { mockFollowersData } from '../data/mockFollowers';

// Loading and error components with safe default insets
const LoadingView = ({ insets }) => {
  // Ensure insets is properly initialized
  const safeInsets = insets || { top: 0, bottom: 0, left: 0, right: 0 };
  return (
    <View style={[styles.container, styles.centerContent, { paddingTop: safeInsets.top }]}>
      <ActivityIndicator size="large" color="#000000" />
      <Text style={styles.loadingText}>Loading profile...</Text>
    </View>
  );
};

const ErrorView = ({ error, insets, onRetry }) => {
  // Ensure insets is properly initialized
  const safeInsets = insets || { top: 0, bottom: 0, left: 0, right: 0 };
  return (
    <View style={[styles.container, styles.centerContent, { paddingTop: safeInsets.top }]}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

// Custom Toast component for iOS
const Toast = ({ visible, message, duration = 2000 }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.delay(duration - 600),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible, opacity, duration]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

export default function ProfileScreen() {
  const { 
    currentAccount: contextCurrentAccount, 
    accounts, 
    switchAccount, 
    loading, 
    error: contextError, 
    user, 
    coffeeEvents, 
    coffeeCollection, 
    coffeeWishlist,
    favorites,
    recipes, 
    loadData,
    removeFromCollection,
    removeFromWishlist,
    removeCoffeeEvent
  } = useCoffee();
  
  // Add theme context at the component level
  const { theme, isDarkMode, toggleTheme } = useTheme();
  
  // Track current account locally with persistence in state
  const [localCurrentAccount, setLocalCurrentAccount] = useState(() => {
    // Check if we have a saved account in AsyncStorage or similar
    // For now, use the context account or default to user1
    return contextCurrentAccount || 'user1';
  });
  
  // Use local account always to make the selection stick
  const currentAccount = localCurrentAccount;

  const safeAreaInsets = useSafeAreaInsets();
  const insets = safeAreaInsets ? {
    top: safeAreaInsets.top || 0,
    bottom: safeAreaInsets.bottom || 0,
    left: safeAreaInsets.left || 0,
    right: safeAreaInsets.right || 0
  } : { top: 0, bottom: 0, left: 0, right: 0 };
  const [refreshing, setRefreshing] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('coffee');
  const [recipeFilter, setRecipeFilter] = useState('all'); // 'all', 'created', 'saved'
  const [enableRefreshControl, setEnableRefreshControl] = useState(false);
  const [loadCount, setLoadCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const scrollViewRef = useRef(null);
  const [shopFilter, setShopFilter] = useState('coffee'); // 'coffee' or 'gear'

  // Default user data for when we don't have loaded data yet
  const defaultUsers = {
    'user1': {
      id: 'user1',
      userName: 'Ivo Vilches',
      userHandle: 'ivoriginal',
      userAvatar: require('../../assets/users/ivo-vilches.jpg'),
      email: 'ivo.vilches@example.com',
      location: 'Murcia, Spain',
      isBusinessAccount: false,
      gear: ["AeroPress", "Chemex", "Hario V60", "Hario Ceramic Slim", "Hario Range Server"],
      gearWishlist: ["9Barista Espresso Machine Mk.1", "Fellow Stagg EKG"]
    },
    'user2': {
      id: 'user2',
      userName: 'Vértigo y Calambre',
      userHandle: 'vertigoycalambre',
      userAvatar: require('../../assets/businesses/vertigo-logo.jpg'),
      email: 'contacto@vertigoycalambre.com',
      location: 'Murcia, Spain',
      isBusinessAccount: true,
      gear: ["La Marzocco Linea Mini", "Mahlkönig E65S GbW", "Acaia Lunar Scale"],
      gearWishlist: ["La Marzocco GS3", "Victoria Arduino Eagle One", "Loring S15 Falcon"]
    },
    'user3': {
      id: 'user3',
      userName: 'Carlos Hernández',
      userHandle: 'CodingCarlos',
      userAvatar: require('../../assets/users/carlos-hernandez.jpg'),
      email: 'carlos.hernandez@example.com',
      location: 'Madrid, Spain',
      isBusinessAccount: false,
      gear: ["AeroPress", "Comandante C40", "Fellow Stagg EKG"]
    },
    'user5': {
      id: 'user5',
      userName: 'Emma Garcia',
      userHandle: 'emmathebarista',
      userAvatar: 'https://randomuser.me/api/portraits/women/33.jpg',
      email: 'emma.garcia@example.com',
      location: 'Austin, TX',
      isBusinessAccount: false,
      gear: ["Rancilio Silvia", "Eureka Mignon", "Acaia Pearl Scale"],
      gearWishlist: ["Mahlkönig EK43", "Synesso S200", "Saint Anthony Industries Phoenix"]
    }
  };
  
  // Use account-specific defaults when user data isn't available
  const defaultUser = defaultUsers[currentAccount] || defaultUsers['user1'];

  // Selected account data - prefer user data from context, fall back to defaults
  const [currentUserData, setCurrentUserData] = useState(defaultUser);
  const userData = user ? 
    // If we have user data from context, use it, but ensure gear data is present
    {...currentUserData, ...user, 
      gear: user.gear || currentUserData.gear || [],
      gearWishlist: user.gearWishlist || currentUserData.gearWishlist || []
    } : 
    // Otherwise fall back to our local state
    currentUserData;
    
  // Make sure we have access to accounts data
  const accountsData = accounts && accounts.length > 0 ? accounts : [
    { id: 'user1', userName: 'Ivo Vilches', userAvatar: require('../../assets/users/ivo-vilches.jpg'), email: 'ivo.vilches@example.com' },
    { id: 'user2', userName: 'Vértigo y Calambre', userAvatar: require('../../assets/businesses/vertigo-logo.jpg'), email: 'contacto@vertigoycalambre.com' },
    { id: 'user3', userName: 'Carlos Hernández', userAvatar: require('../../assets/users/carlos-hernandez.jpg'), email: 'carlos.hernandez@example.com' }
  ];
  
  const displayName = userData?.userName || userData?.name || 'Guest';
  const userHandle = userData?.userHandle || displayName.toLowerCase().replace(/\s+/g, '_');
  const avatarUrl = userData?.userAvatar || userData?.avatar || require('../../assets/users/ivo-vilches.jpg');
  const location = userData?.location || defaultUser?.location || 'Unknown location';
  const isBusinessAccount = userData?.isBusinessAccount || false;
  const userGear = userData?.gear || defaultUser?.gear || [];
  console.log('USER GEAR:', userGear);
  console.log('CURRENT USER DATA:', userData);
  console.log('DEFAULT USER:', defaultUser);

  // Initialize on mount
  useEffect(() => {
    console.log('ProfileScreen - Initial mount, setting default states');
    
    // Set initial load flag
    setIsInitialLoad(true);
    
    // Just set default data immediately without triggering refresh
    const defaultAccountData = defaultUsers[currentAccount] || defaultUsers['user1'];
    setCurrentUserData(defaultAccountData);
    
    // Enable refresh control immediately but don't auto-refresh
    setTimeout(() => {
      console.log('ProfileScreen - Enabling refresh control without auto-refresh');
      setEnableRefreshControl(true);
      setIsInitialLoad(false);
      setLastUpdate(Date.now());
    }, 100); // Reduced from 1000ms to 100ms for faster interaction
  }, []);
  
  // Helper function to initialize with a specific account
  const initializeWithAccount = async (accountId) => {
    try {
      console.log(`ProfileScreen - Initializing with account: ${accountId}`);
      
      // If we're already loading, don't reload
      if (loading) {
        console.log('ProfileScreen - Already loading, skipping initialization');
        return;
      }
      
      // Don't reset scroll position automatically - let user maintain their position
      
      // Make sure we have default data immediately
      const defaultAccountData = defaultUsers[accountId] || defaultUsers['user1'];
      setCurrentUserData(defaultAccountData);
      
      // Use loadData function from context - only if it's not the initial load
      // Initial loading will be handled by the CoffeeContext itself
      if (loadData && !isInitialLoad) {
        await loadData(accountId);
        console.log(`ProfileScreen - Data loaded for account: ${accountId}`);
        
        // Update last update timestamp
        setLastUpdate(Date.now());
      } else if (!loadData) {
        console.error('loadData is undefined');
        setLocalError('Failed to initialize: context function not available');
      } else {
        console.log('ProfileScreen - Skipping loadData on initial load, relying on CoffeeContext');
      }
    } catch (error) {
      console.error(`Error initializing with account ${accountId}:`, error);
      setLocalError(error.message || 'Failed to load profile data');
    }
  };

  const handleRefresh = async () => {
    try {
      console.log('ProfileScreen - handleRefresh - refreshing data for account:', currentAccount);
      
      // Only set refreshing state if we're not already refreshing
      if (!refreshing) {
        setRefreshing(true);
      }
      
      setLocalError(null);
      
      // Use loadData function from context
      if (loadData) {
        await loadData(currentAccount);
        console.log('ProfileScreen - handleRefresh - data refreshed successfully');
        
        // Update the last update timestamp after a successful refresh
        setLastUpdate(Date.now());
      } else {
        console.error('loadData is undefined');
        throw new Error('Context function not available');
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      setLocalError(error.message || 'Failed to refresh profile');
    } finally {
      setRefreshing(false);
    }
  };

  // We have an error from either context or local state
  const combinedError = contextError || localError;

  // Show loading view when loading and not refreshing
  if (loading && !refreshing && !userData) {
    return <LoadingView insets={insets} />;
  }

  // Show error view when there's an error and not refreshing
  if (combinedError && !refreshing && !userData) {
    return <ErrorView error={combinedError} insets={insets} onRetry={() => initializeWithAccount(currentAccount)} />;
  }

  // Navigation
  const navigation = useNavigation();

  // Helper function to get the business gear for Vértigo y Calambre
  const getBusinessGear = (userId, userName) => {
    if (userId === 'user2' || userName === 'Vértigo y Calambre') {
      return ['gear6', 'gear4', 'gear9', 'gear1', 'gear5', 'gear7', 'gear12', 'gear13'];
    }
    return [];
  };

  // Helper function to get business coffees
  const getBusinessCoffees = (userId, userName) => {
    // Check if this is a business user
    if (userId === 'user2' || userName === 'Vértigo y Calambre') {
      return businessCoffees["user2"] || [];
    } else if (userId === 'business-kima') {
      return businessCoffees["business-kima"] || [];
    } else if (userId === 'business-toma') {
      return businessCoffees["business-toma"] || [];
    }
    return [];
  };

  // Load data on mount and when current account changes - but be less aggressive to prevent unwanted scrolling
  useEffect(() => {
    console.log('Current user updated:', user);
    console.log('Display name:', displayName);
    console.log('Avatar URL:', avatarUrl);
    console.log('Current account:', currentAccount);
    console.log('Coffee Events count:', coffeeEvents?.length);
    console.log('Coffee Collection count:', coffeeCollection?.length);
    console.log('Coffee Wishlist count:', coffeeWishlist?.length);

    // Only reload if user is truly missing AND we're not already loading AND this isn't just a normal state update
    // This prevents unnecessary refreshes that cause the "moving down" behavior
    if (!user && !loading && !contextError && !userData) {
      console.log('User data truly missing, reloading...');
      initializeWithAccount(currentAccount);
    }
  }, [currentAccount]); // Removed user, loading, contextError dependencies to prevent frequent triggers

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Show toast notification based on platform
  const showToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // Use custom Toast component for iOS
      setToastMessage(message);
      setToastVisible(true);
      
      // Hide the toast after 2 seconds
      setTimeout(() => {
        setToastVisible(false);
      }, 2000);
    }
  };
  
  // Handle account switching from other components
  useFocusEffect(
    useCallback(() => {
      // If we're returning to this screen, see if the account changed
      console.log('ProfileScreen focused, current account:', currentAccount);
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdate;
      
      // Check if we have updated user data from EditProfileScreen
      const route = navigation.getState().routes.find(route => route.name === 'Profile');
      const hasUpdatedUserData = route?.params?.updatedUserData;
      
      if (hasUpdatedUserData) {
        const updatedUserData = route.params.updatedUserData;
        console.log('Received updated user data:', updatedUserData);
        
        // Check if there are actual changes before showing the toast
        const hasChanges = 
          user?.userName !== updatedUserData.userName ||
          user?.location !== updatedUserData.location ||
          user?.userAvatar !== updatedUserData.userAvatar ||
          !arraysEqual(user?.gear || [], updatedUserData.gear || []);
        
        // Helper to compare arrays
        function arraysEqual(a, b) {
          if (a.length !== b.length) return false;
          const sortedA = [...a].sort();
          const sortedB = [...b].sort();
          return sortedA.every((item, index) => item === sortedB[index]);
        }
        
        // Only show toast if there were actual changes
        if (hasChanges) {
          showToast('Profile updated');
        }
        
        // Update the CoffeeContext user data
        if (accounts && accounts.length > 0) {
          const updatedAccounts = [...accounts];
          const accountIndex = updatedAccounts.findIndex(acc => acc.id === currentAccount);
          
          if (accountIndex !== -1) {
            // Log the location to verify it's being passed correctly
            console.log('Updating profile with location:', updatedUserData.location);
            
            // Update the account data
            updatedAccounts[accountIndex] = {
              ...updatedAccounts[accountIndex],
              userName: updatedUserData.userName,
              location: updatedUserData.location,
              userAvatar: updatedUserData.userAvatar,
              userHandle: updatedUserData.userHandle || updatedAccounts[accountIndex].userHandle,
              gear: updatedUserData.gear
            };
            
            // Set current user data for immediate UI update
            setCurrentUserData({
              ...currentUserData,
              userName: updatedUserData.userName,
              location: updatedUserData.location,
              userAvatar: updatedUserData.userAvatar,
              userHandle: updatedUserData.userHandle || currentUserData.userHandle,
              gear: updatedUserData.gear
            });
            
            // Don't force refresh data to avoid unwanted scrolling - the UI update above is sufficient
            console.log('User data updated in UI - not forcing refresh to prevent scroll movement');
            
            // Clear the updatedUserData param to avoid re-processing
            navigation.setParams({ updatedUserData: null });
            
            // Update the lastUpdate timestamp to prevent immediate refresh
            setLastUpdate(now);
          }
        }
      } else {
        // Only refresh data if:
        // 1. It's the first load of the app (isInitialLoad = true) - but we'll let the initial useEffect handle this
        // 2. We haven't refreshed in a very long time (> 5 minutes = 300000ms)
        // 3. User has explicitly pulled down to refresh (this is handled separately by the ScrollView's refreshControl)
        // Removed automatic refresh on focus to prevent the annoying "moving down" behavior
        if (currentAccount && !refreshing && !loading && isInitialLoad && timeSinceLastUpdate > 300000) {
          console.log(`Refreshing profile data only on very long intervals. Initial load: ${isInitialLoad}, Time since last update: ${timeSinceLastUpdate}ms`);
          // Don't auto-refresh on normal focus events - let user pull to refresh if they want fresh data
          setIsInitialLoad(false);
          setLastUpdate(now);
        } else {
          // Just mark as no longer initial load without refreshing
          if (isInitialLoad) {
            setIsInitialLoad(false);
            setLastUpdate(now);
          }
        }
      }

      return () => {
        // Cleanup when screen loses focus
      };
    }, [currentAccount, navigation, lastUpdate, isInitialLoad])
  );

  // Add the long press handler to the profile tab
  useEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerLeft: () => (
        <TouchableOpacity 
          style={[styles.usernameContainer, { marginLeft: 16 }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={[styles.usernameText, { color: theme.primaryText }]}>@{userHandle}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.primaryText} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={[styles.headerRightContainer, { marginRight: 16 }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              navigation.navigate('Saved');
            }}
          >
            <Ionicons name="bookmarks-outline" size={24} color={theme.primaryText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleOptionsPress}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={theme.primaryText} />
          </TouchableOpacity>
        </View>
      )
    });
  }, [navigation, userHandle, handleOptionsPress, theme, theme.primaryText]);

  // Listen for tab long press events
  useEffect(() => {
    const handleLongPress = () => {
      setModalVisible(true);
    };
    
    eventEmitter.addListener('profileTabLongPress', handleLongPress);
    
    return () => {
      eventEmitter.removeListener('profileTabLongPress', handleLongPress);
    };
  }, []);

  // Handle account switching
  const handleSwitchAccount = (accountId) => {
    try {
      console.log('==== ACCOUNT SWITCH DEBUGGING ====');
      console.log(`Attempting to switch from ${currentAccount} to ${accountId}`);
      
      // Close modal first
      setModalVisible(false);

      // Check if we're trying to switch to the same account
      if (currentAccount === accountId) {
        console.log('Already on this account, no switch needed');
        return;
      }

      // Show loading state and prevent any other actions
      setRefreshing(true);
      
      // First update the local account ID to maintain state
      setLocalCurrentAccount(accountId);
      
      // Immediately set default user data for smoother transition
      const defaultAccountData = defaultUsers[accountId];
      if (defaultAccountData) {
        console.log('Setting default account data:', defaultAccountData);
        setCurrentUserData(defaultAccountData);
      }

      // Use the switchAccount function from CoffeeContext, but handle the case where it might not be a promise
      if (switchAccount) {
        try {
          const result = switchAccount(accountId);
          
          // Handle both Promise and non-Promise returns
          if (result && typeof result.then === 'function') {
            result
              .then(() => {
                console.log('Account switched successfully');
                
                // After loading, ensure we still have the gear data
                if (!user || !user.gear) {
                  console.log('Gear data missing from loaded user, using default gear');
                  const updatedUserData = {
                    ...user || {},
                    ...defaultAccountData,
                    gear: defaultAccountData?.gear || []
                  };
                  setCurrentUserData(updatedUserData);
                }
              })
              .catch(error => {
                console.error('Error switching account:', error);
                setLocalError(error.message || 'Failed to switch account');
              })
              .finally(() => {
                setRefreshing(false);
              });
          } else {
            // Handle synchronous switchAccount (non-Promise)
            console.log('Account switch completed synchronously');
            
            // Force refresh data to update UI
            setTimeout(() => {
              loadData(accountId);
              setRefreshing(false);
            }, 500);
          }
        } catch (switchError) {
          console.error('Error during switchAccount execution:', switchError);
          setLocalError(switchError.message || 'Failed to switch account');
          setRefreshing(false);
        }
      } else {
        console.error('switchAccount function not available');
        setLocalError('Switch account functionality not available');
        setRefreshing(false);
        
        // Try fallback to loadData directly if switchAccount is not available
        if (loadData) {
          console.log('Trying fallback with loadData directly');
          loadData(accountId)
            .then(() => console.log('Fallback loading successful'))
            .catch(err => console.error('Fallback loading failed:', err))
            .finally(() => setRefreshing(false));
        }
      }
    } catch (error) {
      console.error('Error in handleSwitchAccount:', error);
      setLocalError(error.message);
      setRefreshing(false);
    }
  };

  // Handle coffee press
  const handleCoffeePress = (item) => {
    // If item is a reference to a coffee in mockCoffees.json (has coffeeId but no id)
    const coffeeId = item.coffeeId || item.id;
    
    navigation.navigate('CoffeeDetail', {
      coffeeId: coffeeId,
      skipAuth: true
    });
  };

  // Handle recipe press
  const handleRecipePress = (item) => {
    navigation.navigate('RecipeDetail', {
      recipeId: item.id,
      coffeeId: item.coffeeId,
      coffeeName: item.coffeeName || item.name,
      roaster: item.roaster || item.roasterName,
      imageUrl: item.imageUrl,
      recipe: item,
      userId: item.userId,
      userName: item.userName,
      userAvatar: item.userAvatar
    });
  };

  // Handle user press
  const handleUserPress = (userInfo) => {
    // Handle both formats: event object or direct userId/userName
    const userId = userInfo.userId || userInfo;
    
    if (userId) {
      navigation.navigate('UserProfileBridge', {
        userId: userId,
        skipAuth: true
      });
    }
  };

  // Handle tab change
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // Get followers count for current user
  const getFollowersCount = () => {
    const userFollowerData = mockFollowersData[currentAccount];
    return userFollowerData?.followers?.length || 0;
  };

  // Get following count for current user
  const getFollowingCount = () => {
    const userFollowerData = mockFollowersData[currentAccount];
    return userFollowerData?.following?.length || 0;
  };

  // Filter recipes based on the selected filter
  const getFilteredRecipes = () => {
    console.log('Current account in getFilteredRecipes:', currentAccount);
    
    // If user has no recipes, use recipes from mockRecipes.json for current user
    let userRecipes = recipes;
    if ((!userRecipes || userRecipes.length === 0) && currentAccount === 'user1') {
      console.log('Using mock recipes from mockRecipes.json');
      userRecipes = mockRecipes.recipes.filter(recipe => recipe.creatorId === 'user1' || recipe.userId === 'user1');
    }
    
    // For profile, only return recipes created by the current user
    return userRecipes.filter(recipe => recipe.userId === currentAccount || 
                                        recipe.creatorId === currentAccount || 
                                        recipe.isCreated);
  };

  // Render coffee item
  const renderCoffeeItem = ({ item }) => {
    // Enhance item with default recipe data if missing
    const enhancedItem = {
      ...item,
      // If type is missing or null, set it to 'coffee_log'
      type: item.type || 'coffee_log',
      // Add default brewing method if missing
      brewingMethod: item.brewingMethod || item.method || 'V60',
      // Add default recipe data if missing
      amount: item.amount || '15',
      grindSize: item.grindSize || 'Medium',
      waterVolume: item.waterVolume || '250',
      brewTime: item.brewTime || '3:00'
    };
    
    return (
      <View style={styles.coffeeLogCardContainer}>
        <ThemeCoffeeLogCard
          event={enhancedItem}
          onCoffeePress={() => handleCoffeePress(enhancedItem)}
          onRecipePress={() => handleRecipePress(enhancedItem)}
          onUserPress={() => handleUserPress(enhancedItem)}
          onOptionsPress={handleCoffeeOptionsPress}
          onLikePress={handleCoffeeLikePress}
          currentUserId={currentAccount}
        />
      </View>
    );
  };

  // Render collection item
  const renderCollectionItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.collectionCard, 
        { 
          backgroundColor: isDarkMode ? theme.cardBackground : theme.background,
          borderColor: isDarkMode ? theme.cardBackground : theme.border,
        }
      ]}
      onPress={() => handleCoffeePress(item)}
    >
      {item.image ? (
        <Image
          source={{ uri: item.image || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e' }}
          style={styles.collectionCardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.collectionCardImagePlaceholder}>
          <Ionicons name="cafe-outline" size={30} color="#666666" />
        </View>
      )}
      <View style={styles.collectionCardInfo}>
        <Text style={[styles.collectionCardName, { color: theme.primaryText }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.collectionCardRoaster, { color: theme.secondaryText }]} numberOfLines={1}>{item.roaster}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render wishlist item
  const renderWishlistItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.coffeeItem, styles.coffeeItemContainer]}
      onPress={() => handleCoffeePress(item)}
    >
      <Image
        source={{ uri: item.image || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e' }}
        style={styles.coffeeImage}
      />
      <View style={styles.coffeeInfo}>
        <Text style={styles.coffeeName}>{item.name}</Text>
        <Text style={styles.coffeeRoaster}>{item.roaster}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render recipe item
  const renderRecipeItem = ({ item }) => (
    <RecipeCard
      recipe={item}
      onPress={() => handleRecipePress(item)}
      onUserPress={(userId, userName) => handleUserPress({userId, userName})}
      style={[
        styles.fullWidthRecipe,
        {
          backgroundColor: isDarkMode ? theme.cardBackground : theme.background,
          borderColor: isDarkMode ? theme.divider : '#E5E5EA'
        }
      ]}
    />
  );

  // Render tabs
  const renderTabs = () => (
    <View style={[styles.tabsContainer, { borderBottomColor: theme.divider }, { backgroundColor: theme.background }]}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'coffee' && [styles.activeTabButton, { borderBottomColor: theme.primaryText }]]}
        onPress={() => handleTabChange('coffee')}
      >
        <Text style={[styles.tabText, { color: theme.secondaryText }, activeTab === 'coffee' && { color: theme.primaryText }]}>Activity</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === (isBusinessAccount ? 'shop' : 'collection') && [styles.activeTabButton, { borderBottomColor: theme.primaryText }]]}
        onPress={() => handleTabChange(isBusinessAccount ? 'shop' : 'collection')}
      >
        <Text style={[styles.tabText, { color: theme.secondaryText }, activeTab === (isBusinessAccount ? 'shop' : 'collection') && { color: theme.primaryText }]}>
          {isBusinessAccount ? 'Shop' : 'Collection'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'recipes' && [styles.activeTabButton, { borderBottomColor: theme.primaryText }]]}
        onPress={() => handleTabChange('recipes')}
      >
        <Text style={[styles.tabText, { color: theme.secondaryText }, activeTab === 'recipes' && { color: theme.primaryText }]}>Recipes</Text>
      </TouchableOpacity>
    </View>
  );

  // Render empty state
  const renderEmptyState = (message) => (
    <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
      <Ionicons name="cafe-outline" size={50} color={theme.secondaryText} />
      <Text style={[styles.emptyText, { color: theme.secondaryText }]}>{message}</Text>
    </View>
  );

  // Render content based on active tab
  const renderContent = () => {
    if (loading) {
      return <LoadingView insets={insets} />;
    }

    if (combinedError) {
      return <ErrorView error={combinedError} insets={insets} onRetry={handleRefresh} />;
    }

    return (
      <ScrollView 
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            enabled={enableRefreshControl} 
            progressViewOffset={20}
          />
        }
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ paddingTop: 0 }}
        scrollToOverflowEnabled={false}
        automaticallyAdjustContentInsets={false}
        scrollsToTop={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        ref={scrollViewRef}
        onScrollBeginDrag={() => {
          if (!enableRefreshControl) {
            setEnableRefreshControl(true);
          }
        }}
      >
        {/* Profile Header - Avatar, name, stats */}
        <View style={[styles.profileHeader, { backgroundColor: theme.background }]}>
          <Image 
            source={typeof avatarUrl === 'string' ? { uri: avatarUrl } : avatarUrl} 
            style={[
              styles.avatar,
              isBusinessAccount ? styles.businessAvatar : styles.userAvatar
            ]} 
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: theme.primaryText }]}>{displayName}</Text>
            <Text style={[styles.location, { color: theme.secondaryText }]}>{location}</Text>
          </View>
        </View>

        {/* Profile Stats */}
        <View style={[styles.followStatsContainer, { backgroundColor: theme.background }]}>
          <TouchableOpacity 
            style={styles.followStat}
            onPress={() => setActiveTab(isBusinessAccount ? 'shop' : 'collection')}
          >
            <Text style={[styles.followStatNumber, { color: theme.primaryText }]}>
              {coffeeEvents?.length || 0}
            </Text>
            <Text style={[styles.followStatLabel, { color: theme.secondaryText }]}>
              coffees
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.followStat}
            onPress={() => setActiveTab('recipes')}
          >
            <Text style={[styles.followStatNumber, { color: theme.primaryText }]}>
              {getFilteredRecipes().length}
            </Text>
            <Text style={[styles.followStatLabel, { color: theme.secondaryText }]}>
              recipes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.followStat}
            onPress={() => {
              navigation.navigate('FollowersScreen', {
                userId: currentAccount,
                userName: displayName,
                type: 'followers',
                skipAuth: true
              });
            }}
          >
            <Text style={[styles.followStatNumber, { color: theme.primaryText }]}>
              {getFollowersCount()}
            </Text>
            <Text style={[styles.followStatLabel, { color: theme.secondaryText }]}>
              followers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.followStat}
            onPress={() => {
              navigation.navigate('FollowersScreen', {
                userId: currentAccount,
                userName: displayName,
                type: 'following',
                skipAuth: true
              });
            }}
          >
            <Text style={[styles.followStatNumber, { color: theme.primaryText }]}>
              {getFollowingCount()}
            </Text>
            <Text style={[styles.followStatLabel, { color: theme.secondaryText }]}>
              following
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Gear Module - showing user's gear */}
        {renderGearModule()}
        
        {/* Tabs for collection/wishlist/recipes */}
        {renderTabs()}
        
        {/* Tab Content */}
        {activeTab === 'coffee' && (
          <View style={[styles.sectionContainer, { backgroundColor: theme.background }]}>
            {coffeeEvents && coffeeEvents.length > 0 ? (
              <FlatList
                data={coffeeEvents}
                renderItem={renderCoffeeItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            ) : (
              renderEmptyState('No activity yet')
            )}
          </View>
        )}
        
        {activeTab === (isBusinessAccount ? 'shop' : 'collection') && (
          <View style={[styles.sectionContainer, { backgroundColor: theme.background }]}>
            {isBusinessAccount && (
              <View style={[styles.recipeFilterContainer, { backgroundColor: theme.background }]}>
                <View style={[styles.segmentedControl, { backgroundColor: theme.cardBackground }]}>
                  <TouchableOpacity
                    style={[
                      styles.segment,
                      shopFilter === 'coffee' && [styles.segmentActive, { backgroundColor: isDarkMode ? '#3A3A3C' : theme.background }]
                    ]}
                    onPress={() => setShopFilter('coffee')}
                  >
                    <Text style={[
                      styles.segmentText,
                      { color: theme.secondaryText },
                      shopFilter === 'coffee' && [styles.segmentTextActive, { color: theme.primaryText }]
                    ]}>Coffee</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.segment,
                      shopFilter === 'gear' && [styles.segmentActive, { backgroundColor: isDarkMode ? '#3A3A3C' : theme.background }]
                    ]}
                    onPress={() => setShopFilter('gear')}
                  >
                    <Text style={[
                      styles.segmentText,
                      { color: theme.secondaryText },
                      shopFilter === 'gear' && [styles.segmentTextActive, { color: theme.primaryText }]
                    ]}>Gear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {isBusinessAccount && shopFilter === 'gear' ? (
              <View style={[styles.collectionSection, { backgroundColor: theme.background }]}>
                <FlatList
                  data={mockGear.gear.filter(gear => getBusinessGear(currentAccount, userData?.userName).includes(gear.id))}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[
                        styles.collectionCard, 
                        { 
                          backgroundColor: isDarkMode ? theme.cardBackground : theme.background,
                          borderColor: isDarkMode ? theme.divider : '#E5E5EA'
                        }
                      ]}
                      onPress={() => handleGearPress(item.name)}
                    >
                      <Image
                        source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1575441347544-11725ca18b26' }}
                        style={styles.collectionCardImage}
                        resizeMode="cover"
                      />
                      <View style={styles.collectionCardInfo}>
                        <Text style={[styles.collectionCardName, { color: theme.primaryText }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.collectionCardRoaster, { color: theme.secondaryText }]} numberOfLines={1}>{item.brand}</Text>
                        <Text style={[styles.collectionCardPrice, { color: theme.primaryText }]}>{typeof item.price === 'number' ? `€${item.price.toFixed(2)}` : item.price}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  numColumns={2}
                  columnWrapperStyle={styles.collectionCardRow}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                  contentContainerStyle={{paddingHorizontal: 16, paddingTop: 16}}
                  ListEmptyComponent={() => (
                    <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
                      <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No gear in shop</Text>
                    </View>
                  )}
                />
              </View>
            ) : isBusinessAccount && shopFilter === 'coffee' ? (
              <View style={[styles.collectionSection, { backgroundColor: theme.background }]}>
                <FlatList
                  data={getBusinessCoffees(currentAccount, userData?.userName)}
                  keyExtractor={(item) => item.coffeeId || item.id}
                  renderItem={({ item }) => {
                    // If item is a reference to a coffee in mockCoffees.json
                    // Our unified data model works by storing business-specific details (like price)
                    // in businessProducts.js with coffeeId references to the core coffee data in mockCoffees.json
                    // This keeps our data DRY and allows each business to set their own prices and availability
                    const isReference = item.coffeeId && !item.name;
                    
                    // Find complete coffee data from mockCoffees.json if this is a reference
                    const coffeeData = isReference 
                      ? mockCoffeesData.coffees.find(coffee => coffee.id === item.coffeeId) 
                      : item;
                    
                    // Only render if we have coffee data
                    if (!coffeeData) return null;
                    
                    return (
                      <TouchableOpacity 
                        style={[
                          styles.collectionCard, 
                          { 
                            backgroundColor: isDarkMode ? theme.cardBackground : theme.background,
                            borderColor: isDarkMode ? theme.divider : '#E5E5EA'
                          }
                        ]}
                        onPress={() => handleCoffeePress(item)}
                      >
                        <Image
                          source={{ uri: coffeeData.image || coffeeData.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e' }}
                          style={styles.collectionCardImage}
                          resizeMode="cover"
                        />
                        <View style={styles.collectionCardInfo}>
                          <Text style={[styles.collectionCardName, { color: theme.primaryText }]} numberOfLines={1}>{coffeeData.name}</Text>
                          <Text style={[styles.collectionCardRoaster, { color: theme.secondaryText }]} numberOfLines={1}>{coffeeData.roaster}</Text>
                          <Text style={[styles.collectionCardPrice, { color: theme.primaryText }]}>{typeof item.price === 'number' ? `€${item.price.toFixed(2)}` : item.price}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  numColumns={2}
                  columnWrapperStyle={styles.collectionCardRow}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                  contentContainerStyle={{paddingHorizontal: 16, paddingTop: 16}}
                  ListEmptyComponent={() => (
                    <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
                      <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No coffees in shop</Text>
                    </View>
                  )}
                />
              </View>
            ) : coffeeCollection && coffeeCollection.length > 0 ? (
              <View style={[styles.collectionSection, { backgroundColor: theme.background }]}>
                <FlatList
                  data={coffeeCollection}
                  renderItem={renderCollectionItem}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  columnWrapperStyle={styles.collectionCardRow}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                  contentContainerStyle={{paddingHorizontal: 16, paddingTop: 16}}
                />
              </View>
            ) : (
              renderEmptyState(`No ${isBusinessAccount ? 'products' : 'coffees'} in ${isBusinessAccount ? 'shop' : 'collection'} yet`)
            )}
          </View>
        )}
        
        {activeTab === 'recipes' && (
          <View style={[styles.sectionContainer, { backgroundColor: theme.background }]}>
            {console.log('Rendering recipes tab')}
            <View style={[styles.collectionSection, { backgroundColor: theme.background }]}>
              <FlatList
                data={getFilteredRecipes()}
                renderItem={renderRecipeItem}
                keyExtractor={(item, index) => item.id || `recipe-${index}`}
                numColumns={1}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                contentContainerStyle={{paddingHorizontal: 16, paddingTop: 16}}
                ListEmptyComponent={() => (
                  <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
                    <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
                      No recipes created yet
                    </Text>
                  </View>
                )}
              />
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  // Handle options press (3-dot menu)
  const handleOptionsPress = () => {
    // Log userData before navigation to ensure location is present
    console.log('Profile options - Current userData:', userData);
    console.log('Profile options - Location:', userData.location);
    console.log('Profile options - isDarkMode:', isDarkMode);
    console.log('Profile options - theme:', theme);
    
    // Create a complete userData object with all required fields
    const completeUserData = {
      ...userData,
      location: userData.location || defaultUser?.location || 'Murcia, Spain',
    };
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Edit Profile', 'Settings', 'Sign Out', 'Cancel'],
          cancelButtonIndex: 3,
          destructiveButtonIndex: 2,
          userInterfaceStyle: isDarkMode ? 'dark' : 'light'
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Edit Profile
            navigation.navigate('EditProfile', { userData: completeUserData });
          } else if (buttonIndex === 1) {
            // Settings
            navigation.navigate('Settings');
          } else if (buttonIndex === 2) {
            // Sign Out
            Alert.alert(
              'Sign Out',
              'Are you sure you want to sign out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Sign Out', 
                  style: 'destructive',
                  onPress: () => {
                    // In a real app, you would handle sign out logic here
                    Alert.alert('Signed Out', 'You have been signed out successfully', [], {
                      userInterfaceStyle: isDarkMode ? 'dark' : 'light'
                    });
                  }
                }
              ],
              {
                userInterfaceStyle: isDarkMode ? 'dark' : 'light'
              }
            );
          }
        }
      );
    } else {
      // For Android, we would use a custom modal or menu
      Alert.alert(
        'Options',
        'Choose an option',
        [
          { text: 'Edit Profile', onPress: () => navigation.navigate('EditProfile', { userData: completeUserData }) },
          { text: 'Settings', onPress: () => navigation.navigate('Settings') },
          { 
            text: 'Sign Out', 
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Sign Out',
                'Are you sure you want to sign out?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Sign Out', 
                    style: 'destructive',
                    onPress: () => {
                      // In a real app, you would handle sign out logic here
                      Alert.alert('Signed Out', 'You have been signed out successfully', [], {
                        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
                      });
                    }
                  }
                ],
                {
                  userInterfaceStyle: isDarkMode ? 'dark' : 'light'
                }
              );
            } 
          },
          { text: 'Cancel', style: 'cancel' }
        ],
        {
          userInterfaceStyle: isDarkMode ? 'dark' : 'light'
        }
      );
    }
  };

  // Handle gear item press
  const handleGearPress = (item) => {
    console.log('Navigating to GearDetailScreen with gear:', item);
    navigation.navigate('GearDetail', {
      gearName: item
    });
  };

  // Render account modal - with added "Create Account" option
  const renderAccountModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[
          styles.modalContent,
          { paddingBottom: insets.bottom + 12, backgroundColor: theme.cardBackground }
        ]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
            <Text style={[styles.modalTitle, { color: theme.primaryText }]}>Select Account</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={theme.primaryText} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={accountsData || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.accountItem, { borderBottomColor: theme.divider }]}
                onPress={() => handleSwitchAccount(item.id)}
              >
                <Image
                  source={typeof item.userAvatar === 'string' ? { uri: item.userAvatar } : item.userAvatar}
                  style={[styles.accountAvatar, defaultUsers[item.id]?.isBusinessAccount && styles.businessAvatar]}
                />
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, { color: theme.primaryText }]}>{item.userName || item.name}</Text>
                  <Text style={[styles.accountEmail, { color: theme.secondaryText }]}>{item.email}</Text>
                </View>
                {currentAccount === item.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                )}
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.createAccountItem}
                onPress={() => {
                  setModalVisible(false);
                  Alert.alert('Coming Soon', 'Create Account functionality will be available soon.', [], {
                    userInterfaceStyle: isDarkMode ? 'dark' : 'light'
                  });
                }}
              >
                <View style={[styles.createAccountCircle, { backgroundColor: theme.primaryText }]}>
                  <Ionicons name="add" size={24} color={theme.background} />
                </View>
                <Text style={[styles.createAccountText, { color: theme.primaryText }]}>Create Account</Text>
              </TouchableOpacity>
            }
          />
        </View>
      </View>
    </Modal>
  );

  // Render the gear module
  const renderGearModule = () => {
    // Get the current user's data from mockUsers
    const mockUserData = mockUsers.users.find(u => u.id === currentAccount);
    
    // Make sure we always have gear data by using the mock user's gear as a fallback
    const gearToDisplay = userGear && userGear.length > 0 
      ? userGear 
      : mockUserData?.gear || [];
    
    const wishlistToDisplay = currentUserData?.gearWishlist || mockUserData?.gearWishlist || [];
    const hasGear = gearToDisplay.length > 0;
    const hasWishlist = wishlistToDisplay.length > 0;
    
    const handleGearWishlistNavigate = () => {
      navigation.navigate('GearWishlist', {
        userId: currentAccount, 
        userName: displayName,
        isCurrentUser: true
      });
    };

    // Helper function to get gear image
    const getGearImage = (gearName) => {
      // First try to find gear in mockGear.gear
      const mockGearItem = mockGear.gear.find(g => g.name === gearName);
      
      // Then check if we have detailed gear data
      const detailedGear = gearDetails[gearName];
      
      // Return the image URL from either source
      return mockGearItem?.imageUrl || detailedGear?.image || null;
    };
    
    return (
      <View style={[styles.gearContainer, { backgroundColor: theme.background }]}>
        <View style={styles.gearTitleRow}>
          <Text style={[styles.gearTitle, { color: theme.primaryText }]}>My gear</Text>
          
          <TouchableOpacity onPress={handleGearWishlistNavigate}>
            <Text style={[styles.gearWishlistToggle, { color: theme.primaryText, borderBottomColor: theme.primaryText }]}>
              {hasWishlist ? 'Wishlist' : 'View Wishlist'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gearScrollContainer}
        >
          {gearToDisplay && gearToDisplay.length > 0 ? (
            gearToDisplay.map((item, index) => {
              const gearImage = getGearImage(item);
              
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.gearItem, { backgroundColor: theme.cardBackground }]}
                  onPress={() => handleGearPress(item)}
                >
                  {gearImage && (
                    <View style={styles.gearItemAvatarContainer}>
                      <Image 
                        source={{ uri: gearImage }}
                        style={styles.gearItemAvatar}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  <Text style={[styles.gearItemText, { color: theme.primaryText }]}>{item}</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={[styles.emptyGearText, { color: theme.secondaryText }]}>
              No gear added yet
            </Text>
          )}
        </ScrollView>
      </View>
    );
  };

  // Update current user data when user changes
  useEffect(() => {
    console.log('User data changed:', user);
    if (user) {
      // If user data is loaded but missing gear, merge with default user gear
      const defaultUserForAccount = defaultUsers[currentAccount];
      if (!user.gear && defaultUserForAccount && defaultUserForAccount.gear) {
        console.log('User data loaded but missing gear, using default gear');
        const mergedUserData = {
          ...user,
          ...defaultUserForAccount,
          userName: user.userName || defaultUserForAccount.userName,
          userAvatar: user.userAvatar || defaultUserForAccount.userAvatar,
          userHandle: user.userHandle || defaultUserForAccount.userHandle,
          location: user.location || defaultUserForAccount.location,
          gear: defaultUserForAccount.gear,
          gearWishlist: defaultUserForAccount.gearWishlist
        };
        setCurrentUserData(mergedUserData);
      } else {
        setCurrentUserData(user);
      }
    } else if (currentAccount && accounts && accounts.length > 0) {
      // If user is null but we have an account ID, find the account data and merge with defaults
      const accountData = accounts.find(acc => acc.id === currentAccount);
      const defaultUserForAccount = defaultUsers[currentAccount];
      
      if (accountData && defaultUserForAccount) {
        console.log('Found account data:', accountData);
        
        // Merge account data with default data, with account data taking precedence
        const mergedAccountData = {
          ...defaultUserForAccount, 
          ...accountData,
          // Ensure these critical fields are present
          gear: accountData.gear || defaultUserForAccount.gear || [],
          gearWishlist: accountData.gearWishlist || defaultUserForAccount.gearWishlist || [],
          userHandle: accountData.userHandle || defaultUserForAccount.userHandle,
          location: accountData.location || defaultUserForAccount.location
        };
        setCurrentUserData(mergedAccountData);
      } else if (defaultUserForAccount) {
        // If we only have default data, use that
        setCurrentUserData(defaultUserForAccount);
      }
    }
  }, [user, currentAccount, accounts]);

  // Handle coffee options
  const handleCoffeeOptionsPress = (event, action) => {
    console.log('Coffee options action:', action, 'for event:', event.id);
    if (action === 'delete') {
      // Use the context function to delete the coffee log
      if (removeCoffeeEvent) {
        removeCoffeeEvent(event.id);
      }
      // No need for Alert since Toast is shown by the component
    } else if (action === 'public' || action === 'private') {
      // Toggle visibility status
      console.log(`Changed visibility to ${action}`);
      // Note: Toast is handled by the CoffeeLogCard component
    } else if (action === 'edit') {
      // Navigate to edit screen
      navigation.navigate('EditCoffeeLog', { eventId: event.id });
    }
  };

  // Handle coffee like
  const handleCoffeeLikePress = (eventId, isLiked) => {
    console.log('Coffee like:', eventId, isLiked);
    // Call API to like/unlike the coffee log
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Don't auto-refresh on focus - this was causing the annoying "moving down" behavior
      // User can manually pull-to-refresh if they want fresh data
      console.log('ProfileScreen focused - not auto-refreshing to prevent unwanted scroll movement');
    });
    
    // Cleanup
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentAccount, navigation]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (data) => {
      console.log('Received profile update event:', data);
      
      if (data.user) {
        // Update the current user data - ensure we preserve the userHandle
        const updatedUserData = {
          ...data.user,
          // Make sure we keep the original userHandle if not explicitly changed
          userHandle: data.user.userHandle || currentUserData.userHandle
        };
        
        setCurrentUserData(updatedUserData);
        
        // Show success toast if a message is provided
        if (data.message) {
          showToast(data.message);
        }
        
        // Don't force refresh to avoid unwanted scrolling - the state update above is sufficient
      }
    };
    
    eventEmitter.addListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      eventEmitter.removeListener('profileUpdated', handleProfileUpdate);
    };
  }, [currentAccount]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light" : "dark"} />

      {renderContent()}
      {renderAccountModal()}
      
      {/* Custom Toast for iOS */}
      {Platform.OS === 'ios' && (
        <Toast 
          visible={toastVisible} 
          message={toastMessage} 
          duration={2000}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // This will be overridden by inline style with theme.background
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    marginBottom: 8,
    // borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  userAvatar: {
    borderRadius: 40,
  },
  businessAvatar: {
    borderRadius: 12,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 5,
  },
  optionsButton: {
    padding: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: '#666666',
  },
  gearButton: {
    padding: 8,
  },
  contentContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 12,
  },
  coffeeItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  coffeeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  coffeeInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  coffeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  coffeeRoaster: {
    fontSize: 14,
    color: '#666666',
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeItem: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  recipeInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  recipeMethod: {
    fontSize: 14,
    color: '#666666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    padding: 5,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  accountAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  accountEmail: {
    fontSize: 14,
    color: '#666666',
  },
  createAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginTop: 10,
  },
  createAccountCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  createAccountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 15,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#000000',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileHeader: {
    padding: 16,
    paddingBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666666',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    height: 48,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '600',
  },
  sectionContainer: {
    padding: 0,
    backgroundColor: '#F2F2F7',
  },
  gearContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
    paddingRight: 0,
    paddingBottom: 12,
  },
  gearTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingRight: 16,
  },
  gearTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  gearWishlistToggle: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
    padding: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  gearScrollContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingLeft: 0,
    paddingRight: 16,
  },
  gearItem: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 12,
    paddingLeft: 8,
    paddingVertical: 8,
    borderRadius: 50,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gearItemAvatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    marginRight: 4,
  },
  gearItemAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  gearItemText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  emptyGearText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  collectionSection: {
    backgroundColor: '#FFFFFF',
    // paddingBottom: 16,
  },
  collectionCard: {
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative',
  },
  collectionCardImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  collectionCardImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  collectionCardInfo: {
    padding: 12,
  },
  collectionCardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  collectionCardRoaster: {
    fontSize: 12,
    color: '#666666',
  },
  collectionCardPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 4,
  },
  collectionCardRow: {
    justifyContent: 'space-between',
  },
  removeIcon: {
    // No additional styling needed
  },
  recipeFilterContainer: {
    position: 'relative',
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    padding: 16,
    paddingBottom: 0,
    backgroundColor: '#FFFFFF',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  segmentTextActive: {
    color: '#000000',
  },
  recipeDetails: {
    marginTop: 4,
  },
  recipeDetailText: {
    fontSize: 12,
    color: '#777777',
  },
  fullWidthRecipe: {
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
  },
  toast: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  toastText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  followStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingVertical: 12,
    paddingBottom: 0,
    backgroundColor: '#FFFFFF',
    // borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor: '#E5E5EA',
    justifyContent: 'space-between',
  },
  followStat: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 0,
    paddingBottom: 4,
    paddingHorizontal: 8,
    flex: 1,
  },
  followStatNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 0,
  },
  followStatLabel: {
    fontSize: 14,
    color: '#666666',
  },
}); 