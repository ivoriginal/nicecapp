import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * GearCard - Reusable component for displaying coffee gear items
 * 
 * @param {Object} props
 * @param {Object} props.item - The gear item object
 * @param {Function} props.onPress - Function to call when the card is pressed
 * @param {boolean} props.isWishlist - Whether this item is in a wishlist
 * @param {boolean} props.compact - Whether to use a compact layout
 * @param {boolean} props.showAvatars - Whether to show the user avatars (defaults to true)
 * @param {Function} props.onWishlistToggle - Function to call when wishlist button is toggled
 */
const GearCard = ({ 
  item, 
  onPress, 
  isWishlist = false, 
  compact = false,
  showAvatars = true,
  onWishlistToggle
}) => {
  // Debug log to check item data
  console.log(`GearCard rendering ${item.name}:`, {
    usedBy: item.usedBy ? item.usedBy.map(u => ({ id: u.id, name: u.name })) : null,
    avatarsVisible: showAvatars,
    compact
  });
  
  // Get users who own this gear
  const usersOwning = item.usedBy && Array.isArray(item.usedBy) ? item.usedBy : [];
  
  if (usersOwning.length > 0) {
    console.log(`${item.name} is owned by ${usersOwning.length} users:`, 
      usersOwning.map(u => `${u.name} (avatar: ${typeof u.avatar === 'string' ? u.avatar : 'object'})`));
  }
  
  // Helper function to handle both remote and local image sources
  const getImageSource = (imageUrl) => {
    if (!imageUrl) {
      console.log('GearCard: No image URL provided');
      return null;
    }
    
    // Add debugging log to see what's being processed
    console.log('GearCard processing avatar:', imageUrl);
    
    // If it's already an object (from require), return it directly
    if (typeof imageUrl !== 'string') return imageUrl;
    
    // For remote URLs that start with http
    if (imageUrl.startsWith('http')) {
      return { uri: imageUrl };
    }
    
    // For local assets, we need to resolve the path
    // Use a mapping for local assets
    if (imageUrl.includes('assets/')) {
      // Common local assets
      if (imageUrl.includes('ivo-vilches.jpg')) {
        return require('../../assets/users/ivo-vilches.jpg');
      } else if (imageUrl.includes('carlos-hernandez.jpg')) {
        return require('../../assets/users/carlos-hernandez.jpg');
      } else if (imageUrl.includes('elias-veris.jpg')) {
        return require('../../assets/users/elias-veris.jpg');
      } else if (imageUrl.includes('vertigo-logo.jpg')) {
        return require('../../assets/businesses/vertigo-logo.jpg');
      } else if (imageUrl.includes('cafelab-logo.png')) {
        return require('../../assets/businesses/cafelab-logo.png');
      } else if (imageUrl.includes('cafelab-murcia-cover.png')) {
        return require('../../assets/businesses/cafelab-murcia-cover.png');
      } else if (imageUrl.includes('cafelab-cartagena-cover.png')) {
        return require('../../assets/businesses/cafelab-cartagena-cover.png');
      } else if (imageUrl.includes('toma-cafe-logo.jpg') || imageUrl.includes('toma-cafe-logo.png')) {
        // Use the actual file name that exists in the assets directory
        console.log('Attempting to load Toma Café logo');
        return require('../../assets/businesses/toma-logo.jpg');
      } else if (imageUrl.includes('toma-cafe-1-cover.jpg') || imageUrl.includes('toma-cafe-1-cover.png')) {
        return require('../../assets/businesses/toma-1-cover.jpg');
      } else if (imageUrl.includes('toma-cafe-2-cover.jpg') || imageUrl.includes('toma-cafe-2-cover.png')) {
        return require('../../assets/businesses/toma-2-cover.jpg');
      } else if (imageUrl.includes('toma-cafe-3-cover.jpg') || imageUrl.includes('toma-cafe-3-cover.png')) {
        return require('../../assets/businesses/toma-3-cover.jpg');
      }
      // Add more mappings as needed
      
      // Log when we can't find a mapping
      console.log('GearCard: No mapping found for asset:', imageUrl);
    }
    
    // Default fallback
    return { uri: imageUrl };
  };

  // For compact mode, we need to adjust the layout to fit avatars
  const compactWithAvatars = compact && showAvatars && usersOwning.length > 0;

  console.log(`GearCard for ${item.name} has ${usersOwning.length} users and showAvatars=${showAvatars}`);

  return (
    <TouchableOpacity 
      style={[
        styles.gearCard,
        compact && styles.compactCard,
        compactWithAvatars && styles.compactCardWithAvatars
      ]}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={getImageSource(item.imageUrl)} 
          style={styles.gearImage} 
          resizeMode="cover"
        />
        {/* Wishlist bookmark icon */}
        <TouchableOpacity 
          style={styles.wishlistButton}
          onPress={() => onWishlistToggle && onWishlistToggle(item)}
        >
          <Ionicons 
            name={isWishlist ? "bookmark" : "bookmark-outline"} 
            size={22} 
            color={isWishlist ? "#FF9500" : "#FFFFFF"} 
          />
        </TouchableOpacity>

        {/* Show avatars overlaid on the image in bottom right corner */}
        {showAvatars && usersOwning.length > 0 && compact && (
          <View style={styles.imageOverlayAvatars}>
            {usersOwning.slice(0, 2).map((user, index) => (
              <View key={index} style={[styles.overlayAvatarContainer, { marginLeft: index > 0 ? -8 : 0 }]}>
                {user?.avatar ? (
                  <Image 
                    source={getImageSource(user.avatar)} 
                    style={styles.overlayAvatar}
                    defaultSource={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
                  />
                ) : (
                  <View style={styles.overlayAvatarFallback}>
                    <Text style={styles.overlayAvatarText}>{user?.name?.charAt(0) || '?'}</Text>
                  </View>
                )}
              </View>
            ))}
            {usersOwning.length > 2 && (
              <View style={[styles.overlayAvatarContainer, { marginLeft: -8 }]}>
                <View style={styles.overlayMoreContainer}>
                  <Text style={styles.overlayMoreText}>+{usersOwning.length - 2}</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
      
      <View style={styles.gearContent}>
        <View>
          <Text style={styles.gearName} numberOfLines={1}>{item.name}</Text>
          
          {/* Brand and type */}
          <View style={styles.brandContainer}>
            <Text style={styles.gearBrand}>{item.brand}</Text>
            <Text style={styles.gearType}>{item.type}</Text>
          </View>
        </View>
        
        {!compact && (
          <View style={styles.gearMetadata}>
            {/* Reviews in their own row */}
            <View style={styles.gearReviews}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.gearRating}>{(item.rating || 4.0).toFixed(1)}</Text>
              <Text style={styles.gearReviewCount}>({item.reviewCount || 0})</Text>
            </View>
            
            {/* Price in its own row */}
            <View style={styles.priceContainer}>
              <Text style={styles.gearPrice}>${(item.price || 0).toFixed(2)}</Text>
            </View>
          </View>
        )}
        
        {compact && (
          <View style={styles.compactBottom}>
            <Text style={styles.gearPrice}>${(item.price || 0).toFixed(2)}</Text>
          </View>
        )}
        
        {usersOwning.length > 0 && !compact && showAvatars && (
          <View style={styles.gearUsers}>
            <Text style={styles.gearUsersText}>Owned by: </Text>
            <View style={styles.gearAvatarsRow}>
              {usersOwning.slice(0, 3).map((user, index) => (
                <View key={index} style={[styles.gearUserAvatarContainer, { marginLeft: index > 0 ? -10 : 0 }]}>
                  {user?.avatar ? (
                    <Image 
                      source={getImageSource(user.avatar)} 
                      style={styles.gearUserAvatar}
                      defaultSource={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
                    />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>{user?.name?.charAt(0) || '?'}</Text>
                    </View>
                  )}
                </View>
              ))}
              {usersOwning.length > 3 && (
                <View style={styles.moreUsersCircle}>
                  <Text style={styles.moreUsersText}>+{usersOwning.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  gearCard: {
    width: '46%',
    margin: 8,
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  compactCard: {
    width: 220,
    height: 240,
    margin: 0,
    marginRight: 12,
  },
  compactCardWithAvatars: {
    height: 260,
  },
  imageContainer: {
    position: 'relative',
  },
  gearImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F2F2F7',
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gearContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  gearName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gearBrand: {
    fontSize: 14,
    color: '#333333',
    marginRight: 8,
  },
  gearType: {
    fontSize: 12,
    color: '#666666',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gearMetadata: {
    marginTop: 8,
  },
  gearReviews: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gearRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 4,
  },
  gearReviewCount: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  priceContainer: {
    marginTop: 4,
  },
  gearPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  compactBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  gearUsers: {
    marginTop: 12,
  },
  gearUsersText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  gearAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageOverlayAvatars: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 8,
  },
  overlayAvatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#E5E5EA',
  },
  overlayAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  overlayAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  overlayMoreContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayMoreText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#666666',
  },
  gearUserAvatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#E5E5EA',
  },
  gearUserAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  moreUsersCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  moreUsersText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666666',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default GearCard; 