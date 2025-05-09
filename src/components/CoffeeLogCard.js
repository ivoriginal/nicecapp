import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActionSheetIOS, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppImage from './common/AppImage';

const CoffeeLogCard = ({ event, onCoffeePress, onRecipePress, onUserPress, onOptionsPress, onLikePress, currentUserId, showToast }) => {
  // Local state to handle UI updates before backend sync
  const [isLiked, setIsLiked] = useState(event.isLiked || false);
  const [likeCount, setLikeCount] = useState(event.likes || 0);
  const [isPrivate, setIsPrivate] = useState(event.isPrivate || false);

  // Ensure we have a valid event object
  if (!event) {
    return null;
  }

  // Format the date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  // Check if this is a business account (like Vértigo y Calambre)
  const isBusinessAccount = event.userName === 'Vértigo y Calambre' || 
                           event.userName === 'Kima Coffee' ||
                           event.userName.includes('Café') ||
                           event.userId?.startsWith('business-');

  // Helper function to check if a user name is a business account
  const isBusinessName = (name) => {
    return name === 'Vértigo y Calambre' || 
           name === 'Kima Coffee' ||
           name?.includes('Café') ||
           name?.startsWith('Business-');
  };

  // Check if this is the current user's post
  const isCurrentUserPost = event.userId === currentUserId;

  // Handle options menu press
  const handleOptionsPress = () => {
    // Different options based on if it's the current user's post
    const options = isCurrentUserPost 
      ? [
          isPrivate ? 'Make Public' : 'Make Private', 
          'Share this post',
          'Delete', 
          'Cancel'
        ]
      : [
          'Report', 
          'Share this post', 
          'Cancel'
        ];
    
    const destructiveButtonIndex = isCurrentUserPost ? 2 : null;
    const cancelButtonIndex = isCurrentUserPost ? 3 : 2;
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (isCurrentUserPost && buttonIndex === 0) {
            // Toggle private/public
            const newVisibility = isPrivate ? 'public' : 'private';
            // Update local UI state
            setIsPrivate(!isPrivate);
            // Call parent handler
            onOptionsPress && onOptionsPress(event, newVisibility);
            // Use showToast prop instead of direct Toast.show
            showToast && showToast('Visibility changed');
          } else if (buttonIndex === 1) {
            handleShare();
          } else if (!isCurrentUserPost && buttonIndex === 0) {
            // Report
            onOptionsPress && onOptionsPress(event, 'report');
          } else if (isCurrentUserPost && buttonIndex === 2) {
            // Delete post (now at index 2)
            // Show confirmation dialog
            Alert.alert(
              "Delete Post",
              "Are you sure you want to delete this post?",
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Delete", 
                  style: "destructive", 
                  onPress: () => {
                    // Call parent handler to update state/refresh
                    onOptionsPress && onOptionsPress(event, 'delete');
                    // Use showToast prop instead of direct Toast.show
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
          { 
            text: isPrivate ? "Make Public" : "Make Private", 
            onPress: () => {
              const newVisibility = isPrivate ? 'public' : 'private';
              // Update local UI state
              setIsPrivate(!isPrivate);
              // Call parent handler
              onOptionsPress && onOptionsPress(event, newVisibility);
              // Use showToast prop instead of direct Toast.show
              showToast && showToast('Visibility changed');
            }
          },
          { 
            text: "Share this post", 
            onPress: handleShare
          },
          { 
            text: "Delete", 
            style: "destructive", 
            onPress: () => {
              // Show confirmation dialog for deletion
              Alert.alert(
                "Delete Post",
                "Are you sure you want to delete this post?",
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: () => {
                      // Call parent handler to update state/refresh
                      onOptionsPress && onOptionsPress(event, 'delete');
                      // Use showToast prop instead of direct Toast.show
                      showToast && showToast('Post deleted');
                    }
                  }
                ]
              );
            }
          },
          { 
            text: "Cancel", 
            style: "cancel" 
          },
        ] : [
          { 
            text: "Report", 
            onPress: () => onOptionsPress && onOptionsPress(event, 'report') 
          },
          { 
            text: "Share this post", 
            onPress: handleShare 
          },
          { 
            text: "Cancel", 
            style: "cancel" 
          },
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
        // url: event.imageUrl, // App would have a shareable link in production
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
      case 'cafe_visit':
        return 'storefront';
      case 'coffee_announcement':
        return 'megaphone';
      case 'coffee_roasting':
        return 'flame';
      case 'added_to_collection':
        return 'bookmark';
      case 'added_to_wishlist':
        return 'heart';
      case 'saved_recipe':
        return 'newspaper';
      case 'followed_user':
        return 'person-add';
      case 'created_recipe':
        return 'create';
      case 'added_to_gear_wishlist':
        return 'cart';
      case 'gear_added':
        return 'hardware-chip';
      default:
        return 'cafe';
    }
  };

  // Get event type label based on the event type
  const getEventTypeLabel = () => {
    const type = event.type || 'coffee_log';
    
    switch (type) {
      case 'coffee_log':
        return 'brewed';
      case 'cafe_visit':
        return 'visited';
      case 'coffee_announcement':
        return 'added';
      case 'coffee_roasting':
        return 'roasted';
      case 'added_to_collection':
        return 'added to collection';
      case 'added_to_wishlist':
        return 'added to wishlist';
      case 'saved_recipe':
        return 'saved recipe';
      case 'followed_user':
        return 'followed';
      case 'created_recipe':
        return 'created recipe';
      case 'added_to_gear_wishlist':
        return 'added to gear wishlist';
      case 'gear_added':
        return 'added gear';
      default:
        return 'brewed';
    }
  };

  // Render recipe creator info
  const renderRecipeCreatorInfo = () => {
    // If the recipe is part of a regular brew log
    if (!event.type || event.type === 'coffee_log') {
      // Check if recipe has a different creator than the logger
      if (event.recipeCreatorId && event.recipeCreatorId !== event.userId) {
        if (event.recipeCreatorDeleted) {
          return (
            <View style={styles.recipeCreatorRow}>
              <View style={styles.creatorAvatarContainer}>
                <Ionicons name="person" size={16} color="#666666" style={styles.creatorAvatar} />
              </View>
              <Text style={styles.recipeCreatorText}>
                Recipe that was deleted
              </Text>
            </View>
          );
        }
        
        // Check if recipe creator is a business account
        const recipeCreatorIsBusiness = 
          event.recipeCreatorId?.startsWith('business-') || 
          isBusinessName(event.recipeCreatorName);
        
        return (
          <View style={styles.recipeCreatorRow}>
            <AppImage 
              source={event.recipeCreatorAvatar}
              style={[
                styles.creatorAvatar,
                recipeCreatorIsBusiness ? styles.businessCreatorAvatar : null
              ]}
              placeholder="person"
            />
            <Text style={styles.recipeCreatorText}>
              Recipe by {event.recipeCreatorName || 'Unknown'}
            </Text>
          </View>
        );
      }
      
      // If the recipe is based on another recipe
      if (event.basedOnRecipeBy) {
        if (event.basedOnRecipeDeleted) {
          return (
            <View style={styles.recipeCreatorRow}>
              <View style={styles.creatorAvatarContainer}>
                <Ionicons name="git-branch" size={16} color="#666666" style={styles.creatorAvatar} />
              </View>
              <Text style={styles.recipeCreatorText}>
                Based on a recipe that was deleted
              </Text>
            </View>
          );
        }
        
        // Check if the based-on recipe creator is a business
        const basedOnCreatorIsBusiness = isBusinessName(event.basedOnRecipeBy);
        
        return (
          <View style={styles.recipeCreatorRow}>
            <AppImage 
              source={event.basedOnRecipeAvatar}
              style={[
                styles.creatorAvatar,
                basedOnCreatorIsBusiness ? styles.businessCreatorAvatar : null
              ]}
              placeholder="person"
            />
            <Text style={styles.recipeCreatorText}>
              {isCurrentUserPost ? 'Your recipe' : `${event.userName}'s recipe`}, based on {event.basedOnRecipeBy}'s
            </Text>
          </View>
        );
      }

      return (
        <View style={styles.recipeCreatorRow}>
          <AppImage 
            source={event.userAvatar}
            style={[
              styles.creatorAvatar,
              isBusinessAccount ? styles.businessCreatorAvatar : null
            ]}
            placeholder="person"
          />
          <Text style={styles.recipeCreatorText}>
            {isCurrentUserPost ? 'Your recipe' : `${event.userName}'s recipe`}
          </Text>
        </View>
      );
    }
    
    // For specific recipe events like created_recipe or saved_recipe
    if (event.type === 'created_recipe' || event.type === 'saved_recipe') {
      const creatorName = event.creatorName || 'Unknown';
      
      if (event.basedOnRecipeBy) {
        if (event.basedOnRecipeDeleted) {
          return (
            <View style={styles.recipeCreatorRow}>
              <View style={styles.creatorAvatarContainer}>
                <Ionicons name="git-branch" size={16} color="#666666" style={styles.creatorAvatar} />
              </View>
              <Text style={styles.recipeCreatorText}>
                Based on a recipe that was deleted
              </Text>
            </View>
          );
        }
        
        // Check if the based-on recipe creator is a business
        const basedOnCreatorIsBusiness = isBusinessName(event.basedOnRecipeBy);
        
        return (
          <View style={styles.recipeCreatorRow}>
            <AppImage 
              source={event.basedOnRecipeAvatar}
              style={[
                styles.creatorAvatar,
                basedOnCreatorIsBusiness ? styles.businessCreatorAvatar : null
              ]}
              placeholder="person"
            />
            <Text style={styles.recipeCreatorText}>
              {isCurrentUserPost ? 'Your recipe' : `${event.userName}'s recipe`}, based on {event.basedOnRecipeBy}'s
            </Text>
          </View>
        );
      }
      
      if (event.type === 'saved_recipe' && event.creatorId !== event.userId) {
        if (event.creatorDeleted) {
          return (
            <View style={styles.recipeCreatorRow}>
              <View style={styles.creatorAvatarContainer}>
                <Ionicons name="person" size={16} color="#666666" style={styles.creatorAvatar} />
              </View>
              <Text style={styles.recipeCreatorText}>
                Recipe by a deleted user
              </Text>
            </View>
          );
        }
        
        // Check if creator is a business account
        const creatorIsBusiness = 
          event.creatorId?.startsWith('business-') || 
          isBusinessName(event.creatorName);
        
        return (
          <View style={styles.recipeCreatorRow}>
            <AppImage 
              source={event.creatorAvatar}
              style={[
                styles.creatorAvatar,
                creatorIsBusiness ? styles.businessCreatorAvatar : null
              ]}
              placeholder="person"
            />
            <Text style={styles.recipeCreatorText}>
              Recipe by {creatorName}
            </Text>
          </View>
        );
      }

      // Default case - creator is the same as logger
      return (
        <View style={styles.recipeCreatorRow}>
          <AppImage 
            source={event.userAvatar}
            style={[
              styles.creatorAvatar,
              isBusinessAccount ? styles.businessCreatorAvatar : null
            ]}
            placeholder="person"
          />
          <Text style={styles.recipeCreatorText}>
            {isCurrentUserPost ? 'Your recipe' : `${event.userName}'s recipe`}
          </Text>
        </View>
      );
    }
    
    return null;
  };

  // Render saved count with avatars
  const renderSavedCount = () => {
    const savedCount = event.savedCount || event.saves || 0;
    const savedUsers = event.savedUsers || [];
    
    if (savedCount === 0) {
      return null;
    }
    
    return (
      <View style={styles.savedCountContainer}>
        <View style={styles.savedAvatarsContainer}>
          {savedUsers.slice(0, 3).map((user, index) => (
            <AppImage 
              key={`saved-user-${index}`}
              source={user.avatar}
              style={[
                styles.savedUserAvatar,
                { marginLeft: index > 0 ? -8 : 0 }
              ]}
              placeholder="person"
            />
          ))}
        </View>
        <Text style={styles.savedCountText}>
          {savedCount} {savedCount === 1 ? 'save' : 'saves'}
        </Text>
      </View>
    );
  };

  // Render rating stars
  const renderRating = () => {
    if (!event.rating && event.rating !== 0) {
      return null;
    }
    
    const rating = Math.min(Math.max(0, event.rating), 5);
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      const iconName = i <= rating ? "star" : "star-outline";
      stars.push(
        <Ionicons 
          key={`star-${i}`} 
          name={iconName} 
          size={16} 
          color="#FFC107" 
          style={{ marginRight: 2 }}
        />
      );
    }
    
    return (
      <View style={styles.ratingContainer}>
        {stars}
      </View>
    );
  };

  // Render different event types
  const renderEventContent = () => {
    const type = event.type || 'coffee_log';
    
    // Default coffee log - has coffeeId, coffeeName and no explicit type
    if (!type || type === 'coffee_log' || 
        ((!event.type || event.type === 'coffee_announcement') && event.coffeeId && event.coffeeName)) {
      return (
        <View style={styles.contentContainer}>
          {/* Combined container for coffee and recipe */}
          <View style={styles.combinedContainer}>
            {/* Coffee image and details */}
            <TouchableOpacity 
              style={styles.coffeeContainer}
              onPress={() => onCoffeePress && onCoffeePress(event)}
              activeOpacity={0.7}
            >
              <View style={styles.coffeeImageContainer}>
                {event.imageUrl ? (
                  <AppImage source={event.imageUrl} style={styles.coffeeImage} placeholder="coffee" />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="cafe" size={24} color="#666" />
                  </View>
                )}
              </View>
              <View style={styles.coffeeInfo}>
                <Text style={styles.coffeeName}>{event.coffeeName || 'Unknown Coffee'}</Text>
                <Text style={styles.roasterName}>{event.roaster || event.roasterName || 'Unknown Roaster'}</Text>
              </View>
              {event.type === 'coffee_announcement' && (
                <View style={styles.announcementBadge}>
                  <Ionicons name="megaphone" size={12} color="#FFFFFF" />
                  <Text style={styles.announcementText}>New in shop</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Recipe details - now clickable */}
            {!event.type || event.type !== 'coffee_announcement' ? (
              <TouchableOpacity 
                style={styles.recipeContainer}
                onPress={() => onRecipePress && onRecipePress(event)}
                activeOpacity={0.7}
              >
                {/* Recipe creator info - moved before method */}
                {renderRecipeCreatorInfo()}
                
                <View style={styles.recipeHeader}>
                  <View style={styles.methodContainer}>
                    <Ionicons name="cafe" size={20} color="#000000" />
                    <Text style={styles.methodText}>{event.method || event.brewingMethod || 'Unknown Method'}</Text>
                  </View>
                </View>
                
                <View style={styles.recipeDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Coffee</Text>
                    <Text style={styles.detailValue}>{event.amount || '18'}g</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Grind Size</Text>
                    <Text style={styles.detailValue}>{event.grindSize || 'Medium'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Water</Text>
                    <Text style={styles.detailValue}>{event.waterVolume || '300'}ml</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Brew Time</Text>
                    <Text style={styles.detailValue}>{event.brewTime || '3:30'}</Text>
                  </View>
                </View>

                {/* Saved count with avatars */}
                {renderSavedCount()}
              </TouchableOpacity>
            ) : null}
          </View>
          
          {/* Notes and rating outside the recipe container */}
          <View style={styles.notesContainer}>
            {renderRating()}
            {event.notes && (
              <Text style={styles.notesText} numberOfLines={3}>
                {event.notes}
              </Text>
            )}
          </View>
        </View>
      );
    }
    
    // Other event types
    return (
      <View style={styles.contentContainer}>
        <View style={styles.genericEventContainer}>
          <View style={styles.eventImageContainer}>
            {event.imageUrl ? (
              <AppImage source={event.imageUrl} style={styles.eventImage} placeholder={getEventTypeIcon()} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name={getEventTypeIcon()} size={24} color="#666" />
              </View>
            )}
          </View>
          
          <View style={styles.eventContent}>
            {event.title && <Text style={styles.eventTitle}>{event.title}</Text>}
            {event.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={16} color="#666666" />
                <Text style={styles.locationText}>{event.location}</Text>
              </View>
            )}
            {event.gearName && (
              <View style={styles.genericInfoRow}>
                <Ionicons name="hardware-chip" size={16} color="#666666" />
                <Text style={styles.genericInfoText}>{event.gearName}</Text>
              </View>
            )}
            {event.type === 'gear_added' && event.gearName && (
              <View style={styles.gearAddedContainer}>
                <AppImage 
                  source={event.gearImage || event.imageUrl}
                  style={styles.gearImage}
                  placeholder="hardware-chip"
                />
                <View style={styles.gearInfo}>
                  <Text style={styles.gearName}>{event.gearName}</Text>
                  {event.gearBrand && (
                    <Text style={styles.gearBrand}>{event.gearBrand}</Text>
                  )}
                </View>
              </View>
            )}
            {event.cafeId && event.cafeName && (
              <View style={styles.genericInfoRow}>
                <Ionicons name="storefront" size={16} color="#666666" />
                <Text style={styles.genericInfoText}>{event.cafeName}</Text>
              </View>
            )}
            {event.beanOrigin && (
              <View style={styles.genericInfoRow}>
                <Ionicons name="globe" size={16} color="#666666" />
                <Text style={styles.genericInfoText}>{event.beanOrigin}</Text>
              </View>
            )}
            {event.recipeName && (
              <View style={styles.genericInfoRow}>
                <Ionicons name="document-text" size={16} color="#666666" />
                <Text style={styles.genericInfoText}>{event.recipeName}</Text>
              </View>
            )}
            {event.followedUserName && (
              <View style={styles.genericInfoRow}>
                <Ionicons name="person" size={16} color="#666666" />
                <Text style={styles.genericInfoText}>{event.followedUserName}</Text>
              </View>
            )}
            {event.type === 'followed_user' && event.followedUserAvatar && (
              <View style={styles.followedUserContainer}>
                <AppImage 
                  source={event.followedUserAvatar}
                  style={styles.followedUserAvatar}
                  placeholder="person"
                />
                <Text style={styles.followedUserText}>
                  {isBusinessName(event.followedUserName) ? 'Business profile' : 'User profile'}
                </Text>
              </View>
            )}
            {event.coffeeName && type !== 'coffee_log' && (
              <View style={styles.genericInfoRow}>
                <Ionicons name="cafe" size={16} color="#666666" />
                <Text style={styles.genericInfoText}>{event.coffeeName}</Text>
              </View>
            )}
            
            {/* Recipe creator info for created_recipe or saved_recipe events */}
            {(type === 'created_recipe' || type === 'saved_recipe') && renderRecipeCreatorInfo()}
            
            {/* Saved count with avatars */}
            {renderSavedCount()}
            
            {event.notes && (
              <Text style={styles.notesText} numberOfLines={3}>
                {event.notes}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Render action buttons (like, comment, etc.)
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
            color={isLiked ? "#F44336" : "#666666"}
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
          <Ionicons name="chatbubble-outline" size={20} color="#666666" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={22} color="#666666" />
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Header with user info and timestamp */}
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
          {isPrivate && (
            <Ionicons name="lock-closed" size={18} color="#666666" style={styles.privateIcon} />
          )}
          <TouchableOpacity
            onPress={handleOptionsPress}
            style={styles.optionsButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#666666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Event content - either coffee log or other event type */}
      {renderEventContent()}
      
      {/* Action buttons - hidden for now */}
      {/* {renderActionButtons()} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
    marginVertical: 0,
    overflow: 'hidden',
    // borderBottomWidth: 1,
    // borderBottomColor: '#E0E0E0',
    marginBottom: 8,
  },
  contentContainer: {
    padding: 12,
    paddingTop: 0,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    // borderBottomWidth: 1,
    // borderBottomColor: '#F0F0F0',
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
    color: '#000000',
    marginRight: 5,
  },
  userAction: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  businessAvatar: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  headerActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privateIcon: {
    marginRight: 8,
  },
  optionsButton: {
    padding: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
  },
  coffeeContainer: {
    flexDirection: 'row',
    padding: 12,
    // paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    // outlineWidth: 1,
    // outlineColor: '#E0E0E0',
    // borderWidth: 1,
    // borderColor: '#E0E0E0',
    // borderColor: '#E5E5EA',
    // borderRadius: 12,
    position: 'relative',
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
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
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
    color: '#000000',
    marginBottom: 4,
  },
  roasterName: {
    fontSize: 14,
    color: '#666666',
  },
  recipeContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 2,
    borderRadius: 0,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    // borderBottomWidth: 1,
    // borderBottomColor: '#F1F1F1',
    marginTop: 1,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  methodText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  recipeCreatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  businessCreatorAvatar: {
    borderRadius: 6,
  },
  creatorAvatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  recipeCreatorText: {
    fontSize: 13,
    color: '#666666',
  },
  savedCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
  },
  savedAvatarsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  savedUserAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  savedCountText: {
    fontSize: 12,
    color: '#666666',
  },
  recipeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailRow: {
    width: '50%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  notesContainer: {
    marginVertical: 8,
    marginTop: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#666666',
  },
  // New styles for generic events
  genericEventContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  eventImageContainer: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  eventContent: {
    paddingHorizontal: 4,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  genericInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  genericInfoText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
    fontWeight: '500',
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
    color: '#666666',
    marginLeft: 6,
  },
  combinedContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderColor: '#E5E5EA',
    // backgroundColor: '#F1F1F1',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    // marginBottom: 12,
    // padding: 8,
  },
  followedUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  followedUserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  followedUserText: {
    fontSize: 14,
    color: '#666666',
  },
  announcementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  announcementText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  gearAddedContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  gearImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  gearInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  gearName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  gearBrand: {
    fontSize: 14,
    color: '#666666',
  },
});

export default CoffeeLogCard;
