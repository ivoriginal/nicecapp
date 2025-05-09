import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

const ReviewStars = ({
  rating = 0,
  maxRating = 5,
  size = 16,
  color = COLORS.primary,
  emptyColor = COLORS.lightGray,
  showHalfStars = true,
  containerStyle
}) => {
  // Ensure rating is within valid range
  const normalizedRating = Math.max(0, Math.min(rating, maxRating));
  
  // Create an array with the total number of stars
  const stars = Array(maxRating).fill(0);

  return (
    <View style={[styles.container, containerStyle]}>
      {stars.map((_, index) => {
        // Determine the star type based on the rating
        let iconName = 'star-outline'; // Empty star by default
        
        if (index + 1 <= Math.floor(normalizedRating)) {
          // Full star
          iconName = 'star';
        } else if (showHalfStars && 
                  index + 1 > Math.floor(normalizedRating) && 
                  index + 0.5 < normalizedRating) {
          // Half star
          iconName = 'star-half';
        }
        
        return (
          <MaterialIcons
            key={index}
            name={iconName}
            size={size}
            color={iconName === 'star-outline' ? emptyColor : color}
            style={styles.star}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: SIZES.base / 2,
  },
});

export default ReviewStars; 