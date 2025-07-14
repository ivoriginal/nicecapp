import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const NotificationPermissionCard = ({ onPress, onDismiss }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.divider }]}>
      <View style={styles.iconContainer}>
        <Ionicons name="notifications" size={24} color={theme.primaryText} />
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.primaryText }]}>
          Enable Push Notifications
        </Text>
        <Text style={[styles.description, { color: theme.secondaryText }]}>
          Stay updated when people follow you, save your recipes, or interact with your content.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.enableButton, { backgroundColor: theme.primaryText }]}
          onPress={onPress}
        >
          <Text style={[styles.enableButtonText, { color: theme.background }]}>
            Enable
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dismissButton}
          onPress={onDismiss}
        >
          <Ionicons name="close" size={20} color={theme.secondaryText} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5EA',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000000',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666666',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enableButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 8,
  },
});

export default NotificationPermissionCard; 