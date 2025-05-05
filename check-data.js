const fs = require('fs');

// Read the updated mockData.json
const data = JSON.parse(fs.readFileSync('./src/data/mockData.json', 'utf8'));

// Check if Elias Veris was added
const eliasUser = data.users.find(u => u.id === 'user-elias');
console.log('Elias Veris added:', !!eliasUser);
if (eliasUser) {
  console.log('Elias Veris data:', {
    userName: eliasUser.userName,
    location: eliasUser.location,
    gear: eliasUser.gear
  });
}

// Check if The Fix was added
const theFix = data.businesses.find(b => b.id === 'business-thefix');
console.log('\nThe Fix added:', !!theFix);
if (theFix) {
  console.log('The Fix data:', {
    name: theFix.name,
    location: theFix.location,
    type: theFix.type
  });
}

// Check if The Fix coffees were added
const theFixCoffees = data.coffees.filter(c => c.roaster === 'The Fix');
console.log('\nThe Fix coffees added:', theFixCoffees.length);
if (theFixCoffees.length > 0) {
  console.log('First coffee:', {
    name: theFixCoffees[0].name,
    origin: theFixCoffees[0].origin,
    price: theFixCoffees[0].price
  });
}

// Check if 9Barista was updated
const nineBarista = data.gear.find(g => g.id === 'gear10');
console.log('\n9Barista updated:', !!nineBarista);
if (nineBarista) {
  console.log('9Barista data:', {
    name: nineBarista.name,
    imageUrl: nineBarista.imageUrl
  });
}

// Check if Fellow Stagg EKG was updated
const fellowStagg = data.gear.find(g => g.id === 'gear1');
console.log('\nFellow Stagg EKG updated:', !!fellowStagg);
if (fellowStagg) {
  console.log('Fellow Stagg EKG data:', {
    name: fellowStagg.name,
    price: fellowStagg.price,
    imageUrl: fellowStagg.imageUrl,
    features: fellowStagg.features ? fellowStagg.features.length : 0
  });
}

// Check Ivo's wishlist
const ivoUser = data.users.find(u => u.id === 'user1');
console.log('\nIvo Vilches wishlist updated:', !!ivoUser);
if (ivoUser) {
  console.log('Ivo\'s wishlist:', ivoUser.gearWishlist);
} 