import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

/**
 * Configure the navigation bar appearance
 * @param {string} backgroundColor - The background color in hex format (e.g., '#ffffff')
 * @param {string} buttonStyle - The button style: 'light' or 'dark'
 */
export const configureNavigationBar = async (backgroundColor = '#ffffff', buttonStyle = 'dark') => {
  if (Platform.OS !== 'android') return;
  
  try {
    // Set the background color
    await NavigationBar.setBackgroundColorAsync(backgroundColor);
    
    // Set the button style (light or dark)
    await NavigationBar.setButtonStyleAsync(buttonStyle);
    
    // Set the behavior to 'inset-touch' for better user experience
    await NavigationBar.setBehaviorAsync('inset-touch');
    
    console.log('Navigation bar configured successfully');
  } catch (error) {
    console.error('Error configuring navigation bar:', error);
  }
};

/**
 * Get the current navigation bar configuration
 */
export const getNavigationBarConfig = async () => {
  if (Platform.OS !== 'android') return null;
  
  try {
    const backgroundColor = await NavigationBar.getBackgroundColorAsync();
    const buttonStyle = await NavigationBar.getButtonStyleAsync();
    const behavior = await NavigationBar.getBehaviorAsync();
    
    return { backgroundColor, buttonStyle, behavior };
  } catch (error) {
    console.error('Error getting navigation bar config:', error);
    return null;
  }
}; 