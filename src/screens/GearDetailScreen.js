import React, { useState, useEffect, useLayoutEffect } from 'react';
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
import mockCafes from '../data/mockCafes.json';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppImage from '../components/common/AppImage';
import mockUsers from '../data/mockUsers.json';
import Toast from '../components/Toast';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

// Transform mockGear.json data to the format expected by the component
const gearData = mockGearData.gear.reduce((acc, item) => {
  // Create a simple entry for the gear item with real purchase links
  let whereToBuy = [];
  
  // Add real purchase links based on the item
  if (item.name === 'Fellow Stagg EKG') {
    whereToBuy = [
      { name: 'Fellow Products', url: 'https://fellowproducts.com/products/stagg-ekg-electric-pour-over-kettle', price: '€179.95', logo: 'https://fellowproducts.com/cdn/shop/files/Fellow_Logo_Black_160x.png' },
      { name: 'Amazon', url: 'https://www.amazon.es/Fellow-Electric-Pour-over-Kettle/dp/B077JBQZPX', price: '€179.95', logo: 'https://logo.clearbit.com/amazon.es' },
      { name: 'Tea Forté', url: 'https://teaforte.com/products/tea-accessories-stagg-electric-kettle-ekg-matte-black-21096', price: '€149.00', logo: 'https://logo.clearbit.com/teaforte.com' },
    ];
  } else if (item.name === 'Baratza Encore') {
    whereToBuy = [
      { name: 'Amazon', url: 'https://www.amazon.es/Baratza-Encore-Conical-Coffee-Grinder/dp/B007F183LK', price: '€139.95', logo: 'https://logo.clearbit.com/amazon.es' },
      { name: 'Prima Coffee', url: 'https://prima-coffee.com/equipment/baratza/485', price: '€139.95', logo: 'https://logo.clearbit.com/prima-coffee.com' },
      { name: 'Baratza Direct', url: 'https://baratza.com/grinder/encore/', price: '€139.95', logo: 'https://logo.clearbit.com/baratza.com' },
    ];
  } else {
    // Fallback for other items
    whereToBuy = [
      { name: 'Vértigo y Calambre', url: 'https://vertigoycalambre.com', price: `€${item.price}`, logo: 'https://logo.clearbit.com/vertigoycalambre.com' },
      { name: item.brand, url: `https://${item.brand.toLowerCase().replace(/\s+/g, '')}.com`, price: `€${item.price}`, logo: `https://logo.clearbit.com/${item.brand.toLowerCase().replace(/\s+/g, '')}.com` },
      { name: 'Amazon', url: 'https://amazon.es', price: `€${item.price}`, logo: 'https://logo.clearbit.com/amazon.es' },
    ];
  }

  // Map gear to cafés that use it (based on gear type and realistic associations)
  let usedByCafes = [];
  if (item.name === 'Fellow Stagg EKG' || item.type === 'Kettle') {
    usedByCafes = [
      { id: 'kima-coffee', name: 'Kima Coffee', avatar: 'assets/businesses/kima-logo.jpg', location: 'Málaga, Spain' },
      { id: 'toma-cafe-1', name: 'Toma Café 1', avatar: 'assets/businesses/toma-logo.jpg', location: 'Madrid, Spain' },
      { id: 'cafelab-murcia', name: 'CaféLab Murcia', avatar: 'assets/businesses/cafelab-logo.png', location: 'Murcia, Spain' },
    ];
  } else if (item.name === 'Baratza Encore' || item.type === 'Grinder') {
    usedByCafes = [
      { id: 'toma-cafe-2', name: 'Toma Café 2', avatar: 'assets/businesses/toma-logo.jpg', location: 'Madrid, Spain' },
      { id: 'cafelab-cartagena', name: 'CaféLab Cartagena', avatar: 'assets/businesses/cafelab-logo.png', location: 'Cartagena, Spain' },
    ];
  } else if (item.type === 'Pour Over' || item.name.includes('V60') || item.name.includes('Chemex')) {
    usedByCafes = [
      { id: 'kima-coffee', name: 'Kima Coffee', avatar: 'assets/businesses/kima-logo.jpg', location: 'Málaga, Spain' },
      { id: 'toma-cafe-1', name: 'Toma Café 1', avatar: 'assets/businesses/toma-logo.jpg', location: 'Madrid, Spain' },
      { id: 'toma-cafe-2', name: 'Toma Café 2', avatar: 'assets/businesses/toma-logo.jpg', location: 'Madrid, Spain' },
      { id: 'cafelab-murcia', name: 'CaféLab Murcia', avatar: 'assets/businesses/cafelab-logo.png', location: 'Murcia, Spain' },
    ];
  } else if (item.type === 'Scale') {
    usedByCafes = [
      { id: 'kima-coffee', name: 'Kima Coffee', avatar: 'assets/businesses/kima-logo.jpg', location: 'Málaga, Spain' },
      { id: 'toma-cafe-1', name: 'Toma Café 1', avatar: 'assets/businesses/toma-logo.jpg', location: 'Madrid, Spain' },
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
        // Use the userAvatar directly as a string path, AppImage will handle it
        return {
          id: user.id,
          name: user.userName,
          avatar: user.userAvatar // Keep as string, AppImage will handle local assets
        };
      }),
    wantedBy: mockUsers.users
      .filter(user => user.gearWishlist && user.gearWishlist.includes(item.name))
      .map(user => {
        // Use the userAvatar directly as a string path, AppImage will handle it
        return {
          id: user.id,
          name: user.userName,
          avatar: user.userAvatar // Keep as string, AppImage will handle local assets
        };
      }),
    usedByCafes: usedByCafes
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
  const [inCollection, setInCollection] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showGearNameInHeader, setShowGearNameInHeader] = useState(false);
  const { coffeeWishlist, addToWishlist, removeFromWishlist } = useCoffee();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Animated values for header title
  const headerOpacity = useSharedValue(0);
  
  // Helper function to show toast
  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
  };
  
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
      brand: 'Unknown',
      whereToBuy: [],
      usedBy: [],
      wantedBy: [],
      usedByCafes: []
    };
  }

  // Animated header title styles
  const animatedDefaultTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(showGearNameInHeader ? 0 : 1, { duration: 150 }),
      transform: [
        {
          translateY: withTiming(showGearNameInHeader ? -10 : 0, { duration: 150 })
        }
      ]
    };
  });

  const animatedGearTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(showGearNameInHeader ? 1 : 0, { duration: 150 }),
      transform: [
        {
          translateY: withTiming(showGearNameInHeader ? 0 : 10, { duration: 150 })
        }
      ]
    };
  });
  
  // Set screen title and header options
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', height: 44 }}>
          <Animated.Text 
            style={[
              animatedDefaultTitleStyle,
              {
                position: 'absolute',
                color: theme.primaryText,
                fontSize: 17,
                fontWeight: '600',
              }
            ]}
          >
            Gear Details
          </Animated.Text>
          <Animated.Text 
            style={[
              animatedGearTitleStyle,
              {
                position: 'absolute',
                color: theme.primaryText,
                fontSize: 17,
                fontWeight: '600',
                textAlign: 'center',
                maxWidth: 200,
              }
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {gear.name}
          </Animated.Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 16 }}
          onPress={showActionSheet}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.primaryText} />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: theme.background,
        elevation: 0, // Remove shadow on Android
        shadowOpacity: 0, // Remove shadow on iOS
        borderBottomWidth: 1,
        borderBottomColor: theme.divider,
      },
      headerTintColor: theme.primaryText,
    });
  }, [navigation, gear.name, theme.primaryText, theme.background, theme.divider, isDarkMode, scrollY, showGearNameInHeader, animatedDefaultTitleStyle, animatedGearTitleStyle]);
  
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
      setInWishlist(false); // Update local state immediately
      showToast(`${gear.name} removed from your wishlist`);
    } else {
      const wishlistItem = {
        id: gear.id,
        name: gear.name,
        image: gear.image,
        roaster: 'Gear',
        type: 'gear'
      };
      addToWishlist(wishlistItem);
      setInWishlist(true); // Update local state immediately
      showToast(`${gear.name} added to your wishlist`);
    }
  };

  // Toggle collection (have it)
  const toggleCollection = () => {
    setInCollection(!inCollection);
    showToast(`${gear.name} ${inCollection ? 'removed from' : 'added to'} your collection`);
  };

  // Navigate to GearListScreen with brand filter
  const navigateToGearList = () => {
    navigation.navigate('GearList', {
      preselectedBrand: gear.brand
    });
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
        showToast(`Cannot open ${shop.name} website`);
      }
    } catch (error) {
      showToast(`Failed to open ${shop.name} website`);
    }
  };

  // Handle action sheet options
  const showActionSheet = () => {
    const options = ['Share', 'Cancel'];
    const cancelButtonIndex = 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          userInterfaceStyle: isDarkMode ? 'dark' : 'light',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Share
            showToast('Sharing functionality coming soon!');
          }
        }
      );
    } else {
      // Android fallback - use Alert with buttons
      Alert.alert(
        '',
        '',
        [
          { text: 'Share', onPress: () => showToast('Sharing functionality coming soon!') },
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
        onScroll={(event) => {
          const currentScrollY = event.nativeEvent.contentOffset.y;
          setScrollY(currentScrollY);
          
          // Show gear name in header when scrolled past the gear name section
          const gearNameThreshold = 200;
          setShowGearNameInHeader(currentScrollY > gearNameThreshold);
        }}
        scrollEventThrottle={16}
      >
        {/* Gear Header - Redesigned */}
        <View style={[styles.headerCard, { backgroundColor: theme.background }]}>
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
                <TouchableOpacity onPress={navigateToGearList}>
                  <Text style={[styles.brandName, { color: theme.primaryText }]}>{gear.brand}</Text>
                </TouchableOpacity>
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
              {/* <View style={styles.priceSection}>
                <Text style={[styles.priceFromLabel, { color: theme.secondaryText }]}>
                  From
                </Text>
                <Text style={[styles.price, { color: theme.primaryText }]}>
                  €{gear.price ? gear.price.toFixed(2) : '0.00'}
                </Text>
              </View> */}
            </View>
          </View>

          {/* Action buttons - Full width row */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { 
                backgroundColor: inCollection ? 'transparent' : (isDarkMode ? theme.cardBackground : theme.background), 
                borderColor: theme.border,
                borderWidth: 1
              }]}
              onPress={toggleCollection}
            >
              <Ionicons
                name={inCollection ? "checkmark-circle" : "checkmark-circle-outline"}
                size={20}
                color={theme.primaryText}
              />
              <Text style={[styles.actionButtonText, { 
                color: theme.primaryText 
              }]}>
                {inCollection ? 'Have It' : 'I have this'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { 
                backgroundColor: inWishlist ? 'transparent' : (isDarkMode ? theme.cardBackground : theme.background), 
                borderColor: theme.border,
                borderWidth: 1
              }]}
              onPress={toggleWishlist}
            >
              <Ionicons
                name={inWishlist ? "bookmark" : "bookmark-outline"}
                size={20}
                color={theme.primaryText}
              />
              <Text style={[styles.actionButtonText, { 
                color: theme.primaryText 
              }]}>
                {inWishlist ? 'Wishlisted' : 'Wishlist'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Gear Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText, borderBottomColor: theme.divider }]}>About this gear</Text>
          <Text style={[styles.description, { color: theme.secondaryText }]}>{gear.description}</Text>
        </View>

        {/* People who have it */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText, borderBottomColor: theme.divider }]}>People who have it</Text>
          
          {gear.usedBy && gear.usedBy.length > 0 ? (
            <View style={styles.avatarsContainer}>
              <View style={styles.avatarsRow}>
                {gear.usedBy.slice(0, 6).map((user, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.avatarItem, { marginRight: index < 5 ? 8 : 0 }]}
                    onPress={() => handleUserPress(user.id, user.name)}
                  >
                    <AppImage
                      source={user.avatar}
                      style={styles.avatarImage}
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
                  <Text style={[styles.sectionTitle, { color: theme.primaryText, borderBottomColor: theme.divider }]}>
                    People you follow who want this
                  </Text>
                  <View style={styles.avatarsRow}>
                    {gear.wantedBy.slice(0, 6).map((user, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.avatarItem, { marginRight: index < 5 ? 8 : 0 }]}
                        onPress={() => handleUserPress(user.id, user.name)}
                      >
                        <View style={styles.wantedAvatarContainer}>
                          <AppImage
                            source={user.avatar}
                            style={styles.avatarImage}
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
                        <View style={[styles.moreAvatarsCircle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                          <Text style={[styles.moreAvatarsText, { color: theme.secondaryText }]}>
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

        {/* Cafés that use it */}
        {gear.usedByCafes && gear.usedByCafes.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.primaryText, borderBottomColor: theme.divider }]}>Cafés that use it</Text>
            <View style={styles.cafesList}>
              {gear.usedByCafes.map((cafe, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.cafeItem,
                    { borderBottomColor: 'transparent' },
                    index === gear.usedByCafes.length - 1 ? styles.cafeItemNoBorder : null
                  ]}
                  onPress={() => {
                    navigation.navigate('UserProfileBridge', { 
                      userId: cafe.id, 
                      userName: cafe.name,
                      skipAuth: true,
                      isBusinessAccount: true
                    });
                  }}
                >
                  <AppImage
                    source={cafe.avatar}
                    style={styles.cafeAvatar}
                    resizeMode="cover"
                  />
                  <View style={styles.cafeInfo}>
                    <Text style={[styles.cafeName, { color: theme.primaryText }]}>{cafe.name}</Text>
                    <Text style={[styles.cafeLocation, { color: theme.secondaryText }]}>{cafe.location}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Where to buy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText, borderBottomColor: theme.divider }]}>Where to buy</Text>
          
          {gear.whereToBuy && gear.whereToBuy.length > 0 ? (
            <View style={styles.shopsList}>
              {gear.whereToBuy.map((shop, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.shopItem, { 
                    backgroundColor: theme.surface,
                    borderRadius: 12,
                    marginBottom: 16,
                    // shadowColor: theme.shadow,
                    // shadowOffset: { width: 0, height: 1 },
                    // shadowOpacity: 0.1,
                    // shadowRadius: 3,
                    // elevation: 2,
                    // padding: 16,
                  }]}
                  onPress={() => handleShopPress(shop)}
                >
                  <View style={styles.shopContent}>
                    <View style={styles.shopLeft}>
                      <AppImage
                        source={{ uri: shop.logo }}
                        style={styles.shopLogo}
                        resizeMode="contain"
                      />
                      <View style={styles.shopMainInfo}>
                        <Text style={[styles.shopName, { color: theme.primaryText }]}>{shop.name}</Text>
                        <Text style={[styles.shopPrice, { color: theme.primaryText }]}>
                          {shop.price}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.shopAction}>
                      <Ionicons name="open-outline" size={20} color={theme.primaryText} />
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
              <Toast 
          visible={toastVisible}
          message={toastMessage}
          onDismiss={() => setToastVisible(false)}
        />
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
    paddingBottom: 16,
    // margin: 16,
    // borderRadius: 16,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // padding: 20,
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
    fontWeight: '400',
    marginBottom: 12,
    // borderBottomWidth: 1,
    // borderBottomColor: '#E5E5EA',
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
    marginVertical: 16,
    marginTop: 8,
    // marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Avatar styles
  avatarsContainer: {
    // marginTop: 16,
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
  },
  wantedAvatarContainer: {
    position: 'relative',
  },
  wantIconContainer: {
    position: 'absolute',
    bottom: 2,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 2,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.2,
    // shadowRadius: 2,
    // elevation: 2,
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
    width: '100%',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
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
    marginTop: 4,
  },
  shopItem: {
    width: '100%',
  },
  shopContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shopLogo: {
    width: 48,
    height: 48,
    marginRight: 12,
    borderRadius: 8,
  },
  shopMainInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 4,
  },
  shopPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  shopAction: {
    padding: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
  },
  // Café styles
  cafesList: {
    width: '100%',
  },
  cafeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  cafeItemNoBorder: {
    borderBottomWidth: 0,
  },
  cafeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  cafeInfo: {
    flex: 1,
  },
  cafeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cafeLocation: {
    fontSize: 14,
  },
}); 