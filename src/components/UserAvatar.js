import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants';

const UserAvatar = ({ 
  user, 
  size = 40, 
  showName = false,
  namePosition = 'right', // 'right', 'bottom', 'none'
  onPress,
  containerStyle
}) => {
  // Default placeholder image if user has no avatar
  const placeholderImage = 'https://ui-avatars.com/api/?name=' + 
    (user?.username || 'User') + '&background=f4511e&color=fff';
    
  const avatarSource = { 
    uri: user?.avatar || placeholderImage 
  };

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2
  };

  const renderName = () => {
    if (!showName) return null;
    
    return (
      <Text 
        style={[
          styles.name,
          namePosition === 'bottom' && styles.nameBottom,
          namePosition === 'right' && styles.nameRight
        ]}
        numberOfLines={1}
      >
        {user?.username || 'User'}
      </Text>
    );
  };

  const content = (
    <View style={[
      styles.container, 
      namePosition === 'right' && styles.containerRow,
      containerStyle
    ]}>
      <Image
        source={avatarSource}
        style={[styles.avatar, avatarStyle]}
      />
      {renderName()}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={() => onPress(user)} 
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center'
  },
  containerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    backgroundColor: COLORS.gray
  },
  name: {
    ...FONTS.body4,
    color: COLORS.black,
  },
  nameBottom: {
    marginTop: SIZES.base / 2,
  },
  nameRight: {
    marginLeft: SIZES.base,
  }
});

export default UserAvatar; 