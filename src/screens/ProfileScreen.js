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
import * as ImagePicker from 'expo-image-picker';
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
    removeCoffeeEvent,
    signOut,
    deleteRecipe
  } = useCoffee();
  
  // Add theme context at the component level
  const { theme, isDarkMode, toggleTheme } = useTheme();
  
  // Use the real authenticated user account from context
  const currentAccount = contextCurrentAccount;

  const safeAreaInsets = useSafeAreaInsets();
  const insets = safeAreaInsets ? {
    top: safeAreaInsets.top || 0,
    bottom: safeAreaInsets.bottom || 0,
    left: safeAreaInsets.left || 0,
    right: safeAreaInsets.right || 0
  } : { top: 0, bottom: 0, left: 0, right: 0 };
  const [refreshing, setRefreshing] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [activeTab, setActiveTab] = useState('coffee');
  const [recipeFilter, setRecipeFilter] = useState('all'); // 'all', 'created', 'saved'
  const [enableRefreshControl, setEnableRefreshControl] = useState(false);
  const [loadCount, setLoadCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const scrollViewRef = useRef(null);
  const [shopFilter, setShopFilter] = useState('coffee'); // 'coffee' or 'gear'
  
  // Add new states for coffee addition modal
  const [showAddCoffeeModal, setShowAddCoffeeModal] = useState(false);
  
  // Collection view and sorting states
  const [collectionViewMode, setCollectionViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'name', 'roaster'
  const [showSortModal, setShowSortModal] = useState(false);

  // Default user data for when we don't have loaded data yet (minimal fallback)
  const defaultUser = {
    id: currentAccount || 'unknown',
    userName: 'User',
    userHandle: 'user',
    userAvatar: null,
    email: '',
    location: '',
    isBusinessAccount: false,
    gear: [],
    gearWishlist: []
  };

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
    
  // With real authentication, we only have the current user account
  const accountsData = user ? [user] : [];
  
  const displayName = userData?.userName || userData?.name || 'Guest';
  const userHandle = userData?.userHandle || displayName.toLowerCase().replace(/\s+/g, '_');
  const avatarUrl = userData?.userAvatar || userData?.avatar || null;
  const location = (userData?.location || defaultUser?.location || '').trim();
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
    if (currentAccount) {
      const minimalUserData = {
        id: currentAccount,
        userName: 'Loading...',
        userHandle: 'loading',
        userAvatar: null,
        email: '',
        location: '',
        isBusinessAccount: false,
        gear: [],
        gearWishlist: []
      };
      setCurrentUserData(minimalUserData);
    }
    
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
      if (accountId) {
        const minimalUserData = {
          id: accountId,
          userName: 'Loading...',
          userHandle: 'loading',
          userAvatar: null,
          email: '',
          location: '',
          isBusinessAccount: false,
          gear: [],
          gearWishlist: []
        };
        setCurrentUserData(minimalUserData);
      }
      
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
      const route = navigation.getState().routes.find(route => route.name === 'Root');
      const hasUpdatedUserData = route?.params?.params?.updatedUserData;
      
      if (hasUpdatedUserData) {
        const updatedUserData = route.params.params.updatedUserData;
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
            navigation.setParams({ params: { updatedUserData: null } });
            
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

  // Set up header without account switching
  useEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerLeft: () => (
        <View style={[styles.usernameContainer, { marginLeft: 16 }]}>
          <Text style={[styles.usernameText, { color: theme.primaryText }]}>@{userHandle}</Text>
        </View>
      ),
      headerRight: () => (
        <View style={[styles.headerRightContainer, { marginRight: 16 }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              navigation.navigate('Analytics');
            }}
          >
            <Ionicons name="stats-chart-outline" size={24} color={theme.primaryText} />
          </TouchableOpacity>
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

  // Remove tab long press events since account switching is disabled

  // Handle account switching - with real auth, this just refreshes the current user's data
  const handleSwitchAccount = (accountId) => {
    try {
      console.log('Refreshing account data for:', accountId);
      
      // Close modal first
      setModalVisible(false);

      // Check if we're trying to "switch" to the same account (which is the only one available)
      if (currentAccount !== accountId) {
        console.log('Cannot switch to different account with real authentication');
        return;
      }

      // Show loading state and refresh the user's data
      setRefreshing(true);
      
      // Use the switchAccount function from CoffeeContext to refresh data
      if (switchAccount) {
        try {
          const result = switchAccount(accountId);
          
          // Handle both Promise and non-Promise returns
          if (result && typeof result.then === 'function') {
            result
              .then(() => {
                console.log('Account data refreshed successfully');
              })
              .catch(error => {
                console.error('Error refreshing account:', error);
                setLocalError(error.message || 'Failed to refresh account');
              })
              .finally(() => {
                setRefreshing(false);
              });
          } else {
            // Handle synchronous switchAccount (non-Promise)
            console.log('Account refresh completed synchronously');
            setRefreshing(false);
          }
        } catch (switchError) {
          console.error('Error during account refresh:', switchError);
          setLocalError(switchError.message || 'Failed to refresh account');
          setRefreshing(false);
        }
      } else {
        console.error('switchAccount function not available');
        setLocalError('Account refresh functionality not available');
        setRefreshing(false);
      }
    } catch (error) {
      console.error('Error in handleSwitchAccount:', error);
      setLocalError(error.message);
      setRefreshing(false);
    }
  };

  // Handle coffee press
  const handleCoffeePress = (item) => {
    // Check if this is a gear item that needs to navigate to GearDetail
    if (item.navigateTo === 'GearDetail') {
      navigation.navigate('GearDetail', { 
        gearName: item.gearName,
        gearId: item.gearId
      });
      return;
    }

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

  // Handle long press on collection item
  const handleCollectionItemLongPress = (item) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Remove from Collection', 'Cancel'],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
          userInterfaceStyle: isDarkMode ? 'dark' : 'light',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            handleRemoveFromCollection(item);
          }
        }
      );
    } else {
      Alert.alert(
        'Collection Options',
        'What would you like to do?',
        [
          {
            text: 'Remove from Collection',
            style: 'destructive',
            onPress: () => handleRemoveFromCollection(item)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ],
        {
          userInterfaceStyle: isDarkMode ? 'dark' : 'light'
        }
      );
    }
  };

  // Handle long press on recipe
  const handleRecipeLongPress = (item) => {
    // Only show delete option if current user is the creator
    const isCreator = item.userId === currentAccount || item.creatorId === currentAccount;
    
    if (!isCreator) return; // Don't show action sheet if not creator
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Delete Recipe', 'Cancel'],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
          userInterfaceStyle: isDarkMode ? 'dark' : 'light',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            handleDeleteRecipe(item);
          }
        }
      );
    } else {
      Alert.alert(
        'Recipe Options',
        'What would you like to do?',
        [
          {
            text: 'Delete Recipe',
            style: 'destructive',
            onPress: () => handleDeleteRecipe(item)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ],
        {
          userInterfaceStyle: isDarkMode ? 'dark' : 'light'
        }
      );
    }
  };

  // Handle remove from collection
  const handleRemoveFromCollection = (item) => {
    Alert.alert(
      'Remove from Collection',
      `Remove "${item.name}" from your collection?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFromCollection(item.id);
            showToast('Removed from collection');
          }
        }
      ],
      {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      }
    );
  };

  // Handle delete recipe
  const handleDeleteRecipe = (item) => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (deleteRecipe) {
              deleteRecipe(item.id);
            }
            showToast('Recipe deleted');
          }
        }
      ],
      {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      }
    );
  };

  // Handle add coffee modal options
  const handleAddCoffeeOption = async (option) => {
    setShowAddCoffeeModal(false);
    
    switch (option) {
      case 'url':
        handleURLInput();
        break;
      case 'camera':
        await handleTakePhoto();
        break;
      case 'gallery':
        await handleSelectFromGallery();
        break;
      case 'manual':
        navigation.navigate('AddCoffeeManually');
        break;
    }
  };

  // Handle URL input with alert
  const handleURLInput = () => {
    Alert.prompt(
      'Enter Coffee URL',
      'Paste the URL of a coffee product page to extract details automatically',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Parse URL',
          onPress: (url) => {
            if (url && url.trim()) {
              navigation.navigate('AddCoffeeFromURL', { url: url.trim() });
            } else {
              Alert.alert('Error', 'Please enter a valid URL');
            }
          }
        }
      ],
      'plain-text',
      '',
      'url'
    );
  };

  // Handle camera capture
  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to grant permission to access your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        navigation.navigate('AddCoffeeFromCamera', { 
          capturedImage: result.assets[0].uri 
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Handle gallery selection
  const handleSelectFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        navigation.navigate('AddCoffeeFromGallery', { 
          selectedImage: result.assets[0].uri 
        });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
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
          currentUserId={user?.id || currentAccount}
        />
      </View>
    );
  };

  // Render collection item
  const renderCollectionItem = ({ item }) => {
    const isListView = collectionViewMode === 'list';
    console.log('Rendering collection item:', item.name, 'in', collectionViewMode, 'mode, isListView:', isListView);
    
    return (
      <TouchableOpacity 
        style={[
          isListView ? styles.collectionListItem : styles.collectionCard, 
          { 
            backgroundColor: isDarkMode ? theme.cardBackground : theme.background,
            borderColor: isDarkMode ? theme.cardBackground : theme.border,
          }
        ]}
        onPress={() => handleCoffeePress(item)}
        onLongPress={() => handleCollectionItemLongPress(item)}
      >
        {item.image ? (
          <Image
            source={{ uri: item.image || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e' }}
            style={isListView ? styles.collectionListImage : styles.collectionCardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={isListView ? styles.collectionListImagePlaceholder : styles.collectionCardImagePlaceholder}>
            <Ionicons name="cafe-outline" size={isListView ? 50 : 30} color="#666666" />
          </View>
        )}
        <View style={isListView ? styles.collectionListInfo : styles.collectionCardInfo}>
          <Text style={[
            isListView ? styles.collectionListName : styles.collectionCardName, 
            { color: theme.primaryText }
          ]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[
            isListView ? styles.collectionListRoaster : styles.collectionCardRoaster, 
            { color: theme.secondaryText }
          ]} numberOfLines={1}>
            {item.roaster}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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
    <TouchableOpacity
      onLongPress={() => handleRecipeLongPress(item)}
      activeOpacity={0.7}
    >
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
    </TouchableOpacity>
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

  // Render collection section header
  const renderCollectionHeader = () => (
    <View style={[styles.collectionHeader, { backgroundColor: theme.background, borderBottomColor: theme.divider }]}>
        {/* Sort by chip */}
        <TouchableOpacity 
          style={[styles.sortChip]}
          onPress={() => setShowSortModal(true)}
        >
        <Text style={[styles.sortChipText, { color: theme.primaryText }]}>
          Sort by {sortBy === 'recent' ? 'Recent' : sortBy === 'name' ? 'Name' : 'Roaster'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={theme.secondaryText} style={styles.sortChipIcon} />
      </TouchableOpacity>

      {/* Action buttons */}
      <View style={styles.headerActions}>
                {/* Grid/List toggle button */}
                <TouchableOpacity 
          style={[styles.headerActionButton, { backgroundColor: theme.background }]}
          onPress={() => {
            const newMode = collectionViewMode === 'grid' ? 'list' : 'grid';
            console.log('Toggling view mode from', collectionViewMode, 'to', newMode);
            setCollectionViewMode(newMode);
          }}
        >
          <Ionicons 
            name={collectionViewMode === 'grid' ? "list-outline" : "grid-outline"} 
            size={24} 
            color={theme.primaryText} 
          />
        </TouchableOpacity>
        
        {/* Add to collection button */}
        <TouchableOpacity 
          style={[styles.headerActionButton, { backgroundColor: theme.background }]}
          onPress={() => setShowAddCoffeeModal(true)}
        >
          <Ionicons name="add" size={24} color={theme.primaryText} />
        </TouchableOpacity>
      </View>
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
          {avatarUrl ? (
            <Image 
              source={typeof avatarUrl === 'string' ? { uri: avatarUrl } : avatarUrl} 
              style={[
                styles.avatar,
                isBusinessAccount ? styles.businessAvatar : styles.userAvatar
              ]} 
            />
          ) : (
            <View style={[
              styles.avatar,
              styles.placeholderAvatar,
              isBusinessAccount ? styles.businessAvatar : styles.userAvatar,
              { backgroundColor: theme.cardBackground }
            ]}>
              <Ionicons name="person" size={40} color={theme.secondaryText} />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: theme.primaryText }]}>{displayName}</Text>
            {location ? (
              <Text style={[styles.location, { color: theme.secondaryText }]}>{location}</Text>
            ) : null}
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
            ) : (
              <View style={[styles.collectionSection, { backgroundColor: theme.background }]}>
                {/* Collection header - only show for non-business collection */}
                {!isBusinessAccount && renderCollectionHeader()}
                
                {coffeeCollection && coffeeCollection.length > 0 ? (
                  <FlatList
                    key={collectionViewMode} // Force re-render when view mode changes
                    data={coffeeCollection.sort((a, b) => {
                      if (sortBy === 'name') return a.name.localeCompare(b.name);
                      if (sortBy === 'roaster') return a.roaster.localeCompare(b.roaster);
                      // Default to recent (by addedAt or id)
                      return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
                    })}
                    renderItem={renderCollectionItem}
                    keyExtractor={(item) => item.id}
                    numColumns={collectionViewMode === 'grid' ? 2 : 1}
                    columnWrapperStyle={collectionViewMode === 'grid' ? styles.collectionCardRow : null}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                    contentContainerStyle={{
                      paddingHorizontal: 16, 
                      paddingTop: !isBusinessAccount ? 0 : 16
                    }}
                  />
                ) : (
                  renderEmptyState(`No ${isBusinessAccount ? 'products' : 'coffees'} in ${isBusinessAccount ? 'shop' : 'collection'} yet`)
                )}
              </View>
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
      location: userData.location || defaultUser?.location || '',
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
                  onPress: async () => {
                    try {
                      await signOut();
                      // Navigate to SignIn screen and reset navigation stack
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'SignIn' }],
                      });
                    } catch (error) {
                      console.error('Sign out error:', error);
                      Alert.alert('Error', 'Failed to sign out. Please try again.', [], {
                        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
                      });
                    }
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
                    onPress: async () => {
                      try {
                        await signOut();
                        // Navigate to SignIn screen and reset navigation stack
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'SignIn' }],
                        });
                      } catch (error) {
                        console.error('Sign out error:', error);
                        Alert.alert('Error', 'Failed to sign out. Please try again.', [], {
                          userInterfaceStyle: isDarkMode ? 'dark' : 'light'
                        });
                      }
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

  // Account modal no longer needed with real authentication

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
              Edit your profile to add gear
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
      // With real authentication, just use the user data from Supabase
      setCurrentUserData(user);
    }
  }, [user]);

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
        // Update the current user data with all fields
        const updatedUserData = {
          ...currentUserData,
          ...data.user,
          // Make sure we keep the original userHandle if not explicitly changed
          userHandle: data.user.userHandle || currentUserData.userHandle,
          // Ensure we have gear data
          gear: data.user.gear || currentUserData.gear || [],
          gearWishlist: data.user.gearWishlist || currentUserData.gearWishlist || []
        };
        
        console.log('Setting updated user data:', updatedUserData);
        
        // Update local state immediately for smooth UI update
        setCurrentUserData(updatedUserData);
        
        // Show success toast if a message is provided
        if (data.message) {
          showToast(data.message);
        }
        
        // Update the CoffeeContext data if we have accounts
        if (accounts && accounts.length > 0) {
          const updatedAccounts = [...accounts];
          const accountIndex = updatedAccounts.findIndex(acc => acc.id === currentAccount);
          
          if (accountIndex !== -1) {
            // Update the account data
            updatedAccounts[accountIndex] = {
              ...updatedAccounts[accountIndex],
              ...updatedUserData
            };
          }
        }
        
        // Force a data refresh after a short delay to ensure all updates are applied
        setTimeout(() => {
          if (loadData) {
            loadData(currentAccount).catch(error => {
              console.error('Error refreshing data after profile update:', error);
            });
          }
        }, 100);
      }
    };
    
    eventEmitter.addListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      eventEmitter.removeListener('profileUpdated', handleProfileUpdate);
    };
  }, [currentAccount, currentUserData, accounts, loadData]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light" : "dark"} />

      {renderContent()}
      
            {/* FAB is now replaced by section header - keeping this comment for reference */}
      
            {/* Add Coffee Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddCoffeeModal}
        onRequestClose={() => setShowAddCoffeeModal(false)}
      >
        <View style={styles.addCoffeeModalContainer}>
          <View style={[
            styles.addCoffeeModalContent,
            { paddingBottom: insets.bottom + 12, backgroundColor: theme.cardBackground }
          ]}>
            <View style={[styles.addCoffeeModalHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.addCoffeeModalTitle, { color: theme.primaryText }]}>Add Coffee</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAddCoffeeModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.primaryText} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.addCoffeeOptionsContainer}>
              <TouchableOpacity
                style={[styles.addCoffeeOption, { backgroundColor: isDarkMode ? theme.cardBackground : theme.background, borderColor: theme.border }]}
                onPress={() => handleAddCoffeeOption('url')}
              >
                <Ionicons name="link-outline" size={24} color={theme.primaryText} />
                <View style={styles.addCoffeeOptionTextContainer}>
                  <Text style={[styles.addCoffeeOptionTitle, { color: theme.primaryText }]}>Paste URL</Text>
                  <Text style={[styles.addCoffeeOptionSubtitle, { color: theme.secondaryText }]}>Add coffee from a website URL</Text>
                </View>
                {/* <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} /> */}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.addCoffeeOption, { backgroundColor: isDarkMode ? theme.cardBackground : theme.background, borderColor: theme.border }]}
                onPress={() => handleAddCoffeeOption('camera')}
              >
                <Ionicons name="camera-outline" size={24} color={theme.primaryText} />
                <View style={styles.addCoffeeOptionTextContainer}>
                  <Text style={[styles.addCoffeeOptionTitle, { color: theme.primaryText }]}>Take Picture</Text>
                  <Text style={[styles.addCoffeeOptionSubtitle, { color: theme.secondaryText }]}>Scan coffee bag with camera</Text>
                </View>
                {/* <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} /> */}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.addCoffeeOption, { backgroundColor: isDarkMode ? theme.cardBackground : theme.background, borderColor: theme.border }]}
                onPress={() => handleAddCoffeeOption('gallery')}
              >
                <Ionicons name="image-outline" size={24} color={theme.primaryText} />
                <View style={styles.addCoffeeOptionTextContainer}>
                  <Text style={[styles.addCoffeeOptionTitle, { color: theme.primaryText }]}>Select Picture</Text>
                  <Text style={[styles.addCoffeeOptionSubtitle, { color: theme.secondaryText }]}>Choose from photo library</Text>
                </View>
                {/* <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} /> */}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.addCoffeeOption, { backgroundColor: isDarkMode ? theme.cardBackground : theme.background, borderColor: theme.border }]}
                onPress={() => handleAddCoffeeOption('manual')}
              >
                <Ionicons name="create-outline" size={24} color={theme.primaryText} />
                <View style={styles.addCoffeeOptionTextContainer}>
                  <Text style={[styles.addCoffeeOptionTitle, { color: theme.primaryText }]}>Enter Manually</Text>
                  <Text style={[styles.addCoffeeOptionSubtitle, { color: theme.secondaryText }]}>Fill out coffee details by hand</Text>
                </View>
                {/* <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} /> */}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Sort Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSortModal}
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.sortModalContainer}>
          <View style={[
            styles.sortModalContent,
            { paddingBottom: insets.bottom + 12, backgroundColor: theme.cardBackground }
          ]}>
            <View style={[styles.sortModalHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.sortModalTitle, { color: theme.primaryText }]}>Sort Collection</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowSortModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.primaryText} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sortOptionsContainer}>
              {[
                { value: 'recent', label: 'Recently Added', icon: 'time-outline' },
                { value: 'name', label: 'Coffee Name', icon: 'text-outline' },
                { value: 'roaster', label: 'Roaster Name', icon: 'business-outline' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption, 
                    { 
                      backgroundColor: isDarkMode ? theme.cardBackground : theme.background,
                      borderColor: theme.border 
                    }
                  ]}
                  onPress={() => {
                    setSortBy(option.value);
                    setShowSortModal(false);
                  }}
                >
                  <Ionicons name={option.icon} size={24} color={theme.primaryText} />
                  <Text style={[styles.sortOptionTitle, { color: theme.primaryText }]}>
                    {option.label}
                  </Text>
                  {sortBy === option.value && (
                    <Ionicons name="checkmark" size={24} color="#34C759" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
      
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
  placeholderAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#F0F0F0',
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
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  fabText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addCoffeeModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  addCoffeeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  addCoffeeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 0,
    // borderBottomWidth: 1,
    // borderBottomColor: '#E5E5E5',
  },
  addCoffeeModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  addCoffeeOptionsContainer: {
    padding: 16,
  },
  addCoffeeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 8,
  },
  addCoffeeOptionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  addCoffeeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  addCoffeeOptionSubtitle: {
    fontSize: 14,
    color: '#666666',
    display: 'none',
  },
  // Collection header styles
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    // borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor: '#E5E5EA',
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingHorizontal: 12,
    // paddingVertical: 8,
    // borderRadius: 20,
    // borderWidth: 1,
    // borderColor: '#E5E5EA',
  },
  sortChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortChipIcon: {
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // marginLeft: 8,
  },
  // Collection list view styles
  collectionListItem: {
    flexDirection: 'row',
    // padding: 16,
    // borderWidth: 1,
    // borderColor: '#E5E5EA',
    // borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    marginHorizontal: 0,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
    // elevation: 2,
  },
  collectionListImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  collectionListImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  collectionListInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  collectionListName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
  },
  collectionListRoaster: {
    fontSize: 16,
    color: '#666666',
  },
  // Sort modal styles
  sortModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sortModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 0,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  sortOptionsContainer: {
    padding: 16,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 8,
  },
  sortOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
    marginLeft: 16,
  },
}); 