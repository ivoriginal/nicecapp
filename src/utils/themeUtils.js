import { Appearance } from 'react-native';

/**
 * Force a specific color scheme for testing purposes
 * @param {string} scheme - 'light', 'dark', or null to reset to system default
 */
export const setColorScheme = (scheme) => {
  // This is only for testing and debugging
  if (scheme) {
    console.log(`Forcing color scheme to: ${scheme}`);
    Appearance.setColorScheme(scheme);
  } else {
    console.log('Resetting to system color scheme');
    Appearance.setColorScheme(null);
  }
};

/**
 * Toggle between light and dark themes for testing
 */
export const toggleTestColorScheme = () => {
  const currentScheme = Appearance.getColorScheme();
  setColorScheme(currentScheme === 'dark' ? 'light' : 'dark');
}; 