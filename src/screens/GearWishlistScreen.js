import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import mockData from '../data/mockData.json';
import { useCoffee } from '../context/CoffeeContext';
import GearCard from '../components/GearCard';

// Import gear details with usedBy data
import gearDetails from '../data/gearDetails';

const { width } = Dimensions.get('window');

export default function GearWishlistScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { userId, userName, isCurrentUser = false } = route.params || {};
  const { user: currentUser } = useCoffee();
  
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loadUserData = () => {
      // For current user
      if (isCurrentUser && currentUser) {
        setUserData(currentUser);
        setWishlistItems(currentUser.gearWishlist || []);
        setLoading(false);
        return;
      }
      
      // For other users
      if (userId) {
        const foundUser = mockData.users.find(u => u.id === userId);
        if (foundUser) {
          setUserData(foundUser);
          // Ensure we have a wishlist array, even if empty
          setWishlistItems(foundUser.gearWishlist || []);
        } else {
          // User not found, set empty wishlist
          setWishlistItems([]);
        }
      } else {
        // No userId, set empty wishlist
        setWishlistItems([]);
      }
      
      setLoading(false);
    };
    
    loadUserData();
  }, [userId, userName, isCurrentUser, currentUser]);

  // Find gear details from mockData.gear array and enhance with usedBy data
  const getGearDetails = (gearName) => {
    if (!gearName) return null;
    
    // First try to find gear in mockData.gear
    const mockGear = mockData.gear.find(gear => gear.name === gearName);
    
    // Then check if we have detailed gear data with usedBy information
    const detailedGear = gearDetails && gearDetails[gearName];
    
    // Combine the data, prioritizing detailed gear data
    if (detailedGear) {
      return {
        ...mockGear || {},
        ...detailedGear,
        usedBy: detailedGear.usedBy || []
      };
    }
    
    return mockGear;
  };

  const handleGearPress = (gearName) => {
    console.log('Navigating to GearDetail with:', gearName);
    navigation.navigate('GearDetail', {
      gearName: gearName
    });
  };

  const renderWishlistItem = ({ item }) => {
    const gearDetails = getGearDetails(item);
    
    // Convert string gear name to object with required properties for GearCard
    const gearObject = gearDetails || {
      id: `gear-${item}`,
      name: item,
      imageUrl: null,
      brand: '',
      type: 'Unknown',
      price: 0,
      usedBy: [] // Add empty usedBy array for consistency
    };
    
    // Log the gear object to verify usedBy data
    console.log(`Rendering wishlist item ${item}:`, gearObject.usedBy);
    
    return (
      <GearCard 
        item={gearObject}
        isWishlist={true}
        showAvatars={true}
        onPress={() => handleGearPress(item)}
        onWishlistToggle={() => {
          // Here you would handle the wishlist toggle
          console.log('Toggle wishlist for:', item);
        }}
      />
    );
  };

  // Return customized empty state based on whether it's current user or someone else
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text>
        <Ionicons name="bookmark-outline" size={60} color="#CCCCCC" />
      </Text>
      <Text style={styles.emptyText}>
        {isCurrentUser ? 'Your wishlist is empty' : `${userName}'s wishlist is empty`}
      </Text>
      <Text style={styles.emptySubtext}>
        {isCurrentUser 
          ? 'Items bookmarked from the Gear Detail page will appear here'
          : 'This user has not added any gear to their wishlist yet'}
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.emptyButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container]}>
      <StatusBar barStyle="dark-content" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={renderWishlistItem}
          keyExtractor={(item, index) => `${item}-${index}`}
          contentContainerStyle={styles.listContainer}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} in wishlist
            </Text>
          }
          ListEmptyComponent={renderEmptyState()}
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
  listContainer: {
    padding: 12,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 16,
    marginLeft: 4,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginVertical: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 