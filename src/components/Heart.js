import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSequence,
  withSpring, 
  Easing,
  runOnJS 
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const Heart = ({ 
  size = 24, 
  filled = false, 
  onAnimationComplete, 
  style,
  color = COLORS.error
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(filled ? 1 : 0);
  
  useEffect(() => {
    if (filled) {
      // Heart filling animation
      scale.value = withSequence(
        withTiming(0.6, { duration: 50 }),
        withSpring(1.2, { damping: 2 }),
        withTiming(1, { 
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        })
      );
      
      opacity.value = withTiming(1, { duration: 150 });
    } else {
      // Heart emptying animation
      opacity.value = withTiming(0, { duration: 150 });
      
      scale.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(1, { 
          duration: 200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)();
          }
        })
      );
    }
  }, [filled]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const animatedFilledStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <MaterialIcons
          name="favorite-outline"
          size={size}
          color={color}
          style={styles.outlineIcon}
        />
        <Animated.View style={[styles.filledIconContainer, animatedFilledStyle]}>
          <MaterialIcons
            name="favorite"
            size={size}
            color={color}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineIcon: {
    position: 'absolute',
  },
  filledIconContainer: {
    position: 'absolute',
  },
});

export default Heart; 