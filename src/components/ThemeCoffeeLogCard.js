import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActionSheetIOS, Share, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppImage from './common/AppImage';
import RecipeCard from './RecipeCard';
import FollowButton from './FollowButton';
import { useTheme } from '../context/ThemeContext';

// A replacement for CoffeeLogCard that properly handles themes
const ThemeCoffeeLogCard = ({ 
  event, 
  onCoffeePress, 
  onRecipePress, 
  onUserPress, 
  onOptionsPress, 
  onLikePress, 
  currentUserId, 
  showToast,
  containerStyle 
}) => {
  // Get theme from context
  const { theme, isDarkMode } = useTheme();
  
  // Create dynamic styles based on current theme
  const styles = createStyles(theme, isDarkMode);
  
  // Local state to handle UI updates before backend sync
  const [isLiked, setIsLiked] = useState(event.isLiked || false);
  const [likeCount, setLikeCount] = useState(event.likes || 0);

  // Ensure we have a valid event object
  if (!event) {
    return null;
  }

  // Check if this is a business account
  const isBusinessAccount = event.userName === 'Vértigo y Calambre' || 
                           event.userName === 'Kima Coffee' ||
                           (event.userName && event.userName.includes('Café')) ||
                           event.userId?.startsWith('business-');

  // Helper function to check if a user name is a business account
  const isBusinessName = (name) => {
    return name === 'Vértigo y Calambre' || 
           name === 'Kima Coffee' ||
           (name && name.includes('Café')) ||
           name?.startsWith('Business-');
  };

  // Check if this is the current user's post
  const isCurrentUserPost = event.userId === currentUserId;

  // Handle options menu press
  const handleOptionsPress = () => {
    // Different options based on if it's the current user's post
    const options = isCurrentUserPost 
      ? ['Share this post', 'Delete', 'Cancel']
      : ['Report', 'Share this post', 'Cancel'];
    
    const destructiveButtonIndex = isCurrentUserPost ? 1 : null;
    const cancelButtonIndex = isCurrentUserPost ? 2 : 2;
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            handleShare();
          } else if (!isCurrentUserPost && buttonIndex === 0) {
            // Report
            onOptionsPress && onOptionsPress(event, 'report');
          } else if (isCurrentUserPost && buttonIndex === 1) {
            // Delete post
            Alert.alert(
              "Delete Post",
              "Are you sure you want to delete this post?",
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Delete", 
                  style: "destructive", 
                  onPress: () => {
                    onOptionsPress && onOptionsPress(event, 'delete');
                    showToast && showToast('Post deleted');
                  }
                }
              ]
            );
          }
        }
      );
    } else {
      // For non-iOS platforms, we use Alert
      Alert.alert(
        "Post Options",
        "Select an option",
        isCurrentUserPost ? [
          { text: "Share this post", onPress: handleShare },
          { 
            text: "Delete", 
            style: "destructive", 
            onPress: () => {
              Alert.alert(
                "Delete Post",
                "Are you sure you want to delete this post?",
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: () => {
                      onOptionsPress && onOptionsPress(event, 'delete');
                      showToast && showToast('Post deleted');
                    }
                  }
                ]
              );
            }
          },
          { text: "Cancel", style: "cancel" },
        ] : [
          { text: "Report", onPress: () => onOptionsPress && onOptionsPress(event, 'report') },
          { text: "Share this post", onPress: handleShare },
          { text: "Cancel", style: "cancel" },
        ]
      );
    }
  };

  // Handle share button press
  const handleShare = async () => {
    try {
      const coffeeDetails = event.coffeeName 
        ? `Check out this coffee: ${event.coffeeName} from ${event.roaster || event.roasterName || 'Unknown Roaster'}`
        : 'Check out this post from Nice Coffee App!';
        
      await Share.share({
        message: coffeeDetails,
      });
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  // Handle like button press
  const handleLikePress = () => {
    // Update local UI state immediately
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prevCount => newIsLiked ? prevCount + 1 : Math.max(0, prevCount - 1));
    
    // Call the parent component's handler
    onLikePress && onLikePress(event.id, newIsLiked);
  };

  // Get event type icon
  const getEventTypeIcon = () => {
    const type = event.type || 'coffee_log';
    
    switch (type) {
      case 'coffee_announcement': return 'megaphone';
      case 'added_to_collection': return 'bookmark';
      case 'added_to_wishlist': return 'heart';
      case 'saved_recipe': return 'newspaper';
      case 'followed_user': return 'person-add';
      case 'created_recipe': return 'create';
      case 'added_to_gear_wishlist': return 'cart';
      case 'gear_added': return 'hardware-chip';
      case 'similar_coffee_recommendation': return 'sparkles';
      case 'user_recommendation': return 'people';
      case 'remixed_recipe': return 'git-branch';
      default: return 'cafe';
    }
  };

  // Get event type label based on the event type
  const getEventTypeLabel = () => {
    const type = event.type || 'coffee_log';
    
    // If it's a coffee log and has a location (not home), show "ordered"
    if ((!type || type === 'coffee_log') && event.locationId && event.locationId !== 'home') {
      return 'ordered';
    }
    
    switch (type) {
      case 'coffee_log': return 'brewed';
      case 'coffee_announcement': return 'added to shop';
      case 'added_to_collection': return 'added to collection';
      case 'added_to_wishlist': return 'added to wishlist';
      case 'saved_recipe': return 'saved a recipe';
      case 'followed_user': return 'followed';
      case 'created_recipe': return 'created a recipe';
      case 'added_to_gear_wishlist': return 'wishlisted';
      case 'gear_added': return 'added gear';
      case 'remixed_recipe': return 'remixed a recipe';
      default: return 'brewed';
    }
  };

  // Render a coffee card
  const renderCoffeeCard = () => {
    return (
      <View style={styles.contentContainer}>
        <View style={styles.combinedContainer}>
          <TouchableOpacity 
            style={styles.coffeeContainer}
            onPress={() => onCoffeePress && onCoffeePress(event)}
            activeOpacity={0.7}
          >
            <View style={styles.coffeeImageContainer}>
              {event.imageUrl ? (
                <AppImage source={event.imageUrl} style={styles.coffeeImage} placeholder="cafe" />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="cafe" size={24} color={theme.secondaryText} />
                </View>
              )}
            </View>
            <View style={styles.coffeeInfo}>
              <Text style={styles.coffeeName}>{event.coffeeName || 'Unknown Coffee'}</Text>
              <Text style={styles.roasterName}>{event.roaster || event.roasterName || 'Unknown Roaster'}</Text>
              {event.type === 'coffee_announcement' && (
                <View style={styles.announcementBadge}>
                  <Ionicons name="megaphone" size={12} color="#FFFFFF" />
                  <Text style={styles.announcementText}>New in shop</Text>
                </View>
              )}
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={theme.secondaryText} 
              style={[styles.coffeeChevron, { display: 'none' }]} 
            />
          </TouchableOpacity>

          {/* Recipe details - show if there's recipe data, unless explicitly marked as no recipe */}
          {(event.type === 'coffee_log' || event.type === 'coffee_announcement') && 
           (event.brewingMethod || event.method) && 
           event.hasRecipe !== false && (
            <TouchableOpacity 
              style={styles.recipeContainer}
              onPress={() => onRecipePress && onRecipePress(event)}
              activeOpacity={0.7}
            >
              <View style={styles.recipeRow}>
                <AppImage 
                  source={event.userAvatar}
                  style={[
                    styles.creatorAvatar,
                    isBusinessAccount ? styles.businessCreatorAvatar : null
                  ]}
                  placeholder="person"
                />
                <View style={styles.methodContainer}>
                  {/* <Ionicons name="cafe" size={16} color={theme.primaryText} /> */}
                  <Text style={styles.methodText} numberOfLines={1}>
                    {event.method || event.brewingMethod || 'Unknown Method'}
                  </Text>
                </View>
                <Text style={styles.recipeDetail} numberOfLines={1}>{event.amount || '18'}g</Text>
                <Text style={styles.recipeDetail} numberOfLines={1}>{event.grindSize || 'Medium'}</Text>
                <Text style={styles.recipeDetail} numberOfLines={1}>{event.waterVolume || '300'}ml</Text>
                <Text style={styles.recipeDetail} numberOfLines={1}>{event.brewTime || '3:30'}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Metadata section - location and friends before notes - only show if there's metadata */}
        {((event.location && event.location !== 'Home') || (event.friends && event.friends.length > 0)) && (
          <View style={styles.metadataContainer}>
            {event.location && event.location !== 'Home' && (
              <TouchableOpacity 
                style={styles.metadataRow}
                onPress={() => {
                  if (event.locationId && event.locationId !== 'home') {
                    // Pass the full location data to onUserPress
                    onUserPress && onUserPress({
                      id: event.locationId,
                      type: 'location',
                      name: event.location,
                      avatar: event.locationAvatar,
                      isBusiness: true
                    });
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="location" size={16} color={theme.secondaryText} />
                <Text style={styles.metadataText}>{event.location}</Text>
              </TouchableOpacity>
            )}
            {event.friends && event.friends.length > 0 && (
              <View style={styles.metadataRow}>
                <Ionicons name="people" size={16} color={theme.secondaryText} />
                <Text style={styles.metadataText}>
                  With {event.friends.map(friend => friend.name || friend.userName).join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Notes and rating after metadata */}
        {(event.notes && event.notes.trim() !== '') || event.rating ? (
          <View style={styles.notesContainer}>
            {/* Rating stars would go here */}
            {event.notes && event.notes.trim() !== '' && (
              <Text style={styles.notesText} numberOfLines={3}>
                {event.notes}
              </Text>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  // Render a gear card
  const renderGearCard = () => {
    return (
      <View style={styles.contentContainer}>
        <TouchableOpacity 
          style={styles.gearCard}
          onPress={() => {
            // Navigate to gear detail screen
            if (onCoffeePress) {
              onCoffeePress({
                ...event,
                navigateTo: 'GearDetail',
                gearName: event.gearName,
                gearId: event.gearId
              });
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.gearImageContainer}>
            <AppImage 
              source={event.gearImage || event.imageUrl} 
              style={styles.gearImage}
              placeholder="hardware-chip" 
            />
          </View>
          <View style={styles.gearInfo}>
            <Text style={styles.gearName}>{event.gearName}</Text>
            <Text style={styles.gearBrand}>{event.gearBrand}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Render action buttons
  const renderActionButtons = () => {
    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleLikePress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={22}
            color={isLiked ? "#F44336" : theme.secondaryText}
          />
          {likeCount > 0 && (
            <Text style={styles.actionButtonText}>
              {likeCount}
            </Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {}}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={20} color={theme.secondaryText} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={22} color={theme.secondaryText} />
        </TouchableOpacity>
      </View>
    );
  };

  // Render different event types
  const renderEventContent = () => {
    const type = event.type || 'coffee_log';
    
    // Default coffee log
    if (!type || type === 'coffee_log' || 
        ((!event.type || event.type === 'coffee_announcement') && event.coffeeId && event.coffeeName)) {
      return renderCoffeeCard();
    }
    
    // Added to collection event
    if (type === 'added_to_collection') {
      return renderCoffeeCard();
    }
    
    // Recipe-related events that should show coffee cards
    if (type === 'saved_recipe' || type === 'created_recipe' || type === 'remixed_recipe') {
      return renderCoffeeCard();
    }
    
    // Recommendation events that should show coffee cards
    if (type === 'similar_coffee_recommendation') {
      // For similar coffee recommendations, we need to render multiple coffee options
      if (event.similarCoffees && event.similarCoffees.length > 0) {
        return (
          <View style={styles.contentContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.similarCoffeesContainer}>
              {event.similarCoffees.map((coffee, index) => (
                <TouchableOpacity 
                  key={coffee.id || index}
                  style={[styles.similarCoffeeCard, index === event.similarCoffees.length - 1 && styles.lastSimilarCoffeeCard]}
                  onPress={() => onCoffeePress && onCoffeePress({
                    ...event,
                    coffeeId: coffee.id,
                    coffeeName: coffee.name,
                    roaster: coffee.roaster,
                    imageUrl: coffee.imageUrl,
                    type: 'coffee_recommendation'
                  })}
                  activeOpacity={0.7}
                >
                  <View style={styles.similarCoffeeImageContainer}>
                    <AppImage source={coffee.imageUrl} style={styles.similarCoffeeImage} placeholder="cafe" />
                  </View>
                  <Text style={styles.similarCoffeeName} numberOfLines={1} ellipsizeMode="tail">{coffee.name}</Text>
                  <Text style={styles.similarCoffeeRoaster} numberOfLines={1} ellipsizeMode="tail">{coffee.roaster || 'Unknown Roaster'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      }
      return renderCoffeeCard();
    }
    
    // User recommendation events
    if (type === 'user_recommendation') {
      // Check if recommended user is a business account
      const isRecommendedUserBusiness = isBusinessName(event.recommendedUserName);
      
      return (
        <View style={styles.contentContainer}>
          <View style={styles.userRecommendationCard}>
            <TouchableOpacity 
              style={styles.userRecommendationInfo}
              onPress={() => onUserPress && onUserPress({
                userId: event.recommendedUserId,
                userName: event.recommendedUserName,
                userAvatar: event.recommendedUserAvatar
              })}
              activeOpacity={0.7}
            >
              <AppImage 
                source={event.recommendedUserAvatar} 
                style={[
                  styles.recommendedUserAvatar,
                  isRecommendedUserBusiness ? styles.recommendedBusinessAvatar : null
                ]}
                placeholder="person" 
              />
              <View style={styles.recommendedUserInfo}>
                <Text style={styles.recommendedUserName}>{event.recommendedUserName}</Text>
                <Text style={styles.recommendedUserHandle}>{event.recommendedUserHandle}</Text>
              </View>
            </TouchableOpacity>
            <FollowButton
              userId={event.recommendedUserId}
              userName={event.recommendedUserName}
              size="small"
              onFollowChange={(userId, isFollowing) => {
                console.log(`Follow status changed for ${userId}: ${isFollowing}`);
              }}
            />
          </View>
        </View>
      );
    }
    
    // Gear events
    if (type === 'gear_added' || type === 'added_to_gear_wishlist') {
      return renderGearCard();
    }
    
    // Default fallback
    return (
      <View style={styles.contentContainer}>
        <View style={styles.genericEventContainer}>
          <Text style={styles.genericEventText}>Unsupported event type: {type}</Text>
        </View>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      {/* Header with user info and timestamp */}
      {event.type === 'similar_coffee_recommendation' ? (
        <View style={styles.headerContainer}>
          <View style={styles.specialHeaderContainer}>
            <Ionicons name="sparkles" size={20} color={theme.iconColor} style={styles.similarCoffeeIcon} />
            <Text style={styles.specialHeaderText}>
              <Text style={styles.headerNormalText}>Similar to </Text>
              <Text 
                style={styles.headerBoldText}
                onPress={() => {
                  if (event.basedOnCoffeeId && onCoffeePress) {
                    onCoffeePress({
                      coffeeId: event.basedOnCoffeeId,
                      coffeeName: event.basedOnCoffeeName
                    });
                  }
                }}
              >
                {event.basedOnCoffeeName || 'coffees you like'}
              </Text>
            </Text>
          </View>
        </View>
      ) : event.type === 'user_recommendation' ? (
        <View style={styles.headerContainer}>
          <View style={styles.specialHeaderContainer}>
            <Ionicons name="people" size={20} color={theme.iconColor} style={styles.similarCoffeeIcon} />
            <Text style={styles.specialHeaderText}>
              <Text style={styles.headerNormalText}>Followed by people you follow</Text>
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.userInfoContainer}
            onPress={() => onUserPress && onUserPress(event)}
          >
            <AppImage 
              source={event.userAvatar || 'https://via.placeholder.com/40'} 
              style={[
                styles.userAvatar,
                isBusinessAccount ? styles.businessAvatar : null
              ]}
              placeholder="person"
            />
            <View style={styles.userNameContainer}>
              <Text style={styles.userName}>{event.userName || 'Unknown User'}</Text>
              <Text style={styles.userAction}>{getEventTypeLabel()}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerActionsContainer}>
            <TouchableOpacity
              onPress={handleOptionsPress}
              style={styles.optionsButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={theme.iconColor} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Event content */}
      {renderEventContent()}
    </View>
  );
};

// Create styles as a function that takes theme as parameter
const createStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    // backgroundColor: theme.cardBackground,
    marginHorizontal: 0,
    marginVertical: 0,
    overflow: 'hidden',
    borderWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 16,
    paddingTop: 0,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    // backgroundColor: theme.cardBackground,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.primaryText,
    marginRight: 5,
  },
  userAction: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.secondaryText,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  businessAvatar: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  headerActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionsButton: {
    padding: 4,
  },
  combinedContainer: {
    ...(isDarkMode ? {
      backgroundColor: theme.cardBackground,
      borderWidth: 0,
    } : {
      borderWidth: 1,
      borderColor: theme.border,
    }),
    borderRadius: 16,
    overflow: 'hidden',
  },
  coffeeContainer: {
    flexDirection: 'row',
    padding: 12,
    // backgroundColor: theme.cardBackground,
    position: 'relative',
    alignItems: 'center',
    borderBottomWidth: 0,
    borderColor: 'transparent',
  },
  coffeeImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  coffeeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    // unsure about this
    backgroundColor: theme.placeholder,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.placeholder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coffeeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  coffeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 4,
  },
  roasterName: {
    fontSize: 14,
    color: theme.secondaryText,
  },
  coffeeChevron: {
    marginLeft: 'auto',
  },
  recipeContainer: {
    padding: 12,
    paddingHorizontal: 12,
    paddingRight: 24,
    backgroundColor: theme.recipeContainer,
    borderTopWidth: 1,
    borderTopColor: theme.divider,
    marginTop: 1,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    justifyContent: 'flex-start',
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    // borderWidth: 1,
    // borderColor: theme.border,
    // compensates the gap between the method container and the recipe details
    marginLeft: -12,
    marginRight: -8,
    // maxWidth: 100,
  },
  methodText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: theme.primaryText,
  },
  recipeDetail: {
    fontSize: 12,
    color: theme.secondaryText,
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 0,
    borderWidth: 1,
    borderColor: theme.border,
  },
  businessCreatorAvatar: {
    borderRadius: 6,
  },
  notesContainer: {
    marginTop: 12,
    paddingHorizontal: 8,
  },
  notesText: {
    fontSize: 14,
    color: theme.secondaryText,
  },
  metadataContainer: {
    marginTop: 12,
    marginBottom: 0,
    paddingTop: 4,
    paddingHorizontal: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 14,
    color: theme.secondaryText,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionButtonText: {
    fontSize: 14,
    color: theme.secondaryText,
    marginLeft: 6,
  },
  announcementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    position: 'absolute',
    right: 4,
    top: '35%',
    transform: [{ translateY: -12 }],
  },
  announcementText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  gearCard: {
    ...(isDarkMode ? {
      backgroundColor: theme.cardBackground,
      borderWidth: 0,
    } : {
      borderWidth: 1,
      borderColor: theme.border,
    }),
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    borderColor: theme.border,
    // marginBottom: 8,
    alignItems: 'center',
  },
  gearImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: theme.placeholder,
  },
  gearImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gearInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  gearName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 4,
  },
  gearBrand: {
    fontSize: 14,
    color: theme.secondaryText,
  },
  specialHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
  },
  specialHeaderText: {
    fontSize: 14,
    marginLeft: 8,
    color: theme.primaryText,
  },
  headerNormalText: {
    fontWeight: '400',
    color: theme.primaryText,
  },
  headerBoldText: {
    fontWeight: '600',
    color: theme.primaryText,
  },
  similarCoffeeIcon: {
    padding: 5,
    marginRight: 0,
  },
  genericEventContainer: {
    padding: 12,
    // backgroundColor: theme.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  genericEventText: {
    fontSize: 14,
    color: theme.secondaryText,
  },
  similarCoffeesContainer: {
    // paddingHorizontal: 12,
  },
  similarCoffeeCard: {
    ...(isDarkMode ? {
      backgroundColor: theme.cardBackground,
      borderWidth: 0,
    } : {
      borderWidth: 1,
      borderColor: theme.border,
    }),
    borderRadius: 12,
    marginRight: 12,
    width: 124,
    // padding: 8,
    // height: 165, // Fixed height for consistent card sizes
  },
  lastSimilarCoffeeCard: {
    // marginRight: 12,
    paddingBottom: 12,
  },
  similarCoffeeImageContainer: {
    width: isDarkMode ? 124 : 122, // Account for borders in light mode
    height: isDarkMode ? 124 : 122, // Same as width for 1:1 aspect ratio
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: theme.placeholder,
    alignSelf: 'center',
  },
  similarCoffeeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  similarCoffeeName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 4,
    paddingHorizontal: 12,
    lineHeight: 15,
    textAlignVertical: 'top',
    width: isDarkMode ? 124 : 122, // Match the image width to constrain text
  },
  similarCoffeeRoaster: {
    fontSize: 12,
    color: theme.secondaryText,
    paddingHorizontal: 12,
    lineHeight: 13,
    width: isDarkMode ? 124 : 122, // Match the image width to constrain text
    height: 13, // Fixed height for 1 line
    textAlignVertical: 'top',
  },
  userRecommendationCard: {
    ...(isDarkMode ? {
      backgroundColor: theme.cardBackground,
      borderWidth: 0,
    } : {
      borderWidth: 1,
      borderColor: theme.border,
    }),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  userRecommendationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recommendedUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  recommendedBusinessAvatar: {
    borderRadius: 8, // Square corners for business accounts
  },
  recommendedUserInfo: {
    flex: 1,
  },
  recommendedUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 2,
  },
  recommendedUserHandle: {
    fontSize: 14,
    color: theme.secondaryText,
  },
});

export default ThemeCoffeeLogCard; 