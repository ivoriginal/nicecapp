import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppImage from './common/AppImage';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
// Adjust the width calculation to work better with the parent container sizing
const CARD_WIDTH = (width - 40) / 2; // For 2 columns with adequate spacing

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
  onUserPress,
  isWishlist = false,
  showAvatars = true
}) => {
  const { theme, isDarkMode } = useTheme();
  
  if (!item) return null;

  // Ensure we have the data structure we need
  const {
    name,
    brand,
    imageUrl,
    rating,
    reviewCount,
    usedBy = []
  } = item;

  // Debug log to check usedBy data and image URL
  console.log(`GearCard for ${name}, usedBy data:`, usedBy ? JSON.stringify(usedBy.slice(0, 2)) : 'none');
  console.log(`GearCard for ${name}, imageUrl:`, imageUrl);

  // Render avatars of users who own this gear
  const renderAvatars = () => {
    if (!showAvatars || !usedBy || usedBy.length === 0) {
      console.log(`No avatars to show for ${name}`);
      return null;
    }
    
    console.log(`Rendering ${usedBy.length} avatars for ${name}`);
    
    return (
      <View style={styles.avatarsSection}>
        <Text style={[styles.avatarsLabel, { color: theme.secondaryText }]}>Owned by</Text>
        <View style={styles.avatarsContainer}>
          {usedBy.slice(0, 3).map((user, index) => {
            // Handle both URL and relative path images
            const isRemoteImage = user.avatar && (
              user.avatar.startsWith('http') || 
              user.avatar.startsWith('https')
            );
            
            // For debugging
            console.log(`Avatar for user ${user.name || user.id}:`, {
              avatar: user.avatar,
              isRemote: isRemoteImage
            });
            
            return (
              <TouchableOpacity
                key={`${user.id || index}-${index}`}
                style={[styles.avatarWrapper, { zIndex: 10 - index, borderColor: theme.cardBackground }]}
                onPress={() => onUserPress && onUserPress(user.id)}
              >
                <View style={styles.avatar}>
                  {/* Use a default background color as fallback */}
                  <View style={[styles.avatarFallback, { backgroundColor: isDarkMode ? '#2C2C2E' : '#E0E0E0' }]}>
                    <Text style={[styles.avatarFallbackText, { color: theme.secondaryText }]}>
                      {(user.name || user.id || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <AppImage
                    source={user.avatar}
                    style={styles.avatarImage}
                    placeholder="user"
                  />
                </View>
              </TouchableOpacity>
            );
          })}
          {usedBy.length > 3 && (
            <View style={[styles.avatarWrapper, styles.moreAvatars, { backgroundColor: isDarkMode ? '#2C2C2E' : '#E0E0E0', borderColor: theme.cardBackground }]}>
              <Text style={[styles.moreAvatarsText, { color: theme.secondaryText }]}>+{usedBy.length - 3}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.card, 
        { 
          borderWidth: isDarkMode ? 0 : 1,
          borderColor: isDarkMode ? 'transparent' : theme.divider,
          backgroundColor: isDarkMode ? theme.cardBackground : 'transparent' 
        }
      ]}
      onPress={() => onPress && onPress(item)}
      activeOpacity={0.8}
    >
      {/* Image */}
      <View style={[
        styles.imageContainer, 
        { 
          backgroundColor: isDarkMode ? '#2C2C2E' : '#F5F5F5',
          borderBottomWidth: 1,
          borderBottomColor: theme.divider
        }
      ]}>
        <AppImage
          source={imageUrl}
          style={styles.image}
          placeholder="cafe-outline"
          resizeMode="cover"
        />
      </View>

      {/* Content */}
      <View style={(!showAvatars || !usedBy || usedBy.length === 0) ? styles.contentContainerCompact : styles.contentContainer}>
        {brand && <Text style={[styles.brand, { color: theme.secondaryText }]}>{brand}</Text>}
        <Text style={[styles.name, { color: theme.primaryText }]} numberOfLines={1}>{name}</Text>
        
        {/* Rating */}
        {rating > 0 && (
          <View style={[styles.ratingContainer]}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={[styles.rating, { color: theme.secondaryText }]}>
              {rating.toFixed(1)} ({reviewCount || 0})
            </Text>
          </View>
        )}

        {/* Avatars section - renders only when showAvatars is true */}
        {renderAvatars()}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    // minHeight: 220,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH - 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentContainer: {
    padding: 12,
    // height: 110,
  },
  contentContainerCompact: {
    padding: 12,
    paddingBottom: 6, // Controlled bottom padding when no avatars
  },
  brand: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  avatarsSection: {
    marginTop: 8,
  },
  avatarsLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  avatarsContainer: {
    flexDirection: 'row',
  },
  avatarWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: -8,
    borderWidth: 1,
    borderColor: 'white',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  avatarFallbackText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  moreAvatars: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreAvatarsText: {
    fontSize: 8,
    color: '#666',
    fontWeight: '600',
  },
});

export default GearCard; 