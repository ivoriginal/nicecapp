import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const Toast = ({ 
  visible, 
  message, 
  actionText, 
  onAction, 
  onDismiss, 
  duration = 4000 
}) => {
  const { theme, isDarkMode } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  useEffect(() => {
    if (visible) {
      // Show toast
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Set timer to dismiss toast
      timer.current = setTimeout(() => {
        dismissToast();
      }, duration);
    } else {
      // Hide toast
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [visible, duration]);

  const dismissToast = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          transform: [{ translateY }],
          opacity,
          backgroundColor: isDarkMode ? '#1C1C1E' : '#000000'
        }
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.message, { color: '#FFFFFF' }]}>{message}</Text>
        {actionText && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => {
              if (onAction) {
                onAction();
              }
              dismissToast();
            }}
          >
            <Text style={[styles.actionText, { color: isDarkMode ? '#0A84FF' : '#007AFF' }]}>{actionText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 4,
  },
});

export default Toast; 