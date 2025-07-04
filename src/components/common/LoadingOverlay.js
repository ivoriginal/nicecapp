import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function LoadingOverlay({ message = 'Processing…' }) {
  const { theme, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }]}>
      <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
        <ActivityIndicator size="large" color={theme.primaryText} />
        {message && <Text style={[styles.message, { color: theme.primaryText }]}>{message}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  card: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : '500',
    textAlign: 'center',
  },
});