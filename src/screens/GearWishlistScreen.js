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
  Alert,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import mockUsers from '../data/mockUsers.json';
import mockGear from '../data/mockGear.json';
import gearDetails from '../data/gearDetails';
import AppImage from '../components/common/AppImage';
import GearCard from '../components/GearCard';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

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
  const { userId, userName, isCurrentUser, addedGear } = route.params || {};
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Only load from mock data if we don't have any items yet
    if (wishlistItems.length === 0) {
      loadWishlist();
    }
  }, [userId]);

  // Handle success toast when gear is added
  useEffect(() => {
    if (addedGear) {
      // Add the new gear to the wishlist items
      setWishlistItems(prevItems => [...prevItems, {
        id: `gear-${Date.now()}`, // Generate a temporary ID
        ...addedGear
      }]);
      
      showToast(`${addedGear.name} added to your wishlist`);
      // Clear the addedGear param to prevent showing toast again
      navigation.setParams({ addedGear: null });
    }
  }, [addedGear]);

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
    // Skip navigation bar setup in this screen as we're using the one from App.js
    
    // Get user data
    const user = mockUsers.users.find(u => u.id === userId) || 
                 mockUsers.users.find(u => u.id === 'user1'); // Default to user1 if not found

    if (user && user.gearWishlist && user.gearWishlist.length > 0) {
      try {
        // Fetch all available gear from Supabase
        const { data: availableGear, error: gearError } = await supabase
          .from('gear')
          .select('*');

        if (gearError) {
          console.error('Error fetching gear from Supabase:', gearError);
          setWishlistItems([]);
          setLoading(false);
          return;
        }

        console.log('Available gear from Supabase:', availableGear?.length || 0);

        // Map gear wishlist names to actual gear objects, but only include items that exist in Supabase
        const wishlistGear = user.gearWishlist
          .map(gearName => {
            // First try to find gear in Supabase by name
            const supabaseGear = availableGear?.find(g => g.name === gearName);
            
            if (supabaseGear) {
              // Transform Supabase gear to match expected format
              return {
                id: supabaseGear.id,
                name: supabaseGear.name,
                brand: supabaseGear.brand,
                price: supabaseGear.price,
                imageUrl: supabaseGear.image_url,
                category: supabaseGear.category,
                description: supabaseGear.description
              };
            }

            // If not found in Supabase, try mockGear as fallback
            const mockGearItem = mockGear.gear.find(g => g.name === gearName);
            if (mockGearItem) {
              // Check if this mock gear also exists in Supabase by ID
              const supabaseMatch = availableGear?.find(g => g.id === mockGearItem.id);
              if (supabaseMatch) {
                return {
                  id: supabaseMatch.id,
                  name: supabaseMatch.name,
                  brand: supabaseMatch.brand,
                  price: supabaseMatch.price,
                  imageUrl: supabaseMatch.image_url,
                  category: supabaseMatch.category,
                  description: supabaseMatch.description
                };
              }
            }

            // If gear doesn't exist in Supabase, return null to filter it out
            console.log(`Gear "${gearName}" not found in Supabase database, removing from wishlist`);
            return null;
          })
          .filter(item => item !== null); // Remove null items (gear not in database)
        
        setWishlistItems(wishlistGear);
      } catch (error) {
        console.error('Error loading wishlist:', error);
        setWishlistItems([]);
      }
    } else {
      setWishlistItems([]);
    }
    
    setLoading(false);
  };

  const handleDeleteItem = (itemId) => {
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
  };

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
    });
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
          options: ['Cancel', 'Share Wishlist', 'Edit'],
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
          { text: 'Share Wishlist', onPress: handleShare },
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
          gearId: item.id,
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
              placeholder="cafe-outline"
            />
          ) : (
            <View style={styles.gearImagePlaceholder}>
              <Ionicons name="cafe-outline" size={30} color={theme.secondaryText} />
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
              {/* <Ionicons name="cafe-outline" size={50} color="#CCCCCC" /> */}
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
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('AddGear', { 
            userId: userId,
            onAddGear: (newGear) => {
              setWishlistItems(prev => [...prev, newGear]);
              showToast(`${newGear.name} added to your wishlist`);
            }
          })}
        >
          <Text style={styles.fabText}>Add gear</Text>
        </TouchableOpacity>
      )}

      {/* Toast */}
      {toastVisible && (
        <Animated.View 
          style={[
            styles.toast,
            { 
              opacity: toastOpacity,
              bottom: 100 + (insets?.bottom || 0)
            }
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
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
  },
  fabText: {
    color: isDarkMode ? '#000000' : '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: isDarkMode ? 1 : 0,
    borderColor: theme.border,
  },
  toastText: {
    color: theme.primaryText,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default GearWishlistScreen; 