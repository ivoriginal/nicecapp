import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
  Platform,
  ActionSheetIOS,
  TextInput,
  Modal,
  Dimensions,
  Animated,
  PanResponder,
  Linking
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
// Import the raw JSON data to ensure it's available
import mockUsersData from '../data/mockUsers.json';
import mockRecipesData from '../data/mockRecipes.json';
import mockEventsData from '../data/mockEvents.json';
import mockCafesData from '../data/mockCafes.json';
import mockCoffeesData from '../data/mockCoffees.json';
import mockGear from '../data/mockGear.json';
import gearDetails from '../data/gearDetails';
import { businessCoffees } from '../data/businessProducts';
// Import mock followers data
import { mockFollowersData } from '../data/mockFollowers';
// Initialize default empty mock data structures to prevent "undefined" errors
const defaultMockData = mockUsersData || { users: [], trendingCafes: [], businesses: [] };
import { useCoffee } from '../context/CoffeeContext';
import AppImage from '../components/common/AppImage';
import ThemeCoffeeLogCard from '../components/ThemeCoffeeLogCard';
import FollowButton from '../components/FollowButton';
import { COLORS, FONTS, SIZES } from '../constants';
import AnimatedTabBar from '../components/AnimatedTabBar';
import { useUser } from '../context/UserContext';
import RecipeCard from '../components/RecipeCard';
import { useTheme } from '../context/ThemeContext';

// Helper component to safely render FlatLists inside ScrollView
const SafeFlatList = ({ data, ...props }) => {
  if (!data || data.length === 0) {
    return props.ListEmptyComponent ? props.ListEmptyComponent() : null;
  }
  
  return (
    <FlatList
      data={data}
      scrollEnabled={false} // prevent scrolling to avoid nested scrollviews warning
      {...props}
    />
  );
};

// Fallback implementation in case dataService's getMockUser is unavailable
const getMockUserFallback = (userId) => {
  if (!mockUsersData || !mockUsersData.users) {
    console.warn('mockUsersData is not available');
    return null;
  }
  return mockUsersData.users.find(u => u.id === userId);
};

// After imports, add a helper function for gear images
const getGearImage = (gearName) => {
  if (!gearName) return null;
  
  // First try to find in mockGear.gear
  const mockGearItem = mockGear.gear.find(g => g.name === gearName);
  if (mockGearItem && mockGearItem.imageUrl) {
    return mockGearItem.imageUrl;
  }
  
  // Then check if it's in gearDetails
  const gearItem = gearDetails[gearName];
  if (gearItem && gearItem.image) {
    return gearItem.image;
  }
  
  // If we can't find an image, return null
  return null;
};

export default function UserProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { userId, userName, isCurrentUser, ensureHeaderShown, isLocation, parentBusinessId, isModalView = false } = route.params || { userId: 'user1' };
  const { allEvents, following, followers, loadData: loadGlobalData, currentAccount, removeCoffeeEvent } = useCoffee();
  const { currentUser } = useUser();
  const { theme, isDarkMode } = useTheme();
  
  const [user, setUser] = useState(null);
  const [userCoffees, setUserCoffees] = useState([]);
  const [roasterCoffees, setRoasterCoffees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('coffees'); // 'coffees' represents the Activity tab which will show coffee logs and other types of events
  const [isFollowing, setIsFollowing] = useState(false);
  const [collectionCoffees, setCollectionCoffees] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [gear, setGear] = useState([]);
  const [userLogs, setUserLogs] = useState([]);
  const [enableRefreshControl, setEnableRefreshControl] = useState(false);

  const [showAllDesc, setShowAllDesc] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [error, setError] = useState(null);
  const [coffeeEvents, setCoffeeEvents] = useState([]);
  const [shopFilter, setShopFilter] = useState('coffee');
  // Add states for follower data
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [mutualFollowers, setMutualFollowers] = useState([]);
  
  // Add refs and state for scroll-based header
  const scrollViewRef = useRef(null);
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);
  const profileSectionHeight = 100; // Height threshold to show header title
  
  // Add review modal states
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [parentRoasterData, setParentRoasterData] = useState(null);
  const [userReviews, setUserReviews] = useState([]);
  
  // Add profile picture viewer states
  const [showProfilePicture, setShowProfilePicture] = useState(false);
  const profilePictureTranslateY = useRef(new Animated.Value(0)).current;

  // Pan responder for drag-to-dismiss profile picture
  const profilePicturePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to vertical gestures, and require a minimum threshold
        return Math.abs(gestureState.dy) > 5 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only update translateY if gesture is primarily vertical
        if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
          // Clamp the movement to prevent overscrolling
          const clampedValue = Math.max(-50, Math.min(gestureState.dy, Dimensions.get('window').height));
          profilePictureTranslateY.setValue(clampedValue);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Only consider vertical movement for dismissal
        const verticalMovement = gestureState.dy;
        const verticalVelocity = gestureState.vy;
        
        // Calculate thresholds
        const isQuickFlick = Math.abs(verticalVelocity) > 0.8;
        const isDraggedFarEnough = Math.abs(verticalMovement) > 150;
        
                 // Only dismiss if moving downward (positive dy)
         if ((isQuickFlick || isDraggedFarEnough) && verticalMovement > 0) {
           // Dismiss with smooth animation
           Animated.timing(profilePictureTranslateY, {
             toValue: Dimensions.get('window').height,
             duration: 200,
             useNativeDriver: true,
           }).start(() => {
             // Just hide modal - value will be reset when modal opens next time
             setShowProfilePicture(false);
           });
        } else {
          // Spring back to original position
          Animated.spring(profilePictureTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Get cover image URL from user data or route params  
  const coverImageUrl = user?.coverImage || route.params?.coverImage;

  const isFocused = useIsFocused();

  // Set up header navigation options
  useLayoutEffect(() => {
    const displayName = user?.userName || userName || 'Profile';
    navigation.setOptions({
      headerShown: true,
      headerTransparent: false,
      headerStyle: {
        backgroundColor: theme.background,
        elevation: 0, // Remove shadow for Android
        shadowOpacity: 0, // Remove shadow for iOS
        shadowRadius: 0,
        borderBottomWidth: showHeaderTitle ? 1 : 0, // Show border when title is visible
        borderBottomColor: theme.divider
      },
      headerTitle: showHeaderTitle ? displayName : '', // Show title based on scroll position
      headerTintColor: theme.primaryText, // Set back button color
      headerBackTitleVisible: false, // Hide back button title on iOS
      headerRight: () => (
        <TouchableOpacity 
          onPress={handleOptionsPress} 
          style={{ marginRight: 16 }}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.primaryText} />
        </TouchableOpacity>
      )
    });
  }, [navigation, theme, showHeaderTitle, user, userName]);

  // Reset header when screen comes into focus (fixes header disappearing issue when navigating back)
  useFocusEffect(
    useCallback(() => {
      const displayName = user?.userName || userName || 'Profile';
      // Force header to be shown and reset any conflicting options
      navigation.setOptions({
        headerShown: true,
        headerTransparent: false,
        headerStyle: {
          backgroundColor: theme.background,
          elevation: 0,
          shadowOpacity: 0,
          shadowRadius: 0,
          borderBottomWidth: showHeaderTitle ? 1 : 0,
          borderBottomColor: theme.divider
        },
        headerTitle: showHeaderTitle ? displayName : '',
        headerTintColor: theme.primaryText,
        headerBackTitleVisible: false,
      });
    }, [navigation, theme, showHeaderTitle, user, userName])
  );

  // Handle options button press
  const handleOptionsPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Share Profile', 'Cancel'],
          cancelButtonIndex: 1,
          userInterfaceStyle: isDarkMode ? 'dark' : 'light' // Match system appearance
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Share Profile
            Alert.alert('Share', `Sharing ${user?.userName || 'user'}'s profile`);
            // In a real app, you would implement actual sharing functionality here
          }
        }
      );
    } else {
      // For Android, we would use a custom modal or menu
      Alert.alert(
        'Options',
        'Choose an option',
        [
          { 
            text: 'Share Profile', 
            onPress: () => Alert.alert('Share', `Sharing ${user?.userName || 'user'}'s profile`) 
          },
          { text: 'Cancel', style: 'cancel' }
        ],
        {
          userInterfaceStyle: isDarkMode ? 'dark' : 'light'
        }
      );
    }
  };



  // Handle scroll events to show/hide header title
  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const shouldShowTitle = scrollY > profileSectionHeight;
    
    if (shouldShowTitle !== showHeaderTitle) {
      setShowHeaderTitle(shouldShowTitle);
    }
  };



  // Determine tabs based on user type
  const getTabs = () => {
    if (user?.isRoaster) {
      return [
        { id: 'information', label: 'About' },
        { id: 'locations', label: 'Locations' },
        { id: 'shop', label: 'Shop' }
      ];
    } else if (user?.isBusinessAccount) {
      // For cafés and other business accounts, show about first, then activity, shop and recipes tabs
      return [
        { id: 'information', label: 'About' },
        { id: 'coffees', label: 'Activity' },
        { id: 'shop', label: 'Shop' },
        { id: 'recipes', label: 'Recipes' }
      ];
    } else {
      return [
        { id: 'coffees', label: 'Activity' },
        { id: 'collection', label: 'Collection' },
        { id: 'recipes', label: 'Recipes' }
      ];
    }
  };

  // Set default active tab based on user type
  useEffect(() => {
    if (user?.isRoaster && (activeTab === 'coffees' || activeTab === 'locations')) {
      setActiveTab('information');
    } else if (user?.isBusinessAccount && !user?.isRoaster && (activeTab === 'coffees' || activeTab === 'locations')) {
      setActiveTab('information');
    } else if (!user?.isRoaster && !user?.isBusinessAccount && (activeTab === 'locations')) {
      setActiveTab('coffees');
    }
  }, [user]);

  // Fetch initial data
  useEffect(() => {
    loadProfileData();
    
    // Add navigation focus listener - but don't auto-refresh on every focus to prevent annoying "moving down" behavior
    const unsubscribe = navigation.addListener('focus', () => {
      // Only refresh if coming from screens that might have changed data (like editing)
      // Most of the time, users just want to view the profile without it reloading
      console.log('UserProfileScreen focused - not auto-refreshing to prevent unwanted movement');
    });
    
    // Cleanup
    return unsubscribe;
  }, [userId, allEvents, following, navigation]);

  // Refresh function
  const onRefresh = async () => {
    console.log('UserProfileScreen - Refreshing data');
    setRefreshing(true);
    try {
      await loadProfileData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadProfileData = async () => {
    console.log('UserProfileScreen - Loading data for userId:', userId);
    
    // Initialize with safe empty data
    setRoasterCoffees([]);
    setUserCoffees([]);
    
    // If we have proper allEvents data, filter it
    if (Array.isArray(allEvents)) {
      const userEvents = allEvents.filter(event => event.userId === userId || event.coffeeId === userId);
      setUserCoffees(userEvents);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    const loadAllProfileData = async () => {
      console.log('Loading all profile data for:', userId);
      console.log('Route params:', route.params);
      setLoading(true);
      
      try {
        // Debug: Check if mock data is available
        console.log('mockUsersData available:', !!mockUsersData);
        console.log('mockEventsData available:', !!mockEventsData);
        console.log('mockRecipesData available:', !!mockRecipesData);
        // First, get the user data
        let userData;
        if (isCurrentUser) {
          // If viewing own profile, use current user data
          userData = currentUser;
        } else {
          // Check if this is a business ID (roaster)
          if (userId.startsWith('business-')) {
            const businessData = mockUsersData.businesses?.find(b => b.id === userId) || 
                               mockCafesData.roasters?.find(b => b.id === userId);
            
            if (businessData) {
              // Find all cafe locations for this roaster
              const roasterCafes = mockCafesData.cafes?.filter(cafe => cafe.roasterId === userId) || [];
              
              userData = {
                ...businessData,
                userName: businessData.name,
                userAvatar: businessData.avatar || businessData.logo,
                isBusinessAccount: true,
                isRoaster: businessData.isRoaster || businessData.type?.includes('roaster'),
                location: businessData.location || route.params?.location,
                // Load cafe locations from mockCafes.json
                cafes: roasterCafes.map(cafe => ({
                  id: cafe.id,
                  name: cafe.name,
                  address: cafe.address,
                  location: cafe.location,
                  avatar: cafe.avatar || businessData.avatar || businessData.logo,
                  rating: cafe.rating || 4.8,
                  reviewCount: cafe.reviewCount || (100 + Math.floor(Math.random() * 50)),
                  phone: cafe.phone,
                  neighborhood: cafe.neighborhood,
                  openingHours: cafe.openingHours,
                  coordinates: cafe.coordinates
                }))
              };
              
              // Load coffees from mockCoffees.json for specific roasters
              if (userId === 'business-kima') {
                console.log('Loading Kima Coffee products');
                // Get coffees from mockCoffees.json where roasterId matches the business ID
                import('../data/mockCoffees.json').then(mockCoffeesData => {
                  const roasterCoffeeProducts = mockCoffeesData.coffees.filter(
                    coffee => coffee.roasterId === userId
                  );
                  console.log(`Found ${roasterCoffeeProducts.length} coffees for ${userData.userName}`);
                  setRoasterCoffees(roasterCoffeeProducts);
                });
              }
            }
          } else {
            // Check if this is a cafe ID from mockCafes.json
            const cafeData = mockCafesData.cafes?.find(c => c.id === userId);
            
            if (cafeData) {
              console.log('Found cafe data for', userId, ':', cafeData);
              
              // Get parent roaster info if available
              const parentRoaster = cafeData.roasterId ? 
                mockCafesData.roasters?.find(r => r.id === cafeData.roasterId) : null;
              
              userData = {
                id: cafeData.id,
                userName: cafeData.name,
                userAvatar: cafeData.avatar,
                coverImage: cafeData.coverImage,
                location: cafeData.location,
                bio: cafeData.description || '',
                phone: cafeData.phone,
                address: cafeData.address,
                rating: cafeData.rating,
                reviewCount: cafeData.reviewCount,
                categories: cafeData.categories,
                priceRange: cafeData.priceRange,
                openingHours: cafeData.openingHours,
                coordinates: cafeData.coordinates,
                neighborhood: cafeData.neighborhood,
                isBusinessAccount: true,
                isLocation: !!cafeData.roasterId,
                parentBusinessId: cafeData.roasterId,
                parentBusinessName: parentRoaster ? parentRoaster.name : null,
                gear: [],
                gearWishlist: []
              };
            } else {
              // Otherwise, fetch the requested user using the fallback function
              userData = getMockUserFallback(userId);
              console.log('Found user data for', userId, ':', userData);
            }
          }
        }
        
        if (userData) {
          console.log('Setting user data:', userData);
          
          // Special handling for Vértigo y Calambre: if we get user2, redirect to business-vertigo
          if (userData.id === 'user2' && userData.userName === 'Vértigo y Calambre') {
            console.log('Redirecting user2 to business-vertigo for Vértigo y Calambre');
            navigation.replace('UserProfileBridge', {
              userId: 'business-vertigo',
              userName: 'Vértigo y Calambre',
              skipAuth: true
            });
            return;
          }
          
          // If route params include isRoaster, isBusinessAccount, or location, merge them with userData
          if (route.params?.isRoaster !== undefined || 
              route.params?.isBusinessAccount !== undefined ||
              route.params?.location) {
            userData = {
              ...userData,
              isRoaster: route.params.isRoaster !== undefined ? route.params.isRoaster : userData.isRoaster,
              isBusinessAccount: route.params.isBusinessAccount !== undefined ? 
                route.params.isBusinessAccount : userData.isBusinessAccount,
              location: route.params.location || userData.location
            };
          }
          
          // Additional check for business accounts by name (in case the flag wasn't set in route params)
          if (userData.userName === 'Vértigo y Calambre' || 
              userData.userName === 'Kima Coffee' ||
              (userData.userName && userData.userName.includes('Café')) ||
              userData.id?.startsWith('business-')) {
            userData.isBusinessAccount = true;
          }
          
          setUser(userData);
          
          // Get user logs from mockEvents.json
          const userEvents = mockEventsData.coffeeEvents.filter(event => 
            event.userId === userId && 
            !event.isPrivate // Don't show private events
          );
          
          setUserLogs(userEvents);
          
          // Get recipes from mockRecipes.json
          const userRecipes = mockRecipesData.recipes.filter(recipe => 
            recipe.creatorId === userId || recipe.userId === userId
          );
          
          setRecipes(userRecipes);
        } else {
          // Show alert that profile was not found
          console.warn(`Profile not found for userId: ${userId}, userName: ${route.params?.userName}`);
          Alert.alert(
            'Profile Not Found',
            `The profile for "${route.params?.userName || userId}" could not be found.`,
            [
              {
                text: 'Go Back',
                onPress: () => navigation.goBack(),
                style: 'cancel'
              },
              {
                text: 'OK',
                onPress: () => {
                  // Create a default user if none found
                  setUser({
                    id: userId,
                    userName: route.params?.userName || 'User',
                    userAvatar: null,
                    location: '',
                    bio: '',
                    isBusinessAccount: route.params?.isBusinessAccount || false,
                    isRoaster: route.params?.isRoaster || false,
                    userHandle: userId,
                    gear: [],
                    gearWishlist: []
                  });
                }
              }
            ],
            {
              userInterfaceStyle: isDarkMode ? 'dark' : 'light'
            }
          );
        }
        
        // Load followers data
        const followerData = mockFollowersData[userId];
        if (followerData) {
          setFollowersCount(followerData.followers?.length || 0);
          setFollowingCount(followerData.following?.length || 0);
          
          // Also update isFollowing state if this is another user's profile
          if (!isCurrentUser && currentUser) {
            const currentUserId = currentUser.id || 'user1';
            const isUserFollowing = followerData.followers?.includes(currentUserId) || false;
            setIsFollowing(isUserFollowing);
          }
        } else {
          setFollowersCount(0);
          setFollowingCount(0);
        }
        
        // Also load user events data
        setUserCoffees([]);
        
        // If we have proper allEvents data, filter it
        if (Array.isArray(allEvents)) {
          const userEvents = allEvents.filter(event => event.userId === userId || event.coffeeId === userId);
          setUserCoffees(userEvents);
        }
        
        // For specific roasters, load their coffees if not loaded above
        if (userId === 'business-kima' && roasterCoffees.length === 0) {
          // Load Kima coffees directly from the JSON file
          import('../data/mockCoffees.json').then(mockCoffeesData => {
            const kimaCoffees = mockCoffeesData.coffees.filter(
              coffee => coffee.roasterId === 'business-kima'
            );
            console.log(`Found ${kimaCoffees.length} coffees for Kima Coffee`);
            setRoasterCoffees(kimaCoffees);
          }).catch(error => {
            console.error('Error loading coffee data:', error);
          });
        }

        // Load collection coffees for regular users (coffees they've tried)
        if (!userData?.isBusinessAccount && mockEventsData.coffeeEvents) {
          const userEvents = mockEventsData.coffeeEvents.filter(event => 
            event.userId === userId && 
            event.coffeeId && 
            (event.type === 'coffee_log' || !event.type)
          );
          
          // Get unique coffees from user events
          const coffeesInCollection = userEvents
            .map(event => ({
              id: event.coffeeId,
              name: event.coffeeName,
              roaster: event.roaster || event.roasterName || 'Unknown Roaster',
              imageUrl: event.imageUrl,
              lastBrewedDate: event.date
            }));
          
          // Remove duplicates (keep only most recent brew of each coffee)
          const uniqueCoffees = [];
          const coffeeIds = new Set();
          
          coffeesInCollection.forEach(coffee => {
            if (!coffeeIds.has(coffee.id)) {
              coffeeIds.add(coffee.id);
              uniqueCoffees.push(coffee);
            }
          });
          
          setCollectionCoffees(uniqueCoffees);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        console.error('Error details:', error.message, error.stack);
        
        // Show alert about loading error
        Alert.alert(
          'Error Loading Profile',
          `There was an error loading the profile for "${route.params?.userName || userId}". ${error.message}`,
          [
            {
              text: 'Go Back',
              onPress: () => navigation.goBack(),
              style: 'cancel'
            },
            {
              text: 'Retry',
              onPress: () => {
                                  // Retry loading
                  setLoading(true);
                  setTimeout(() => {
                    if (loadAllProfileData) {
                      loadAllProfileData();
                    }
                  }, 100);
              }
            },
            {
              text: 'Continue',
              onPress: () => {
                // Still set a default user to prevent infinite loading
                setUser({
                  id: userId,
                  userName: route.params?.userName || 'User',
                  userAvatar: null,
                  location: '',
                  bio: '',
                  isBusinessAccount: route.params?.isBusinessAccount || false,
                  isRoaster: route.params?.isRoaster || false,
                  userHandle: userId,
                  gear: [],
                  gearWishlist: []
                });
              }
            }
          ],
          {
            userInterfaceStyle: isDarkMode ? 'dark' : 'light'
          }
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        
        // Enable the refresh control only after initial loading is complete
        setTimeout(() => {
          setEnableRefreshControl(true);
        }, 500);
      }
    };
    
    loadAllProfileData();
  }, [userId, isCurrentUser, currentUser, allEvents, route.params]);

  const handleFollowPress = () => {
    if (isFollowing) {
      // Show confirmation alert when unfollowing
      Alert.alert(
        `Unfollow ${user.userName}?`,
        '',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Unfollow',
            onPress: () => {
              setIsFollowing(false);
            },
            style: 'destructive', // This makes the button red
          },
        ],
        {
          userInterfaceStyle: isDarkMode ? 'dark' : 'light' // Match system appearance
        }
      );
    } else {
      // Follow user directly without confirmation
      setIsFollowing(true);
    }
  };

  const handleGearPress = (item) => {
    console.log('Navigating to GearDetail with:', item);
    navigation.navigate('GearDetail', {
      gearName: item
    });
  };

  const handleGearWishlistPress = () => {
    // Navigate to gear wishlist screen
    navigation.navigate('GearWishlist', {
      userId: userId, 
      userName: user.userName
    });
  };

  // Renders a coffee log or other event item using the CoffeeLogCard component
  const renderCoffeeItem = ({ item, index }) => {
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
    
    // Log enhanced item for debugging
    console.log('Enhanced coffee card item:', {
      id: enhancedItem.id,
      brewingMethod: enhancedItem.brewingMethod,
      method: enhancedItem.method,
      amount: enhancedItem.amount,
      grindSize: enhancedItem.grindSize,
      waterVolume: enhancedItem.waterVolume,
      brewTime: enhancedItem.brewTime,
      type: enhancedItem.type
    });
    
    return (
    <ThemeCoffeeLogCard
      event={enhancedItem}
      onCoffeePress={() => navigation.navigate('CoffeeDetail', { coffeeId: enhancedItem.coffeeId, skipAuth: true })}
      onRecipePress={() => navigation.navigate('RecipeDetail', { 
        recipeId: enhancedItem.id,
        coffeeId: enhancedItem.coffeeId,
        coffeeName: enhancedItem.coffeeName,
        roaster: enhancedItem.roaster || enhancedItem.roasterName,
        imageUrl: enhancedItem.imageUrl,
        recipe: enhancedItem,
        userId: enhancedItem.userId,
        userName: enhancedItem.userName,
        userAvatar: enhancedItem.userAvatar
      })}
      onUserPress={(event) => navigation.navigate('UserProfileScreen', { 
        userId: event.userId,
        userName: event.userName,
        userAvatar: event.userAvatar,
        isBusinessAccount: event.isBusinessAccount || false,
        skipAuth: true 
      })}
      onOptionsPress={handleOptionsPress}
      onLikePress={handleLikePress}
      currentUserId={currentAccount}
      containerStyle={{
        marginBottom: index === userCoffees.length - 1 ? 0 : 8
      }}
    />
  );
  };

  // Handle like button press
  const handleLikePress = (eventId, isLiked) => {
    console.log('Like toggled:', eventId, isLiked);
    // API call would happen here
  };

  // Render coffee item for Shop tab (for roasters)
  // This function handles both direct coffee objects and reference objects that use coffeeId
  // If the item contains a coffeeId property but no name, it's a reference object to a coffee in mockCoffeesData
  // In that case, we look up the full coffee details from mockCoffeesData while preserving business-specific
  // pricing from the reference object
  const renderShopCoffeeItem = ({ item }) => {
    // If item is a reference to a coffee in mockCoffees.json
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
          styles.coffeeCard,
          isDarkMode 
            ? { backgroundColor: theme.cardBackground, borderWidth: 0 }
            : { backgroundColor: 'transparent', borderColor: theme.border, borderWidth: 1 }
        ]}
        onPress={() => navigation.navigate('CoffeeDetail', { 
          coffeeId: coffeeData.id,
          skipAuth: true 
        })}
      >
        <AppImage 
          source={coffeeData.image || coffeeData.imageUrl} 
          style={styles.coffeeImage}
          resizeMode="cover"
        />
        <View style={styles.coffeeInfo}>
          <Text style={[styles.coffeeName, { color: theme.primaryText }]} numberOfLines={1}>{coffeeData.name}</Text>
          <Text style={[styles.coffeeOrigin, { color: theme.secondaryText }]} numberOfLines={1}>{coffeeData.origin}</Text>
          <Text style={[styles.coffeePrice, { color: theme.primaryText }]}>{typeof item.price === 'number' ? `€${item.price.toFixed(2)}` : item.price}</Text>
        </View>
      </TouchableOpacity>
    );
  };



  // Load user's collection (coffees they've tried)
  useEffect(() => {
    if (!userId.startsWith('business-') && !loading) {
      // Get unique coffees from user events
      const userEvents = allEvents.filter(event => event.userId === userId);
      const coffeesInCollection = userEvents
        .filter(event => event.coffeeId && (event.type === 'coffee_log' || !event.type)) // Only coffee logs or brewing events
        .map(event => {
          return {
            id: event.coffeeId,
            name: event.coffeeName,
            roaster: event.roaster || event.roasterName || 'Unknown Roaster',
            imageUrl: event.imageUrl,
            lastBrewedDate: event.date
          };
        });
      
      // Remove duplicates (keep only most recent brew of each coffee)
      const uniqueCoffees = [];
      const coffeeIds = new Set();
      
      coffeesInCollection.forEach(coffee => {
        if (!coffeeIds.has(coffee.id)) {
          coffeeIds.add(coffee.id);
          uniqueCoffees.push(coffee);
        }
      });
      
      setCollectionCoffees(uniqueCoffees);
    }
  }, [userId, allEvents, loading]);

  const handleFollowChange = (userId, isFollowing) => {
    console.log(`User ${userId} follow status changed to ${isFollowing}`);
    // In a real app, you would call your API to update follow status
  };
  
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };
  
  const tabs = [
    { label: 'Coffee Logs' },
    { label: 'Reviews' },
    { label: 'Recipes' },
  ];
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Coffee Logs
        return (
          <View style={[styles.tabContent, { backgroundColor: theme.background }]}>
            {userLogs.length > 0 ? (
              userLogs.map(log => (
                <ThemeCoffeeLogCard 
                  key={log.id} 
                  log={log} 
                  containerStyle={styles.logCard}
                />
              ))
            ) : (
              <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No coffee logs yet</Text>
            )}
          </View>
        );
        
      case 1: // Reviews
        return (
          <View style={[styles.tabContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No reviews yet</Text>
          </View>
        );
        
      case 2: // Recipes
        return (
          <View style={styles.recipesContainer}>
            {recipes && recipes.length > 0 ? (
              <SafeFlatList
                data={recipes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <RecipeCard
                    recipe={item}
                    onPress={() => handleRecipePress(item)}
                    onUserPress={() => null} // We don't need to navigate to the user since we're already on their profile
                    showCoffeeInfo={true}
                    style={styles.recipeCard}
                  />
                )}
                contentContainerStyle={styles.recipeListContainer}
              />
            ) : (
              <View style={[styles.standardEmptyContainer, { backgroundColor: theme.background }]}>
                <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No recipes yet</Text>
                {user?.id === 'user1' && (
                  <TouchableOpacity 
                    style={[styles.createButton, { backgroundColor: theme.primaryText }]}
                    onPress={() => navigation.navigate('CreateRecipe')}
                  >
                    <Text style={[styles.createButtonText, { color: isDarkMode ? theme.background : '#FFFFFF' }]}>Create Recipe</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
        
      default:
        return null;
    }
  };

  // Load Kima's coffees when in the shop tab
  useEffect(() => {
    if (user?.isRoaster && activeTab === 'shop' && roasterCoffees.length === 0) {
      console.log('Loading Kima coffees for shop tab');
      // Filter coffees for Kima (business-kima)
      const kimaCoffees = mockCoffeesData.coffees.filter(coffee => 
        coffee.roaster === 'Kima Coffee' || 
        coffee.roasterId === 'business-kima'
      );
      setRoasterCoffees(kimaCoffees);
    } else if (user?.isBusinessAccount && !user?.isRoaster && activeTab === 'shop' && roasterCoffees.length === 0) {
      // Load special coffees for Vértigo y Calambre
      if (user.userName === 'Vértigo y Calambre' || user.id === 'user2') {
        // Get coffee data from our unified business coffees data structure
        const businessId = 'user2';
        const businessCoffeeRefs = businessCoffees[businessId] || [];
        
        // Map reference list to full coffee data objects
        const vertigoCoffees = businessCoffeeRefs
          .map(coffeeRef => {
            const coffeeData = mockCoffeesData.coffees.find(c => c.id === coffeeRef.coffeeId);
            return coffeeData ? {
              ...coffeeData,
              price: coffeeRef.price // Use business-specific price
            } : null;
          })
          .filter(Boolean); // Remove any null values
        
        setRoasterCoffees(vertigoCoffees);
        
        // Also set gear for Vértigo y Calambre
        const vertigoGear = [
          {
            id: "gear1",
            name: "Fellow Stagg EKG",
            type: "Kettle",
            brand: "Fellow",
            price: 170,
            description: "Electric pour-over kettle with variable temperature control",
            imageUrl: "https://hola.coffee/cdn/shop/files/FELLOW-STAGG_1024x1024@2x.jpg?v=1732719228"
          },
          {
            id: "gear3",
            name: "Comandante C40 MK4",
            type: "Grinder",
            brand: "Comandante",
            price: 299.99,
            description: "Premium hand grinder featuring high-nitrogen stainless steel burrs",
            imageUrl: "https://images.unsplash.com/photo-1575441347544-11725ca18b26"
          },
          {
            id: "gear4",
            name: "Hario V60",
            type: "Pour Over",
            brand: "Hario",
            price: 24.99,
            description: "Iconic cone-shaped pour-over dripper with spiral ribs",
            imageUrl: "https://www.hario-europe.com/cdn/shop/files/VDC-01R_web.png?v=1683548122&width=1400"
          },
          {
            id: "gear6",
            name: "AeroPress",
            type: "Brewer",
            brand: "Aerobie",
            price: 29.99,
            description: "Versatile coffee maker that uses pressure for quick brewing",
            imageUrl: "https://aeropress.com/cdn/shop/files/Hero_Original_87a4958c-7df9-43b6-af92-0edc12c126cf_900x.png?v=1744683381"
          }
        ];
        
        setGear(vertigoGear);
      }
    }
  }, [user, activeTab, roasterCoffees.length]);

  const handleRecipePress = (item) => {
    navigation.navigate('RecipeDetail', { 
      recipeId: item.id,
      coffeeId: item.coffeeId,
      coffeeName: item.coffeeName,
      roaster: item.roaster,
      imageUrl: item.imageUrl,
      recipe: item,
      userId: item.creatorId,
      userName: item.creatorName || user?.userName,
      userAvatar: item.creatorAvatar || user?.userAvatar,
      isBusinessAccount: user?.isBusinessAccount
    });
  };

  // Render shop tab
  const renderShopTab = () => {
    // Get coffee data for this business
    const businessId = userId === 'user2' || (user && user.userName === 'Vértigo y Calambre')
      ? "user2"
      : userId === 'business-kima' ? "business-kima"
      : userId === 'business-toma' ? "business-toma"
      : null;
      
    const userCoffees = businessId && businessCoffees[businessId] ? businessCoffees[businessId] : [];
    
    // Check if user is a business and has gear in their shop tab
    const userGear = user && user.isBusinessAccount ? 
      mockGear.gear.filter(gear => businessGear.includes(gear.id)) : [];
      
    const hasContent = userCoffees.length > 0 || userGear.length > 0;
    
    return (
      <View style={styles.shopContainer}>
        {/* iOS-style segmented control */}
        <View style={[styles.segmentedControl, { backgroundColor: isDarkMode ? '#1c1c1f' : theme.cardBackground }]}>
          <TouchableOpacity
            style={[
              styles.segment,
              shopFilter === 'coffee' && [styles.segmentActive, { backgroundColor: isDarkMode ? '#5a5a5f' : theme.background }]
            ]}
            onPress={() => setShopFilter('coffee')}
          >
            <Text style={[
              styles.segmentText,
              { color: theme.secondaryText },
              shopFilter === 'coffee' && [styles.segmentTextActive, { color: theme.primaryText }]
            ]}>Coffees</Text>
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
        
        {shopFilter === 'coffee' ? (
          userCoffees.length > 0 ? (
            <SafeFlatList
              data={userCoffees}
              keyExtractor={(item) => item.coffeeId || item.id}
              renderItem={renderShopCoffeeItem}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
              showsVerticalScrollIndicator={false}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="cafe-outline" size={56} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>No coffees in shop</Text>
            </View>
          )
        ) : (
          userGear.length > 0 ? (
            <SafeFlatList
              data={userGear}
              keyExtractor={(item) => item.id}
              renderItem={renderGearItem}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
              showsVerticalScrollIndicator={false}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="basket-outline" size={56} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>No gear in shop</Text>
            </View>
          )
        )}
      </View>
    );
  };

  const renderGearItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.gearCard,
        isDarkMode 
          ? { backgroundColor: theme.cardBackground, borderWidth: 0 }
          : { backgroundColor: 'transparent', borderColor: theme.border, borderWidth: 1 }
      ]}
      onPress={() => navigation.navigate('GearDetail', { 
        gearName: item.name,
        gear: item
      })}
    >
      <View style={styles.gearImageContainer}>
        <AppImage 
          source={item.imageUrl} 
          style={styles.gearImage}
          resizeMode="cover"
          placeholder="cafe"
        />
      </View>
      <View style={styles.gearInfo}>
        <Text style={[styles.gearBrand, { color: theme.primaryText }]}>{item.brand}</Text>
        <Text style={[styles.gearName, { color: theme.secondaryText }]}>{item.name}</Text>
        <Text style={[styles.gearPrice, { color: theme.primaryText }]}>{typeof item.price === 'number' ? `€${item.price.toFixed(2)}` : item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  // Get businessGear for shop tab if it's a business account
  const businessGear = useMemo(() => {
    // Predefined list of gear IDs for Vértigo y Calambre
    if (userId === 'user2' || (user && user.userName === 'Vértigo y Calambre')) {
      return ['gear6', 'gear4', 'gear9', 'gear1', 'gear5', 'gear7', 'gear12', 'gear13'];
    }
    return [];
  }, [userId, user]);

  // Add function to load follower data
  useEffect(() => {
    // Load follower data when user is loaded
    if (user) {
      // Get follower data for the profile being viewed
      const profileFollowerData = mockFollowersData[userId];
      
      if (profileFollowerData) {
        // Set follower and following counts
        const followers = profileFollowerData.followers || [];
        const following = profileFollowerData.following || [];
        
        setFollowersCount(followers.length);
        setFollowingCount(following.length);
        
        // Set initial following state based on whether current user is following this profile
        const currentUserId = currentUser?.id || 'user1';
        const isUserFollowing = followers.includes(currentUserId);
        setIsFollowing(isUserFollowing);
        
        // Find mutual followers (people the current user follows who also follow this profile)
        if (mockFollowersData[currentUserId] && profileFollowerData.followers) {
          const currentUserFollowing = mockFollowersData[currentUserId].following || [];
          const mutualFollowerIds = profileFollowerData.followers.filter(
            followerId => currentUserFollowing.includes(followerId) && followerId !== currentUserId
          );
          
          // Get full user objects for the mutual followers
          const mutualFollowerUsers = mutualFollowerIds.map(id => 
            mockUsersData.users.find(user => user.id === id)
          ).filter(Boolean);
          
          setMutualFollowers(mutualFollowerUsers);
        }
      } else {
        // Set defaults if no data found
        setFollowersCount(0);
        setFollowingCount(0);
        setMutualFollowers([]);
      }
    }
  }, [user, userId, currentUser]);

  // Load parent roaster data
  useEffect(() => {
    if (user?.parentBusinessId && !user?.isRoaster) {
      const roasterData = mockCafesData.roasters?.find(r => r.id === user.parentBusinessId);
      if (roasterData) {
        setParentRoasterData(roasterData);
      }
    }
  }, [user]);

  // Handle review submission
  const handleSubmitReview = () => {
    if (reviewRating === 0) return;
    
    const newReview = {
      id: Date.now().toString(),
      userId: currentUser?.id || 'user1',
      userName: currentUser?.userName || 'You',
      userAvatar: currentUser?.userAvatar,
      rating: reviewRating,
      text: reviewText,
      date: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    setUserReviews(prev => [newReview, ...prev]);
    setShowReviewModal(false);
    setReviewText('');
    setReviewRating(0);
  };

  // Handle opening maps for address
  const handleAddressPress = (address) => {
    if (!address) return;
    
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
    });
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        Linking.openURL(webUrl);
      }
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primaryText} />
        <Text style={[styles.emptyText, { color: theme.primaryText }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light" : "dark"} />
      
      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[isDarkMode ? '#FFFFFF' : '#000000']}
            tintColor={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        }
      >
        {/* Profile Section */}
        {user && (
          <>
            <View style={[styles.profileSection, { backgroundColor: theme.background }]}>
              <TouchableOpacity onPress={() => {
              // Reset animation value before showing modal to prevent freeze
              profilePictureTranslateY.setValue(0);
              setShowProfilePicture(true);
            }}>
                <AppImage 
                  source={user.userAvatar || 'https://via.placeholder.com/80'} 
                  style={[
                    styles.profileImage,
                    user.isBusinessAccount ? styles.businessAvatar : styles.userAvatar
                  ]}
                  placeholder="person"
                />
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.primaryText }]}>
                  {user.userName || userName || 'Unknown User'}
                </Text>
                {user.isRoaster && (
                  <View style={[styles.roasterBadge, { backgroundColor: theme.cardBackground }]}>
                    <Text style={[styles.roasterBadgeText, { color: theme.primaryText }]}>Roaster</Text>
                  </View>
                )}
                <Text style={[styles.profileUsername, { color: theme.secondaryText }]}>
                  {(user.handle || user.userHandle || `@${user.userName?.toLowerCase().replace(/\s+/g, '') || 'user'}`)}
                </Text>
                {user.location && (
                  <Text style={[styles.profileLocation, { color: theme.secondaryText }]}>
                    {user.location}
                  </Text>
                )}
              </View>
            </View>

            {/* Bio */}
            {user.bio && (
              <Text style={[styles.profileBio, { color: theme.primaryText }]}>
                {user.bio}
              </Text>
            )}

            {/* Profile Stats */}
            <View style={[styles.followStatsContainer, { backgroundColor: theme.background }]}>
              <TouchableOpacity 
                style={styles.followStat}
                onPress={() => setActiveTab('collection')}
              >
                <Text style={[styles.followStatNumber, { color: theme.primaryText }]}>
                  {collectionCoffees.length}
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
                  {recipes.length}
                </Text>
                <Text style={[styles.followStatLabel, { color: theme.secondaryText }]}>
                  recipes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.followStat}
                onPress={() => {
                  navigation.navigate('FollowersScreen', {
                    userId: userId,
                    userName: user?.userName || userName,
                    type: 'followers',
                    skipAuth: true
                  });
                }}
              >
                <Text style={[styles.followStatNumber, { color: theme.primaryText }]}>
                  {followersCount}
                </Text>
                <Text style={[styles.followStatLabel, { color: theme.secondaryText }]}>
                  followers
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.followStat}
                onPress={() => {
                  navigation.navigate('FollowersScreen', {
                    userId: userId,
                    userName: user?.userName || userName,
                    type: 'following',
                    skipAuth: true
                  });
                }}
              >
                <Text style={[styles.followStatNumber, { color: theme.primaryText }]}>
                  {followingCount}
                </Text>
                <Text style={[styles.followStatLabel, { color: theme.secondaryText }]}>
                  following
                </Text>
              </TouchableOpacity>
            </View>

            {/* Gear Module - showing user's gear for non-business accounts */}
            {!user.isBusinessAccount && !user.isRoaster && (
              <View style={[styles.gearContainer, { backgroundColor: theme.background }]}>
                <View style={styles.gearTitleRow}>
                  <Text style={[styles.gearTitle, { color: theme.primaryText }]}>Gear</Text>
                  {user.gearWishlist && user.gearWishlist.length > 0 && (
                    <TouchableOpacity onPress={handleGearWishlistPress}>
                      <Text style={[styles.gearWishlistToggle, { color: theme.primaryText, borderBottomColor: theme.primaryText }]}>
                        Wishlist
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.gearScrollContainer}
                >
                  {user.gear && user.gear.length > 0 ? (
                    user.gear.map((item, index) => {
                      const gearImage = getGearImage(item);
                      
                      return (
                        <TouchableOpacity 
                          key={index} 
                          style={[styles.gearItem, { backgroundColor: theme.cardBackground }]}
                          onPress={() => handleGearPress(item)}
                        >
                          <View style={styles.gearItemAvatarContainer}>
                            {gearImage ? (
                              <Image 
                                source={{ uri: gearImage }}
                                style={styles.gearItemAvatar}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={[styles.gearItemAvatar, { backgroundColor: theme.placeholder }]} />
                            )}
                          </View>
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
            )}

            {/* Mutual Followers */}
            {mutualFollowers.length > 0 && (
              <View style={[styles.mutualFollowersContainer, { backgroundColor: theme.background }]}>
                <View style={styles.mutualFollowersAvatars}>
                  {mutualFollowers.slice(0, 3).map((follower, index) => (
                    <View 
                      key={follower.id} 
                      style={[
                        styles.mutualFollowerAvatarContainer,
                        { 
                          marginLeft: index > 0 ? -8 : 0,
                          borderColor: theme.background 
                        }
                      ]}
                    >
                      <AppImage 
                        source={follower.userAvatar}
                        style={styles.mutualFollowerAvatar}
                        placeholder="person"
                      />
                    </View>
                  ))}
                </View>
                <Text style={[styles.mutualFollowersText, { color: theme.secondaryText }]}>
                  Followed by{' '}
                  <Text style={[styles.mutualFollowerBold, { color: theme.primaryText }]}>
                    {mutualFollowers[0].userName}
                  </Text>
                  {mutualFollowers.length > 1 && (
                    <>
                      {mutualFollowers.length === 2 ? ' and ' : ', '}
                      <Text style={[styles.mutualFollowerBold, { color: theme.primaryText }]}>
                        {mutualFollowers.length === 2 
                          ? mutualFollowers[1].userName
                          : `${mutualFollowers.length - 1} others`
                        }
                      </Text>
                    </>
                  )}
                  {' you follow'}
                </Text>
              </View>
            )}

            {/* Follow Button */}
            {!isCurrentUser && (
              <View style={[styles.followButtonContainer, { backgroundColor: theme.background }]}>
                <TouchableOpacity
                  style={[
                    isFollowing ? styles.followingButton : styles.followButton,
                    { 
                      borderColor: theme.primaryText,
                      backgroundColor: isFollowing ? 'transparent' : theme.primaryText
                    }
                  ]}
                  onPress={handleFollowPress}
                >
                  <Text style={[
                    isFollowing ? styles.followingButtonText : styles.followButtonText,
                    { color: isFollowing ? theme.primaryText : (isDarkMode ? theme.background : '#FFFFFF') }
                  ]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Tabs */}
            <View style={[styles.tabsContainer, { backgroundColor: theme.background, borderBottomColor: theme.divider }]}>
              {getTabs().map((tab, index) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    activeTab === tab.id && [styles.activeTab, { borderBottomColor: theme.primaryText }]
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Text style={[
                    styles.tabText,
                    { color: theme.secondaryText },
                    activeTab === tab.id && [styles.activeTabText, { color: theme.primaryText }]
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab Content */}
            <View style={{ flex: 1, backgroundColor: theme.background }}>
              {activeTab === 'information' && user?.isBusinessAccount && (
                <View style={styles.informationContainer}>
                  {/* Basic Information */}
                  <View style={styles.infoSection}>
                    <Text style={[styles.infoSectionTitle, { color: theme.primaryText }]}>About</Text>
                    
                    {/* Address (for cafes) */}
                    {user.address && (
                      <TouchableOpacity 
                        style={styles.infoItem}
                        onPress={() => handleAddressPress(user.address)}
                      >
                        <Ionicons name="location-outline" size={20} color={theme.secondaryText} />
                        <Text style={[styles.infoText, { color: theme.primaryText }]}>{user.address}</Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* Location (for roasters - general location) */}
                    {!user.address && user.location && (
                      <View style={styles.infoItem}>
                        <Ionicons name="location-outline" size={20} color={theme.secondaryText} />
                        <Text style={[styles.infoText, { color: theme.primaryText }]}>{user.location}</Text>
                      </View>
                    )}
                    
                    {/* Phone */}
                    {user.phone && (
                      <View style={styles.infoItem}>
                        <Ionicons name="call-outline" size={20} color={theme.secondaryText} />
                        <Text style={[styles.infoText, { color: theme.primaryText }]}>{user.phone}</Text>
                      </View>
                    )}
                    
                    {/* Website (mainly for roasters) */}
                    {user.website && (
                      <View style={styles.infoItem}>
                        <Ionicons name="globe-outline" size={20} color={theme.secondaryText} />
                        <Text style={[styles.infoText, { color: theme.primaryText }]}>{user.website}</Text>
                      </View>
                    )}
                    
                    {/* Instagram (mainly for roasters) */}
                    {user.instagram && (
                      <View style={styles.infoItem}>
                        <Ionicons name="logo-instagram" size={20} color={theme.secondaryText} />
                        <Text style={[styles.infoText, { color: theme.primaryText }]}>{user.instagram}</Text>
                      </View>
                    )}
                    
                    {/* Neighborhood (for cafes) */}
                    {user.neighborhood && (
                      <View style={styles.infoItem}>
                        <Ionicons name="map-outline" size={20} color={theme.secondaryText} />
                        <Text style={[styles.infoText, { color: theme.primaryText }]}>{user.neighborhood}</Text>
                      </View>
                    )}
                    
                    {/* Price Range */}
                    {user.priceRange && (
                      <View style={styles.infoItem}>
                        <Ionicons name="card-outline" size={20} color={theme.secondaryText} />
                        <Text style={[styles.infoText, { color: theme.primaryText }]}>Price Range: {user.priceRange}</Text>
                      </View>
                    )}
                    
                    {/* Categories */}
                    {user.categories && user.categories.length > 0 && (
                      <View style={styles.infoItem}>
                        <Ionicons name="pricetag-outline" size={20} color={theme.secondaryText} />
                        <Text style={[styles.infoText, { color: theme.primaryText }]}>{user.categories.join(', ')}</Text>
                      </View>
                    )}
                  </View>

                  {/* Section divider */}
                  <View style={[styles.sectionDivider, { backgroundColor: theme.divider }]} />

                  {/* Description (mainly for roasters) */}
                  {user.description && (
                    <>
                      <View style={styles.infoSection}>
                        <Text style={[styles.infoSectionTitle, { color: theme.primaryText }]}>Description</Text>
                        <Text style={[styles.descriptionText, { color: theme.primaryText }]}>
                          {user.description}
                        </Text>
                      </View>
                      <View style={[styles.sectionDivider, { backgroundColor: theme.divider }]} />
                    </>
                  )}

                  {/* Parent Roaster (only for cafes, not roasters) */}
                  {user.parentBusinessName && !user.isRoaster && (
                    <>
                      <View style={styles.infoSection}>
                        <Text style={[styles.infoSectionTitle, { color: theme.primaryText }]}>Roaster</Text>
                        <TouchableOpacity
                          style={styles.parentRoasterContainer}
                          onPress={() => navigation.navigate('UserProfileBridge', {
                            userId: user.parentBusinessId,
                            userName: user.parentBusinessName,
                            skipAuth: true,
                            isRoaster: true,
                            isBusinessAccount: true
                          })}
                        >
                          <View style={styles.infoItem}>
                            {parentRoasterData?.avatar ? (
                              <AppImage 
                                source={parentRoasterData.avatar}
                                style={styles.roasterAvatar}
                                placeholder="business"
                              />
                            ) : (
                              <Ionicons name="business-outline" size={20} color={theme.secondaryText} />
                            )}
                            <Text style={[styles.infoText, { color: theme.primaryText }]}>{user.parentBusinessName}</Text>
                            <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} style={{ marginLeft: 'auto' }} />
                          </View>
                        </TouchableOpacity>
                      </View>
                      <View style={[styles.sectionDivider, { backgroundColor: theme.divider }]} />
                    </>
                  )}

                  {/* Opening Hours (only for cafes, not roasters) */}
                  {user.openingHours && !user.isRoaster && (
                    <>
                      <View style={styles.infoSection}>
                        <Text style={[styles.infoSectionTitle, { color: theme.primaryText }]}>Opening Hours</Text>
                        {Object.entries(user.openingHours).map(([day, hours]) => (
                          <View key={day} style={styles.hoursItem}>
                            <Text style={[styles.dayText, { color: theme.primaryText }]}>
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </Text>
                            <Text style={[styles.hoursText, { color: theme.secondaryText }]}>{hours}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={[styles.sectionDivider, { backgroundColor: theme.divider }]} />
                    </>
                  )}

                  {/* Reviews Section */}
                  <View style={styles.infoSection}>
                    <View style={styles.reviewsHeaderContainer}>
                      <Text style={[styles.infoSectionTitle, { color: theme.primaryText }]}>Reviews</Text>
                      {!isCurrentUser && (
                        <TouchableOpacity 
                          style={[styles.writeReviewButton, { borderColor: theme.primaryText }]}
                          onPress={() => setShowReviewModal(true)}
                        >
                          <Text style={[styles.writeReviewText, { color: theme.primaryText }]}>Write Review</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* Rating Summary */}
                    <View style={styles.ratingContainer}>
                      <View style={styles.ratingLeft}>
                        <Text style={[styles.ratingNumber, { color: theme.primaryText }]}>
                          {user.rating || 4.8}
                        </Text>
                        <View style={styles.starsContainer}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name={star <= Math.floor(user.rating || 4.8) ? "star" : "star-outline"}
                              size={16}
                              color="#FFD700"
                            />
                          ))}
                        </View>
                        <Text style={[styles.reviewCount, { color: theme.secondaryText }]}>
                          {user.reviewCount || 0} reviews
                        </Text>
                      </View>
                    </View>
                    
                    {/* Reviews List */}
                    {userReviews.length > 0 ? (
                      <View style={styles.reviewsList}>
                        {userReviews.map((review) => (
                          <View key={review.id} style={[styles.reviewItem, { borderBottomColor: theme.divider }]}>
                            <View style={styles.reviewHeader}>
                              <AppImage
                                source={review.userAvatar}
                                style={styles.reviewUserAvatar}
                                placeholder="person"
                              />
                              <View style={styles.reviewUserInfo}>
                                <Text style={[styles.reviewUserName, { color: theme.primaryText }]}>
                                  {review.userName}
                                </Text>
                                <View style={styles.reviewRatingStars}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Ionicons
                                      key={star}
                                      name={star <= review.rating ? "star" : "star-outline"}
                                      size={12}
                                      color="#FFD700"
                                      style={{ marginRight: 2 }}
                                    />
                                  ))}
                                </View>
                              </View>
                              <Text style={[styles.reviewDate, { color: theme.secondaryText }]}>
                                {new Date(review.date).toLocaleDateString()}
                              </Text>
                            </View>
                            {review.text && (
                              <Text style={[styles.reviewText, { color: theme.primaryText }]}>
                                {review.text}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={[styles.reviewsPlaceholder, { backgroundColor: theme.cardBackground }]}>
                        <Text style={[styles.emptyReviewsText, { color: theme.secondaryText }]}>
                          No reviews yet
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {activeTab === 'coffees' && (
                <View style={styles.coffeesContainer}>
                  {userLogs.length > 0 ? (
                    userLogs.map((log, index) => (
                                          <ThemeCoffeeLogCard 
                      key={log.id} 
                      event={log}
                      onCoffeePress={(event) => navigation.navigate('CoffeeDetail', { coffeeId: event.coffeeId, skipAuth: true })}
                      onRecipePress={(event) => navigation.navigate('RecipeDetail', { 
                        recipeId: event.id,
                        coffeeId: event.coffeeId,
                        coffeeName: event.coffeeName,
                        roaster: event.roaster || event.roasterName,
                        imageUrl: event.imageUrl,
                        recipe: event,
                        userId: event.userId,
                        userName: event.userName,
                        userAvatar: event.userAvatar
                      })}
                      onUserPress={(event) => navigation.navigate('UserProfileScreen', { 
                        userId: event.userId,
                        userName: event.userName,
                        userAvatar: event.userAvatar,
                        isBusinessAccount: event.isBusinessAccount || false,
                        skipAuth: true 
                      })}
                      onOptionsPress={handleOptionsPress}
                      onLikePress={handleLikePress}
                      currentUserId={currentAccount}
                      hideFollowButton={true}
                      containerStyle={{
                        marginBottom: index === userLogs.length - 1 ? 0 : 8
                      }}
                    />
                    ))
                  ) : (
                    <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
                      <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No activity yet</Text>
                    </View>
                  )}
                </View>
              )}

              {activeTab === 'collection' && (
                <View style={styles.collectionSection}>
                  {collectionCoffees.length > 0 ? (
                    <SafeFlatList
                      data={collectionCoffees}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity 
                          style={[
                            styles.collectionCard, 
                            isDarkMode 
                              ? { backgroundColor: theme.cardBackground, borderWidth: 0 }
                              : { backgroundColor: 'transparent', borderColor: theme.border, borderWidth: 1 }
                          ]}
                          onPress={() => navigation.navigate('CoffeeDetail', { coffeeId: item.id, skipAuth: true })}
                        >
                          <View style={[styles.collectionCardImagePlaceholder, { backgroundColor: theme.placeholder }]}>
                            <AppImage
                              source={item.imageUrl}
                              style={styles.collectionCardImage}
                              placeholder="cafe"
                            />
                          </View>
                          <View style={styles.collectionCardInfo}>
                            <Text style={[styles.collectionCardName, { color: theme.primaryText }]} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={[styles.collectionCardRoaster, { color: theme.secondaryText }]} numberOfLines={1}>
                              {item.roaster}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                      numColumns={2}
                      columnWrapperStyle={styles.collectionCardRow}
                      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
                    />
                  ) : (
                    <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
                      <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No coffees in collection yet</Text>
                    </View>
                  )}
                </View>
              )}

              {activeTab === 'shop' && renderShopTab()}

              {activeTab === 'recipes' && (
                <View style={[styles.recipesContainer, { backgroundColor: theme.background }]}>
                  {recipes && recipes.length > 0 ? (
                    <SafeFlatList
                      data={recipes}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <RecipeCard
                          recipe={item}
                          onPress={() => handleRecipePress(item)}
                          onUserPress={() => null}
                          showCoffeeInfo={true}
                          style={[
                            styles.recipeCard, 
                            isDarkMode ? { backgroundColor: theme.cardBackground } : { backgroundColor: 'transparent' }
                          ]}
                        />
                      )}
                      contentContainerStyle={styles.recipeListContainer}
                    />
                  ) : (
                    <View style={[styles.standardEmptyContainer, { backgroundColor: theme.background }]}>
                      <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No recipes yet</Text>
                    </View>
                  )}
                </View>
              )}

              {activeTab === 'locations' && user?.isRoaster && (
                <View style={styles.cafesSection}>
                  {user.cafes && user.cafes.length > 0 ? (
                    user.cafes.map((cafe) => (
                      <TouchableOpacity
                        key={cafe.id}
                        style={[
                          styles.cafeItem, 
                          { 
                            backgroundColor: isDarkMode ? theme.cardBackground : 'transparent',
                            borderColor: isDarkMode ? 'transparent' : theme.border,
                            borderWidth: isDarkMode ? 0 : 1
                          }
                        ]}
                        onPress={() => navigation.navigate('UserProfileBridge', {
                          userId: cafe.id,
                          userName: cafe.name,
                          userAvatar: cafe.avatar,
                          isBusinessAccount: true,
                          isLocation: true,
                          parentBusinessId: user.id,
                          skipAuth: true
                        })}
                      >
                        <View style={styles.cafeImagePlaceholder}>
                          <AppImage
                            source={cafe.avatar}
                            style={styles.cafeImage}
                            placeholder="business"
                          />
                        </View>
                        <View style={styles.cafeInfo}>
                          <Text style={[styles.cafeName, { color: theme.primaryText }]}>{cafe.name}</Text>
                          <Text style={[styles.cafeAddress, { color: theme.secondaryText }]}>{cafe.address}</Text>
                          <View style={styles.cafeMetrics}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text style={[styles.cafeRating, { color: theme.primaryText }]}>{cafe.rating}</Text>
                            <Text style={[styles.cafeReviews, { color: theme.secondaryText }]}>
                              ({cafe.reviewCount} reviews)
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
                      <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No locations yet</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={[styles.reviewModalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.reviewModalHeader, { borderBottomColor: theme.divider }]}>
            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
              <Text style={[styles.reviewModalCancel, { color: theme.primaryText }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.reviewModalTitle, { color: theme.primaryText }]}>Write Review</Text>
            <TouchableOpacity 
              onPress={handleSubmitReview}
              disabled={reviewRating === 0}
            >
              <Text style={[
                styles.reviewModalSubmit, 
                { 
                  color: reviewRating === 0 ? theme.secondaryText : theme.primaryText,
                  opacity: reviewRating === 0 ? 0.5 : 1
                }
              ]}>Post</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.reviewModalContent}>
            {/* Star Rating */}
            <View style={styles.reviewRatingContainer}>
              <Text style={[styles.reviewRatingLabel, { color: theme.primaryText }]}>Rating</Text>
              <View style={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                    style={styles.reviewStar}
                  >
                    <Ionicons
                      name={star <= reviewRating ? "star" : "star-outline"}
                      size={32}
                      color="#FFD700"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Review Text */}
            <View style={styles.reviewTextContainer}>
              <Text style={[styles.reviewTextLabel, { color: theme.primaryText }]}>Review</Text>
              <TextInput
                style={[
                  styles.reviewTextInput, 
                  { 
                    backgroundColor: theme.cardBackground,
                    color: theme.primaryText,
                    borderColor: theme.border
                  }
                ]}
                placeholder="Share your experience..."
                placeholderTextColor={theme.secondaryText}
                multiline
                numberOfLines={4}
                value={reviewText}
                onChangeText={setReviewText}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Picture Viewer */}
      <Modal
        visible={showProfilePicture}
        animationType="none"
        transparent={true}
        onRequestClose={() => setShowProfilePicture(false)}
      >
        <Animated.View 
          style={[
            styles.profilePictureModalContainer,
            {
              transform: [{ translateY: profilePictureTranslateY }],
              opacity: profilePictureTranslateY.interpolate({
                inputRange: [-200, 0, 200],
                outputRange: [0.2, 1, 0.2],
              }),
            }
          ]}
          {...profilePicturePanResponder.panHandlers}
        >
          <View style={styles.profilePictureModalOverlay}>
            <View style={styles.profilePictureModalContent}>
              <AppImage
                source={user?.userAvatar || 'https://via.placeholder.com/300'}
                style={styles.profilePictureModalImage}
                placeholder="person"
                resizeMode="cover"
              />
            </View>
            
            {/* Close button */}
            <TouchableOpacity 
              style={styles.profilePictureCloseButton}
              onPress={() => {
                // Animate out before closing
                Animated.timing(profilePictureTranslateY, {
                  toValue: Dimensions.get('window').height,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => {
                  // Just hide modal - value will be reset when modal opens next time
                  setShowProfilePicture(false);
                });
              }}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#F2F2F7',
  },
  contentScrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 8,
    paddingTop: Platform.OS === 'ios' ? 12 : 0,
    backgroundColor: '#FFFFFF',
  },
  profileImage: {
    width: 80,
    height: 80,
    marginRight: 16,
    // borderWidth: 1,
    // borderColor: '#F0F0F0',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    // marginBottom: 4,
  },
  roasterBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 6,
  },
  roasterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileUsername: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  profileLocation: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  profileBio: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  followButtonContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  followButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    width: '100%',
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    width: '100%',
    alignItems: 'center',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    height: 48,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '500',
  },
  tabContent: {
    flex: 1,
  },
  coffeesContainer: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    // backgroundColor: '#F2F2F7',
    flex: 1,
  },
  coffeesList: {
    // backgroundColor: '#F2F2F7',
    flex: 1,
  },
  coffeesSection: {
    padding: 0,
    // backgroundColor: '#F2F2F7',
  },
  listSeparator: {
    height: 0,
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    padding: 0,
    marginVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    // backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  standardEmptyContainer: {
    padding: 0,
    margin: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // height: 132,
    // backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 8,
  },
  refreshButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  refreshButtonText: {
    fontWeight: '500',
  },
  gearContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 4,
    paddingRight: 0,
    paddingBottom: 12,
    marginTop: 8,
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
  gearScrollContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingLeft: 0,
    paddingRight: 16,
  },
  gearItem: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 16,
    paddingLeft: 10,
    paddingVertical: 8,
    borderRadius: 50,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gearItemAvatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
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
  gearWishlistToggle: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
    padding: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  emptyGearText: {
    fontSize: 14,
    color: '#666666',
    paddingVertical: 8,
  },
  cafesSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  locationCount: {
    fontSize: 14,
    color: '#666666',
  },
  cafeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  cafeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  cafeImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginHorizontal: 8,
    // backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cafeInfo: {
    flex: 1,
  },
  cafeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  cafeAddress: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  cafeMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cafeRating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 4,
  },
  cafeReviews: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  cafePhone: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  coffeeScrollContainer: {
    marginVertical: 8,
  },
  coffeeCard: {
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  coffeeImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  coffeeInfo: {
    padding: 12,
  },
  coffeeName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  coffeeOrigin: {
    fontSize: 12,
    marginBottom: 4,
  },
  coffeePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  businessAvatar: {
    borderRadius: 12,
  },
  userAvatar: {
    borderRadius: 40,
  },
  collectionSection: {
    // padding: 16,
  },
  collectionCount: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  collectionCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  collectionCardImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  collectionCardImagePlaceholder: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
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
  collectionCardRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  collectionContainer: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  shopSection: {
    padding: 16,
  },
  coffeeCount: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  coffeeCardRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  coffeeGridContainer: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  recipesSection: {
    padding: 16,
  },
  recipeCard: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  recipeCardImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  recipeCardInfo: {
    padding: 12,
  },
  recipeCardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  recipeCardCoffee: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  recipeCardRoaster: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  recipeCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeCardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  recipeCardStatText: {
    fontSize: 14,
    color: '#666666',
  },
  gearCard: {
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gearImageContainer: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  gearImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  gearInfo: {
    padding: 12,
  },
  gearBrand: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gearName: {
    fontSize: 14,
    marginBottom: 4,
  },
  gearPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  recipesContainer: {
    padding: 16,
  },
  recipeListContainer: {
    padding: 0,
  },
  createButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  createButtonText: {
    fontWeight: '500',
  },
  segmentedControlContainer: {
    paddingHorizontal: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 16,
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
  },
  segmentTextActive: {
    fontWeight: '600',
  },
  emptyShopContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyShopText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  shopTabContainer: {
    padding: 16,
  },
  shopListContent: {
    padding: 0,
  },
  gearColumnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  renderGearItem: {
    // Implementation of renderGearItem function
  },
  shopContainer: {
    // padding: 16,
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
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
  mutualFollowersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 0,
    backgroundColor: '#FFFFFF',
  },
  mutualFollowersAvatars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  mutualFollowerAvatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  mutualFollowerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  mutualFollowersText: {
    fontSize: 14,
    color: '#666666',
    flexShrink: 1,
  },
  mutualFollowerBold: {
    fontWeight: '600',
    color: '#000000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerOpacity: {
    opacity: 1,
  },
  headerTranslate: {
    translateY: 0,
  },
  headerTitleOpacity: {
    opacity: 1,
  },
  headerTitleTranslate: {
    translateY: 0,
  },
  headerHeight: {
    height: 100,
  },
  informationContainer: {
    padding: 16,
  },
  infoSection: {
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  infoSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
    flex: 1,
  },
  parentRoasterContainer: {
    // No additional styling needed, uses infoItem
  },
  hoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
  },
  hoursText: {
    fontSize: 16,
    color: '#666666',
  },
  ratingContainer: {
    marginBottom: 16,
  },
  ratingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: '#666666',
  },
  reviewsPlaceholder: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  emptyReviewsText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  descriptionText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
  },
  roasterAvatar: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 0,
  },
  reviewsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  writeReviewButton: {
    // borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  writeReviewText: {
    fontSize: 14,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF',
  },
  reviewModalContainer: {
    flex: 1,
  },
  reviewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewModalCancel: {
    fontSize: 16,
    fontWeight: '400',
  },
  reviewModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  reviewModalSubmit: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewModalContent: {
    flex: 1,
    padding: 16,
  },
  reviewRatingContainer: {
    marginBottom: 24,
  },
  reviewRatingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewStar: {
    marginRight: 8,
  },
  reviewTextContainer: {
    flex: 1,
  },
  reviewTextLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  reviewTextInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  reviewsList: {
    marginTop: 16,
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewRatingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 44,
  },
  profilePictureModalContainer: {
    flex: 1,
  },
  profilePictureModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePictureModalContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePictureModalImage: {
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  profilePictureCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 