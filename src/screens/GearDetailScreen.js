import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useCoffee } from '../context/CoffeeContext';
import mockGearData from '../data/mockGear.json';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppImage from '../components/common/AppImage';

// Transform mockGear.json data to the format expected by the component
const gearData = mockGearData.gear.reduce((acc, item) => {
  // Create a simple entry for the gear item
  acc[item.name] = {
    id: item.id,
    name: item.name,
    image: item.imageUrl,
    description: item.description,
    price: item.price,
    brand: item.brand,
    type: item.type,
    whereToBuy: [
      { name: 'Vértigo y Calambre', url: 'https://vertigoycalambre.com', location: 'Murcia, Spain' },
      { name: item.brand, url: `https://${item.brand.toLowerCase()}.com`, location: 'Online' },
      { name: 'Amazon', url: 'https://amazon.com', location: 'Online' },
    ],
    // Default usedBy and wantedBy if needed
    usedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: require('../../assets/users/ivo-vilches.jpg') },
      { id: 'user5', name: 'Emma Garcia', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' }
    ],
    wantedBy: [
      { id: 'user3', name: 'Carlos Hernández', avatar: require('../../assets/users/carlos-hernandez.jpg') },
      { id: 'user9', name: 'Olivia Taylor', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' }
    ]
  };
  return acc;
}, {});

// Export gearData so it can be imported by other components
export { gearData };

export default function GearDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { gearName, gearId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const [inWishlist, setInWishlist] = useState(false);
  const { coffeeWishlist, addToWishlist, removeFromWishlist } = useCoffee();
  
  // Get gear data - try to match by ID first, then by name
  let gear;
  
  if (gearId) {
    // Try to find gear by ID first
    gear = Object.values(gearData).find(item => item.id === gearId);
  }
  
  if (!gear && gearName) {
    // If not found by ID, try to find by name
    gear = gearData[gearName];
  }
  
  // Fallback to default if still not found
  if (!gear) {
    gear = {
      id: gearId || 'unknown',
      name: gearName || 'Unknown Gear',
      image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
      description: 'No information available for this item.',
      price: 0,
      whereToBuy: [],
      usedBy: [],
      wantedBy: []
    };
  }
  
  // Set screen title
  useEffect(() => {
    navigation.setOptions({
      title: gear.name,
    });
  }, [navigation, gear.name]);
  
  // Check if item is in wishlist
  useEffect(() => {
    if (coffeeWishlist && gear) {
      const isInWishlist = coffeeWishlist.some(item => item.id === gear.id);
      setInWishlist(isInWishlist);
    }
  }, [coffeeWishlist, gear]);
  
  // Toggle wishlist
  const toggleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(gear.id);
      setInWishlist(false);
      Alert.alert('Removed', `${gear.name} removed from your wishlist`);
    } else {
      const wishlistItem = {
        id: gear.id,
        name: gear.name,
        image: gear.image,
        roaster: 'Gear',
        type: 'gear'
      };
      addToWishlist(wishlistItem);
      setInWishlist(true);
      Alert.alert('Added', `${gear.name} added to your wishlist`);
    }
  };
  
  // Handle user profile press
  const handleUserPress = (userId, userName) => {
    navigation.navigate('UserProfileBridge', {
      userId,
      userName,
      skipAuth: true
    });
  };
  
  // Handle shop press
  const handleShopPress = (shop) => {
    Alert.alert('Coming Soon', `You'll be able to visit ${shop.name} soon.`);
  };
  
  // Create a simple star rating component
  const StarRating = ({ rating, size = 16 }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {[...Array(fullStars)].map((_, i) => (
          <Ionicons key={`full-${i}`} name="star" size={size} color="#FFD700" />
        ))}
        {halfStar && (
          <Ionicons key="half" name="star-half" size={size} color="#FFD700" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Ionicons key={`empty-${i}`} name="star-outline" size={size} color="#FFD700" />
        ))}
      </View>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Gear Header */}
        <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
          {/* Gear Image */}
          <View style={styles.imageContainer}>
            <AppImage
              source={{ uri: gear.image }}
              style={styles.gearImage}
              resizeMode="contain"
            />
          </View>

          {/* Gear Details */}
          <View style={styles.gearInfo}>
            <Text style={[styles.gearName, { color: theme.primaryText }]}>{gear.name}</Text>
            <Text style={[styles.brandName, { color: theme.secondaryText }]}>{gear.brand}</Text>
            
            {/* Rating */}
            <View style={styles.ratingContainer}>
              <StarRating rating={gear.rating || 4.5} size={16} />
              <Text style={[styles.ratingText, { color: theme.secondaryText }]}>
                {gear.rating || 4.5} ({gear.numReviews || 254} reviews)
              </Text>
            </View>

            {/* Price */}
            <Text style={[styles.price, { color: theme.primaryText }]}>
              ${gear.price ? gear.price.toFixed(2) : '0.00'}
            </Text>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.wishlistButton, { backgroundColor: inWishlist ? '#007AFF' : theme.cardBackground, borderColor: theme.border }]}
                onPress={toggleWishlist}
              >
                <Ionicons
                  name={inWishlist ? "heart" : "heart-outline"}
                  size={20}
                  color={inWishlist ? '#FFFFFF' : theme.primaryText}
                  style={styles.wishlistIcon}
                />
                <Text style={[styles.wishlistText, { color: inWishlist ? '#FFFFFF' : theme.primaryText }]}>
                  {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Gear Description */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>About this gear</Text>
          <Text style={[styles.description, { color: theme.secondaryText }]}>{gear.description}</Text>
        </View>

        {/* People who use this */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>People who use this</Text>
          
          {gear.usedBy && gear.usedBy.length > 0 ? (
            <View style={styles.usersList}>
              {gear.usedBy.map((user, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.userItem, { borderBottomColor: theme.divider }]}
                  onPress={() => handleUserPress(user.id, user.name)}
                >
                  <AppImage
                    source={typeof user.avatar === 'string' ? { uri: user.avatar } : user.avatar}
                    style={styles.userAvatar}
                    resizeMode="cover"
                  />
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: theme.primaryText }]}>{user.name}</Text>
                    {user.location && (
                      <Text style={[styles.userLocation, { color: theme.secondaryText }]}>{user.location}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>No users found</Text>
            </View>
          )}
        </View>

        {/* Where to buy */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Where to buy</Text>
          
          {gear.whereToBuy && gear.whereToBuy.length > 0 ? (
            <View style={styles.shopsList}>
              {gear.whereToBuy.map((shop, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.shopItem, { borderBottomColor: theme.divider }]}
                  onPress={() => handleShopPress(shop)}
                >
                  <AppImage
                    source={typeof shop.logo === 'string' ? { uri: shop.logo } : shop.logo}
                    style={styles.shopLogo}
                    resizeMode="contain"
                  />
                  <View style={styles.shopInfo}>
                    <Text style={[styles.shopName, { color: theme.primaryText }]}>{shop.name}</Text>
                    <Text style={[styles.shopPrice, { color: theme.primaryText }]}>
                      {typeof shop.price === 'number' ? `$${shop.price.toFixed(2)}` : shop.price}
                    </Text>
                  </View>
                  <View style={[styles.shopButton, { backgroundColor: theme.primaryText }]}>
                    <Text style={[styles.shopButtonText, { color: theme.background }]}>Visit</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>No shops found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 20,
  },
  gearImage: {
    width: '100%',
    height: '100%',
  },
  gearInfo: {
    flex: 1,
  },
  gearName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  wishlistButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 10,
    padding: 12,
  },
  wishlistIcon: {
    marginRight: 8,
  },
  wishlistText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 8,
  },
  usersList: {
    width: '100%',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    width: '100%',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#E5E5EA',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  userLocation: {
    fontSize: 14,
    color: '#666666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
  },
  shopsList: {
    width: '100%',
  },
  shopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    width: '100%',
  },
  shopLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 12,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  shopPrice: {
    fontSize: 14,
    color: '#666666',
  },
  shopButton: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#007AFF',
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 