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
  const { userId } = route.params || { userId: 'user1' }; // Default to Ivo Vilches
  const { allEvents, following, followers, loadData, currentAccount, removeCoffeeEvent } = useCoffee();
  
  const [user, setUser] = useState(null);
  const [userCoffees, setUserCoffees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('coffees'); // 'coffees' represents the Activity tab which will show coffee logs and other types of events
  const [isFollowing, setIsFollowing] = useState(false);

  // Refresh function
  const onRefresh = async () => {
    console.log('UserProfileScreen - Refreshing data');
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    console.log('UserProfileScreen - Loading profile for userId:', userId);
    console.log('Current allEvents count:', allEvents?.length || 0);
    
    // Find user in mock data immediately (no need for setTimeout)
    const foundUser = mockData.users.find(u => u.id === userId);
    
    // Determine if this is a business account
    // 1. Explicit matches like Vértigo y Calambre (user2)
    // 2. Business IDs that start with "business-" like "business-kima"
    // 3. Café IDs that start with "cafe" like "cafe1"
    const isBusinessAccount = userId === 'user2' || 
                             userId.startsWith('business-') || 
                             userId.startsWith('cafe');
    
    let userWithBusinessStatus = null;
    
    // Special case for Vértigo y Calambre (user2)
    if (userId === 'user2') {
      console.log('Setting up Vértigo y Calambre profile');
      userWithBusinessStatus = {
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
    }
    // For café accounts that aren't in the users array
    else if (userId.startsWith('cafe')) {
      console.log('Setting up café profile for', userId);
      // Find café in trendingCafes
      const cafeData = mockData.trendingCafes.find(cafe => cafe.id === userId);
      
      if (cafeData) {
        userWithBusinessStatus = {
          id: cafeData.id,
          userName: cafeData.name,
          userAvatar: cafeData.logo || cafeData.imageUrl,
          location: cafeData.location,
          bio: cafeData.description,
          isBusinessAccount: true,
          userHandle: cafeData.id,
          // Add empty gear since businesses don't have personal gear
          gear: [],
          gearWishlist: []
        };
      }
    }
    // For business accounts that start with "business-"
    else if (userId.startsWith('business-')) {
      console.log('Setting up business profile for', userId);
      // Try to find in businesses array
      const businessData = mockData.businesses?.find(b => b.id === userId);
      
      if (businessData) {
        userWithBusinessStatus = {
          id: businessData.id,
          userName: businessData.name,
          userAvatar: businessData.logo || businessData.imageUrl,
          location: businessData.location,
          bio: businessData.description,
          isBusinessAccount: true,
          userHandle: userId.replace('business-', ''),
          gear: [],
          gearWishlist: []
        };
      } else {
        // Try to find in trendingCafes as a fallback
        const cafeData = mockData.trendingCafes.find(cafe => cafe.id === userId.replace('business-', 'cafe'));
        
        if (cafeData) {
          userWithBusinessStatus = {
            id: userId,
            userName: cafeData.name,
            userAvatar: cafeData.logo || cafeData.imageUrl,
            location: cafeData.location,
            bio: cafeData.description,
            isBusinessAccount: true,
            userHandle: userId.replace('business-', ''),
            gear: [],
            gearWishlist: []
          };
        }
      }
    }
    // Regular user account
    else if (foundUser) {
      console.log('Setting up regular user profile for', userId);
      userWithBusinessStatus = {
        ...foundUser,
        isBusinessAccount: false,
        userHandle: foundUser.userName.toLowerCase().replace(/\s+/g, '_'),
        // Ensure gearWishlist is defined even if not in the data
        gearWishlist: foundUser.gearWishlist || []
      };
      
      // Update locations for specific users
      if (userWithBusinessStatus.id === 'user1') {
        userWithBusinessStatus.location = 'Murcia, Spain';
      } else if (userWithBusinessStatus.id === 'user3') {
        userWithBusinessStatus.location = 'Madrid, Spain';
      }
    }
    
    // If we still don't have user data, create a fallback
    if (!userWithBusinessStatus) {
      console.log('User not found, using fallback');
      userWithBusinessStatus = {
        id: userId,
        userName: 'Unknown User',
        userAvatar: null,
        location: '',
        bio: '',
        isBusinessAccount: isBusinessAccount,
        userHandle: isBusinessAccount ? userId.replace('business-', '') : userId,
        gear: [],
        gearWishlist: []
      };
    }
    
    // Debug the user data being set
    console.log('Setting user data:', JSON.stringify(userWithBusinessStatus, null, 2));
    console.log('User has gear:', userWithBusinessStatus.gear?.length > 0);
    console.log('User has wishlist:', userWithBusinessStatus.gearWishlist?.length > 0);
    console.log('User avatar:', userWithBusinessStatus.userAvatar, 'Type:', typeof userWithBusinessStatus.userAvatar);
    
    setUser(userWithBusinessStatus);
    
    // Check if following
    setIsFollowing(following.some(f => f.id === userId));
    
    // Get user's coffee events from the context using allEvents
    console.log('Finding events for user:', userId);
    const userEvents = allEvents ? allEvents.filter(event => event.userId === userId) : [];
    console.log(`Found ${userEvents.length} events for user ${userId}`);
    setUserCoffees(userEvents);
    
    setLoading(false);
  }, [userId, allEvents, following, followers]);

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : !user ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#CCCCCC" />
          <Text style={styles.errorText}>User not found</Text>
          <Text style={styles.errorSubtext}>The user you're looking for doesn't exist or has been removed.</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Profile Header */}
          <View style={[styles.header]}>
            <View style={styles.headerContent}>
              <AppImage 
                source={user.userAvatar} 
                style={[
                  styles.avatar,
                  user.isBusinessAccount ? styles.businessAvatar : styles.userAvatar
                ]} 
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.userName}</Text>
                <Text style={styles.userLocation}>@{user.userHandle}</Text>
                <Text style={styles.userLocation}>{user.location}</Text>
              </View>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userCoffees.length}</Text>
                <Text style={styles.statLabel}>Activity</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{followers.length || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{following.length || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.followButton,
                isFollowing && styles.followingButton
              ]}
              onPress={handleFollowPress}
            >
              <Text style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText
              ]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Bio */}
          {/* {user.bio && (
            <View style={styles.bioContainer}>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          )} */}
          
          {/* Gear Section */}
          {Array.isArray(user.gear) && (
            <View style={styles.gearContainer}>
              <View style={styles.gearTitleContainer}>
                <Text style={styles.gearTitle}>Gear</Text>
                
                {/* Show appropriate action based on wishlist status */}
                {Array.isArray(user.gearWishlist) ? (
                  <TouchableOpacity onPress={handleGearWishlistPress}>
                    <Text style={styles.gearWishlistToggle}>
                      {user.gearWishlist.length > 0 ? 'Wishlist' : 'Wishlist'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              
              {user.gear.length > 0 ? (
                <View style={styles.gearList}>
                  {user.gear.map((item, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.gearItem}
                      onPress={() => handleGearPress(item)}
                    >
                      <Text style={styles.gearText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyGearContainer}>
                  <Text style={styles.emptyGearText}>
                    {user.id === 'user3' ? 
                      "Hasn't added any gear yet" : 
                      (Array.isArray(user.gearWishlist) && user.gearWishlist.length > 0 
                        ? "No gear added yet, but this user has a wishlist" 
                        : "No gear added yet")
                    }
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Tabs - conditionally show Shop for business accounts */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'coffees' && styles.activeTab]}
              onPress={() => setActiveTab('coffees')}
            >
              <Text style={[styles.tabText, activeTab === 'coffees' && styles.activeTabText]}>Activity</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.tab, 
                activeTab === (user.isBusinessAccount ? 'shop' : 'collection') && styles.activeTab
              ]}
              onPress={() => setActiveTab(user.isBusinessAccount ? 'shop' : 'collection')}
            >
              <Text style={[
                styles.tabText, 
                activeTab === (user.isBusinessAccount ? 'shop' : 'collection') && styles.activeTabText
              ]}>
                {user.isBusinessAccount ? 'Shop' : 'Collection'}
              </Text>
            </TouchableOpacity>
            
            {!user.isBusinessAccount && (
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'wishlist' && styles.activeTab]}
                onPress={() => setActiveTab('wishlist')}
              >
                <Text style={[styles.tabText, activeTab === 'wishlist' && styles.activeTabText]}>Wishlist</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'recipes' && styles.activeTab]}
              onPress={() => setActiveTab('recipes')}
            >
              <Text style={[styles.tabText, activeTab === 'recipes' && styles.activeTabText]}>Recipes</Text>
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          {activeTab === 'coffees' ? (
            <FlatList
              data={userCoffees}
              renderItem={renderCoffeeItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.coffeesContainer}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#000000']}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {user.id === 'user3' ? 
                      "No activity yet from this user" : 
                      "No activity yet"
                    }
                  </Text>
                  <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          ) : activeTab === 'collection' || activeTab === 'shop' ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No {user.isBusinessAccount ? 'products' : 'logs'} in collection</Text>
            </View>
          ) : activeTab === 'wishlist' ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No logs in wishlist</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recipes yet</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999999',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#F0F0F0',
  },
  userAvatar: {
    borderRadius: 40,
  },
  businessAvatar: {
    borderRadius: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: -6,
  },
  userLocation: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  followButton: {
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: 'center',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  followingButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
  },
  followingButtonText: {
    color: '#000000',
  },
  bioContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  bioText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  gearContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  gearTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gearTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  gearList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gearItem: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  gearText: {
    fontSize: 14,
    color: '#666666',
  },
  gearWishlistToggle: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
    padding: 5,
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
  coffeesContainer: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  listSeparator: {
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  emptyContainer: {
    padding: 12,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
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
  emptyGearContainer: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  emptyGearText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  coffeeItem: undefined,
  coffeeImage: undefined,
  coffeeInfo: undefined,
  coffeeName: undefined,
  roasterName: undefined,
  ratingContainer: undefined,
  ratingText: undefined,
  eventNotes: undefined,
}); 