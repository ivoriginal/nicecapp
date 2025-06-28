import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
  ActionSheetIOS,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useCoffee } from '../context/CoffeeContext';
import mockGearData from '../data/mockGear.json';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppImage from '../components/common/AppImage';
import mockUsers from '../data/mockUsers.json';

// Transform mockGear.json data to the format expected by the component
const gearData = mockGearData.gear.reduce((acc, item) => {
  // Create a simple entry for the gear item with real purchase links
  let whereToBuy = [];
  
  // Add real purchase links based on the item
  if (item.name === 'Fellow Stagg EKG') {
    whereToBuy = [
      { name: 'Fellow Products', url: 'https://fellowproducts.com/products/stagg-ekg-electric-pour-over-kettle', price: '$199.95', logo: 'https://fellowproducts.com/cdn/shop/files/Fellow_Logo_Black_160x.png' },
      { name: 'Amazon', url: 'https://www.amazon.com/Fellow-Electric-Pour-over-Kettle/dp/B077JBQZPX', price: '$199.95', logo: 'https://logo.clearbit.com/amazon.com' },
      { name: 'Tea Forté', url: 'https://teaforte.com/products/tea-accessories-stagg-electric-kettle-ekg-matte-black-21096', price: '$165.00', logo: 'https://logo.clearbit.com/teaforte.com' },
    ];
  } else if (item.name === 'Baratza Encore') {
    whereToBuy = [
      { name: 'Amazon', url: 'https://www.amazon.com/Baratza-Encore-Conical-Coffee-Grinder/dp/B007F183LK', price: '$149.95', logo: 'https://logo.clearbit.com/amazon.com' },
      { name: 'Prima Coffee', url: 'https://prima-coffee.com/equipment/baratza/485', price: '$149.95', logo: 'https://logo.clearbit.com/prima-coffee.com' },
      { name: 'Baratza Direct', url: 'https://baratza.com/grinder/encore/', price: '$149.95', logo: 'https://logo.clearbit.com/baratza.com' },
    ];
  } else {
    // Fallback for other items
    whereToBuy = [
      { name: 'Vértigo y Calambre', url: 'https://vertigoycalambre.com', price: `$${item.price}`, logo: 'https://logo.clearbit.com/vertigoycalambre.com' },
      { name: item.brand, url: `https://${item.brand.toLowerCase().replace(/\s+/g, '')}.com`, price: `$${item.price}`, logo: `https://logo.clearbit.com/${item.brand.toLowerCase().replace(/\s+/g, '')}.com` },
      { name: 'Amazon', url: 'https://amazon.com', price: `$${item.price}`, logo: 'https://logo.clearbit.com/amazon.com' },
    ];
  }
  
  acc[item.name] = {
    id: item.id,
    name: item.name,
    image: item.imageUrl,
    description: item.description,
    price: item.price,
    brand: item.brand,
    type: item.type,
    whereToBuy,
    // Connect to real user data from mockUsers.json based on gear in their profile
    usedBy: mockUsers.users
      .filter(user => user.gear && user.gear.includes(item.name))
      .map(user => {
        let avatar = user.userAvatar;
        // Handle local asset paths
        if (user.userAvatar === 'assets/users/ivo-vilches.jpg') {
          avatar = require('../../assets/users/ivo-vilches.jpg');
        } else if (user.userAvatar === 'assets/users/carlos-hernandez.jpg') {
          avatar = require('../../assets/users/carlos-hernandez.jpg');
        } else if (user.userAvatar === 'assets/users/elias-veris.jpg') {
          avatar = require('../../assets/users/elias-veris.jpg');
        }
        
        return {
          id: user.id,
          name: user.userName,
          avatar: avatar
        };
      }),
    wantedBy: mockUsers.users
      .filter(user => user.gearWishlist && user.gearWishlist.includes(item.name))
      .map(user => {
        let avatar = user.userAvatar;
        // Handle local asset paths
        if (user.userAvatar === 'assets/users/ivo-vilches.jpg') {
          avatar = require('../../assets/users/ivo-vilches.jpg');
        } else if (user.userAvatar === 'assets/users/carlos-hernandez.jpg') {
          avatar = require('../../assets/users/carlos-hernandez.jpg');
        } else if (user.userAvatar === 'assets/users/elias-veris.jpg') {
          avatar = require('../../assets/users/elias-veris.jpg');
        }
        
        return {
          id: user.id,
          name: user.userName,
          avatar: avatar
        };
      })
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
  
  // Set screen title and header options
  useEffect(() => {
    navigation.setOptions({
      title: gear.name,
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 8 }}
          onPress={showActionSheet}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.primaryText} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, gear.name, theme.primaryText]);
  
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
      Alert.alert('Removed', `${gear.name} removed from your wishlist`, [], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
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
      Alert.alert('Added', `${gear.name} added to your wishlist`, [], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
    }
  };
  
  // Handle user profile press
  const handleUserPress = (userId, userName) => {
    navigation.push('UserProfileBridge', {
      userId,
      userName,
      skipAuth: true
    });
  };
  
  // Handle shop press - open in browser
  const handleShopPress = async (shop) => {
    try {
      const supported = await Linking.canOpenURL(shop.url);
      if (supported) {
        await Linking.openURL(shop.url);
      } else {
        Alert.alert('Error', `Cannot open ${shop.name} website`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to open ${shop.name} website`);
    }
  };

  // Handle action sheet options
  const showActionSheet = () => {
    const options = ['Share', 'Add to Collection', 'Cancel'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          title: 'Options',
          message: `Choose an action for ${gear.name}`,
          userInterfaceStyle: isDarkMode ? 'dark' : 'light',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Share
            Alert.alert('Share', 'Sharing functionality coming soon!');
          } else if (buttonIndex === 1) {
            // Add to Collection
            Alert.alert('Collection', 'Add to collection coming soon!');
          }
        }
      );
    } else {
      // Android fallback - use Alert with buttons
      Alert.alert(
        'Options',
        `Choose an action for ${gear.name}`,
        [
          { text: 'Share', onPress: () => Alert.alert('Share', 'Sharing functionality coming soon!') },
          { text: 'Add to Collection', onPress: () => Alert.alert('Collection', 'Add to collection coming soon!') },
          { text: 'Cancel', style: 'cancel' }
        ],
        {
          userInterfaceStyle: isDarkMode ? 'dark' : 'light'
        }
      );
    }
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
        {/* Gear Header - Redesigned */}
        <View style={[styles.headerCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.headerContent}>
            {/* Gear Image */}
            <View style={[styles.imageContainer, { backgroundColor: theme.surface }]}>
              <AppImage
                source={{ uri: gear.image }}
                style={styles.gearImage}
                resizeMode="contain"
              />
            </View>

            {/* Gear Details */}
            <View style={styles.gearInfo}>
              <View style={styles.titleSection}>
                <Text style={[styles.gearName, { color: theme.primaryText }]}>{gear.name}</Text>
                <Text style={[styles.brandName, { color: '#007AFF' }]}>{gear.brand}</Text>
              </View>
              
              {/* Rating and Reviews */}
              <View style={styles.ratingSection}>
                <View style={styles.ratingContainer}>
                  <StarRating rating={gear.rating || 4.5} size={16} />
                  <Text style={[styles.ratingText, { color: theme.primaryText }]}>
                    {gear.rating || 4.5}
                  </Text>
                  <Text style={[styles.reviewCount, { color: theme.secondaryText }]}>
                    ({gear.numReviews || 254})
                  </Text>
                </View>
              </View>

              {/* Price */}
              <View style={styles.priceSection}>
                <Text style={[styles.priceFromLabel, { color: theme.secondaryText }]}>
                  From
                </Text>
                <Text style={[styles.price, { color: theme.primaryText }]}>
                  ${gear.price ? gear.price.toFixed(2) : '0.00'}
                </Text>
              </View>

              {/* Action buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.wishlistButton, { 
                    backgroundColor: inWishlist ? '#007AFF' : theme.surface, 
                    borderColor: '#007AFF',
                    borderWidth: inWishlist ? 0 : 1
                  }]}
                  onPress={toggleWishlist}
                >
                  <Ionicons
                    name={inWishlist ? "heart" : "heart-outline"}
                    size={20}
                    color={inWishlist ? '#FFFFFF' : '#007AFF'}
                  />
                                  <Text style={[styles.wishlistText, { color: inWishlist ? '#FFFFFF' : '#007AFF' }]}>
                  {inWishlist ? 'In Wishlist' : 'Wishlist'}
                </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Gear Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>About this gear</Text>
          <Text style={[styles.description, { color: theme.secondaryText }]}>{gear.description}</Text>
        </View>

        {/* People who have it */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>People who have it</Text>
          
          {gear.usedBy && gear.usedBy.length > 0 ? (
            <View style={styles.avatarsContainer}>
              <View style={styles.avatarsRow}>
                {gear.usedBy.slice(0, 6).map((user, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.avatarItem, { marginRight: index < 5 ? 12 : 0 }]}
                    onPress={() => handleUserPress(user.id, user.name)}
                  >
                    <AppImage
                      source={typeof user.avatar === 'string' ? { uri: user.avatar } : user.avatar}
                      style={[styles.avatarImage, { borderColor: theme.border }]}
                      resizeMode="cover"
                    />
                    <Text style={[styles.avatarName, { color: theme.secondaryText }]} numberOfLines={1}>
                      {user.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
                {gear.usedBy.length > 6 && (
                  <View style={[styles.avatarItem, styles.moreAvatars]}>
                    <View style={[styles.moreAvatarsCircle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <Text style={[styles.moreAvatarsText, { color: theme.secondaryText }]}>
                        +{gear.usedBy.length - 6}
                      </Text>
                    </View>
                    <Text style={[styles.avatarName, { color: theme.secondaryText }]} numberOfLines={1}>
                      more
                    </Text>
                  </View>
                )}
              </View>
              
              {/* People you follow who want this */}
              {gear.wantedBy && gear.wantedBy.length > 0 && (
                <View style={styles.wantedSection}>
                  <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
                    People you follow who want this
                  </Text>
                  <View style={styles.avatarsRow}>
                    {gear.wantedBy.slice(0, 6).map((user, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.avatarItem, { marginRight: index < 5 ? 12 : 0 }]}
                        onPress={() => handleUserPress(user.id, user.name)}
                      >
                        <View style={styles.wantedAvatarContainer}>
                          <AppImage
                            source={typeof user.avatar === 'string' ? { uri: user.avatar } : user.avatar}
                            style={[styles.avatarImage, { borderColor: '#FF6B6B' }]}
                            resizeMode="cover"
                          />
                          <View style={styles.wantIconContainer}>
                            <Ionicons 
                              name="heart" 
                              size={12} 
                              color="#FF6B6B" 
                            />
                          </View>
                        </View>
                        <Text style={[styles.avatarName, { color: theme.secondaryText }]} numberOfLines={1}>
                          {user.name.split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {gear.wantedBy.length > 6 && (
                      <View style={[styles.avatarItem, styles.moreAvatars]}>
                        <View style={[styles.moreAvatarsCircle, { backgroundColor: theme.surface, borderColor: '#FF6B6B' }]}>
                          <Text style={[styles.moreAvatarsText, { color: '#FF6B6B' }]}>
                            +{gear.wantedBy.length - 6}
                          </Text>
                        </View>
                        <Text style={[styles.avatarName, { color: theme.secondaryText }]} numberOfLines={1}>
                          want
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>No one has this yet</Text>
            </View>
          )}
        </View>

        {/* Where to buy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Where to buy</Text>
          
          {gear.whereToBuy && gear.whereToBuy.length > 0 ? (
            <View style={styles.shopsList}>
              {gear.whereToBuy.map((shop, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.shopItem, { 
                    backgroundColor: theme.surface,
                    borderRadius: 12,
                    marginBottom: 12,
                    shadowColor: theme.shadow,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    elevation: 2
                  }]}
                  onPress={() => handleShopPress(shop)}
                >
                  <View style={styles.shopContent}>
                    <View style={styles.shopMainInfo}>
                      <Text style={[styles.shopName, { color: theme.primaryText }]}>{shop.name}</Text>
                      <Text style={[styles.shopPrice, { color: '#007AFF' }]}>
                        {shop.price}
                      </Text>
                    </View>
                    <View style={styles.shopAction}>
                      <Ionicons name="open-outline" size={20} color="#007AFF" />
                    </View>
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
  headerCard: {
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
  },
  gearImage: {
    width: '100%',
    height: '100%',
  },
  gearInfo: {
    flex: 1,
  },
  titleSection: {
    marginBottom: 12,
  },
  gearName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 28,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingSection: {
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  reviewCount: {
    fontSize: 13,
    marginLeft: 2,
  },
  priceSection: {
    marginBottom: 16,
  },
  priceFromLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  wishlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  wishlistText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Avatar styles
  avatarsContainer: {
    marginTop: 16,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarItem: {
    alignItems: 'center',
    width: 60,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    marginBottom: 6,
  },
  avatarName: {
    fontSize: 12,
    textAlign: 'center',
    width: 60,
  },
  moreAvatars: {
    alignItems: 'center',
  },
  moreAvatarsCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  moreAvatarsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Shared section styles
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  // Wanted section styles
  wantedSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  wantedAvatarContainer: {
    position: 'relative',
  },
  wantIconContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
    width: '100%',
    padding: 16,
  },
  shopContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopMainInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  shopPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shopAction: {
    padding: 8,
  },
}); 