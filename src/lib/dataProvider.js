import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock data storage keys
const STORAGE_KEYS = {
  COFFEE_EVENTS: 'coffee_events',
  COLLECTION: 'collection',
  WISHLIST: 'wishlist',
  FAVORITES: 'favorites',
  USER: 'user'
};

// Helper function to generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Helper function to save a coffee event
export const saveCoffeeEvent = async (event) => {
  try {
    // Get existing events
    const eventsString = await AsyncStorage.getItem(STORAGE_KEYS.COFFEE_EVENTS);
    const events = eventsString ? JSON.parse(eventsString) : [];
    
    // Create a new event with an ID and timestamp
    const newEvent = {
      id: generateId(),
      ...event,
      timestamp: new Date().toISOString()
    };
    
    // Add to the events array
    events.unshift(newEvent);
    
    // Save back to storage
    await AsyncStorage.setItem(STORAGE_KEYS.COFFEE_EVENTS, JSON.stringify(events));
    
    return newEvent;
  } catch (error) {
    console.error('Error in saveCoffeeEvent:', error);
    throw error;
  }
};

// Helper function to get coffee events
export const getCoffeeEvents = async () => {
  try {
    const eventsString = await AsyncStorage.getItem(STORAGE_KEYS.COFFEE_EVENTS);
    return eventsString ? JSON.parse(eventsString) : [];
  } catch (error) {
    console.error('Error in getCoffeeEvents:', error);
    throw error;
  }
};

// Collection operations
export const saveToCollection = async (coffee) => {
  try {
    // Get existing collection
    const collectionString = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTION);
    const collection = collectionString ? JSON.parse(collectionString) : [];
    
    // Check if coffee already exists in collection
    const exists = collection.some(item => item.id === coffee.id);
    
    if (!exists) {
      // Add to collection
      collection.push({
        ...coffee,
        id: coffee.id || generateId()
      });
      
      // Save back to storage
      await AsyncStorage.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify(collection));
    }
    
    return coffee;
  } catch (error) {
    console.error('Error in saveToCollection:', error);
    throw error;
  }
};

export const getCollection = async () => {
  try {
    const collectionString = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTION);
    return collectionString ? JSON.parse(collectionString) : [];
  } catch (error) {
    console.error('Error in getCollection:', error);
    throw error;
  }
};

export const removeFromCollection = async (coffeeId) => {
  try {
    // Get existing collection
    const collectionString = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTION);
    let collection = collectionString ? JSON.parse(collectionString) : [];
    
    // Remove the coffee
    collection = collection.filter(item => item.id !== coffeeId);
    
    // Save back to storage
    await AsyncStorage.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify(collection));
  } catch (error) {
    console.error('Error in removeFromCollection:', error);
    throw error;
  }
};

// Wishlist operations
export const saveToWishlist = async (coffee) => {
  try {
    // Get existing wishlist
    const wishlistString = await AsyncStorage.getItem(STORAGE_KEYS.WISHLIST);
    const wishlist = wishlistString ? JSON.parse(wishlistString) : [];
    
    // Check if coffee already exists in wishlist
    const exists = wishlist.some(item => item.id === coffee.id);
    
    if (!exists) {
      // Add to wishlist
      wishlist.push({
        ...coffee,
        id: coffee.id || generateId()
      });
      
      // Save back to storage
      await AsyncStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
    }
    
    return coffee;
  } catch (error) {
    console.error('Error in saveToWishlist:', error);
    throw error;
  }
};

export const getWishlist = async () => {
  try {
    const wishlistString = await AsyncStorage.getItem(STORAGE_KEYS.WISHLIST);
    return wishlistString ? JSON.parse(wishlistString) : [];
  } catch (error) {
    console.error('Error in getWishlist:', error);
    throw error;
  }
};

export const removeFromWishlist = async (coffeeId) => {
  try {
    // Get existing wishlist
    const wishlistString = await AsyncStorage.getItem(STORAGE_KEYS.WISHLIST);
    let wishlist = wishlistString ? JSON.parse(wishlistString) : [];
    
    // Remove the coffee
    wishlist = wishlist.filter(item => item.id !== coffeeId);
    
    // Save back to storage
    await AsyncStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
  } catch (error) {
    console.error('Error in removeFromWishlist:', error);
    throw error;
  }
};

// Favorites operations
export const saveFavorites = async (favorites) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    return favorites;
  } catch (error) {
    console.error('Error in saveFavorites:', error);
    throw error;
  }
};

export const getFavorites = async () => {
  try {
    const favoritesString = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    return favoritesString ? JSON.parse(favoritesString) : [];
  } catch (error) {
    console.error('Error in getFavorites:', error);
    throw error;
  }
};

// Mock user functions
export const getUser = async () => {
  try {
    // For development: Return a fake user instead of checking auth
    return {
      email: 'mock.user@example.com',
      id: 'mock-user-id',
      name: 'Mock User'
    };
  } catch (error) {
    console.error('Error in getUser:', error);
    throw error;
  }
}; 