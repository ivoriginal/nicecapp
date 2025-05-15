import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
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
  Dimensions,
  Platform,
  ActionSheetIOS,
  Animated
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useIsFocused } from '@react-navigation/native';
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
import CoffeeLogCard from '../components/CoffeeLogCard';
import FollowButton from '../components/FollowButton';
import { COLORS, FONTS, SIZES } from '../constants';
import AnimatedTabBar from '../components/AnimatedTabBar';
import { useUser } from '../context/UserContext';
import RecipeCard from '../components/RecipeCard';

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
  const { userId, isCurrentUser, ensureHeaderShown, isLocation, parentBusinessId } = route.params || { userId: 'user1' }; // Default to Ivo Vilches
  const { allEvents, following, followers, loadData: loadGlobalData, currentAccount, removeCoffeeEvent } = useCoffee();
  const { currentUser } = useUser();
  
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
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showAllDesc, setShowAllDesc] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [error, setError] = useState(null);
  const [coffeeEvents, setCoffeeEvents] = useState([]);
  const [shopFilter, setShopFilter] = useState('coffee');
  // Add states for follower data
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [mutualFollowers, setMutualFollowers] = useState([]);

  const isFocused = useIsFocused();

  // Ensure header is visible and handle transitions properly
  useEffect(() => {
    const initialSetup = () => {
      // Keep header visible but with no title or border initially
      navigation.setOptions({
        headerShown: true,
        headerTransparent: false,
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0, // Remove shadow for Android
          shadowOpacity: 0, // Remove shadow for iOS
          shadowRadius: 0,
          borderBottomWidth: 0 // Remove bottom border
        },
        headerTitle: '', // Start with empty title
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleOptionsPress} 
            style={{ marginRight: 16 }}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#000000" />
          </TouchableOpacity>
        )
      });
    };
    
    // Initial setup
    initialSetup();
    
    // Listen for focus events to keep header visible
    const focusUnsubscribe = navigation.addListener('focus', () => {
      console.log('UserProfileScreen focused, ensuring header is shown');
      initialSetup();
    });
    
    // Listen for blur events to handle transition properly
    const blurUnsubscribe = navigation.addListener('blur', () => {
      console.log('UserProfileScreen blurred');
    });
    
    // Clean up all listeners when component unmounts
    return () => {
      focusUnsubscribe();
      blurUnsubscribe();
    };
  }, [navigation, isLocation, user]);

  // Handle options button press
  const handleOptionsPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Share Profile', 'Cancel'],
          cancelButtonIndex: 1,
          userInterfaceStyle: 'light'
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
        ]
      );
    }
  };

  // Handle scroll events to update header title and border
  const handleScroll = (event) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    
    // Show header title after scrolling past a threshold (e.g., 40 pixels)
    if (currentScrollY > 40 && scrollY.current <= 40) {
      // Scrolled down past threshold - show title and border
      navigation.setOptions({
        headerTitle: user?.userName || route.params?.userName || 'Profile',
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0, // Keep 0 to avoid accidental shadow on Android
          shadowOpacity: 0, // Keep 0 to avoid accidental shadow on iOS
          shadowRadius: 0,
          borderBottomWidth: 1, // Add bottom border
          borderBottomColor: '#E5E5EA'
        },
        // Keep the three-dot menu
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleOptionsPress} 
            style={{ marginRight: 16 }}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#000000" />
          </TouchableOpacity>
        )
      });
    } else if (currentScrollY <= 40 && scrollY.current > 40) {
      // Scrolled up to threshold - hide title and border
      navigation.setOptions({
        headerTitle: '',
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0, // Remove shadow for Android
          shadowOpacity: 0, // Remove shadow for iOS
          shadowRadius: 0,
          borderBottomWidth: 0 // Remove bottom border
        },
        // Keep the three-dot menu
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleOptionsPress} 
            style={{ marginRight: 16 }}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#000000" />
          </TouchableOpacity>
        )
      });
    }
    
    // Update the ref with current position
    scrollY.current = currentScrollY;
  };

  // Determine tabs based on user type
  const getTabs = () => {
    if (user?.isRoaster) {
      return [
        { id: 'locations', label: 'Locations' },
        { id: 'shop', label: 'Shop' }
      ];
    } else if (user?.isBusinessAccount) {
      // For cafés and other business accounts, show activity, shop and recipes tabs
      return [
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
    if (user?.isRoaster && activeTab === 'coffees') {
      setActiveTab('locations');
    } else if (!user?.isRoaster && (activeTab === 'locations')) {
      setActiveTab('coffees');
    }
  }, [user]);

  // Fetch initial data
  useEffect(() => {
    loadProfileData();
    
    // Add navigation focus listener to ensure data is reloaded when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      // This ensures data is fresh when returning to this screen
      loadProfileData();
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
      setLoading(true);
      
      try {
        // First, get the user data
        let userData;
        if (isCurrentUser) {
          // If viewing own profile, use current user data
          userData = currentUser;
        } else {
          // Check if this is a business ID (roaster)
          if (userId.startsWith('business-')) {
            const businessData = mockUsersData.businesses?.find(b => b.id === userId) || 
                               mockCafesData.businesses?.find(b => b.id === userId);
            
            if (businessData) {
              userData = {
                ...businessData,
                userName: businessData.name,
                userAvatar: businessData.avatar || businessData.logo,
                isBusinessAccount: true,
                isRoaster: businessData.isRoaster || businessData.type?.includes('roaster'),
                location: businessData.location || route.params?.location,
                // If the business has locations, add them as cafes
                cafes: businessData.addresses?.map(addr => ({
                  id: addr.id,
                  name: addr.name,
                  address: addr.address,
                  location: addr.location || addr.address,
                  avatar: businessData.avatar || businessData.logo,
                  rating: 4.8,
                  reviewCount: 100 + Math.floor(Math.random() * 50)
                })) || []
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
            // Otherwise, fetch the requested user using the fallback function
            userData = getMockUserFallback(userId);
          }
        }
        
        if (userData) {
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
      } catch (error) {
        console.error('Error loading profile data:', error);
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
        ]
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
    <CoffeeLogCard
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
      onUserPress={() => navigation.navigate('UserProfileBridge', { 
        userId: enhancedItem.userId,
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
        style={styles.coffeeCard}
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
          <Text style={styles.coffeeName} numberOfLines={1}>{coffeeData.name}</Text>
          <Text style={styles.coffeeOrigin} numberOfLines={1}>{coffeeData.origin}</Text>
          <Text style={styles.coffeePrice}>{typeof item.price === 'number' ? `€${item.price.toFixed(2)}` : item.price}</Text>
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
            roaster: event.roaster,
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
          <View style={styles.tabContent}>
            {userLogs.length > 0 ? (
              userLogs.map(log => (
                <CoffeeLogCard 
                  key={log.id} 
                  log={log} 
                  containerStyle={styles.logCard}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No coffee logs yet</Text>
            )}
          </View>
        );
        
      case 1: // Reviews
        return (
          <View style={styles.tabContent}>
            <Text style={styles.emptyText}>No reviews yet</Text>
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
              <View style={styles.standardEmptyContainer}>
                <Text style={styles.emptyText}>No recipes yet</Text>
                {user?.id === 'user1' && (
                  <TouchableOpacity 
                    style={styles.createButton}
                    onPress={() => navigation.navigate('CreateRecipe')}
                  >
                    <Text style={styles.createButtonText}>Create Recipe</Text>
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
            ]}>Coffees</Text>
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
      style={styles.gearCard}
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
          placeholder="hardware-chip"
        />
      </View>
      <View style={styles.gearInfo}>
        <Text style={styles.gearBrand}>{item.brand}</Text>
        <Text style={styles.gearName}>{item.name}</Text>
        <Text style={styles.gearPrice}>{typeof item.price === 'number' ? `€${item.price.toFixed(2)}` : item.price}</Text>
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

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : (
        <>
          <ScrollView
            contentOffset={{x: 0, y: 0}}
            refreshControl={
              enableRefreshControl ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.primary}
                />
              ) : undefined
            }
            contentContainerStyle={{ paddingBottom: insets.bottom }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View style={styles.profileSection}>
              <AppImage 
                source={user?.userAvatar} 
                style={[
                  styles.profileImage,
                  user?.isBusinessAccount || user?.isRoaster ? styles.businessAvatar : styles.userAvatar
                ]}
                resizeMode="cover"
              />
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.userName}</Text>
                {user?.isRoaster && (
                  <View style={styles.roasterBadge}>
                    <Text style={styles.roasterBadgeText}>Roaster</Text>
                  </View>
                )}
                <Text style={styles.profileUsername}>@{user?.userHandle || user?.userName?.toLowerCase().replace(/\s+/g, '')}</Text>
                <Text style={styles.profileLocation}>{user?.location}</Text>
              </View>
            </View>
            
            {/* Add follower stats section */}
            <View style={styles.followStatsContainer}>
              <TouchableOpacity style={styles.followStat} onPress={() => console.log('Show followers list')}>
                <Text style={styles.followStatNumber}>{followersCount || 0}</Text>
                <Text style={styles.followStatLabel}>{followersCount === 1 ? 'Follower' : 'Followers'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.followStat} onPress={() => console.log('Show following list')}>
                <Text style={styles.followStatNumber}>{followingCount || 0}</Text>
                <Text style={styles.followStatLabel}>Following</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.followStat} 
                onPress={() => {
                  setActiveTab('collection');
                }}
              >
                <Text style={styles.followStatNumber}>{collectionCoffees.length || 0}</Text>
                <Text style={styles.followStatLabel}>Coffees</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.followStat} 
                onPress={() => {
                  setActiveTab('recipes');
                }}
              >
                <Text style={styles.followStatNumber}>{recipes.length || 0}</Text>
                <Text style={styles.followStatLabel}>Recipes</Text>
              </TouchableOpacity>
            </View>
            
            {/* Add mutual followers section */}
            {!isCurrentUser && mutualFollowers.length > 0 && (
              <View style={styles.mutualFollowersContainer}>
                <View style={styles.mutualFollowersAvatars}>
                  {mutualFollowers.slice(0, 3).map((follower, index) => (
                    <View key={follower.id} style={[styles.mutualFollowerAvatarContainer, { marginLeft: index > 0 ? -12 : 0 }]}>
                      <AppImage
                        source={follower.userAvatar}
                        style={styles.mutualFollowerAvatar}
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </View>
                <Text style={styles.mutualFollowersText}>
                  Followed by <Text style={styles.mutualFollowerBold}>{mutualFollowers[0]?.userName}</Text> 
                  {mutualFollowers.length > 1 ? 
                    <Text> and <Text style={styles.mutualFollowerBold}>{mutualFollowers.length - 1} more</Text></Text> 
                    : null}
                </Text>
              </View>
            )}
            
            {/* Follow button */}
            {!isCurrentUser && (
              <View style={styles.followButtonContainer}>
                <TouchableOpacity 
                  style={isFollowing ? styles.followingButton : styles.followButton}
                  onPress={handleFollowPress}
                >
                  <Text style={isFollowing ? styles.followingButtonText : styles.followButtonText}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Display gear module for all user profiles except roasters */}
            {!user?.isRoaster && (
              <View style={styles.gearContainer}>
                <View style={styles.gearTitleRow}>
                  <Text style={styles.gearTitle}>Gear</Text>
                  
                  <TouchableOpacity onPress={handleGearWishlistPress}>
                    <Text style={styles.gearWishlistToggle}>
                      {user?.gearWishlist?.length > 0 ? 'Wishlist' : 'View Wishlist'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.gearScrollContainer}
                >
                  {user?.gear && user.gear.length > 0 ? (
                    user.gear.map((item, index) => {
                      // Get gear details including users who own this gear
                      const gearDetail = gearDetails[item] || {};
                      const usersOwning = gearDetail.usedBy || [];
                      // Get the gear image from mockGear.json
                      const gearImage = getGearImage(item);
                      
                      return (
                        <TouchableOpacity 
                          key={index} 
                          style={styles.gearItem}
                          onPress={() => handleGearPress(item)}
                        >
                          <View style={styles.gearItemAvatarContainer}>
                            {gearImage ? (
                              <AppImage 
                                source={{ uri: gearImage }}
                                style={styles.gearItemAvatar}
                                placeholder={null}
                                resizeMode="cover"
                              />
                            ) : null}
                          </View>
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
            )}
            
            <View style={styles.tabsContainer}>
              {getTabs().map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Text
                    style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Tab content */}
            <View style={styles.tabContent}>
              {/* Locations tab for roasters */}
              {user?.isRoaster && activeTab === 'locations' && (
                <View style={styles.cafesSection}>
                  {user.cafes && user.cafes.length > 0 ? (
                    <>
                      {/* <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Our Locations</Text>
                        <Text style={styles.locationCount}>{user.cafes.length} {user.cafes.length === 1 ? 'location' : 'locations'}</Text>
                      </View> */}
                      
                      {user.cafes.map((cafe) => (
                        <TouchableOpacity 
                          key={cafe.id}
                          style={styles.cafeItem}
                          onPress={() => {
                            // Use navigate instead of animation which isn't supported
                            navigation.navigate('UserProfileBridge', {
                              userId: cafe.id,
                              userName: cafe.name,
                              skipAuth: true,
                              isBusinessAccount: user.isBusinessAccount,
                              isRoaster: user.isRoaster
                            });
                          }}
                        >
                          {cafe.avatar ? (
                            <AppImage 
                              source={cafe.avatar} 
                              style={styles.cafeImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.cafeImagePlaceholder}>
                              <Ionicons name="cafe-outline" size={30} color="#666666" />
                            </View>
                          )}
                          
                          <View style={styles.cafeInfo}>
                            <Text style={styles.cafeName}>{cafe.name}</Text>
                            <Text style={styles.cafeAddress}>{cafe.address || cafe.location}</Text>
                            <View style={styles.cafeMetrics}>
                              <Ionicons name="star" size={14} color="#FFD700" />
                              <Text style={styles.cafeRating}>{cafe.rating}</Text>
                              <Text style={styles.cafeReviews}>({cafe.reviewCount} reviews)</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </>
                  ) : user.addresses && user.addresses.length > 0 ? (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Our Locations</Text>
                        <Text style={styles.locationCount}>{user.addresses.length} {user.addresses.length === 1 ? 'location' : 'locations'}</Text>
                      </View>
                      
                      {user.addresses.map((address) => (
                        <View key={address.id} style={styles.cafeItem}>
                          <View style={styles.cafeImagePlaceholder}>
                            <Ionicons name="location-outline" size={30} color="#666666" />
                          </View>
                          
                          <View style={styles.cafeInfo}>
                            <Text style={styles.cafeName}>{address.name}</Text>
                            <Text style={styles.cafeAddress}>{address.address}</Text>
                            {address.phone && (
                              <Text style={styles.cafePhone}>{address.phone}</Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </>
                  ) : (
                    <View style={styles.standardEmptyContainer}>
                      <Text style={styles.emptyText}>No locations available</Text>
                    </View>
                  )}
                </View>
              )}
              
              {/* Shop tab for cafés (non-roaster business accounts) */}
              {!user?.isRoaster && user?.isBusinessAccount && activeTab === 'shop' && (
                renderShopTab()
              )}
              
              {/* Coffees tab (for regular users) */}
              {!user?.isRoaster && activeTab === 'coffees' && (
                <View style={[styles.coffeesContainer, { backgroundColor: '#F2F2F7' }]}>
                  <SafeFlatList
                    data={userCoffees}
                    renderItem={renderCoffeeItem}
                    keyExtractor={item => item.id}
                    style={[styles.coffeesList, { 
                      backgroundColor: '#F2F2F7',
                      elevation: 0,
                      shadowOpacity: 0,
                      borderWidth: 0
                    }]}
                    ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
                    ListEmptyComponent={() => (
                      <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText]}>No coffee activity yet</Text>
                      </View>
                    )}
                    // ListFooterComponent={() => <View style={{ height: 60, backgroundColor: '#F2F2F7' }} />}
                    // contentContainerStyle={{ 
                    //   backgroundColor: '#F2F2F7',
                    //   paddingTop: 0,
                    //   paddingBottom: 60
                    // }}
                  />
                </View>
              )}
              
              {/* Collection tab (for regular users) */}
              {!user?.isRoaster && activeTab === 'collection' && (
                <View style={styles.collectionSection}>
                  <SafeFlatList
                    data={collectionCoffees}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={styles.collectionCard}
                        onPress={() => navigation.navigate('CoffeeDetail', { 
                          coffeeId: item.id,
                          skipAuth: true 
                        })}
                      >
                        {item.imageUrl ? (
                          <AppImage 
                            source={item.imageUrl} 
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
                    )}
                    numColumns={2}
                    columnWrapperStyle={styles.collectionCardRow}
                    keyExtractor={item => item.id}
                    style={styles.collectionContainer}
                    ListEmptyComponent={() => (
                      <View style={styles.standardEmptyContainer}>
                        <Text style={styles.emptyText}>No coffees in collection yet</Text>
                      </View>
                    )}
                    ListFooterComponent={() => <View style={{ height: 60 }} />}
                  />
                </View>
              )}
              
              {/* Recipes tab (for all users) */}
              {activeTab === 'recipes' && (
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
                    <View style={styles.standardEmptyContainer}>
                      <Text style={styles.emptyText}>No recipes yet</Text>
                      {user?.id === 'user1' && (
                        <TouchableOpacity 
                          style={styles.createButton}
                          onPress={() => navigation.navigate('CreateRecipe')}
                        >
                          <Text style={styles.createButtonText}>Create Recipe</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </>
      )}
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
    backgroundColor: '#FFFFFF',
  },
  profileImage: {
    width: 80,
    height: 80,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#F0F0F0',
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
    backgroundColor: '#000000',
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
    color: '#FFFFFF',
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
    marginTop: 4,
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
    backgroundColor: '#F2F2F7',
    flex: 1,
  },
  coffeesList: {
    backgroundColor: '#F2F2F7',
    flex: 1,
  },
  coffeesSection: {
    padding: 0,
    backgroundColor: '#F2F2F7',
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
    color: '#666666',
    textAlign: 'center',
    paddingVertical: 8,
  },
  refreshButton: {
    marginTop: 12,
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  gearContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingTop: 4,
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
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    marginRight: 12,
    backgroundColor: '#F0F0F0',
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
    borderColor: '#E5E5EA',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
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
    color: '#000000',
    marginBottom: 4,
  },
  coffeeOrigin: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  coffeePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 4,
  },
  businessAvatar: {
    borderRadius: 12,
  },
  userAvatar: {
    borderRadius: 40,
  },
  collectionSection: {
    padding: 16,
  },
  collectionCount: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  collectionCard: {
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
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
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
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
    borderColor: '#E5E5EA',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
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
    color: '#000000',
    marginBottom: 4,
  },
  gearName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  gearPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
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
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  segmentedControlContainer: {
    paddingHorizontal: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 16,
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
    // marginRight: 16,
  },
  followStatNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
    marginRight: 4,
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
  },
  mutualFollowerBold: {
    fontWeight: '600',
    color: '#000000',
  },
}); 