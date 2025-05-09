import React, { useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Share,
  Platform 
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants';

const ToolBar = ({ 
  itemId, 
  initialLikes = 0,
  initialSaved = false,
  onLike,
  onSave,
  onShare,
  containerStyle
}) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [saved, setSaved] = useState(initialSaved);

  const handleLike = () => {
    const newLikedState = !liked;
    setLiked(newLikedState);
    
    // Update likes count
    setLikes(prevLikes => newLikedState ? prevLikes + 1 : prevLikes - 1);
    
    if (onLike) {
      onLike(itemId, newLikedState, newLikedState ? likes + 1 : likes - 1);
    }
  };

  const handleSave = () => {
    const newSavedState = !saved;
    setSaved(newSavedState);
    
    if (onSave) {
      onSave(itemId, newSavedState);
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        // This message would typically include a deeplink to the content
        message: Platform.OS === 'ios' 
          ? 'Check out this item on NiceCapp!' 
          : 'Check out this item on NiceCapp! https://nicecapp.example/item/' + itemId,
        url: 'https://nicecapp.example/item/' + itemId, // iOS only
        title: 'Share via',
      });
      
      if (result.action === Share.sharedAction && onShare) {
        onShare(itemId);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleLike}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name={liked ? 'favorite' : 'favorite-outline'}
          size={24}
          color={liked ? COLORS.error : COLORS.darkGray}
        />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleSave}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={saved ? 'bookmark' : 'bookmark-outline'}
          size={24}
          color={saved ? COLORS.primary : COLORS.darkGray}
        />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleShare}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name="share"
          size={24}
          color={COLORS.darkGray}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SIZES.base,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconButton: {
    padding: SIZES.base,
  },
});

export default ToolBar; 