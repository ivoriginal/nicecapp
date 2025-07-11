import { resetAllGearViewCounts, getCurrentViewCount } from './gearBadgeManager';

/**
 * Test utility for the NEW badge functionality
 * This can be called from the console or a debug screen
 */

// Reset all gear view counts (useful for testing)
export const testResetAllGearViewCounts = async () => {
  console.log('🧪 Testing: Resetting all gear view counts...');
  await resetAllGearViewCounts();
  console.log('✅ All gear view counts reset successfully');
};

// Check view count for a specific gear item
export const testGetGearViewCount = async (gearId) => {
  console.log(`🧪 Testing: Getting view count for gear ${gearId}...`);
  const count = await getCurrentViewCount(gearId);
  console.log(`✅ Gear ${gearId} has been viewed ${count} times`);
  return count;
};

// Test function to simulate viewing a gear item multiple times
export const testSimulateGearViews = async (gearId, times = 1) => {
  console.log(`🧪 Testing: Simulating ${times} view(s) for gear ${gearId}...`);
  
  for (let i = 0; i < times; i++) {
    const { incrementGearViewCount } = await import('./gearBadgeManager');
    await incrementGearViewCount(gearId);
    console.log(`✅ Incremented view count for gear ${gearId} (view ${i + 1}/${times})`);
  }
  
  const finalCount = await getCurrentViewCount(gearId);
  console.log(`✅ Final view count for gear ${gearId}: ${finalCount}`);
  return finalCount;
};

// Export all test functions for easy access
export const gearBadgeTests = {
  resetAll: testResetAllGearViewCounts,
  getCount: testGetGearViewCount,
  simulateViews: testSimulateGearViews,
};

// Make functions available globally for console testing
if (typeof global !== 'undefined') {
  global.testGearBadge = gearBadgeTests;
}