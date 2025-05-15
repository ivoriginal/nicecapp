import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SIZES } from '../constants';
import UserAvatar from './UserAvatar';
import FollowButton from './FollowButton';
import ReviewStars from './ReviewStars';

const PeopleCard = ({ 
  user, 
  onFollow, 
  containerStyle,
  handleUserPress
}) => {
  const navigation = useNavigation();

  const onPress = () => {
    handleUserPress ? handleUserPress(user) : navigation.navigate('UserProfileBridge', { userId: user.id });
  };

  const handleFollow = (userId, isFollowing) => {
    if (onFollow) {
      onFollow(userId, isFollowing);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, containerStyle]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <UserAvatar 
        user={user} 
        size={50} 
        showName={false} 
      />
      
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{user.name || user.username}</Text>
        
        {user.handle ? (
          <Text style={styles.handle} numberOfLines={1}>
            {user.handle}
          </Text>
        ) : null}
        
        {user.rating > 0 ? (
          <View style={styles.ratingContainer}>
            <ReviewStars 
              rating={user.rating} 
              size={14}
            />
            <Text style={styles.reviewCount}>
              ({user.reviewCount || 0})
            </Text>
          </View>
        ) : null}
      </View>
      
      <FollowButton 
        userId={user.id}
        isFollowing={user.isFollowing}
        onFollowChanged={handleFollow}
        style={styles.followButton}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.base,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoContainer: {
    flex: 1,
    marginHorizontal: SIZES.padding,
  },
  name: {
    ...FONTS.h4,
    color: COLORS.black,
    marginBottom: 2,
  },
  handle: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewCount: {
    ...FONTS.body5,
    color: COLORS.gray,
    marginLeft: 4,
  },
  followButton: {
    minWidth: 90,
  },
});

export default PeopleCard; 