import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { useCoffee } from '../context/CoffeeContext';

const FollowButton = ({ 
  userId, 
  isFollowing: initialIsFollowing = false, 
  onFollowChanged,
  style,
  textStyle
}) => {
  const { theme, isDarkMode } = useTheme();
  const { followUser, unfollowUser, isFollowing: checkIsFollowing } = useCoffee();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  // Update follow state when userId changes
  useEffect(() => {
    setIsFollowing(checkIsFollowing(userId));
  }, [userId, checkIsFollowing]);

  const handlePress = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
      
      const newFollowState = !isFollowing;
      setIsFollowing(newFollowState);
      
      // Notify parent component about the change
      if (onFollowChanged) {
        onFollowChanged(userId, newFollowState);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      // Revert state on error
      setIsFollowing(isFollowing);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isFollowing ? [
          styles.followingContainer, 
          { 
            backgroundColor: theme.background,
            borderColor: theme.primaryText 
          }
        ] : [
          styles.notFollowingContainer, 
          { 
            backgroundColor: theme.primaryText,
            borderColor: theme.primaryText
          }
        ],
        style
      ]}
      onPress={handlePress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={isFollowing ? theme.primaryText : theme.background} />
      ) : (
        <Text 
          style={[
            styles.buttonText,
            isFollowing ? [
              styles.followingText, 
              { color: theme.primaryText }
            ] : [
              styles.notFollowingText, 
              { color: theme.background }
            ],
            textStyle
          ]}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    borderWidth: 1,
  },
  notFollowingContainer: {
    backgroundColor: COLORS.primary,
  },
  followingContainer: {
    backgroundColor: COLORS.white,
  },
  buttonText: {
    ...FONTS.body3,
  },
  notFollowingText: {
    color: COLORS.white,
  },
  followingText: {
    color: COLORS.primary,
  },
});

export default FollowButton; 