const mockGear = require('./src/data/mockGear.json');
const gearDetails = require('./src/data/gearDetails.js').default;

console.log('=== Testing getGearImage function ===');
const getGearImage = (gearName) => {
  if (!gearName) return null;
  
  // First try to find in mockGear.gear
  const mockGearItem = mockGear.gear.find(g => g.name === gearName);
  if (mockGearItem && mockGearItem.imageUrl) {
    return mockGearItem.imageUrl;
  }
  
  // Then check if it's in gearDetails
  const gearItem = gearDetails[gearName];
  if (gearItem && gearItem.image) {
    return gearItem.image;
  }
  
  // If we can't find an image, return null
  return null;
};

console.log('Looking for AeroPress...');
console.log('mockGear.gear length:', mockGear.gear.length);
console.log('Available gear names:', mockGear.gear.map(g => g.name));
console.log('AeroPress search result:', getGearImage('AeroPress'));
console.log('gearDetails keys:', Object.keys(gearDetails));

// Check if AeroPress exists in mockGear
const aeroPressItem = mockGear.gear.find(g => g.name === 'AeroPress');
console.log('AeroPress item found:', aeroPressItem); 