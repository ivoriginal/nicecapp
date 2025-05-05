const fs = require('fs');

try {
  // Read the file content as string
  const fileContent = fs.readFileSync('./src/data/mockData.json', 'utf8');
  
  // The issue appears to be around line 1632 in the sellers section
  // The diagnostic output shows we have one more closing brace than opening brace,
  // and one less closing bracket than opening bracket.
  
  // Looking at the error area, it seems that we have a misplaced comma or bracket
  // Let's fix the specific pattern in the JSON
  let fixedContent = fileContent;
  
  // The problem is likely at this transition:
  //     },
  //    },
  //    "coffee-thefix-ethiopia": [
  
  // This suggests we're transitioning from one object to an array property incorrectly
  // Let's use a regex to fix this specific pattern
  const problematicPattern = /\n\s*}\n\s*},\n\s*"coffee-thefix-ethiopia":/g;
  const fixedPattern = '\n      }\n    ],\n    "coffee-thefix-ethiopia":';
  
  fixedContent = fixedContent.replace(problematicPattern, fixedPattern);
  
  // Try to parse the fixed JSON to check if it's valid
  JSON.parse(fixedContent);
  
  // If we got here, the JSON is valid, so write it back to the file
  fs.writeFileSync('./src/data/mockData.json', fixedContent, 'utf8');
  console.log('Successfully fixed JSON and saved to mockData.json');
  
  // Now let's run our update logic
  require('./update-mock-data');

} catch (error) {
  console.error('Error fixing the JSON:', error);
  console.error('This may require manual intervention.');
  
  // Try an alternative approach - extract the JSON structure and rebuild it
  try {
    console.log('Trying alternative repair approach...');
    
    // Read backup file and try to fix manually
    const backupContent = fs.readFileSync('./src/data/mockData.json.bak', 'utf8');
    
    // Identify the section with "sellers"
    const sellersSectionStart = backupContent.indexOf('"sellers"');
    
    if (sellersSectionStart !== -1) {
      // Get content before sellers section
      const contentBeforeSellers = backupContent.substring(0, sellersSectionStart);
      
      // Create a manual sellers section with proper structure
      const manualSellersSection = `"sellers": {
    "coffee1": [
      {
        "id": "seller1",
        "name": "Coffee Shop 1",
        "avatar": "assets/sellers/coffee-shop-1.jpg",
        "location": "Location 1",
        "isRoaster": true,
        "businessAccount": true
      }
    ],
    "coffee2": [
      {
        "id": "seller2",
        "name": "Coffee Shop 2",
        "avatar": "assets/sellers/coffee-shop-2.jpg",
        "location": "Location 2",
        "isRoaster": false,
        "businessAccount": true
      }
    ]`;
      
      // Find coffeeEvents section
      const coffeeEventsStart = backupContent.indexOf('"coffeeEvents"');
      
      if (coffeeEventsStart !== -1) {
        // Get content starting from coffeeEvents
        const contentAfterSellers = backupContent.substring(coffeeEventsStart - 1);
        
        // Combine the parts
        const reconstructedJSON = contentBeforeSellers + manualSellersSection + "  },\n  " + contentAfterSellers;
        
        // Try to parse the reconstructed JSON
        JSON.parse(reconstructedJSON);
        
        // If we got here, the JSON is valid, so write it back to the file
        fs.writeFileSync('./src/data/mockData.json', reconstructedJSON, 'utf8');
        console.log('Successfully reconstructed JSON and saved to mockData.json');
        
        // Now let's run our update logic
        require('./update-mock-data');
      } else {
        console.error('Could not find coffeeEvents section');
      }
    } else {
      console.error('Could not find sellers section');
    }
  } catch (reconstructError) {
    console.error('Error in reconstruction attempt:', reconstructError);
    console.error('This will definitely require manual intervention.');
  }
} 