import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants';
import { useTheme } from '../context/ThemeContext';

const FollowButton = ({ 
  userId, 
  isFollowing: initialIsFollowing = false, 
  onFollowChanged,
  style
}) => {
  const { theme } = useTheme();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    setIsLoading(true);
    try {
      // In a real app, you would make an API call here to follow/unfollow
      // For now, we'll just toggle the state
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
        isFollowing ? [styles.followingContainer, { backgroundColor: theme.cardBackground, borderColor: theme.primaryText }] : [styles.notFollowingContainer, { backgroundColor: theme.primaryText }],
        style
      ]}
      onPress={handlePress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={isFollowing ? theme.primaryText : theme.cardBackground} />
      ) : (
        <Text 
          style={[
            styles.buttonText,
            isFollowing ? [styles.followingText, { color: theme.primaryText }] : [styles.notFollowingText, { color: theme.cardBackground }]
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
    marginRight: SIZES.base,
  },
  notFollowingContainer: {
    backgroundColor: COLORS.primary,
  },
  followingContainer: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonText: {
    ...FONTS.body3,
    fontWeight: '600',
  },
  notFollowingText: {
    color: COLORS.white,
  },
  followingText: {
    color: COLORS.primary,
  },
});

export default FollowButton; 