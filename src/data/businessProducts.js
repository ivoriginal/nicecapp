/**
 * Business-specific products catalog
 * This file contains references to products that businesses sell,
 * without duplicating the core product data which is stored in mockCoffees.json
 */

// Business coffee product catalogs - references to coffees in mockCoffees.json
export const businessCoffees = {
  // Vértigo y Calambre coffee shop inventory
  "user2": [
    {
      coffeeId: "coffee-refisa-g1",
      price: 12.90,
      inStock: true,
      featured: true
    },
    {
      coffeeId: "coffee-titus-a",
      price: 13.50,
      inStock: true,
      featured: false
    },
    {
      coffeeId: "coffee-la-primavera",
      price: 12.50,
      inStock: true,
      featured: true
    },
    {
      coffeeId: "coffee-sueno-decaf",
      price: 14.90,
      inStock: true,
      featured: false
    },
    {
      coffeeId: "coffee-benti-nenka",
      price: 19.50,
      inStock: true,
      featured: true
    }
  ],
  
  // Kima Coffee roastery inventory
  "business-kima": [
    {
      coffeeId: "coffee-kirunga",
      price: 12.50,  // Direct from roaster price
      inStock: true,
      featured: true
    }
  ],
  
  // Toma Café roastery inventory
  "business-toma": [
    {
      coffeeId: "coffee-refisa-g1",
      price: 15.50,  // Direct from roaster price
      inStock: true,
      featured: true
    },
    {
      coffeeId: "coffee-titus-a",
      price: 13.50,
      inStock: true,
      featured: true
    },
    {
      coffeeId: "coffee-la-primavera",
      price: 12.50,
      inStock: true,
      featured: false
    },
    {
      coffeeId: "coffee-sueno-decaf",
      price: 14.90,
      inStock: true,
      featured: false
    },
    {
      coffeeId: "coffee-benti-nenka",
      price: 19.50,
      inStock: true,
      featured: true
    }
  ]
};

// Export additional business product types as needed
// export const businessGear = { ... };
// export const businessMerch = { ... }; 