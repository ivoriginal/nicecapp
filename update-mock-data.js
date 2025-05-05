const fs = require('fs');

try {
  // Read the file content as string
  const fileContent = fs.readFileSync('./src/data/mockData.json', 'utf8');
  
  // Parse the content to object
  const mockData = JSON.parse(fileContent);
  
  // Remove duplicate Elias Veris (keeping only one)
  const uniqueUsers = mockData.users.filter((user, index, self) => 
    index === self.findIndex(u => u.id === user.id)
  );
  mockData.users = uniqueUsers;
  
  // Ensure Elias Veris has the correct avatar path and ID format
  const eliasUser = mockData.users.find(u => u.id === 'user-elias');
  if (eliasUser) {
    // Update the ID to be consistent with other users
    eliasUser.id = 'user11';
    eliasUser.userAvatar = 'assets/users/elias-veris.jpg';
    
    // Update all references to user-elias in the data
    // Update in coffee events
    mockData.coffeeEvents.forEach(event => {
      if (event.userId === 'user-elias') {
        event.userId = 'user11';
      }
    });
    
    // Update in sellers
    for (const coffeeId in mockData.sellers) {
      if (mockData.sellers[coffeeId]) {
        mockData.sellers[coffeeId].forEach(seller => {
          if (seller.id === 'user-elias') {
            seller.id = 'user11';
          }
        });
      }
    }
  }
  
  // Remove duplicate The Fix entries in trendingCafes
  const uniqueTrendingCafes = mockData.trendingCafes.filter((cafe, index, self) => 
    index === self.findIndex(c => c.id === cafe.id)
  );
  mockData.trendingCafes = uniqueTrendingCafes;
  
  // Fix the empty "Good Cafés" section by ensuring some cafes have isGoodCafe = true
  mockData.trendingCafes.forEach(cafe => {
    // For specific cafes or randomly add the isGoodCafe flag
    if (['toma-cafe-1', 'toma-cafe-2', 'toma-cafe-3', 'kima-coffee', 'thefix-madrid'].includes(cafe.id)) {
      cafe.isGoodCafe = true;
    }
    
    // Set some cafes as trending
    if (['kima-coffee', 'thefix-madrid'].includes(cafe.id)) {
      cafe.isTrending = true;
    }
  });
  
  // Fix the empty "Recipes for you" section by adding isTrending flag to recipes
  if (mockData.recipes && mockData.recipes.length > 0) {
    mockData.recipes.forEach(recipe => {
      recipe.isTrending = true;
      recipe.type = 'recipe'; // Ensure type is set for proper rendering
    });
  }
  
  // Fix the empty "People You Might Know" section
  if (mockData.suggestedUsers) {
    // Make sure all users have the necessary fields for display
    mockData.suggestedUsers.forEach(user => {
      user.type = 'user'; // Ensure type is set for proper rendering
    });
    
    // If suggestedUsers is empty or has less than 3 entries, add some users from the main users array
    if (mockData.suggestedUsers.length < 3) {
      const additionalUsers = mockData.users
        .filter(user => !mockData.suggestedUsers.some(su => su.id === user.id))
        .slice(0, 5 - mockData.suggestedUsers.length)
        .map(user => ({
          id: user.id,
          userName: user.userName,
          userAvatar: user.userAvatar || user.avatar,
          bio: user.bio || "Coffee enthusiast",
          location: user.location || "Unknown",
          mutualFriends: Math.floor(Math.random() * 5) + 1,
          type: 'user'
        }));
      
      mockData.suggestedUsers = [...mockData.suggestedUsers, ...additionalUsers];
    }
  }
  
  // Remove duplicate coffees from The Fix
  const uniqueCoffees = mockData.coffees.filter((coffee, index, self) => 
    index === self.findIndex(c => c.id === coffee.id)
  );
  mockData.coffees = uniqueCoffees;
  
  // Remove duplicate businesses (The Fix appears twice)
  const uniqueBusinesses = mockData.businesses.filter((business, index, self) => 
    index === self.findIndex(b => b.id === business.id)
  );
  mockData.businesses = uniqueBusinesses;
  
  // Remove duplicate coffee events
  const uniqueCoffeeEvents = mockData.coffeeEvents.filter((event, index, self) => 
    index === self.findIndex(e => e.id === event.id)
  );
  mockData.coffeeEvents = uniqueCoffeeEvents;
  
  // Write the updated mockData back to the file
  fs.writeFileSync('./src/data/mockData.json', JSON.stringify(mockData, null, 2), 'utf8');
  console.log('Successfully fixed duplicates and updated data for all sections in mockData.json');
  
} catch (error) {
  console.error('Error processing mockData.json:', error);
} 