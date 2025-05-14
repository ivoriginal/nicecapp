import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActionSheetIOS, Share, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppImage from './common/AppImage';
import RecipeCard from './RecipeCard';

const CoffeeLogCard = ({ event, onCoffeePress, onRecipePress, onUserPress, onOptionsPress, onLikePress, currentUserId, showToast }) => {
  // Local state to handle UI updates before backend sync
  const [isLiked, setIsLiked] = useState(event.isLiked || false);
  const [likeCount, setLikeCount] = useState(event.likes || 0);

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
      ? [
          'Share this post',
          'Delete', 
          'Cancel'
        ]
      : [
          'Report', 
          'Share this post', 
          'Cancel'
        ];
    
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
          { 
            text: "Share this post", 
            onPress: handleShare
          },
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
      case 'coffee_announcement':
        return 'megaphone';
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
      case 'similar_coffee_recommendation':
        return 'sparkles';
      case 'user_recommendation':
        return 'people';
      default:
        return 'cafe';
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
      case 'coffee_log':
        return 'brewed';
      case 'coffee_announcement':
        return 'added to shop';
      case 'added_to_collection':
        return 'added to collection';
      case 'added_to_wishlist':
        return 'added to wishlist';
      case 'saved_recipe':
        return 'saved a recipe';
      case 'followed_user':
        return 'followed';
      case 'created_recipe':
        return 'created a recipe';
      case 'added_to_gear_wishlist':
        return 'wishlisted';
      case 'gear_added':
        return 'added gear';
      default:
        return 'brewed';
    }
  };

  // Handle location press
  const handleLocationPress = () => {
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
    
    // Debug logging for friends data
    console.log('Event data:', {
      friends: event.friends,
      location: event.location,
      locationId: event.locationId
    });
    
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
                color="#666666" 
                style={[styles.coffeeChevron, { display: 'none' }]} 
              />
            </TouchableOpacity>

            {/* Recipe details - only show if there's a recipe */}
            {(!event.type || event.type !== 'coffee_announcement') && 
             event.brewingMethod && event.amount && event.grindSize && event.waterVolume && event.brewTime ? (
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
                    <Ionicons name="cafe" size={16} color="#000000" />
                    <Text style={styles.methodText} numberOfLines={1}>{event.method || event.brewingMethod || 'Unknown Method'}</Text>
                  </View>
                  <Text style={styles.recipeDetail} numberOfLines={1}>{event.amount || '18'}g</Text>
                  <Text style={styles.recipeDetail} numberOfLines={1}>{event.grindSize || 'Medium'}</Text>
                  <Text style={styles.recipeDetail} numberOfLines={1}>{event.waterVolume || '300'}ml</Text>
                  <Text style={styles.recipeDetail} numberOfLines={1}>{event.brewTime || '3:30'}</Text>
                  <Ionicons 
                    name="chevron-forward" 
                    size={16} 
                    color="#000000" 
                    style={[styles.chevronIcon, { display: 'none' }]} 
                  />
                </View>
              </TouchableOpacity>
            ) : null}
          </View>
          
          {/* Notes and rating outside the recipe container */}
          {(event.notes && event.notes.trim() !== '') || event.rating ? (
            <View style={styles.notesContainer}>
              {renderRating()}
              {event.notes && event.notes.trim() !== '' && (
                <Text style={styles.notesText} numberOfLines={3}>
                  {event.notes}
                </Text>
              )}
            </View>
          ) : null}

          {/* Metadata section */}
          <View style={styles.metadataContainer}>
            {event.location && (
              <TouchableOpacity 
                style={styles.metadataRow}
                onPress={handleLocationPress}
                activeOpacity={0.7}
              >
                <Ionicons name="location" size={16} color="#666666" />
                <Text style={styles.metadataText}>{event.location}</Text>
              </TouchableOpacity>
            )}
            {event.friends && event.friends.length > 0 && (
              <View style={styles.metadataRow}>
                <Ionicons name="people" size={16} color="#666666" />
                <Text style={styles.metadataText}>
                  With {event.friends.map(friend => friend.name || friend.userName).join(', ')}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }
    
    // Added to collection event - show coffee card like brewed
    if (type === 'added_to_collection') {
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
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    // Saved recipe and created recipe events - show RecipeCard
    if (type === 'saved_recipe' || type === 'created_recipe') {
      const recipeData = {
        id: event.recipeId || event.id,
        name: event.recipeName || `${event.method || event.brewingMethod} Recipe`,
        method: event.method || event.brewingMethod,
        brewTime: event.brewTime,
        grindSize: event.grindSize,
        coffeeId: event.coffeeId,
        coffeeName: event.coffeeName,
        creatorName: event.userName,
        creatorAvatar: event.userAvatar,
        image: event.imageUrl
      };
      
      return (
        <View style={styles.contentContainer}>
          <RecipeCard 
            recipe={recipeData} 
            onPress={() => onRecipePress && onRecipePress(event)}
            showCoffeeInfo={true}
          />
          
          {/* Notes if any */}
          {event.notes && event.notes.trim() !== '' && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesText} numberOfLines={3}>
                {event.notes}
              </Text>
            </View>
          )}
        </View>
      );
    }
    
    // Similar coffee recommendations - special event with no author
    if (type === 'similar_coffee_recommendation') {
      return (
        <View style={styles.contentContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.similarCoffeeContainer}
          >
            {event.similarCoffees && event.similarCoffees.map((coffee, index) => (
              <TouchableOpacity 
                key={`similar-${coffee.id || index}`}
                style={styles.similarCoffeeCard}
                onPress={() => onCoffeePress && onCoffeePress(coffee)}
              >
                <View style={styles.similarCoffeeImageContainer}>
                  <AppImage 
                    source={coffee.imageUrl || coffee.image} 
                    style={styles.similarCoffeeImage}
                    placeholder="coffee" 
                  />
                </View>
                <View style={styles.similarCoffeeInfo}>
                  <Text style={styles.similarCoffeeName} numberOfLines={1}>{coffee.name}</Text>
                  <Text style={styles.similarCoffeeRoaster} numberOfLines={1}>{coffee.roaster}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }
    
    // Followed user event - special event with no author
    if (type === 'user_recommendation') {
      // Check if recommended user is a business/café
      const isRecommendedBusinessAccount = 
        event.recommendedUserName === 'Vértigo y Calambre' || 
        event.recommendedUserName === 'Kima Coffee' ||
        (event.recommendedUserName && event.recommendedUserName.includes('Café')) ||
        event.recommendedUserId?.startsWith('business-');
      
      return (
        <View style={styles.contentContainer}>
          <TouchableOpacity 
            style={styles.followedUserContent}
            onPress={() => onUserPress && onUserPress({
              id: event.recommendedUserId,
              userName: event.recommendedUserName
            })}
          >
            <AppImage 
              source={event.recommendedUserAvatar}
              style={[
                styles.followedUserAvatar,
                isRecommendedBusinessAccount ? styles.followedBusinessAvatar : null
              ]}
              placeholder="person"
            />
            <View style={styles.followedUserInfo}>
              <Text style={styles.followedUserName}>{event.recommendedUserName}</Text>
              {event.recommendedUserBio && (
                <Text style={styles.followedByText} numberOfLines={2}>{event.recommendedUserBio}</Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.followButton}
              onPress={() => {
                // Will add follow functionality later
                console.log('Follow button pressed for:', event.recommendedUserName);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      );
    }
    
    // Gear events - added gear and wishlisted gear
    if (type === 'gear_added' || type === 'added_to_gear_wishlist') {
      // Get gear data from the event
      const gearData = {
        id: event.gearId,
        name: event.gearName,
        brand: event.gearBrand,
        image: event.gearImage || event.imageUrl
      };
      
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
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color="#666666" 
              style={[styles.gearChevron, { display: 'none' }]} 
            />
          </TouchableOpacity>
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
            {event.coffeeName && type !== 'coffee_log' && (
              <View style={styles.genericInfoRow}>
                <Ionicons name="cafe" size={16} color="#666666" />
                <Text style={styles.genericInfoText}>{event.coffeeName}</Text>
              </View>
            )}
            
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
      {event.type === 'similar_coffee_recommendation' ? (
        <View style={styles.headerContainer}>
          <View style={styles.specialHeaderContainer}>
            <Ionicons name="sparkles" size={20} color="#666666" style={styles.similarCoffeeIcon} />
            <Text style={styles.specialHeaderText}>
              Similar to {event.basedOnCoffeeName || 'coffees you like'}
            </Text>
          </View>
          <View style={styles.headerActionsContainer}>
            {/* Options button hidden for now, will add functionality later */}
            <TouchableOpacity
              onPress={handleOptionsPress}
              style={[styles.optionsButton, { display: 'none' }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>
      ) : event.type === 'user_recommendation' ? (
        <View style={styles.headerContainer}>
          <View style={styles.specialHeaderContainer}>
            <Ionicons name="people" size={20} color="#666666" />
            <Text style={styles.specialHeaderText}>Followed by people you follow</Text>
          </View>
          <View style={styles.headerActionsContainer}>
            {/* Options button hidden for now, will add functionality later */}
            <TouchableOpacity
              onPress={handleOptionsPress}
              style={[styles.optionsButton, { display: 'none' }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#666666" />
            </TouchableOpacity>
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
              <Ionicons name="ellipsis-horizontal" size={20} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>
      )}

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
    // borderBottomColor: '#E5E5EA',
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
    alignItems: 'center',
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
    marginBottom: 8,
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
    padding: 12,
    // padding: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginTop: 1,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    maxWidth: 100,
  },
  methodText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
  },
  recipeDetail: {
    fontSize: 12,
    color: '#666666',
    // maxWidth: 60,
  },
  recipeCreatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 0,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderOpacity: 0.2,
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
  notesContainer: {
    marginTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 8,
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
    marginBottom: 12,
    // padding: 8,
  },
  followedUserCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 16,
    marginBottom: 8,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recommendationHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 8,
  },
  followedUserContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  followedUserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  followedBusinessAvatar: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  followedUserInfo: {
    flex: 1,
  },
  followedUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  followedByText: {
    fontSize: 14,
    color: '#666666',
  },
  followedChevron: {
    marginLeft: 'auto',
  },
  similarCoffeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  similarCoffeeIcon: {
    marginRight: 8,
  },
  similarCoffeeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  similarCoffeeContainer: {
    // paddingLeft: 8,
    paddingRight: 0,
    paddingBottom: 8,
    paddingTop: 0,
  },
  similarCoffeeCard: {
    width: 120,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  similarCoffeeImageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#F5F5F5',
  },
  similarCoffeeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  similarCoffeeInfo: {
    padding: 8,
  },
  similarCoffeeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  similarCoffeeRoaster: {
    fontSize: 12,
    color: '#666666',
  },
  gearCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 8,
    alignItems: 'center',
  },
  gearImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#F5F5F5',
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
    color: '#000000',
    marginBottom: 4,
  },
  gearBrand: {
    fontSize: 14,
    color: '#666666',
  },
  gearChevron: {
    marginLeft: 'auto',
  },
  metadataContainer: {
    paddingTop: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataIcon: {
    marginRight: 8,
  },
  metadataText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  announcementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    position: 'absolute',
    right: 40,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  announcementText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  specialHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  specialHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  followButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#000000',
    borderRadius: 16,
    marginLeft: 'auto',
  },
  followButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  coffeeChevron: {
    marginLeft: 'auto',
  },
});

export default CoffeeLogCard;
