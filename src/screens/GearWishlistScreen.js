import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActionSheetIOS,
  Share,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import mockUsers from '../data/mockUsers.json';
import mockGear from '../data/mockGear.json';
import gearDetails from '../data/gearDetails';
import { getGearWishlist, removeGearFromWishlist } from '../lib/supabase';
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
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, isDarkMode, insets);
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, userName, isCurrentUser } = route.params || {};
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Load wishlist whenever the component mounts or the userId changes
    loadWishlist();
  }, [userId]);

  useEffect(() => {
    // Configure navigation header with three-dot menu or Done button
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={isEditing ? () => setIsEditing(false) : showActionSheet}
          style={[styles.headerButton, isEditing && styles.headerButtonActive]}
        >
          {isEditing ? (
            <Text style={[styles.headerButtonText, { color: theme.background }]}>Done</Text>
          ) : (
            <Ionicons name="ellipsis-horizontal" size={20} color={theme.primaryText} />
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEditing, styles]);

  const loadWishlist = async () => {
    try {
      setLoading(true);

      // 1. Attempt to fetch wishlist from Supabase
      const supabaseWishlist = await getGearWishlist();

      if (supabaseWishlist && supabaseWishlist.length > 0) {
        setWishlistItems(supabaseWishlist);
        return;
      }

      // 2. Fallback to mock data for existing mock users (e.g. during development)
      const user = mockUsers.users.find(u => u.id === userId);

      if (user && user.gearWishlist && user.gearWishlist.length > 0) {
        const wishlistGear = user.gearWishlist.map(gearName => {
          const foundGear = mockGear.gear.find(g => g.name === gearName);

          if (foundGear) {
            return foundGear;
          }

          return {
            id: `placeholder-${gearName}`,
            name: gearName,
            brand: 'Unknown Brand',
            price: '-',
            imageUrl: null,
          };
        });

        setWishlistItems(wishlistGear);
      } else {
        // 3. If no data, default to empty list
        setWishlistItems([]);
      }
    } catch (error) {
      console.error('Error loading gear wishlist:', error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      // Optimistically update UI
      setWishlistItems(prev => prev.filter(item => item.id !== itemId));

      // Remove from Supabase
      await removeGearFromWishlist(itemId);
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${userName || 'this user'}'s gear wishlist!`,
        // TODO: Replace with actual wishlist URL when backend is ready
        url: 'https://nicecapp.com/wishlist/placeholder',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const showActionSheet = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Share', 'Edit'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleShare();
          } else if (buttonIndex === 2) {
            setIsEditing(true);
          }
        }
      );
    } else {
      // For Android, show a simple alert for now
      Alert.alert(
        'Options',
        '',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share', onPress: handleShare },
          { text: 'Edit', onPress: () => setIsEditing(true) },
        ]
      );
    }
  };

  const renderWishlistItem = ({ item, index }) => (
    <View style={[
      styles.cardContainer,
      index % 2 === 0 ? { marginRight: 8 } : { marginLeft: 8 }
    ]}>
      <TouchableOpacity 
        style={styles.gearCard}
        onPress={() => !isEditing && navigation.navigate('GearDetail', { 
          gearName: item.name,
          gear: item
        })}
        disabled={isEditing}
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
            <View style={styles.gearImagePlaceholder}>
              <Ionicons name="hardware-chip-outline" size={30} color={theme.secondaryText} />
            </View>
          )}
        </View>
        <View style={styles.gearInfo}>
          <Text style={styles.gearBrand}>{item.brand}</Text>
          <Text style={styles.gearName}>{item.name}</Text>
          <Text style={styles.gearPrice}>{typeof item.price === 'number' ? `€${item.price.toFixed(2)}` : item.price}</Text>
        </View>
      </TouchableOpacity>
      
      {isEditing && (
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Ionicons name="close-circle" size={24} color={theme.primaryText} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
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
            <View style={styles.emptyContainer}>
              {/* <Ionicons name="hardware-chip-outline" size={50} color="#CCCCCC" /> */}
              <Text style={styles.emptyText}>No items in the wishlist</Text>
              {isCurrentUser && (
                <Text style={styles.emptySubText}>Browse coffee gear to add items to your wishlist</Text>
              )}
            </View>
          )}
        />
      )}
      
      {/* FAB (Floating Action Button) - Hide in edit mode or when viewing other user's wishlist */}
      {!isEditing && isCurrentUser && (
        <TouchableOpacity style={styles.fab}>
          <Text style={styles.fabText}>Add gear</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (theme, isDarkMode, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    color: theme.primaryText,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    minWidth: 44,
    // minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerButtonActive: {
    backgroundColor: theme.primaryText,
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerButtonText: {
    fontSize: 14,
    color: theme.primaryText,
    fontWeight: '600',
  },
  flatListContent: {
    padding: 16,
    paddingBottom: 100, // Add space for FAB
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardContainer: {
    flex: 1,
    maxWidth: '48%',
    position: 'relative',
  },
  gearCard: {
    flex: 1,
    ...(isDarkMode ? {
      borderWidth: 0,
      backgroundColor: theme.cardBackground,
    } : {
      borderWidth: 1,
      borderColor: theme.border,
    }),
          borderRadius: 8,
      // backgroundColor: theme.background,
      overflow: 'hidden',
      width: '100%',
    },
    deleteButton: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 2,
      zIndex: 1,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
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
    backgroundColor: theme.placeholder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gearInfo: {
    padding: 12,
  },
  gearBrand: {
    fontSize: 12,
    color: theme.secondaryText,
    marginBottom: 4,
  },
  gearName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 8,
  },
  gearPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.primaryText,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  emptyText: {
    fontSize: 16,
    color: theme.secondaryText,
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: theme.secondaryText,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 8 + (insets?.bottom || 0),
    alignSelf: 'center',
    backgroundColor: isDarkMode ? '#FFFFFF' : '#000000',
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabText: {
    color: isDarkMode ? '#000000' : '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GearWishlistScreen; 