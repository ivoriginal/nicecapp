import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { theme, isDarkMode, toggleTheme, themeMode, setThemeMode } = useTheme();
  
  // Radio button selection for theme
  const [selectedTheme, setSelectedTheme] = useState(themeMode || 'auto');

  // Configure navigation header with theme
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isDarkMode ? theme.altCardBackground : '#FFFFFF',
        elevation: 0,
        shadowOpacity: 0,
        // borderBottomWidth: 1,
        // borderBottomColor: theme.divider,
      },
      headerTintColor: theme.primaryText,
      headerTitleStyle: {
        color: theme.primaryText,
        fontWeight: '600',
      },
    });
  }, [navigation, theme, isDarkMode]);

  // Update selectedTheme when themeMode changes
  useEffect(() => {
    setSelectedTheme(themeMode || 'auto');
  }, [themeMode]);

  // Handle theme selection
  const handleThemeSelection = (mode) => {
    setSelectedTheme(mode);
    setThemeMode(mode);
  };

  // Render a radio button option
  const renderThemeOption = (label, value) => (
    <TouchableOpacity
      style={[styles.optionRow, { borderBottomColor: theme.divider }]}
      onPress={() => handleThemeSelection(value)}
    >
      <Text style={[styles.optionText, { color: theme.primaryText }]}>{label}</Text>
      <View style={[styles.radioButton, { borderColor: theme.primaryText }]}>
        {selectedTheme === value && (
          <View style={[styles.radioButtonSelected, { backgroundColor: theme.primaryText }]} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? theme.background : theme.altBackground }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <ScrollView style={styles.content}>
        {/* Theme Settings Section */}
        <View style={[styles.section, { backgroundColor: isDarkMode ? theme.altCardBackground : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Appearance</Text>
          
          {/* Theme Options */}
          <View style={[styles.optionsContainer, { borderTopColor: theme.divider }]}>
            {renderThemeOption('Automatic (Follow Device)', 'auto')}
            {renderThemeOption('Light Mode', 'light')}
            {renderThemeOption('Dark Mode', 'dark')}
          </View>
        </View>
        
        {/* Account Section */}
        <View style={[styles.section, { backgroundColor: isDarkMode ? theme.altCardBackground : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Account</Text>
          
          {/* Account Options - These would be actual options in a real app */}
          <View style={[styles.optionsContainer, { borderTopColor: theme.divider }]}>
          <TouchableOpacity 
            style={[styles.optionRow, { borderBottomColor: theme.divider }]}
            onPress={() => Alert.alert('Coming Soon', 'This feature is not available yet.')}
          >
            <Text style={[styles.optionText, { color: theme.primaryText }]}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.optionRow, { borderBottomColor: theme.divider }]}
            onPress={() => Alert.alert('Coming Soon', 'This feature is not available yet.')}
          >
            <Text style={[styles.optionText, { color: theme.primaryText }]}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.optionRowLast, { borderBottomColor: theme.divider }]}
            onPress={() => Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive' }
            ])}
          >
            <Text style={[styles.optionText, { color: '#FF3B30' }]}>Sign Out</Text>
          </TouchableOpacity>
          </View>
        </View>
        
        {/* App Info Section */}
        <View style={[styles.section, { backgroundColor: isDarkMode ? theme.altCardBackground : '#FFFFFF' }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>About</Text>
          
          <View style={[styles.optionsContainer, { borderTopColor: theme.divider }]}>
          <TouchableOpacity 
            style={[styles.optionRowLast, { borderBottomColor: theme.divider }]}
            onPress={() => Alert.alert('Version', 'NiceCup v1.0.0')}
          >
            <Text style={[styles.optionText, { color: theme.primaryText }]}>Version</Text>
            <Text style={[styles.versionText, { color: theme.secondaryText }]}>1.0.0</Text>
          </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 8,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
    // elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionsContainer: {
    borderTopWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  optionRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 16,
    color: '#000000',
  },
  versionText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000000',
  },
}); 