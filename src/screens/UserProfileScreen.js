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
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import mockData from '../data/mockData.json';
import { useCoffee } from '../context/CoffeeContext';

export default function UserProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { userId } = route.params || { userId: 'user1' }; // Default to Ivo Vilches
  const { coffeeEvents, following, followers } = useCoffee();
  
  const [user, setUser] = useState(null);
  const [userCoffees, setUserCoffees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('coffees'); // 'coffees' or 'recipes'
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    // Find user in mock data immediately (no need for setTimeout)
    const foundUser = mockData.users.find(u => u.id === userId) || mockData.users[0];
    
    // Determine if this is a business account
    const isBusinessAccount = userId === 'user2'; // Vértigo y Calambre is a business
    const userWithBusinessStatus = {
      ...foundUser,
      isBusinessAccount,
      userHandle: isBusinessAccount 
        ? 'vertigoycalambre' 
        : foundUser.userName.toLowerCase().replace(/\s+/g, '_')
    };
    
    // Update locations
    if (userWithBusinessStatus.id === 'user1') {
      userWithBusinessStatus.location = 'Murcia, Spain';
    } else if (userWithBusinessStatus.id === 'user2') {
      userWithBusinessStatus.location = 'Murcia, Spain';
    } else if (userWithBusinessStatus.id === 'user3') {
      userWithBusinessStatus.location = 'Madrid, Spain';
    }
    
    setUser(userWithBusinessStatus);
    
    // Check if following
    setIsFollowing(following.some(f => f.id === userId));
    
    // Get user's coffee events from the context
    const userEvents = coffeeEvents ? coffeeEvents.filter(event => event.userId === userId) : [];
    setUserCoffees(userEvents);
    
    setLoading(false);
  }, [userId, coffeeEvents, following]);

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

  const renderCoffeeItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.coffeeItem}
      onPress={() => navigation.navigate('CoffeeDetail', { coffeeId: item.coffeeId, skipAuth: true })}
    >
      <Image 
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }} 
        style={styles.coffeeImage} 
      />
      <View style={styles.coffeeInfo}>
        <Text style={styles.coffeeName}>{item.coffeeName}</Text>
        <Text style={styles.roasterName}>{item.roaster}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
          <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <View style={styles.headerContent}>
              <Image 
                source={{ uri: user.userAvatar }} 
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
                <Text style={styles.statLabel}>Coffees</Text>
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
          {user.bio && (
            <View style={styles.bioContainer}>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          )}
          
          {/* Gear */}
          {user.gear && user.gear.length > 0 && (
            <View style={styles.gearContainer}>
              <Text style={styles.gearTitle}>Gear</Text>
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
            </View>
          )}
          
          {/* Tabs - conditionally show Shop for business accounts */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'coffees' && styles.activeTab]}
              onPress={() => setActiveTab('coffees')}
            >
              <Text style={[styles.tabText, activeTab === 'coffees' && styles.activeTabText]}>Coffees</Text>
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
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No coffees yet</Text>
                </View>
              }
            />
          ) : activeTab === 'collection' || activeTab === 'shop' ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No {user.isBusinessAccount ? 'products' : 'coffees'} in collection</Text>
            </View>
          ) : activeTab === 'wishlist' ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No coffees in wishlist</Text>
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
    borderColor: '#CCCCCC',
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
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: '#666666',
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
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  gearTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
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
    padding: 8,
  },
  coffeeItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  coffeeImage: {
    width: 80,
    height: 80,
  },
  coffeeInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  coffeeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  roasterName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#000000',
    marginLeft: 4,
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
}); 