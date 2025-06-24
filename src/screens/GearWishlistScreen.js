import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import mockUsers from '../data/mockUsers.json';
import mockGear from '../data/mockGear.json';
import gearDetails from '../data/gearDetails';
import AppImage from '../components/common/AppImage';
import GearCard from '../components/GearCard';
import { useTheme } from '../context/ThemeContext';

// Helper function to get the gear details by name
const getGearDetails = (gearName) => {
  if (!gearName) return null;
  
  // Find the gear in mockGear.gear
  const mockGearItem = mockGear.gear.find(g => g.name === gearName);
  
  // Find the gear in gearDetails
  const detailedGear = gearDetails[gearName];
  
  if (!mockGearItem && !detailedGear) return null;
  
  // Combine the data from both sources
  return {
    name: gearName,
    imageUrl: mockGearItem?.imageUrl || detailedGear?.image,
    description: detailedGear?.description || mockGearItem?.description || '',
    brand: detailedGear?.brand || mockGearItem?.brand || '',
    avgRating: detailedGear?.avgRating || mockGearItem?.avgRating || 0,
    numReviews: detailedGear?.numReviews || mockGearItem?.numReviews || 0,
    usedBy: detailedGear?.usedBy || getUsersByGear(gearName)
  };
};

// Helper function to find users who have the specified gear
const getUsersByGear = (gearName) => {
  if (!gearName) return [];
  
  return mockUsers.users
    .filter(user => user.gear && user.gear.includes(gearName))
    .map(user => ({
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar
    }));
};

const GearWishlistScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, userName, isCurrentUser } = route.params || {};
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, [userId]);

  const loadWishlist = () => {
    // Skip navigation bar setup in this screen as we're using the one from App.js
    
    // Get user data
    const user = mockUsers.users.find(u => u.id === userId) || 
                 mockUsers.users.find(u => u.id === 'user1'); // Default to user1 if not found

    if (user && user.gearWishlist && user.gearWishlist.length > 0) {
      // Map gear wishlist names to actual gear objects
      const wishlistGear = user.gearWishlist.map(gearName => {
        // Find the gear in mockGear.json
        const foundGear = mockGear.gear.find(g => g.name === gearName);
        
        if (foundGear) {
          return foundGear;
        } else {
          // Create a placeholder for gear not found in the database
          return {
            id: `placeholder-${gearName}`,
            name: gearName,
            brand: 'Unknown Brand',
            price: '-',
            imageUrl: null
          };
        }
      });
      
      setWishlistItems(wishlistGear);
    } else {
      setWishlistItems([]);
    }
    
    setLoading(false);
  };

  const renderWishlistItem = ({ item, index }) => (
    <TouchableOpacity 
      style={[
        styles.gearCard, 
        { backgroundColor: theme.cardBackground },
        index % 2 === 0 ? { marginRight: 8 } : { marginLeft: 8 }
      ]}
      onPress={() => navigation.navigate('GearDetail', { 
        gearName: item.name,
        gear: item
      })}
    >
      <View style={styles.gearImageContainer}>
        {item.imageUrl ? (
          <AppImage 
            source={item.imageUrl} 
            style={styles.gearImage}
            resizeMode="cover"
            placeholder="hardware-chip"
          />
        ) : (
          <View style={[styles.gearImagePlaceholder, { backgroundColor: theme.placeholder }]}>
            <Ionicons name="hardware-chip-outline" size={30} color={theme.secondaryText} />
          </View>
        )}
      </View>
      <View style={styles.gearInfo}>
        <Text style={[styles.gearBrand, { color: theme.secondaryText }]}>{item.brand}</Text>
        <Text style={[styles.gearName, { color: theme.primaryText }]}>{item.name}</Text>
        <Text style={[styles.gearPrice, { color: theme.primaryText }]}>{typeof item.price === 'number' ? `€${item.price.toFixed(2)}` : item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {loading ? (
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <Text style={{ color: theme.primaryText }}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={renderWishlistItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.flatListContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={() => (
            <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
              {/* <Ionicons name="hardware-chip-outline" size={50} color="#CCCCCC" /> */}
              <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No items in the wishlist</Text>
              {isCurrentUser && (
                <Text style={[styles.emptySubText, { color: theme.tertiaryText }]}>Browse coffee gear to add items to your wishlist</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

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
  flatListContent: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gearCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    maxWidth: '48%',
  },
  gearImageContainer: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  gearImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  gearImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gearInfo: {
    padding: 12,
  },
  gearBrand: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  gearName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  gearPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // paddingTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

export default GearWishlistScreen; 