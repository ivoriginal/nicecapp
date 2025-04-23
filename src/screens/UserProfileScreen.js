import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator
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
  const { coffeeEvents } = useCoffee();
  
  const [user, setUser] = useState(null);
  const [userCoffees, setUserCoffees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('coffees'); // 'coffees' or 'recipes'

  useEffect(() => {
    // Find user in mock data immediately (no need for setTimeout)
    const foundUser = mockData.users.find(u => u.id === userId) || mockData.users[0];
    setUser(foundUser);
    
    // Get user's coffee events from the context
    const userEvents = coffeeEvents ? coffeeEvents.filter(event => event.userId === userId) : [];
    setUserCoffees(userEvents);
    
    setLoading(false);
  }, [userId, coffeeEvents]);

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
          <View style={styles.header}>
            <Image 
              source={{ uri: user.userAvatar }} 
              style={styles.avatar} 
            />
            <Text style={styles.userName}>{user.userName}</Text>
            <Text style={styles.userHandle}>@{user.userName.toLowerCase().replace(/\s+/g, '_')}</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userCoffees.length}</Text>
                <Text style={styles.statLabel}>Coffees</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>
          
          {/* Bio */}
          {user.bio && (
            <View style={styles.bioContainer}>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          )}
          
          {/* Location */}
          {user.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color="#666666" />
              <Text style={styles.locationText}>{user.location}</Text>
            </View>
          )}
          
          {/* Gear */}
          {user.gear && user.gear.length > 0 && (
            <View style={styles.gearContainer}>
              <Text style={styles.gearTitle}>Gear</Text>
              <View style={styles.gearList}>
                {user.gear.map((item, index) => (
                  <View key={index} style={styles.gearItem}>
                    <Text style={styles.gearText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'coffees' && styles.activeTab]}
              onPress={() => setActiveTab('coffees')}
            >
              <Text style={[styles.tabText, activeTab === 'coffees' && styles.activeTabText]}>Coffees</Text>
            </TouchableOpacity>
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
    backgroundColor: '#F2F2F7',
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
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
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
    fontWeight: '600',
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
  },
  followButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bioContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  bioText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
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
    padding: 16,
  },
  coffeeItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
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
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  locationText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
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
}); 