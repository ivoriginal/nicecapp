import AsyncStorage from '@react-native-async-storage/async-storage';

const GEAR_VIEW_COUNTS_KEY = 'gear_view_counts';
const NEW_GEAR_THRESHOLD = 3; // Show "NEW" badge until 3rd view

/**
 * Get the view count for a specific gear item
 * @param {string} gearId - The ID of the gear item
 * @returns {Promise<number>} The number of times this gear has been viewed
 */
export const getGearViewCount = async (gearId) => {
  try {
    const viewCountsString = await AsyncStorage.getItem(GEAR_VIEW_COUNTS_KEY);
    const viewCounts = viewCountsString ? JSON.parse(viewCountsString) : {};
    return viewCounts[gearId] || 0;
  } catch (error) {
    console.error('Error getting gear view count:', error);
    return 0;
  }
};

/**
 * Increment the view count for a specific gear item
 * @param {string} gearId - The ID of the gear item
 * @returns {Promise<void>}
 */
export const incrementGearViewCount = async (gearId) => {
  try {
    const viewCountsString = await AsyncStorage.getItem(GEAR_VIEW_COUNTS_KEY);
    const viewCounts = viewCountsString ? JSON.parse(viewCountsString) : {};
    
    // Increment the count for this gear
    viewCounts[gearId] = (viewCounts[gearId] || 0) + 1;
    
    // Save back to storage
    await AsyncStorage.setItem(GEAR_VIEW_COUNTS_KEY, JSON.stringify(viewCounts));
    
    console.log(`Gear ${gearId} view count incremented to ${viewCounts[gearId]}`);
  } catch (error) {
    console.error('Error incrementing gear view count:', error);
  }
};

/**
 * Check if a gear item should show the "NEW" badge
 * @param {string} gearId - The ID of the gear item
 * @returns {Promise<boolean>} True if the badge should be shown
 */
export const shouldShowNewBadge = async (gearId) => {
  try {
    const viewCount = await getGearViewCount(gearId);
    return viewCount < NEW_GEAR_THRESHOLD;
  } catch (error) {
    console.error('Error checking if should show new badge:', error);
    return false;
  }
};

/**
 * Get the current view count for a gear item (for debugging)
 * @param {string} gearId - The ID of the gear item
 * @returns {Promise<number>} The current view count
 */
export const getCurrentViewCount = async (gearId) => {
  return await getGearViewCount(gearId);
};

/**
 * Reset view counts for all gear (for testing purposes)
 * @returns {Promise<void>}
 */
export const resetAllGearViewCounts = async () => {
  try {
    await AsyncStorage.removeItem(GEAR_VIEW_COUNTS_KEY);
    console.log('All gear view counts reset');
  } catch (error) {
    console.error('Error resetting gear view counts:', error);
  }
};