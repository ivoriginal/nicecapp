import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { lightTheme, darkTheme } from '../constants/theme';

// Create context
const ThemeContext = createContext({
  theme: lightTheme,
  isDarkMode: false,
  toggleTheme: () => {},
  themeMode: 'auto',
  setThemeMode: () => {},
});

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Get device color scheme
  const colorScheme = useColorScheme();
  
  // Add theme mode state: 'light', 'dark', or 'auto'
  const [themeMode, setThemeMode] = useState('auto');
  
  // Initialize isDarkMode state based on theme mode and device settings
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (themeMode === 'auto') {
      return colorScheme === 'dark';
    }
    return themeMode === 'dark';
  });
  
  // Update theme when device theme changes or theme mode changes
  useEffect(() => {
    if (themeMode === 'auto') {
      console.log('Auto theme mode - using device setting:', colorScheme);
      setIsDarkMode(colorScheme === 'dark');
    } else {
      console.log('Manual theme mode set to:', themeMode);
      setIsDarkMode(themeMode === 'dark');
    }
  }, [colorScheme, themeMode]);
  
  // Update theme when device theme changes via Appearance API
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      console.log('Device theme changed via Appearance API to:', newColorScheme);
      if (themeMode === 'auto') {
        setIsDarkMode(newColorScheme === 'dark');
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, [themeMode]);
  
  // Get the current theme object
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  // Function to manually toggle theme (for backward compatibility) - memoized to prevent re-renders
  const toggleTheme = useCallback(() => {
    if (themeMode === 'auto') {
      // If in auto mode, switch to the opposite of the current theme
      setThemeMode(isDarkMode ? 'light' : 'dark');
    } else {
      // If already in a manual mode, just toggle between light and dark
      setThemeMode(prevMode => prevMode === 'dark' ? 'light' : 'dark');
    }
  }, [themeMode, isDarkMode]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    theme,
    isDarkMode,
    toggleTheme,
    themeMode,
    setThemeMode
  }), [theme, isDarkMode, toggleTheme, themeMode, setThemeMode]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme
export const useTheme = () => useContext(ThemeContext); 