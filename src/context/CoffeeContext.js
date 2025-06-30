import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { 
  saveCoffeeEvent, 
  getCoffeeEvents, 
  saveToCollection, 
  removeFromCollection,
  getCollection,
  saveToWishlist,
  removeFromWishlist,
  getWishlist,
  saveFavorites,
  getFavorites
} from '../lib/dataProvider';
import mockEvents from '../data/mockEvents.json';
import mockUsers from '../data/mockUsers.json';
import mockCoffees from '../data/mockCoffees.json';
import mockCoffeesData from '../data/mockCoffees.json';
import mockRecipes from '../data/mockRecipes.json';

// Create the context with a default value
const CoffeeContext = createContext({
  coffeeEvents: [],
  coffeeCollection: [],
  coffeeWishlist: [],
  favorites: [],
  recipes: [],
  isLoading: true,
  isAuthenticated: false, // Default to false until authenticated
  currentAccount: null,
  accounts: [],
  following: [], // Add following
  followers: [], // Add followers
  allEvents: [], // Add all events from all users
  addCoffeeEvent: () => {},
  removeCoffeeEvent: () => {},
  hideEvent: () => {},
  unhideEvent: () => {},
  isEventHidden: () => false,
  addToCollection: () => {},
  removeFromCollection: () => {},
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  toggleFavorite: () => {},
  setCoffeeCollection: () => {},
  setCoffeeWishlist: () => {},
  loadData: () => {},
  getRecipesForCoffee: () => [],
  addRecipe: () => {},
  switchAccount: () => {},
  signIn: () => {},
  signOut: () => {}
});

export const CoffeeProvider = ({ children }) => {
  // State
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [coffeeEvents, setCoffeeEvents] = useState([]);
  const [coffeeCollection, setCoffeeCollection] = useState([]);
  const [coffeeWishlist, setCoffeeWishlist] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [hiddenEvents, setHiddenEvents] = useState(new Set());
  const [currentAccount, setCurrentAccount] = useState(null); // Will be set after authentication
  const [allEvents, setAllEvents] = useState([]); // All events from all users
  const [following, setFollowing] = useState([]); // Users that the current user follows
  const [followers, setFollowers] = useState([]); // Users that follow the current user
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accounts] = useState([
    { id: 'user1', userName: 'Ivo Vilches', userAvatar: require('../../assets/users/ivo-vilches.jpg'), email: 'ivo.vilches@example.com' },
    { id: 'user2', userName: 'Vértigo y Calambre', userAvatar: require('../../assets/businesses/vertigo-logo.jpg'), email: 'contacto@vertigoycalambre.com' },
    { id: 'user3', userName: 'Carlos Hernández', userAvatar: require('../../assets/users/carlos-hernandez.jpg'), email: 'carlos.hernandez@example.com' }
  ]);
  
  // Initialize on mount
  useEffect(() => {
    console.log('CoffeeContext initializing...');
    console.log('Initial authentication state:', isAuthenticated);
    console.log('Initial current account:', currentAccount);
    
    // Auto-sign in for development purposes
    if (!isAuthenticated && !currentAccount) {
      console.log('Auto-signing in as user1 for development...');
      const autoSignIn = async () => {
        try {
          await signIn('user1');
        } catch (error) {
          console.error('Auto sign-in failed:', error);
          setLoading(false);
        }
      };
      setTimeout(autoSignIn, 1000);
    } else {
      setLoading(false);
    }
  }, []);

  // Load data for a specific account - memoized to prevent re-renders
  const loadData = useCallback(async (specificAccount = null) => {
    try {
      const accountToLoad = specificAccount || currentAccount;
      
      // Check if we have a valid account to load data for
      if (!accountToLoad) {
        console.log('No account specified for loadData, skipping...');
        return;
      }
      
      console.log('Loading data for account:', accountToLoad);
      
      // Prevent duplicate loading (to avoid infinite loops)
      if (loading && initialized) {
        console.log('Already loading data, skipping duplicate load');
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // Initialize gear data variables
      let gearData = [];
      let gearWishlistData = [];
      
      // Get gear data from mockUsers.json to ensure it's available
      const mockUserData = mockUsers.users.find(u => u.id === accountToLoad);
      if (mockUserData) {
        console.log(`Found mockUserData for ${accountToLoad} with gear:`, mockUserData.gear);
        gearData = mockUserData.gear || [];
        gearWishlistData = mockUserData.gearWishlist || [];
      }
      
      // Set user data from accounts list
      const userData = accounts.find(acc => acc.id === accountToLoad);
      if (userData) {
        console.log('Found user data:', userData);
        setUser(userData);
      } else {
        console.error('User data not found for account ID:', accountToLoad);
        setError('User data not found');
        return;
      }
      
      // Define our local account data structure
      const accountData = {
        'user1': { coffeeEvents: [], coffeeCollection: [], coffeeWishlist: [], favorites: [], recipes: [] },
        'user2': { coffeeEvents: [], coffeeCollection: [], coffeeWishlist: [], favorites: [], recipes: [] },
        'user3': { coffeeEvents: [], coffeeCollection: [], coffeeWishlist: [], favorites: [], recipes: [] }
      };
      
      // IMPORTANT: Collect all events for social feed - do this BEFORE loading account-specific data
      let allUserEvents = [];
      
      // Load events from mockEvents.json if available
      if (mockEvents.coffeeEvents && Array.isArray(mockEvents.coffeeEvents)) {
        console.log(`Adding ${mockEvents.coffeeEvents.length} events from mockEvents.json`);
        
        // Filter out any events without coffee data
        const validCoffeeEvents = mockEvents.coffeeEvents.filter(
          event => event.coffeeId && event.coffeeName && !event.type
        );
        
        allUserEvents = [...mockEvents.coffeeEvents];
        
        // We're now only using mockEvents.coffeeEvents for all event data
      }
      
      // Only add events from accountData if we want to supplement split files
      // This can be removed once the migration to split files is complete
      else {
        // Create an empty accountData object if it doesn't exist
        const accountData = {
          'user1': {
            coffeeEvents: [],
            coffeeCollection: [],
            coffeeWishlist: [],
            favorites: [],
            recipes: []
          }
        };
        
        for (const acct in accountData) {
          if (accountData[acct]?.coffeeEvents && Array.isArray(accountData[acct].coffeeEvents)) {
            console.log(`Adding ${accountData[acct].coffeeEvents.length} events from ${acct}`);
            // Make sure each event has all required data
            const eventsWithUserInfo = accountData[acct].coffeeEvents.map(event => {
              // Ensure each event has proper user info
              if (!event.userName || !event.userAvatar) {
                const accountInfo = accounts.find(a => a.id === acct);
                return {
                  ...event,
                  userName: event.userName || accountInfo?.userName || 'Unknown User',
                  userAvatar: event.userAvatar || accountInfo?.userAvatar || null,
                };
              }
              return event;
            });
            allUserEvents = [...allUserEvents, ...eventsWithUserInfo];
          }
        }
      }
      
      // Sort by date (newest first)
      allUserEvents.sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp));
      
      // Filter out events from user3 (Carlos Hernández) as he should have no activity
      const filteredEvents = allUserEvents.filter(event => event.userId !== 'user3');
      
      console.log('FINAL - Setting allEvents with length:', filteredEvents.length);
      console.log('Events preview:', filteredEvents.slice(0, 3).map(e => ({ id: e.id, user: e.userName })));
      setAllEvents(filteredEvents);
      
      // Extract unique coffeeIds from user events to add to their collection
      const userEvents = filteredEvents.filter(event => event.userId === accountToLoad && event.coffeeId && event.coffeeName);
      console.log(`Found ${userEvents.length} events for user ${accountToLoad} to potentially add to collection`);
      
      // Create collection items from coffee logs
      const collectionItemsFromLogs = userEvents.map(event => ({
        id: event.coffeeId,
        name: event.coffeeName,
        roaster: event.roaster || '',
        image: event.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
        userId: accountToLoad
      }));
      
      // Get existing collection
      const existingCollection = accountData[accountToLoad]?.coffeeCollection || [];
      
      // Combine existing collection with items from logs, avoiding duplicates
      const existingIds = new Set(existingCollection.map(item => item.id));
      const newItems = collectionItemsFromLogs.filter(item => !existingIds.has(item.id));
      
      // Create combined collection
      const combinedCollection = [...existingCollection, ...newItems];
      console.log(`Added ${newItems.length} items to collection from logs`);
      
      // Set current user's data
      const userOwnEvents = allUserEvents.filter(event => event.userId === accountToLoad);
      console.log(`Setting ${userOwnEvents.length} events for user ${accountToLoad}'s own activity tab`);
      setCoffeeEvents(userOwnEvents);
      setCoffeeCollection(combinedCollection);
      setCoffeeWishlist(accountData[accountToLoad]?.coffeeWishlist || []);
      setFavorites(accountData[accountToLoad]?.favorites || []);
      setRecipes(accountData[accountToLoad]?.recipes || []);
      
      // Update accountData with the new collection
      if (accountData[accountToLoad]) {
        accountData[accountToLoad].coffeeCollection = combinedCollection;
      }
      
      // Load saved recipes from mockUsers and mockRecipes (after setting initial data)
      loadSavedRecipes();
      
      // Set following and followers - for the social feed, everyone follows everyone
      const otherUsers = accounts.filter(acc => acc.id !== accountToLoad);
      setFollowing(otherUsers);
      setFollowers(otherUsers);
      
      console.log('CoffeeContext - Data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setInitialized(true);
      console.log('CoffeeContext - Loading complete, loading set to false');
    }
  }, [currentAccount, accounts, loading, initialized]);

  // Load saved recipes from mockUsers and mockRecipes
  const loadSavedRecipes = () => {
    try {
      console.log("=== Loading saved recipes ===");
      console.log("Current account:", currentAccount);
      // Get the current user's saved recipes
      const currentUser = mockUsers.users.find(user => user.id === currentAccount);
      if (!currentUser || !currentUser.savedRecipes) {
        console.log(`No saved recipes found for ${currentAccount}`);
        return;
      }
      
      console.log(`Found ${currentUser.savedRecipes.length} saved recipe IDs for ${currentAccount}:`, currentUser.savedRecipes);
      
      // Get the recipes that match the IDs in currentUser.savedRecipes
      const userSavedRecipes = mockRecipes.recipes.filter(recipe => 
        currentUser.savedRecipes.includes(recipe.id)
      );
      
      console.log(`Found ${userSavedRecipes.length} matching recipes`);
      
      // Mark these recipes as saved
      const updatedRecipes = [...mockRecipes.recipes];
      updatedRecipes.forEach(recipe => {
        recipe.isSaved = currentUser.savedRecipes.includes(recipe.id);
      });
      
      console.log("Setting recipes with isSaved flags:", updatedRecipes.filter(r => r.isSaved).map(r => ({id: r.id, name: r.name, isSaved: r.isSaved})));
      setRecipes(updatedRecipes);
      
      // Also update coffeeWishlist from user's saved coffees
      if (currentUser.savedCoffees && Array.isArray(currentUser.savedCoffees)) {
        // Check if savedCoffees contains objects or just IDs
        const savedCoffees = currentUser.savedCoffees[0]?.id ? 
          // If it contains objects, use them directly
          currentUser.savedCoffees :
          // If it contains IDs, filter from mockCoffees
          mockCoffees.coffees.filter(coffee => 
            currentUser.savedCoffees.includes(coffee.id)
          );
        
        console.log(`Found ${savedCoffees.length} saved coffees for ${currentAccount}`);
        setCoffeeWishlist(savedCoffees);
      }
    } catch (error) {
      console.error("Error loading saved recipes:", error);
    }
  };

  // Generate mock coffee events - now using mockCoffees.json as the source
  const generateMockEvents = (userId, count = 5) => {
    // Extract the coffees from mockCoffees
    const coffees = mockCoffees.coffees;
    
    // Set up brewing methods and grind sizes
    const methods = ['Pour Over', 'Espresso', 'French Press', 'AeroPress', 'Cold Brew'];
    const grindSizes = ['Fine', 'Medium', 'Coarse'];
    
    // Generate events using coffees from mockCoffees
    return Array(count).fill(null).map((_, index) => {
      const coffeeIndex = index % coffees.length;
      const coffee = coffees[coffeeIndex];
      return {
        id: `event-${userId}-${index}`,
        coffeeId: coffee.id,
        coffeeName: coffee.name,
        roaster: coffee.roaster,
        imageUrl: coffee.image || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
        rating: Math.floor(Math.random() * 5) + 1,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        brewingMethod: methods[Math.floor(Math.random() * methods.length)],
        grindSize: grindSizes[Math.floor(Math.random() * grindSizes.length)],
        notes: coffee.description || 'A delicious cup of coffee with notes of chocolate and caramel.',
        userId: userId
      };
    });
  };

  // Mock accounts data - now referencing coffees from mockCoffees.json
  const accountData = {
    'user1': {
      coffeeEvents: [
        {
          id: 'event-user1-0',
          coffeeId: mockCoffees.coffees[0].id,
          coffeeName: mockCoffees.coffees[0].name,
          roaster: mockCoffees.coffees[0].roaster,
          imageUrl: mockCoffees.coffees[0].image || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
          rating: 4,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          brewingMethod: 'Pour Over',
          grindSize: 'Medium',
          notes: mockCoffees.coffees[0].description || 'Bright acidity with floral notes. Very clean cup.',
          userId: 'user1',
          userName: 'Ivo Vilches',
          userAvatar: require('../../assets/users/ivo-vilches.jpg')
        }
      ],
      // For remaining account data, we'll use the data from split files directly
      coffeeCollection: [],
      coffeeWishlist: [],
      favorites: [],
      recipes: []
    }
  };
  
  // Function to switch between accounts - memoized to prevent re-renders
  const switchAccount = useCallback(async (account) => {
    try {
      // Default to user1 if invalid account is provided
      const targetAccount = account || 'user1';
      console.log('CoffeeContext - Switching account to:', targetAccount);
      
      // Verify the account exists in accounts array
      const userData = accounts.find(user => user.id === targetAccount);
      if (!userData) {
        console.error('Invalid account - account not found in accounts array');
        throw new Error('Invalid account');
      }
      
      console.log('Found user data for switch:', userData);
      
      // First set the current account
      setCurrentAccount(targetAccount);
      console.log('Current account set to:', targetAccount);
      
      // Then set user immediately to avoid flash of empty state
      setUser(userData);
      console.log('User set to:', userData);
      
      // Clear current data to avoid seeing stale data
      setCoffeeEvents([]);
      setCoffeeCollection([]);
      setCoffeeWishlist([]);
      setFavorites([]);
      setRecipes([]);
      console.log('Cleared existing data');
      
      // Set loading state to true
      setLoading(true);
      console.log('Set loading to true');
      
      // Small delay to ensure state updates have taken effect
      setTimeout(async () => {
        try {
          // Now load data for the newly set account
          console.log('Loading data for account after switch:', targetAccount);
          await loadData(targetAccount);
        } catch (loadError) {
          console.error('Error loading data after account switch:', loadError);
          setError('Failed to load account data');
        }
      }, 100);
    } catch (error) {
      console.error('Error switching account:', error);
      setError('Failed to switch account');
      
      // Revert to Ivo Vilches if there's an error
      const defaultUser = accounts.find(u => u.id === 'user1');
      setCurrentAccount('user1');
      setUser(defaultUser);
      
      // Try to load default user data
      setTimeout(() => {
        loadData('user1');
      }, 100);
    }
  }, [accounts, currentAccount, user, loadData]);

  const addCoffeeEvent = async (eventData) => {
    try {
      // Create a new event with a unique ID
      const newEvent = {
        ...eventData,
        id: Date.now().toString(), // Simple unique ID
        date: new Date().toISOString(),
        userId: currentAccount,
        userName: user?.userName || 'Guest',
        userAvatar: user?.userAvatar || null,
        // Ensure friends data is preserved
        friends: eventData.friends || []
      };
      
      // Log the new event data for debugging
      console.log('Adding new coffee event with friends:', {
        eventId: newEvent.id,
        friends: newEvent.friends,
        friendsCount: newEvent.friends?.length
      });
      
      // Add the new event to the coffeeEvents state
      setCoffeeEvents(prevEvents => [newEvent, ...prevEvents]);
      
      // Add the new event to the allEvents state too
      setAllEvents(prevEvents => [newEvent, ...prevEvents]);
      
      // Also update the accountData object
      if (accountData[currentAccount]) {
        accountData[currentAccount].coffeeEvents = [newEvent, ...(accountData[currentAccount].coffeeEvents || [])];
      }
      
      // Return the new event in case it's needed by the caller
      return newEvent;
    } catch (error) {
      console.error('Error adding coffee event:', error);
      throw error;
    }
  };

  // Get recipes for a specific coffee
  const getRecipesForCoffee = (coffeeId) => {
    // First check our local recipes
    const localRecipes = recipes.filter(recipe => recipe.coffeeId === coffeeId);
    
    // Then check mock recipes
    const mockRecipesForCoffee = mockRecipes.recipes.filter(recipe => recipe.coffeeId === coffeeId);
    
    // Combine both sources, with local recipes first
    return [...localRecipes, ...mockRecipesForCoffee];
  };

  // Function to get all recipes
  const getRecipes = () => {
    return mockRecipes.recipes || [];
  };

  // Add function to remove a coffee event (if it doesn't exist already)
  const removeCoffeeEvent = (eventId) => {
    console.log('Removing coffee event with ID:', eventId);
    // Remove from coffeeEvents state
    setCoffeeEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    // Remove from allEvents state too
    setAllEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    
    // Update accountData too if needed
    if (accountData[currentAccount] && accountData[currentAccount].coffeeEvents) {
      accountData[currentAccount].coffeeEvents = accountData[currentAccount].coffeeEvents.filter(
        event => event.id !== eventId
      );
    }
    
    return true;
  };

  // Add to collection function - implements the "Mark as Tried" button functionality
  const addToCollection = (coffee) => {
    console.log('Adding coffee to collection:', coffee.name);
    
    // Create a coffee object with all necessary properties
    const coffeeItem = {
      id: coffee.id,
      name: coffee.name,
      roaster: coffee.roaster || '',
      image: coffee.image || coffee.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
      origin: coffee.origin || '',
      process: coffee.process || '',
      roastLevel: coffee.roastLevel || 'Medium',
      timestamp: new Date().toISOString(),
      userId: currentAccount
    };
    
    // Check if this coffee is already in the collection
    const isInCollection = coffeeCollection.some(c => c.id === coffee.id);
    
    if (!isInCollection) {
      // Add to collection state
      setCoffeeCollection(prev => [...prev, coffeeItem]);
      
      // Update accountData if needed
      if (accountData[currentAccount]) {
        if (!accountData[currentAccount].coffeeCollection) {
          accountData[currentAccount].coffeeCollection = [];
        }
        accountData[currentAccount].coffeeCollection.push(coffeeItem);
      }
    }
    
    return coffeeItem;
  };
  
  // Remove from collection function
  const removeFromCollection = (coffeeId) => {
    console.log('Removing coffee from collection with ID:', coffeeId);
    
    // Remove from collection state
    setCoffeeCollection(prev => prev.filter(coffee => coffee.id !== coffeeId));
    
    // Update accountData if needed
    if (accountData[currentAccount] && accountData[currentAccount].coffeeCollection) {
      accountData[currentAccount].coffeeCollection = accountData[currentAccount].coffeeCollection.filter(
        coffee => coffee.id !== coffeeId
      );
    }
    
    return true;
  };

  // Add to wishlist function - implements the "Save" button functionality
  const addToWishlist = (coffee) => {
    console.log('Adding coffee to wishlist:', coffee.name);
    
    // Create a coffee object with all necessary properties
    const coffeeItem = {
      id: coffee.id,
      name: coffee.name,
      roaster: coffee.roaster || '',
      image: coffee.image || coffee.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
      origin: coffee.origin || '',
      process: coffee.process || '',
      roastLevel: coffee.roastLevel || 'Medium',
      timestamp: new Date().toISOString(),
      userId: currentAccount
    };
    
    // Check if this coffee is already in the wishlist
    const isInWishlist = coffeeWishlist.some(c => c.id === coffee.id);
    
    if (!isInWishlist) {
      // Add to wishlist state
      setCoffeeWishlist(prev => [...prev, coffeeItem]);
      
      // Update accountData if needed
      if (accountData[currentAccount]) {
        if (!accountData[currentAccount].coffeeWishlist) {
          accountData[currentAccount].coffeeWishlist = [];
        }
        accountData[currentAccount].coffeeWishlist.push(coffeeItem);
      }
    }
    
    return coffeeItem;
  };
  
  // Remove from wishlist function
  const removeFromWishlist = (coffeeId) => {
    console.log('Removing coffee from wishlist with ID:', coffeeId);
    
    // Remove from wishlist state
    setCoffeeWishlist(prev => prev.filter(coffee => coffee.id !== coffeeId));
    
    // Update accountData if needed
    if (accountData[currentAccount] && accountData[currentAccount].coffeeWishlist) {
      accountData[currentAccount].coffeeWishlist = accountData[currentAccount].coffeeWishlist.filter(
        coffee => coffee.id !== coffeeId
      );
    }
    
    return true;
  };

  // Add or update a recipe
  const updateRecipe = (updatedRecipe) => {
    try {
      console.log('Updating recipe:', updatedRecipe.id);
      // Find the recipe index
      const recipeIndex = recipes.findIndex(recipe => recipe.id === updatedRecipe.id);
      
      if (recipeIndex !== -1) {
        // Create a new recipes array with the updated recipe
        const updatedRecipes = [...recipes];
        updatedRecipes[recipeIndex] = updatedRecipe;
        
        // Update the recipes state
        setRecipes(updatedRecipes);
        console.log('Recipe updated successfully');
      } else {
        // If the recipe doesn't exist, add it
        console.log('Recipe not found, adding as new');
        addRecipe(updatedRecipe);
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
    }
  };
  
  // Toggle favorite status for a recipe
  const toggleFavorite = (recipeId) => {
    try {
      console.log('Toggling favorite status for recipe:', recipeId);
      
      // Check if the recipe is already in favorites
      const isFavorite = favorites.includes(recipeId);
      
      if (isFavorite) {
        // Remove from favorites
        const updatedFavorites = favorites.filter(id => id !== recipeId);
        setFavorites(updatedFavorites);
        console.log('Recipe removed from favorites');
        
        // Also update the isSaved property on the recipe itself
        const recipeIndex = recipes.findIndex(recipe => recipe.id === recipeId);
        if (recipeIndex !== -1) {
          const updatedRecipes = [...recipes];
          updatedRecipes[recipeIndex] = {
            ...updatedRecipes[recipeIndex],
            isSaved: false
          };
          setRecipes(updatedRecipes);
        }
      } else {
        // Add to favorites
        const updatedFavorites = [...favorites, recipeId];
        setFavorites(updatedFavorites);
        console.log('Recipe added to favorites');
        
        // Also update the isSaved property on the recipe itself
        const recipeIndex = recipes.findIndex(recipe => recipe.id === recipeId);
        if (recipeIndex !== -1) {
          const updatedRecipes = [...recipes];
          updatedRecipes[recipeIndex] = {
            ...updatedRecipes[recipeIndex],
            isSaved: true
          };
          setRecipes(updatedRecipes);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite status:', error);
    }
  };

  const addRecipe = (recipe) => {
    return new Promise((resolve) => {
      setRecipes(prevRecipes => {
        const newRecipes = [...prevRecipes, recipe];
        // Save to AsyncStorage if needed
        // AsyncStorage.setItem('recipes', JSON.stringify(newRecipes));
        return newRecipes;
      });
      resolve(recipe);
    });
  };

  // Authentication functions
  const signIn = async (accountId = 'user1') => {
    try {
      console.log('=== SIGNING IN ===');
      console.log('Signing in as:', accountId);
      setLoading(true);
      
      // Set authentication state and current account
      setIsAuthenticated(true);
      setCurrentAccount(accountId);
      console.log('Authentication state set to true, current account set to:', accountId);
      
      // Explicitly pass the accountId to loadData to avoid race condition
      await loadData(accountId);
      
      console.log('Sign in successful - data loaded');
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Failed to sign in');
      throw error;
    } finally {
      setLoading(false);
      console.log('Sign in process completed');
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out');
      
      // Clear all state
      setIsAuthenticated(false);
      setCurrentAccount(null);
      setUser(null);
      setCoffeeEvents([]);
      setCoffeeCollection([]);
      setCoffeeWishlist([]);
      setFavorites([]);
      setRecipes([]);
      setAllEvents([]);
      setFollowing([]);
      setFollowers([]);
      setHiddenEvents(new Set());
      setError(null);
      
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Failed to sign out');
      throw error;
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    coffeeEvents,
    coffeeCollection,
    coffeeWishlist,
    favorites,
    recipes,
    isLoading: loading,
    error,
    isAuthenticated,
    user,
    currentAccount,
    accounts,
    following,
    followers,
    allEvents,
    addCoffeeEvent,
    removeCoffeeEvent,
    hideEvent: () => {},
    unhideEvent: () => {},
    isEventHidden: () => false,
    addToCollection,
    removeFromCollection,
    addToWishlist,
    removeFromWishlist,
    toggleFavorite,
    setCoffeeCollection: setCoffeeCollection,
    setCoffeeWishlist: setCoffeeWishlist,
    loadData,
    getRecipesForCoffee,
    addRecipe,
    switchAccount,
    loadSavedRecipes,
    setRecipes,
    updateRecipe,
    signIn,
    signOut
  }), [
    coffeeEvents,
    coffeeCollection,
    coffeeWishlist,
    favorites,
    recipes,
    loading,
    error,
    isAuthenticated,
    user,
    currentAccount,
    accounts,
    following,
    followers,
    allEvents,
    addCoffeeEvent,
    removeCoffeeEvent,
    addToCollection,
    removeFromCollection,
    addToWishlist,
    removeFromWishlist,
    toggleFavorite,
    loadData,
    getRecipesForCoffee,
    addRecipe,
    switchAccount,
    loadSavedRecipes,
    setRecipes,
    updateRecipe,
    signIn,
    signOut
  ]);

  return (
    <CoffeeContext.Provider value={contextValue}>
      {children}
    </CoffeeContext.Provider>
  );
};

export const useCoffee = () => {
  const context = useContext(CoffeeContext);
  if (!context) {
    throw new Error('useCoffee must be used within a CoffeeProvider');
  }
  return context;
};
