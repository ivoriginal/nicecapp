import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActionSheetIOS, Share, Platform, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppImage from './common/AppImage';
import RecipeCard from './RecipeCard';

import { useTheme } from '../context/ThemeContext';
import { useCoffee } from '../context/CoffeeContext';
import { useNavigation } from '@react-navigation/native';

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
  containerStyle,
  hideFollowButton = false // Add prop to control follow button visibility
}) => {
  // Get theme from context
  const { theme, isDarkMode } = useTheme();
  const { isFollowing } = useCoffee();
  
  // Create dynamic styles based on current theme
  const styles = createStyles(theme, isDarkMode);
  
  // Local state to handle UI updates before backend sync
  const [isLiked, setIsLiked] = useState(event.isLiked || false);
  const [likeCount, setLikeCount] = useState(event.likes || 0);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

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

  // Check if we're following this user
  const userIsFollowed = isFollowing(event.userId);

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
          userInterfaceStyle: isDarkMode ? 'dark' : 'light',
        },
        (buttonIndex) => {
          if (isCurrentUserPost && buttonIndex === 0) {
            // Share for current user's post
            handleShare();
          } else if (!isCurrentUserPost && buttonIndex === 0) {
            // Report for other user's post
            onOptionsPress && onOptionsPress(event, 'report');
          } else if (!isCurrentUserPost && buttonIndex === 1) {
            // Share for other user's post
            handleShare();
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
              ],
              {
                userInterfaceStyle: isDarkMode ? 'dark' : 'light'
              }
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
                ],
                {
                  userInterfaceStyle: isDarkMode ? 'dark' : 'light'
                }
              );
            }
          },
          { text: "Cancel", style: "cancel" },
        ] : [
          { text: "Report", onPress: () => onOptionsPress && onOptionsPress(event, 'report') },
          { text: "Share this post", onPress: handleShare },
          { text: "Cancel", style: "cancel" },
        ],
        {
          userInterfaceStyle: isDarkMode ? 'dark' : 'light'
        }
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

  // Format event timestamp for display
  const formatEventTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const eventDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now - eventDate) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes === 0 ? 'now' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  // Get event type icon
  const getEventTypeIcon = () => {
    if (event.type === 'recipe_creation' || event.type === 'created_recipe') {
      return 'document-text-outline';
    }
    
    if (event.gearId) {
      return 'build-outline';
    }
    
    if (event.hasRecipe || event.method || event.brewingMethod) {
      return 'document-text-outline';
    }
    
    return 'cafe-outline';
  };

  // Get event type label based on the event type
  const getEventTypeLabel = () => {
    if (event.type === 'recipe_creation' || event.type === 'created_recipe') {
      if (event.isRemix) {
        return `remixed a recipe`;
      }
      return `created a recipe`;
    }
    
    if (event.gearId) {
      return 'added to inventory';
    }
    
    // Check for specific event types first before checking for method/brewing data
    if (event.type === 'added_to_collection') {
      return 'added to collection';
    }
    
    // Handle business coffee announcements
    if (event.type === 'coffee_announcement' && isBusinessAccount) {
      return 'added to store';
    }
    
    // Check for location first - if there's a location and it's not home, it's an order
    if (event.location && event.location !== 'Home' && event.locationId && event.locationId !== 'home') {
      return 'ordered';
    }
    
    // Then check for recipe/method/brewing related events
    if (event.hasRecipe || event.method || event.brewingMethod) {
      return 'brewed';
    }
    
    return 'tried';
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
                  <Ionicons name="cafe" size={20} color={theme.secondaryText} />
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
        
        {/* Notes and rating first */}
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

        {/* Tagged friends section with tap functionality - after notes */}
        {event.friends && event.friends.length > 0 && (
          <TouchableOpacity 
            style={styles.friendsContainer}
            onPress={() => setShowFriendsModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.friendsRow}>
              <Ionicons name="people" size={16} color={theme.secondaryText} />
              <Text style={styles.friendsText} numberOfLines={1} ellipsizeMode="tail">
                <Text style={styles.friendsWithText}>With </Text>
                {event.friends.map((friend, index) => (
                  <Text key={friend.id || index} style={styles.friendNameText}>
                    {friend.name || friend.userName}
                    {index < event.friends.length - 1 ? ', ' : ''}
                  </Text>
                ))}
              </Text>
            </View>
          </TouchableOpacity>
        )}
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
              placeholder="cafe-outline" 
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
    // Handle recipe creation events - just show the recipe card without duplicate header
    if (event.type === 'recipe_creation' || event.type === 'created_recipe') {
      const recipe = {
        id: event.recipeId,
        name: event.recipeName || `${event.coffeeName} ${event.method}`,
        method: event.method,
        amount: event.amount,
        grindSize: event.grindSize,
        waterVolume: event.waterVolume,
        brewTime: event.brewTime,
        notes: event.notes,
        userName: event.userName,
        userAvatar: event.userAvatar,
        userId: event.userId,
        coffeeId: event.coffeeId,
        coffeeName: event.coffeeName,
        roaster: event.roaster,
        imageUrl: event.imageUrl,
        timestamp: event.timestamp,
        // Add remix info if applicable
        ...(event.isRemix ? {
          basedOnRecipeId: event.basedOnRecipeId,
          basedOnRecipeName: event.basedOnRecipeName,
          basedOnCreatorName: event.basedOnCreatorName
        } : {})
      };

      return (
        <View style={styles.contentContainer}>
          <RecipeCard
            recipe={recipe}
            onPress={() => onRecipePress && onRecipePress(recipe)}
            onUserPress={() => onUserPress && onUserPress(event.userId)}
            showCoffeeInfo={true}
            compact={false}
            isRecipeCreationEvent={true}
            style={{ marginBottom: 0 }}  // Override the default margin
          />
        </View>
      );
    }

    // Handle gear events
    if (event.gearId) {
      return renderGearCard();
    }

    // Handle similar coffee recommendation events - show horizontal cards
    if (event.type === 'similar_coffee_recommendation') {
      return (
        <View style={styles.similarCoffeesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12 }}
          >
            {event.similarCoffees && event.similarCoffees.map((coffee, index) => (
              <TouchableOpacity
                key={coffee.id || index}
                style={[
                  styles.similarCoffeeCard,
                  index === event.similarCoffees.length - 1 && styles.lastSimilarCoffeeCard
                ]}
                onPress={() => onCoffeePress && onCoffeePress(coffee)}
                activeOpacity={0.7}
              >
                <View style={styles.similarCoffeeImageContainer}>
                  <AppImage 
                    source={coffee.image || coffee.imageUrl} 
                    style={styles.similarCoffeeImage}
                    placeholder="cafe" 
                  />
                </View>
                <Text style={styles.similarCoffeeName} numberOfLines={1} ellipsizeMode="tail">
                  {coffee.name}
                </Text>
                <Text style={styles.similarCoffeeRoaster} numberOfLines={1} ellipsizeMode="tail">
                  {coffee.roaster}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }

    // Handle user recommendation events - show the recommended user
    if (event.type === 'user_recommendation') {
      return (
        <View style={styles.contentContainer}>
          <TouchableOpacity 
            style={styles.userRecommendationCard}
            onPress={() => onUserPress && onUserPress({
              userId: event.recommendedUserId || event.userId,
              userName: event.recommendedUserName || event.userName,
              userAvatar: event.recommendedUserAvatar || event.userAvatar,
              isBusiness: event.recommendedUserIsBusiness || false
            })}
            activeOpacity={0.7}
          >
            <View style={styles.userRecommendationInfo}>
              <AppImage 
                source={event.recommendedUserAvatar || event.userAvatar} 
                style={[
                  styles.recommendedUserAvatar,
                  (event.recommendedUserIsBusiness || isBusinessName(event.recommendedUserName || event.userName)) && styles.recommendedBusinessAvatar
                ]}
                placeholder="person" 
              />
              <View style={styles.recommendedUserInfo}>
                <Text style={styles.recommendedUserName}>{event.recommendedUserName || event.userName}</Text>
              </View>
            </View>
            <MinimalFollowButton
              userId={event.recommendedUserId || event.userId}
              isFollowing={false}
              onToggle={() => {}}
            />
          </TouchableOpacity>
        </View>
      );
    }

    // Handle regular coffee events
    return renderCoffeeCard();
  };
  
  const navigation = useNavigation();

  // Create a minimal follow button for card use
  const MinimalFollowButton = ({ userId, isFollowing, onToggle }) => {
    const [loading, setLoading] = useState(false);
    const { followUser, unfollowUser } = useCoffee();

    const handlePress = async () => {
      setLoading(true);
      try {
        if (isFollowing) {
          await unfollowUser(userId);
        } else {
          await followUser(userId);
        }
        onToggle && onToggle();
      } catch (error) {
        console.error('Error updating follow status:', error.message || error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={loading}
        style={styles.minimalFollowButton}
      >
        <Text style={[styles.minimalFollowButtonText, { color: theme.primaryText }]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
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
            <View style={styles.userTextContainer}>
              <View style={styles.userNameContainer}>
                <Text style={styles.userName} numberOfLines={1}>{event.userName || 'Unknown User'}</Text>
                <Text style={styles.userAction} numberOfLines={1}>{getEventTypeLabel()}</Text>
              </View>
              {/* Location as second line in header */}
              {event.location && event.location !== 'Home' && (
                <TouchableOpacity 
                  style={styles.locationInHeaderContainer}
                                      onPress={() => {
                      if (event.locationId && event.locationId !== 'home') {
                        // Pass the full location data to onUserPress with proper café structure
                        onUserPress && onUserPress({
                          userId: event.locationId,
                          userName: event.location,
                          userAvatar: event.locationAvatar,
                          isBusiness: true,
                          type: 'cafe',
                          isCafe: true
                        });
                      }
                    }}
                  activeOpacity={0.7}
                >
                  {/* <Ionicons name="location" size={14} color={theme.secondaryText} /> */}
                  <Text style={styles.locationInHeaderText}>{event.location}</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.headerActionsContainer}>
            {/* Follow button for authors the current user doesn't yet follow */}
            {!isCurrentUserPost && !hideFollowButton && (
              <MinimalFollowButton
                userId={event.userId}
                isFollowing={userIsFollowed}
                onToggle={() => {}}
              />
            )}
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

      {/* Friends Modal */}
      <Modal
        visible={showFriendsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFriendsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tagged Friends</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowFriendsModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.primaryText} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {event.friends && event.friends.map((friend, index) => (
              <TouchableOpacity 
                key={friend.id || index}
                style={styles.friendModalItem}
                onPress={() => {
                  setShowFriendsModal(false);
                  onUserPress && onUserPress({
                    userId: friend.id || friend.userId,
                    userName: friend.name || friend.userName,
                    userAvatar: friend.avatar || friend.userAvatar
                  });
                }}
                activeOpacity={0.7}
              >
                <AppImage 
                  source={friend.avatar || friend.userAvatar} 
                  style={styles.friendModalAvatar}
                  placeholder="person" 
                />
                <Text style={styles.friendModalName}>{friend.name || friend.userName}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
    paddingBottom: 20,
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
    flex: 1,
    marginRight: 8,
  },
  userTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primaryText,
    marginRight: 4,
    flexShrink: 1,
  },
  userAction: {
    fontSize: 14,
    fontWeight: '300',
    // fontWeight: '400',
    flexShrink: 1,
    // color: theme.secondaryText,
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
      // backgroundColor: theme.altBackground,
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
    // backgroundColor: theme.recipeContainer,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    borderTopColor: isDarkMode ? '#444444' : theme.border,
    // marginTop: 1,
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
    // borderWidth: 1,
    // borderColor: theme.border,
  },
  businessCreatorAvatar: {
    borderRadius: 6,
  },
  notesContainer: {
    marginTop: 16,
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
    paddingBottom: 20,
  },
  similarCoffeeCard: {
    ...(isDarkMode ? {
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: theme.border,
    } : {
      borderWidth: 1,
      borderColor: theme.border,
    }),
    borderRadius: 12,
    marginRight: 12,
    width: 124,
    paddingBottom: 12,
    // padding: 8,
    // height: 165, // Fixed height for consistent card sizes
  },
  lastSimilarCoffeeCard: {
    // marginRight: 12,
    // paddingBottom: 12,
    marginRight: 0,
  },
  similarCoffeeImageContainer: {
    width: isDarkMode ? 124 : 122, // Account for borders in light mode
    height: isDarkMode ? 124 : 122, // Same as width for 1:1 aspect ratio
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    // borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: theme.placeholder,
    alignSelf: 'center',
  },
  similarCoffeeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    // backgroundColor: theme.placeholder,
    backgroundColor: isDarkMode ? '#FFFFFF' : theme.placeholder,
  },
  similarCoffeeName: {
    fontSize: 14,
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
  // Location in header styles
  locationInHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationInHeaderText: {
    fontSize: 12,
    color: theme.primaryText,
    // marginLeft: 4,
    color: theme.secondaryText,
  },
  // Friends styles
  friendsContainer: {
    marginHorizontal: 12,
    marginTop: 16,
  },
  friendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendsText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    color: theme.secondaryText,
  },
  friendsWithText: {
    fontWeight: '400',
    color: theme.secondaryText,
  },
  friendNameText: {
    fontWeight: '600',
    color: theme.primaryText,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
    backgroundColor: theme.cardBackground,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    backgroundColor: theme.background,
  },
  friendModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
    backgroundColor: theme.cardBackground,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  friendModalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  friendModalName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.primaryText,
  },
     eventContainer: {
     backgroundColor: '#FFFFFF',
     borderRadius: 12,
     marginVertical: 8,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
   eventHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     padding: 12,
   },
   userInfo: {
     flexDirection: 'row',
     alignItems: 'center',
     flex: 1,
   },
   userDetails: {
     flex: 1,
     marginLeft: 12,
   },
   userNameContainer: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   verifiedIcon: {
     marginLeft: 4,
   },
   eventTypeContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     marginTop: 2,
   },
   eventTypeIcon: {
     marginRight: 4,
   },
   eventType: {
     fontSize: 14,
     flex: 1,
   },
   eventTimestamp: {
     fontSize: 12,
     marginLeft: 8,
   },
   remixAttribution: {
     fontStyle: 'italic',
   },
   recipeCardContainer: {
     paddingHorizontal: 12,
     paddingBottom: 12,
   },
       minimalFollowButton: {
      // No padding and no background as requested
    },
    minimalFollowButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.primaryText,
      marginRight: 8,
    },
});

export default ThemeCoffeeLogCard; 