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
import CoffeeLogCard from '../components/CoffeeLogCard';
import eventEmitter from '../utils/EventEmitter';
import mockGear from '../data/mockGear.json';
import mockUsers from '../data/mockUsers.json';
import mockRecipes from '../data/mockRecipes.json';
import mockCoffeesData from '../data/mockCoffees.json';
import gearDetails from '../data/gearDetails';
import { businessCoffees } from '../data/businessProducts';
import AppImage from '../components/common/AppImage';

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
    
    // Disable refresh control on initial load
    setEnableRefreshControl(false);
    
    // Set initial load flag
    setIsInitialLoad(true);
    
    // Initialize with the current account
    initializeWithAccount(currentAccount);
    
    // Enable scrolling after initial render with a delay
    setTimeout(() => {
      console.log('ProfileScreen - Enabling refresh control after initial delay');
      setEnableRefreshControl(true);
      setIsInitialLoad(false);
      setLastUpdate(Date.now());
    }, 1000);
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
      
      // Reset scroll position on account change
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
      }
      
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

  // Load data on mount and when current account changes
  useEffect(() => {
    console.log('Current user updated:', user);
    console.log('Display name:', displayName);
    console.log('Avatar URL:', avatarUrl);
    console.log('Current account:', currentAccount);
    console.log('Coffee Events count:', coffeeEvents?.length);
    console.log('Coffee Collection count:', coffeeCollection?.length);
    console.log('Coffee Wishlist count:', coffeeWishlist?.length);

    // If user is undefined or null after loading, try to load data again
    if (!user && !loading && !contextError) {
      console.log('User data missing, reloading...');
      initializeWithAccount(currentAccount);
    }
  }, [user, currentAccount, loading, contextError]);

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
            
            // Force refresh data to update the UI
            console.log('Forcing refresh to update the UI with new user data');
            setTimeout(() => {
              loadData(currentAccount);
            }, 100);
            
            // Clear the updatedUserData param to avoid re-processing
            navigation.setParams({ updatedUserData: null });
            
            // Update the lastUpdate timestamp to prevent immediate refresh
            setLastUpdate(now);
          }
        }
      } else {
        // Only refresh data if:
        // 1. It's the first load of the app (isInitialLoad = true)
        // 2. We haven't refreshed in a long time (> 30 seconds)
        // 3. User has explicitly pulled down to refresh (this is handled separately by the ScrollView's refreshControl)
        if (currentAccount && !refreshing && !loading && 
            (isInitialLoad || timeSinceLastUpdate > 30000)) {
          console.log(`Refreshing profile data. Initial load: ${isInitialLoad}, Time since last update: ${timeSinceLastUpdate}ms`);
          handleRefresh();
          setIsInitialLoad(false);
          setLastUpdate(now);
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
          <Text style={styles.usernameText}>@{userHandle}</Text>
          <Ionicons name="chevron-down" size={16} color="#000000" />
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
            <Ionicons name="bookmark-outline" size={24} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleOptionsPress}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#000000" />
          </TouchableOpacity>
        </View>
      )
    });
  }, [navigation, userHandle, handleOptionsPress]);

  // Listen for tab long press events
  useEffect(() => {
    const subscription = eventEmitter.addListener('profileTabLongPress', () => {
      setModalVisible(true);
    });
    
    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
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

      // Use the switchAccount function from CoffeeContext
      if (switchAccount) {
        switchAccount(accountId)
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
        console.error('switchAccount function not available');
        setLocalError('Switch account functionality not available');
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
  const handleUserPress = (event) => {
    navigation.navigate('UserProfileBridge', {
      userId: event.userId,
      skipAuth: true
    });
  };

  // Handle tab change
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
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
        <CoffeeLogCard
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
      style={styles.collectionCard}
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
        <Text style={styles.collectionCardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.collectionCardRoaster} numberOfLines={1}>{item.roaster}</Text>
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
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => handleRecipePress(item)}
    >
      <View style={styles.recipeCardHeader}>
        <View style={styles.recipeCardCreator}>
          {item.creatorAvatar ? (
            <Image 
              source={typeof item.creatorAvatar === 'string' ? { uri: item.creatorAvatar } : item.creatorAvatar} 
              style={styles.recipeCreatorAvatar} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.recipeCreatorAvatarPlaceholder}>
              <Ionicons name="person" size={14} color="#999999" />
            </View>
          )}
          <Text style={styles.recipeCreatorName} numberOfLines={1}>
            {item.creatorName || item.userName || 'Anonymous'}
          </Text>
        </View>
        <View style={styles.brewMethodTag}>
          <Text style={styles.brewMethodTagText}>{item.brewingMethod || item.method}</Text>
        </View>
      </View>
      
      <View style={styles.recipeCardInfo}>
        <Text style={styles.recipeCardName} numberOfLines={2}>{item.name || item.coffeeName}</Text>
        <Text style={styles.recipeCardCoffee} numberOfLines={1}>{item.coffeeName}</Text>
        <Text style={styles.recipeCardRoaster} numberOfLines={1}>{item.roaster}</Text>
        
        <View style={styles.recipeCardStats}>
          <View style={styles.recipeCardDetail}>
            <Text style={styles.recipeCardDetailValue}>{item.coffeeAmount || 18}g</Text>
            <Text style={styles.recipeCardDetailLabel}>Coffee</Text>
          </View>
          <View style={styles.recipeCardDetail}>
            <Text style={styles.recipeCardDetailValue}>{item.waterAmount || 300}ml</Text>
            <Text style={styles.recipeCardDetailLabel}>Water</Text>
          </View>
          <View style={styles.recipeCardDetail}>
            <Text style={styles.recipeCardDetailValue}>{item.brewTime || "3:00"}</Text>
            <Text style={styles.recipeCardDetailLabel}>Time</Text>
          </View>
        </View>
        
        <View style={styles.recipeUsageStats}>
          <Ionicons name="repeat" size={14} color="#666666" />
          <Text style={styles.recipeUsageText}>
            Used {item.usageCount || Math.floor(Math.random() * 20) + 1} times
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render tabs
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'coffee' && styles.activeTabButton]}
        onPress={() => handleTabChange('coffee')}
      >
        <Text style={[styles.tabText, activeTab === 'coffee' && styles.activeTabText]}>Activity</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === (isBusinessAccount ? 'shop' : 'collection') && styles.activeTabButton]}
        onPress={() => handleTabChange(isBusinessAccount ? 'shop' : 'collection')}
      >
        <Text style={[styles.tabText, activeTab === (isBusinessAccount ? 'shop' : 'collection') && styles.activeTabText]}>
          {isBusinessAccount ? 'Shop' : 'Collection'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'recipes' && styles.activeTabButton]}
        onPress={() => handleTabChange('recipes')}
      >
        <Text style={[styles.tabText, activeTab === 'recipes' && styles.activeTabText]}>Recipes</Text>
      </TouchableOpacity>
    </View>
  );

  // Render empty state
  const renderEmptyState = (message) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cafe-outline" size={50} color="#CCCCCC" />
      <Text style={styles.emptyText}>{message}</Text>
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
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 0 }}
        scrollToOverflowEnabled={false}
        automaticallyAdjustContentInsets={false}
        scrollsToTop={true}
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
        <View style={[styles.profileHeader]}>
          <Image 
            source={typeof avatarUrl === 'string' ? { uri: avatarUrl } : avatarUrl} 
            style={[
              styles.avatar,
              isBusinessAccount ? styles.businessAvatar : styles.userAvatar
            ]} 
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.location}>{location}</Text>
          </View>
        </View>
        
        {/* Gear Module - showing user's gear */}
        {renderGearModule()}
        
        {/* Tabs for collection/wishlist/recipes */}
        {renderTabs()}
        
        {/* Tab Content */}
        {activeTab === 'coffee' && (
          <View style={styles.sectionContainer}>
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
          <View style={styles.sectionContainer}>
            {isBusinessAccount && (
              <View style={styles.recipeFilterContainer}>
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[
                      styles.segment,
                      shopFilter === 'coffee' && styles.segmentActive
                    ]}
                    onPress={() => setShopFilter('coffee')}
                  >
                    <Text style={[
                      styles.segmentText,
                      shopFilter === 'coffee' && styles.segmentTextActive
                    ]}>Coffee</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.segment,
                      shopFilter === 'gear' && styles.segmentActive
                    ]}
                    onPress={() => setShopFilter('gear')}
                  >
                    <Text style={[
                      styles.segmentText,
                      shopFilter === 'gear' && styles.segmentTextActive
                    ]}>Gear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {isBusinessAccount && shopFilter === 'gear' ? (
              <View style={styles.collectionSection}>
                <FlatList
                  data={mockGear.gear.filter(gear => getBusinessGear(currentAccount, userData?.userName).includes(gear.id))}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.collectionCard}
                      onPress={() => handleGearPress(item.name)}
                    >
                      <Image
                        source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1575441347544-11725ca18b26' }}
                        style={styles.collectionCardImage}
                        resizeMode="cover"
                      />
                      <View style={styles.collectionCardInfo}>
                        <Text style={styles.collectionCardName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.collectionCardRoaster} numberOfLines={1}>{item.brand}</Text>
                        <Text style={styles.collectionCardPrice}>{typeof item.price === 'number' ? `€${item.price.toFixed(2)}` : item.price}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  numColumns={2}
                  columnWrapperStyle={styles.collectionCardRow}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                  contentContainerStyle={{paddingHorizontal: 16, paddingTop: 16}}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No gear in shop</Text>
                    </View>
                  )}
                />
              </View>
            ) : isBusinessAccount && shopFilter === 'coffee' ? (
              <View style={styles.collectionSection}>
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
                        style={styles.collectionCard}
                        onPress={() => handleCoffeePress(item)}
                      >
                        <Image
                          source={{ uri: coffeeData.image || coffeeData.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e' }}
                          style={styles.collectionCardImage}
                          resizeMode="cover"
                        />
                        <View style={styles.collectionCardInfo}>
                          <Text style={styles.collectionCardName} numberOfLines={1}>{coffeeData.name}</Text>
                          <Text style={styles.collectionCardRoaster} numberOfLines={1}>{coffeeData.roaster}</Text>
                          <Text style={styles.collectionCardPrice}>{typeof item.price === 'number' ? `€${item.price.toFixed(2)}` : item.price}</Text>
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
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No coffees in shop</Text>
                    </View>
                  )}
                />
              </View>
            ) : coffeeCollection && coffeeCollection.length > 0 ? (
              <View style={styles.collectionSection}>
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
          <View style={styles.sectionContainer}>
            {console.log('Rendering recipes tab')}
            <View style={styles.collectionSection}>
              <FlatList
                data={getFilteredRecipes()}
                renderItem={renderRecipeItem}
                keyExtractor={(item, index) => item.id || `recipe-${index}`}
                numColumns={2}
                columnWrapperStyle={styles.collectionCardRow}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
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
          userInterfaceStyle: 'light'
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Edit Profile
            navigation.navigate('EditProfile', { userData: completeUserData });
          } else if (buttonIndex === 1) {
            // Settings
            Alert.alert('Coming Soon', 'Settings functionality will be available soon.');
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
                    Alert.alert('Signed Out', 'You have been signed out successfully');
                  }
                }
              ]
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
          { text: 'Settings', onPress: () => Alert.alert('Coming Soon', 'Settings functionality will be available soon.') },
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
                      Alert.alert('Signed Out', 'You have been signed out successfully');
                    }
                  }
                ]
              );
            } 
          },
          { text: 'Cancel', style: 'cancel' }
        ]
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
          { paddingBottom: insets.bottom + 12 }
        ]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Account</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={accounts || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.accountItem}
                onPress={() => handleSwitchAccount(item.id)}
              >
                <Image
                  source={typeof item.userAvatar === 'string' ? { uri: item.userAvatar } : item.userAvatar}
                  style={[styles.accountAvatar, defaultUsers[item.id]?.isBusinessAccount && styles.businessAvatar]}
                />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{item.userName || item.name}</Text>
                  <Text style={styles.accountEmail}>{item.email}</Text>
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
                  Alert.alert('Coming Soon', 'Create Account functionality will be available soon.');
                }}
              >
                <View style={styles.createAccountCircle}>
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.createAccountText}>Create Account</Text>
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
      <View style={styles.gearContainer}>
        <View style={styles.gearTitleRow}>
          <Text style={styles.gearTitle}>My gear</Text>
          
          <TouchableOpacity onPress={handleGearWishlistNavigate}>
            <Text style={styles.gearWishlistToggle}>
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
                  style={styles.gearItem}
                  onPress={() => handleGearPress(item)}
                >
                  {gearImage && (
                    <View style={styles.gearItemAvatarContainer}>
                      <AppImage 
                        source={{ uri: gearImage }}
                        style={styles.gearItemAvatar}
                        placeholder={null}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  <Text style={styles.gearItemText}>{item}</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyGearText}>
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
      // Only refresh data when coming from a screen that might have changed data
      // This avoids refreshing when coming back from gear-related screens
      const previousScreen = navigation.getState()?.routes?.[navigation.getState().index - 1]?.name;
      const skipRefreshScreens = ['GearWishlist', 'GearDetail'];
      
      if (!skipRefreshScreens.includes(previousScreen)) {
        // This ensures data is fresh when returning to this screen from non-gear screens
        handleRefresh();
      }
    });
    
    // Cleanup
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentAccount, handleRefresh, navigation]);

  // Listen for profile updates
  useEffect(() => {
    const subscription = eventEmitter.addListener('profileUpdated', (data) => {
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
        
        // Force refresh data to update the UI
        setTimeout(() => {
          loadData(currentAccount);
        }, 100);
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, [currentAccount]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

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
    backgroundColor: '#FFFFFF',
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
    borderWidth: 1,
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
    paddingTop: 8,
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
    color: '#0066CC',
    fontWeight: '500',
    padding: 0,
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
    backgroundColor: '#F2F2F7',
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
  recipeCard: {
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 6,
  },
  recipeCardCreator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recipeCreatorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    backgroundColor: '#F5F5F7',
  },
  recipeCreatorAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeCreatorName: {
    fontSize: 10,
    color: '#666666',
    flex: 1,
  },
  brewMethodTag: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  brewMethodTagText: {
    fontSize: 10,
    color: '#333333',
    fontWeight: '500',
  },
  recipeCardInfo: {
    padding: 10,
  },
  recipeCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    height: 36,
  },
  recipeCardCoffee: {
    fontSize: 12,
    color: '#333333',
    marginBottom: 2,
  },
  recipeCardRoaster: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 8,
  },
  recipeCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F7',
  },
  recipeCardDetail: {
    alignItems: 'center',
  },
  recipeCardDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  recipeCardDetailLabel: {
    fontSize: 10,
    color: '#888888',
  },
  recipeUsageStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  recipeUsageText: {
    fontSize: 10,
    color: '#666666',
    marginLeft: 4,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
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
}); 