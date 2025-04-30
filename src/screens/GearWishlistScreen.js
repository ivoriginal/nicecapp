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

const { width } = Dimensions.get('window');
const cardWidth = width / 2 - 24; // 2 cards per row with spacing

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

  const handleGearPress = (item) => {
    console.log('Navigating to GearDetail with:', item);
    navigation.navigate('GearDetail', {
      gearName: item
    });
  };

  const renderWishlistItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => handleGearPress(item)}
    >
      <View style={styles.cardIconContainer}>
        <Ionicons name="hardware-chip-outline" size={28} color="#666666" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item}</Text>
        
        <View style={styles.cardActions}>
          <View style={styles.cardTag}>
            <Text style={styles.cardTagText}>Wishlist</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#999999" />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Return customized empty state based on whether it's current user or someone else
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={60} color="#CCCCCC" />
      <Text style={styles.emptyText}>
        {isCurrentUser ? 'Your wishlist is empty' : `${userName}'s wishlist is empty`}
      </Text>
      <Text style={styles.emptySubtext}>
        {isCurrentUser 
          ? 'Items marked as wishlist from the Gear Detail page will appear here'
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isCurrentUser ? 'My Gear Wishlist' : `${userName}'s Gear Wishlist`}
        </Text>
        <View style={styles.placeholder} />
      </View>
      
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
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  placeholder: {
    width: 32,
    height: 32,
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
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardIconContainer: {
    backgroundColor: '#F8F8F8',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 90,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    height: 36,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTag: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  cardTagText: {
    fontSize: 12,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
}); 