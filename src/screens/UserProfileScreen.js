import React, { useState, useEffect } from 'react';
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
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import mockData from '../data/mockData.json';
import { useCoffee } from '../context/CoffeeContext';
import AppImage from '../components/common/AppImage';
import CoffeeLogCard from '../components/CoffeeLogCard';

export default function UserProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { userId, isCurrentUser, ensureHeaderShown, isLocation, parentBusinessId } = route.params || { userId: 'user1' }; // Default to Ivo Vilches
  const { allEvents, following, followers, loadData: loadGlobalData, currentAccount, removeCoffeeEvent } = useCoffee();
  
  const [user, setUser] = useState(null);
  const [userCoffees, setUserCoffees] = useState([]);
  const [roasterCoffees, setRoasterCoffees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('coffees'); // 'coffees' represents the Activity tab which will show coffee logs and other types of events
  const [isFollowing, setIsFollowing] = useState(false);
  const [collectionCoffees, setCollectionCoffees] = useState([]);

  // Ensure header is visible and handle transitions properly
  useEffect(() => {
    const initialSetup = () => {
      // Force header to be shown for this screen
      navigation.setOptions({
        headerShown: true
      });
      
      // Set a descriptive title for location-specific views
      if (isLocation && user) {
        navigation.setOptions({
          title: user.userName // Use the location name as the title
        });
      }
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

  // Determine tabs based on user type
  const getTabs = () => {
    if (user?.isRoaster) {
      return [
        { id: 'locations', label: 'Locations' },
        { id: 'shop', label: 'Shop' }
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
    } else if (!user?.isRoaster && activeTab === 'locations') {
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
    
    // Load user profile
    const foundUser = mockData.users.find(u => u.id === userId);
    const trendingCafe = mockData.trendingCafes.find(cafe => cafe.id === userId);
    
    // Determine user type and load appropriate data
    if (userId.startsWith('business-') && ['business-toma', 'business-kima', 'business-cafelab'].includes(userId)) {
      // Load roaster coffees
      const coffees = mockData.coffees.filter(coffee => coffee.roasterId === userId);
      console.log('Found coffees for roaster:', coffees.length);
      setRoasterCoffees(coffees);
    }
    
    // Load coffee events for regular users
    if (!userId.startsWith('business-') && !trendingCafe) {
      const userEvents = allEvents.filter(event => event.userId === userId || event.coffeeId === userId);
      setUserCoffees(userEvents);
    }
    
    // Additional data loading can be added here
    setLoading(false);
  };

  useEffect(() => {
    console.log('UserProfileScreen - Loading profile for userId:', userId);
    
    // Check if this is a location-specific view
    if (isLocation) {
      console.log('Loading location-specific profile for:', userId, 'parent business:', parentBusinessId);
      
      // Find the specific location in trendingCafes
      const locationCafe = mockData.trendingCafes.find(cafe => cafe.id === userId);
      
      if (locationCafe) {
        // Set up a location-specific profile
        const userWithBusinessStatus = {
          id: locationCafe.id,
          userName: locationCafe.name,
          userAvatar: locationCafe.avatar || locationCafe.logo,
          location: locationCafe.location || 'Unknown location',
          bio: locationCafe.description || `${locationCafe.name} in ${locationCafe.location}`,
          isBusinessAccount: true,
          userHandle: locationCafe.id,
          businessId: locationCafe.businessId, // Keep track of parent business
          isLocation: true, // Mark as a location profile
          parentBusinessId: parentBusinessId,
          gear: [],
          gearWishlist: []
        };
        
        setUser(userWithBusinessStatus);
        loadProfileData();
        return; // Exit early since we've handled the profile
      }
    }
    
    // Check if this is a trending café by ID (regardless of prefix)
    const trendingCafe = mockData.trendingCafes.find(cafe => cafe.id === userId);
    
    // Determine if this is a business account
    // 1. Explicit matches like Vértigo y Calambre (user2)
    // 2. Business IDs that start with "business-" like "business-kima"
    // 3. Café IDs in the trendingCafes array
    const isBusinessAccount = userId === 'user2' || 
                             userId.startsWith('business-') || 
                             userId.startsWith('cafe') ||
                             trendingCafe !== undefined;
    
    let userWithBusinessStatus = null;
    
    // Fetch the appropriate profile
    if (userId === 'user2') {
      // Special case for Vértigo y Calambre
      userWithBusinessStatus = setupVertigoProfile();
    } else if (trendingCafe) {
      // Direct match with trending café
      userWithBusinessStatus = setupCafeProfile(trendingCafe);
    } else if (userId.startsWith('business-') && ['business-toma', 'business-kima', 'business-cafelab'].includes(userId)) {
      // Roaster business profile
      userWithBusinessStatus = setupRoasterProfile(userId);
    } else if (userId.startsWith('cafe')) {
      // Café profile not in trending
      userWithBusinessStatus = setupGenericCafeProfile(userId);
    } else if (userId.startsWith('business-')) {
      // Other business profiles
      userWithBusinessStatus = setupGenericBusinessProfile(userId);
    } else {
      // Regular user profile
      userWithBusinessStatus = setupRegularUserProfile(userId);
    }
    
    setUser(userWithBusinessStatus);
    
    // Also load user coffee events (if applicable)
    loadProfileData();
  }, [userId, isLocation, parentBusinessId]);
  
  // Helper functions for setting up different types of profiles
  const setupVertigoProfile = () => {
    const foundUser = mockData.users.find(u => u.id === 'user2');
    return {
      id: 'user2',
      userName: 'Vértigo y Calambre',
      userAvatar: 'assets/businesses/vertigo-logo.jpg',
      location: 'Murcia, Spain',
      bio: 'Specialty coffee shop and roastery in Murcia, Spain. We roast and serve the best coffee from around the world.',
      isBusinessAccount: true,
      userHandle: 'vertigoycalambre',
      gear: [],
      gearWishlist: foundUser?.gearWishlist || []
    };
  };
  
  const setupCafeProfile = (trendingCafe) => {
    return {
      id: trendingCafe.id,
      userName: trendingCafe.name,
      userAvatar: trendingCafe.avatar,
      location: trendingCafe.location || 'Unknown location',
      bio: trendingCafe.description || `${trendingCafe.name} in ${trendingCafe.location}`,
      isBusinessAccount: true,
      userHandle: trendingCafe.id,
      businessId: trendingCafe.businessId, // Keep track of parent business
      gear: [],
      gearWishlist: []
    };
  };
  
  const setupRoasterProfile = (userId) => {
    const roasterData = mockData.businesses.find(b => b.id === userId);
    
    if (roasterData) {
      // Collect all cafés associated with this roaster from trendingCafes
      const roasterCafes = mockData.trendingCafes.filter(cafe => cafe.businessId === userId);
      console.log('Setting up roaster profile for:', userId, 'Found logo/avatar:', roasterData.avatar || roasterData.logo);
      
      return {
        id: roasterData.id,
        userName: roasterData.name,
        userAvatar: roasterData.avatar || roasterData.logo,
        location: roasterData.location || 'Unknown location',
        bio: roasterData.description || '',
        isBusinessAccount: true,
        isRoaster: true,
        userHandle: userId.replace('business-', ''),
        cafes: roasterCafes, // Include all cafés associated with this roaster
        addresses: roasterData.addresses || [], // Include addresses array if available
        gear: [],
        gearWishlist: []
      };
    }
    return null;
  };
  
  const setupGenericCafeProfile = (userId) => {
    const cafeData = mockData.trendingCafes.find(cafe => cafe.id === userId);
    
    if (cafeData) {
      return {
        id: cafeData.id,
        userName: cafeData.name,
        userAvatar: cafeData.avatar || cafeData.logo || cafeData.imageUrl,
        location: cafeData.location || 'Unknown location',
        bio: cafeData.description || '',
        isBusinessAccount: true,
        userHandle: cafeData.id,
        gear: [],
        gearWishlist: []
      };
    }
    return null;
  };
  
  const setupGenericBusinessProfile = (userId) => {
    const businessData = mockData.businesses?.find(b => b.id === userId);
    
    if (businessData) {
      return {
        id: businessData.id,
        userName: businessData.name,
        userAvatar: businessData.avatar || businessData.logo || businessData.imageUrl,
        location: businessData.location || 'Unknown location',
        bio: businessData.description || '',
        isBusinessAccount: true,
        userHandle: userId.replace('business-', ''),
        gear: [],
        gearWishlist: []
      };
    }
    
    // Try to find in trendingCafes as a fallback
    const cafeData = mockData.trendingCafes.find(cafe => 
      cafe.businessId === userId || cafe.id === userId.replace('business-', '')
    );
    
    if (cafeData) {
      return {
        id: userId,
        userName: cafeData.name,
        userAvatar: cafeData.avatar || cafeData.logo || cafeData.imageUrl,
        location: cafeData.location || 'Unknown location',
        bio: cafeData.description || '',
        isBusinessAccount: true,
        userHandle: userId.replace('business-', ''),
        gear: [],
        gearWishlist: []
      };
    }
    
    return null;
  };
  
  const setupRegularUserProfile = (userId) => {
    const foundUser = mockData.users.find(u => u.id === userId);
    
    if (foundUser) {
      const userProfile = {
        ...foundUser,
        isBusinessAccount: false,
        userHandle: foundUser.userName.toLowerCase().replace(/\s+/g, '_'),
        gearWishlist: foundUser.gearWishlist || []
      };
      
      // Update locations for specific users
      if (userProfile.id === 'user1') {
        userProfile.location = 'Murcia, Spain';
      } else if (userProfile.id === 'user3') {
        userProfile.location = 'Madrid, Spain';
      }
      
      // Ensure Elias Veris has the correct avatar path
      if (userProfile.id === 'user11') {
        userProfile.userAvatar = 'assets/users/elias-veris.jpg';
      }
      
      return userProfile;
    }
    
    // Fallback for unknown users
    return {
      id: userId,
      userName: 'Unknown User',
      userAvatar: null,
      location: '',
      bio: '',
      isBusinessAccount: false,
      userHandle: userId,
      gear: [],
      gearWishlist: []
    };
  };

  const handleFollowPress = () => {
    setIsFollowing(!isFollowing);
    Alert.alert(
      isFollowing ? 'Unfollowed' : 'Followed',
      isFollowing ? `You unfollowed ${user.userName}` : `You followed ${user.userName}`
    );
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
  const renderCoffeeItem = ({ item }) => (
    <CoffeeLogCard
      event={item}
      onCoffeePress={() => navigation.navigate('CoffeeDetail', { coffeeId: item.coffeeId, skipAuth: true })}
      onRecipePress={() => navigation.navigate('RecipeDetail', { 
        recipeId: item.id,
        coffeeId: item.coffeeId,
        coffeeName: item.coffeeName,
        roaster: item.roaster || item.roasterName,
        imageUrl: item.imageUrl,
        recipe: item,
        userId: item.userId,
        userName: item.userName,
        userAvatar: item.userAvatar
      })}
      onUserPress={() => navigation.navigate('UserProfileBridge', { 
        userId: item.userId,
        skipAuth: true 
      })}
      onOptionsPress={handleOptionsPress}
      onLikePress={handleLikePress}
      currentUserId={currentAccount}
    />
  );

  // Handle options button press
  const handleOptionsPress = (event, action) => {
    console.log('Options action:', action, 'for event:', event.id);
    if (action === 'delete') {
      // Use the context function to delete the post
      if (removeCoffeeEvent) {
        removeCoffeeEvent(event.id);
      }
      // No need for Alert since Toast is shown by the component
    } else if (action === 'public' || action === 'private') {
      // Handle visibility change - Toast is shown by the component
      console.log('Changed visibility to:', action);
    } else if (action === 'report') {
      // Handle report
      Alert.alert('Report Submitted', 'Thank you for your report. We will review this content.');
    }
  };

  // Handle like button press
  const handleLikePress = (eventId, isLiked) => {
    console.log('Like toggled:', eventId, isLiked);
    // API call would happen here
  };

  // Render coffee item for Shop tab (for roasters)
  const renderShopCoffeeItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.coffeeCard}
      onPress={() => navigation.navigate('CoffeeDetail', { 
        coffeeId: item.id,
        skipAuth: true 
      })}
    >
      {item.imageUrl ? (
        <AppImage 
          source={item.imageUrl} 
          style={styles.coffeeImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.coffeeImage, { justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="cafe-outline" size={30} color="#888888" />
        </View>
      )}
      <View style={styles.coffeeInfo}>
        <Text style={styles.coffeeName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.coffeeOrigin} numberOfLines={1}>{item.origin}</Text>
        <Text style={styles.coffeePrice}>${item.price?.toFixed(2) || '0.00'}</Text>
      </View>
    </TouchableOpacity>
  );

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

  return (
    <View style={[styles.container]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : (
        <>
          <ScrollView 
            style={styles.contentScrollView}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#000000"
              />
            }
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
              
              {!isCurrentUser && (
                <TouchableOpacity 
                  style={isFollowing ? styles.followingButton : styles.followButton}
                  onPress={handleFollowPress}
                >
                  <Text style={isFollowing ? styles.followingButtonText : styles.followButtonText}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Hide profile stats for now
            <View style={styles.profileStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userCoffees.length}</Text>
                <Text style={styles.statLabel}>{user?.isRoaster ? 'Coffees' : 'Logs'}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{followers?.length || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{following?.length || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
            
            {user?.bio && (
              <Text style={styles.profileBio}>{user.bio}</Text>
            )}
            */}
            
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
                    user.gear.map((item, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.gearItem}
                        onPress={() => handleGearPress(item)}
                      >
                        <Text style={styles.gearItemText}>{item}</Text>
                      </TouchableOpacity>
                    ))
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
                            navigation.navigate('UserProfile', {
                              userId: cafe.id,
                              userName: cafe.name,
                              skipAuth: true
                            },
                            {
                              // Custom animation configuration
                              animation: 'slide_from_right'
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
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No locations available</Text>
                    </View>
                  )}
                </View>
              )}
              
              {/* Shop tab for roasters */}
              {user?.isRoaster && activeTab === 'shop' && (
                <View style={{paddingLeft: 16}}>
                  {/* <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Our Coffees</Text>
                  </View> */}
                  
                  <FlatList
                    horizontal
                    data={roasterCoffees?.slice(0, 5) || []}
                    renderItem={renderShopCoffeeItem}
                    keyExtractor={item => item.id}
                    showsHorizontalScrollIndicator={false}
                    style={styles.coffeeScrollContainer}
                    contentContainerStyle={{paddingVertical: 8}}
                    ListEmptyComponent={() => (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No coffees available</Text>
                      </View>
                    )}
                  />
                </View>
              )}
              
              {/* Coffees tab (for regular users) */}
              {!user?.isRoaster && activeTab === 'coffees' && (
                <>
                  <FlatList
                    data={userCoffees}
                    renderItem={renderCoffeeItem}
                    keyExtractor={item => item.id}
                    style={styles.coffeesContainer}
                    ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
                    ListEmptyComponent={() => (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No coffee activity yet</Text>
                        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                          <Text style={styles.refreshButtonText}>Refresh</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    ListFooterComponent={() => <View style={{ height: 60 }} />}
                    scrollEnabled={false}
                  />
                </>
              )}
              
              {/* Collection tab (for regular users) */}
              {!user?.isRoaster && activeTab === 'collection' && (
                <View style={styles.collectionSection}>
                  
                  <FlatList
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
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No coffees in collection yet</Text>
                        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                          <Text style={styles.refreshButtonText}>Refresh</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    ListFooterComponent={() => <View style={{ height: 60 }} />}
                    scrollEnabled={false}
                  />
                </View>
              )}
              
              {/* Recipes tab (for regular users) */}
              {!user?.isRoaster && activeTab === 'recipes' && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No recipes yet</Text>
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
    backgroundColor: '#FFFFFF',
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
    marginBottom: 4,
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
    marginTop: 2,
  },
  profileLocation: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  profileBio: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  followButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  followingButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#000000',
    marginLeft: 8,
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
  },
  listSeparator: {
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gearItemText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  gearWishlistToggle: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
    padding: 5,
  },
  emptyGearText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
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
    width: 150,
    height: 220,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  coffeeImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F5F5F5',
  },
  coffeeInfo: {
    padding: 8,
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
}); 