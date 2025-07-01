import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from './context/UserContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Import your main navigation component
// Assuming you have a file like this - adjust as needed for your app structure
import AppNavigator from './navigation/AppNavigator';

// The main app component that wraps everything with providers
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Separate component to use the theme hook
function AppContent() {
  const { theme, isDarkMode } = useTheme();
  
  // Use React Navigation's built-in themes
  const navigationTheme = isDarkMode ? DarkTheme : DefaultTheme;
  
  return (
    <UserProvider>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <AppNavigator />
      </NavigationContainer>
    </UserProvider>
  );
} 