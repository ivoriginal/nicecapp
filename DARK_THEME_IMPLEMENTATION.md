# Dark Theme Implementation Guide

This guide explains how to implement dark theme support in the app, which automatically adapts to device settings.

## Overview

The implementation consists of:

1. **ThemeContext**: A React context that provides theme values based on device settings
2. **Theme Colors**: Light and dark theme color schemes defined in theme.js
3. **Theme-Aware Components**: Components that use the theme values from context

## Files Created/Modified

- `src/context/ThemeContext.js`: New context provider for theme
- `src/constants/theme.js`: Updated with light and dark theme values
- `src/components/ThemeAwareCoffeeLogCard.js`: Example of a theme-aware component
- `src/App.js`: Updated to include ThemeProvider

## How to Update Components for Dark Theme

1. Import the `useTheme` hook:

   ```javascript
   import { useTheme } from "../context/ThemeContext";
   ```

2. Access the current theme inside your component:

   ```javascript
   const { theme } = useTheme();
   ```

3. Create dynamic styles based on theme (two approaches):

   **Approach 1: Dynamic style function**

   ```javascript
   // Create styles as a function that takes theme
   const createStyles = (theme) =>
     StyleSheet.create({
       container: {
         backgroundColor: theme.cardBackground,
         borderBottomColor: theme.divider,
       },
       text: {
         color: theme.primaryText,
       },
     });

   // In your component:
   const dynamicStyles = createStyles(theme);
   ```

   **Approach 2: Inline theme values**

   ```javascript
   // Traditional static StyleSheet
   const styles = StyleSheet.create({
     container: {
       // other properties
     },
     text: {
       fontSize: 16,
       fontWeight: "600",
     },
   });

   // In your component JSX:
   <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
     <Text style={[styles.text, { color: theme.primaryText }]}>Hello</Text>
   </View>;
   ```

4. Update icon colors to use the theme:
   ```javascript
   <Ionicons name="cafe" size={16} color={theme.iconColor} />
   ```

## Theme Color Reference

### Light Theme Colors

- background: '#FFFFFF' (Main background)
- cardBackground: '#FFFFFF' (Card backgrounds)
- recipeContainer: '#F5F5F5' (Recipe containers)
- primaryText: '#000000' (Main text)
- secondaryText: '#666666' (Secondary text)
- border: '#E5E5EA' (Borders)
- divider: '#E5E5EA' (Dividers)

### Dark Theme Colors

- background: '#000000' (Main background)
- cardBackground: '#1C1C1E' (Card backgrounds)
- recipeContainer: '#2C2C2E' (Recipe containers)
- primaryText: '#FFFFFF' (Main text)
- secondaryText: '#BBBBBB' (Secondary text)
- border: '#38383A' (Borders)
- divider: '#2C2C2E' (Dividers)

## Automatic Theme Switching

The ThemeContext automatically detects device theme settings using React Native's `useColorScheme` hook and updates the app accordingly. No manual refresh is needed when the user changes their device theme.

## Testing

To test the dark theme:

- iOS: Go to Settings → Display & Brightness → Switch to Dark mode
- Android: Go to Settings → Display → Switch to Dark theme

The app should automatically adapt to the selected theme.
