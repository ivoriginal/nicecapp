import React, { createContext, useState, useContext, useEffect } from 'react';
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
import mockData from '../data/mockData.json';

// Create the context with a default value
const CoffeeContext = createContext({
  coffeeEvents: [],
  coffeeCollection: [],
  coffeeWishlist: [],
  favorites: [],
  recipes: [],
  isLoading: true,
  isAuthenticated: true, // Default to true for prototype
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
  switchAccount: () => {}
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
  const [currentAccount, setCurrentAccount] = useState('user1'); // Default to Ivo Vilches
  const [allEvents, setAllEvents] = useState([]); // All events from all users
  const [following, setFollowing] = useState([]); // Users that the current user follows
  const [followers, setFollowers] = useState([]); // Users that follow the current user
  const [accounts] = useState([
    { id: 'user1', userName: 'Ivo Vilches', userAvatar: require('../../assets/users/ivo-vilches.jpg'), email: 'ivo.vilches@example.com' },
    { id: 'user2', userName: 'Vértigo y Calambre', userAvatar: require('../../assets/businesses/vertigo-logo.jpg'), email: 'contacto@vertigoycalambre.com' },
    { id: 'user3', userName: 'Carlos Hernández', userAvatar: require('../../assets/users/carlos-hernandez.jpg'), email: 'carlos.hernandez@example.com' }
  ]);
  
  // Initialize on mount
  useEffect(() => {
    console.log('CoffeeContext initializing...');
    loadData('user1'); // Force Ivo Vilches on initial load
  }, []);

  // Load data for a specific account
  const loadData = async (specificAccount = null) => {
    try {
      console.log('Loading data for account:', specificAccount || currentAccount);
      setLoading(true);
      setError(null);
      const accountToLoad = specificAccount || currentAccount;
      
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
      
      // IMPORTANT: Collect all events for social feed - do this BEFORE loading account-specific data
      let allUserEvents = [];
      
      // First load events from mockData.json if available
      if (mockData.coffeeEvents && Array.isArray(mockData.coffeeEvents)) {
        console.log(`Adding ${mockData.coffeeEvents.length} events from mockData.json`);
        
        // Filter out any events without coffee data
        const validCoffeeEvents = mockData.coffeeEvents.filter(
          event => event.coffeeId && event.coffeeName && !event.type
        );
        
        allUserEvents = [...mockData.coffeeEvents];
        
        // For each user in mockData.coffeeEvents, ensure they have corresponding collection entries
        // We'll process these later in the collection-building code
      }
      
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
      console.log('CoffeeContext - Loading complete, loading set to false');
    }
  };

  // Generate mock coffee events
  const generateMockEvents = (userId, count = 5) => {
    const methods = ['Pour Over', 'Espresso', 'French Press', 'AeroPress', 'Cold Brew'];
    const grindSizes = ['Fine', 'Medium', 'Coarse'];
    
    // Define specific coffees
    const specificCoffees = [
      {
        id: 'coffee-0',
        name: 'Ethiopian Yirgacheffe',
        roaster: 'Blue Bottle Coffee'
      },
      {
        id: 'coffee-1',
        name: 'Colombian Supremo',
        roaster: 'Stumptown Coffee Roasters'
      },
      {
        id: 'coffee-2',
        name: 'Kenya AA',
        roaster: 'Intelligentsia Coffee'
      },
      {
        id: 'coffee-3',
        name: 'Guatemala Antigua',
        roaster: 'Counter Culture Coffee'
      },
      {
        id: 'coffee-4',
        name: 'Sumatra Mandheling',
        roaster: 'Starbucks Reserve'
      }
    ];
    
    // Generate events using specific coffees
    return Array(count).fill(null).map((_, index) => {
      const coffeeIndex = index % specificCoffees.length;
      const coffee = specificCoffees[coffeeIndex];
      return {
        id: `event-${userId}-${index}`,
        coffeeId: coffee.id,
        coffeeName: coffee.name,
        roaster: coffee.roaster,
        imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
        rating: Math.floor(Math.random() * 5) + 1,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        brewingMethod: methods[Math.floor(Math.random() * methods.length)],
        grindSize: grindSizes[Math.floor(Math.random() * grindSizes.length)],
        notes: 'A delicious cup of coffee with notes of chocolate and caramel.',
        userId: userId
      };
    });
  };

  // Mock accounts data
  const accountData = {
    'user1': {
      coffeeEvents: [
        {
          id: 'event-user1-0',
          coffeeId: 'coffee-0',
          coffeeName: 'Ethiopian Yirgacheffe',
          roaster: 'Blue Bottle Coffee',
          imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
          rating: 4,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          brewingMethod: 'Pour Over',
          grindSize: 'Medium',
          notes: 'Bright acidity with floral notes. Very clean cup.',
          userId: 'user1',
          userName: 'Ivo Vilches',
          userAvatar: require('../../assets/users/ivo-vilches.jpg')
        },
        {
          id: 'event-user1-1',
          coffeeId: 'coffee-1',
          coffeeName: 'Colombian Supremo',
          roaster: 'Stumptown Coffee Roasters',
          imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
          rating: 5,
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          brewingMethod: 'Espresso',
          grindSize: 'Fine',
          notes: 'Rich chocolate notes with a hint of caramel. Good body.',
          userId: 'user1',
          userName: 'Ivo Vilches',
          userAvatar: require('../../assets/users/ivo-vilches.jpg')
        },
        {
          id: 'event-user1-2',
          coffeeId: 'coffee-2',
          coffeeName: 'Kenya AA',
          roaster: 'Intelligentsia Coffee',
          imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
          rating: 4,
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          brewingMethod: 'AeroPress',
          grindSize: 'Medium-Fine',
          notes: 'Complex berry notes with a clean finish. Excellent!',
          userId: 'user1',
          userName: 'Ivo Vilches',
          userAvatar: require('../../assets/users/ivo-vilches.jpg')
        }
      ],
      coffeeCollection: [
        {
          id: 'coffee-0',
          name: 'Ethiopian Yirgacheffe',
          roaster: 'Blue Bottle Coffee',
          image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
          userId: 'user1'
        },
        {
          id: 'coffee-1',
          name: 'Colombian Supremo',
          roaster: 'Stumptown Coffee Roasters',
          image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd',
          userId: 'user1'
        },
        {
          id: 'coffee-2',
          name: 'Kenya AA',
          roaster: 'Intelligentsia Coffee',
          image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd',
          userId: 'user1'
        }
      ],
      coffeeWishlist: [
        {
          id: 'coffee-3',
          name: 'Guatemala Antigua',
          roaster: 'Counter Culture Coffee',
          image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd',
          userId: 'user1'
        }
      ],
      favorites: ['coffee-0', 'coffee-1'],
      recipes: []
    },
    'user2': {
      coffeeEvents: [
        {
          id: 'event-user2-0',
          coffeeId: 'coffee-3',
          coffeeName: 'Guatemala Antigua',
          roaster: 'Counter Culture Coffee',
          imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
          rating: 4,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          brewingMethod: 'French Press',
          grindSize: 'Coarse',
          notes: 'Nutty with a subtle sweetness. Very balanced.',
          userId: 'user2',
          userName: 'Vértigo y Calambre',
          userAvatar: require('../../assets/businesses/vertigo-logo.jpg')
        }
      ],
      coffeeCollection: [
        {
          id: 'coffee-3',
          name: 'Guatemala Antigua',
          roaster: 'Counter Culture Coffee',
          image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6',
          userId: 'user2'
        }
      ],
      coffeeWishlist: [
        {
          id: 'coffee-0',
          name: 'Ethiopian Yirgacheffe',
          roaster: 'Blue Bottle Coffee',
          image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
          userId: 'user2'
        }
      ],
      favorites: ['coffee-3'],
      recipes: []
    },
    'user3': {
      coffeeEvents: [
        {
          id: 'event-user3-0',
          coffeeId: 'coffee-4',
          coffeeName: 'Sumatra Mandheling',
          roaster: 'Starbucks Reserve',
          imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
          rating: 3,
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          brewingMethod: 'Moka Pot',
          grindSize: 'Fine',
          notes: 'Earthy with low acidity. Good for espresso-style drinks.',
          userId: 'user3',
          userName: 'Carlos Hernández',
          userAvatar: require('../../assets/users/carlos-hernandez.jpg')
        }
      ],
      coffeeCollection: [
        {
          id: 'coffee-4',
          name: 'Sumatra Mandheling',
          roaster: 'Starbucks Reserve',
          image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd',
          userId: 'user3'
        }
      ],
      coffeeWishlist: [
        {
          id: 'coffee-1',
          name: 'Colombian Supremo',
          roaster: 'Stumptown Coffee Roasters',
          image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd',
          userId: 'user3'
        }
      ],
      favorites: ['coffee-4'],
      recipes: []
    }
  };
  
  // Function to switch between accounts
  const switchAccount = async (account) => {
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
  };

  const addCoffeeEvent = async (eventData) => {
    try {
      // Create a new event with a unique ID
      const newEvent = {
        ...eventData,
        id: Date.now().toString(), // Simple unique ID
        date: new Date().toISOString(),
        userId: currentAccount,
        userName: user?.userName || 'Guest',
        userAvatar: user?.userAvatar || null
      };
      
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

  // Mock data for recipes
  const mockRecipes = {
    'coffee-0': [
      {
        id: 'recipe-coffee-0-1',
        name: 'Ethiopian Yirgacheffe V60',
        method: 'Pour Over',
        coffeeId: 'coffee-0',
        coffeeName: 'Ethiopian Yirgacheffe',
        userId: 'user1',
        userName: 'Ivo Vilches',
        userAvatar: require('../../assets/users/ivo-vilches.jpg'),
        amount: 20,
        grindSize: 'Medium-Fine',
        waterVolume: 300,
        waterTemp: 94,
        brewTime: '2:30',
        steps: [
          { time: '0:00', action: 'Rinse filter and warm vessel', water: 0 },
          { time: '0:00', action: 'Add 20g coffee', water: 0 },
          { time: '0:00', action: 'Pour 40g water for bloom', water: 40 },
          { time: '0:30', action: 'Stir gently', water: 0 },
          { time: '0:45', action: 'Pour to 150g total', water: 110 },
          { time: '1:15', action: 'Pour to 220g total', water: 70 },
          { time: '1:45', action: 'Pour to 300g total', water: 80 },
          { time: '2:30', action: 'Drawdown complete', water: 0 }
        ],
        tips: [
          'Use filtered water at 94°C',
          'Grind coffee just before brewing',
          'Pour in slow, concentric circles'
        ]
      },
      {
        id: 'recipe-coffee-0-2',
        name: 'Ethiopian Yirgacheffe AeroPress',
        method: 'AeroPress',
        coffeeId: 'coffee-0',
        coffeeName: 'Ethiopian Yirgacheffe',
        userId: 'user2',
        userName: 'Vértigo y Calambre',
        userAvatar: require('../../assets/businesses/vertigo-logo.jpg'),
        amount: 15,
        grindSize: 'Medium',
        waterVolume: 230,
        waterTemp: 92,
        brewTime: '1:30',
        steps: [
          { time: '0:00', action: 'Rinse paper filter', water: 0 },
          { time: '0:00', action: 'Add 15g coffee', water: 0 },
          { time: '0:00', action: 'Add 230g water', water: 230 },
          { time: '0:00', action: 'Stir 10 times', water: 0 },
          { time: '1:00', action: 'Stir again briefly', water: 0 },
          { time: '1:30', action: 'Press gently', water: 0 }
        ],
        tips: [
          'Use water at 92°C for lighter roasts',
          'Stir to ensure even extraction',
          'Press slowly and stop at the hiss'
        ]
      }
    ],
    'coffee-1': [
      {
        id: 'recipe-coffee-1-1',
        name: 'Colombian Supremo Espresso',
        method: 'Espresso',
        coffeeId: 'coffee-1',
        coffeeName: 'Colombian Supremo',
        userId: 'user3',
        userName: 'Carlos Hernández',
        userAvatar: require('../../assets/users/carlos-hernandez.jpg'),
        amount: 18,
        grindSize: 'Fine',
        waterVolume: 36,
        waterTemp: 93,
        brewTime: '0:28',
        steps: [
          { time: '0:00', action: 'Flush grouphead', water: 0 },
          { time: '0:00', action: 'Add 18g ground coffee to portafilter', water: 0 },
          { time: '0:00', action: 'Tamp evenly with 30lbs pressure', water: 0 },
          { time: '0:00', action: 'Start extraction', water: 0 },
          { time: '0:28', action: 'Stop at 36g output', water: 36 }
        ],
        tips: [
          'Aim for 1:2 ratio (18g in, 36g out)',
          'Target 25-30 second extraction time',
          'Adjust grind to control flow rate'
        ]
      }
    ],
    'coffee-2': [
      {
        id: 'recipe-coffee-2-1',
        name: 'Kenya AA French Press',
        method: 'French Press',
        coffeeId: 'coffee-2',
        coffeeName: 'Kenya AA',
        userId: 'user1',
        userName: 'Ivo Vilches',
        userAvatar: require('../../assets/users/ivo-vilches.jpg'),
        amount: 30,
        grindSize: 'Coarse',
        waterVolume: 500,
        waterTemp: 96,
        brewTime: '4:00',
        steps: [
          { time: '0:00', action: 'Add 30g coffee to French Press', water: 0 },
          { time: '0:00', action: 'Add 500g water at 96°C', water: 500 },
          { time: '0:00', action: 'Stir gently', water: 0 },
          { time: '4:00', action: 'Press slowly and pour', water: 0 }
        ],
        tips: [
          'Use coarse grind to avoid silt',
          'Don\'t press all the way to avoid stirring up fines',
          'Pour immediately after pressing to avoid over-extraction'
        ]
      }
    ]
  };

  // Get recipes for a specific coffee
  const getRecipesForCoffee = (coffeeId) => {
    if (coffeeId === 'coffee-villa-rosario') {
      return [
        {
          id: 'recipe-villa-rosario-1',
          name: 'Villa Rosario V60',
          method: 'V60',
          userId: 'user2',
          userName: 'Vértigo y Calambre',
          userAvatar: 'assets/businesses/vertigo-logo.jpg',
          coffeeId: 'coffee-villa-rosario',
          coffeeName: 'Villa Rosario',
          roaster: 'Kima Coffee',
          steps: [
            { time: '0:00', action: 'Rinse filter and warm vessel', water: 0 },
            { time: '0:00', action: 'Add 18g coffee (medium-fine grind)', water: 0 },
            { time: '0:00', action: 'Add 40g water for bloom', water: 40 },
            { time: '0:30', action: 'Gently swirl brewer', water: 0 },
            { time: '0:45', action: 'Add water to 150g', water: 110 },
            { time: '1:15', action: 'Add water to 250g', water: 100 },
            { time: '1:45', action: 'Gently swirl brewer', water: 0 },
            { time: '2:30', action: 'Drawdown complete', water: 0 }
          ],
          tips: [
            'Use filtered water at 94°C',
            'Grind coffee just before brewing',
            'Aim for a total brew time of 2:30-3:00'
          ],
          notes: 'Highlights the cherry and cookie notes with a sweet caramel finish.'
        },
        {
          id: 'recipe-villa-rosario-2',
          name: 'Villa Rosario Espresso',
          method: 'Espresso',
          userId: 'business-kima',
          userName: 'Kima Coffee',
          userAvatar: 'https://kimacoffee.com/cdn/shop/files/CE2711AA-BBF7-4D8D-942C-F9568B66871F_1296x.png?v=1741927728',
          coffeeId: 'coffee-villa-rosario',
          coffeeName: 'Villa Rosario',
          roaster: 'Kima Coffee',
          steps: [
            { time: '0:00', action: 'Dose 18g coffee (fine grind)', water: 0 },
            { time: '0:00', action: 'Distribute and tamp evenly', water: 0 },
            { time: '0:00', action: 'Pull shot with 36g output', water: 36 },
            { time: '0:28', action: 'Shot complete', water: 0 }
          ],
          tips: [
            'Aim for 28-32 seconds extraction time',
            'Machine temperature around 93°C',
            ' 1:2 brew ratio (18g in, 36g out)'
          ],
          notes: 'Rich body with strong caramel sweetness and delicate cola aftertaste.'
        }
      ];
    }
    
    // Original function content for other coffees
    return mockRecipes[coffeeId] || [];
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

  return (
    <CoffeeContext.Provider
      value={{
        coffeeEvents,
        coffeeCollection,
        coffeeWishlist,
        favorites,
        recipes,
        isLoading: loading,
        isAuthenticated: true, // Default to true for prototype
        currentAccount,
        accounts,
        following,
        followers,
        allEvents, // Add all events to the context
        addCoffeeEvent,
        removeCoffeeEvent,
        hideEvent: () => {},
        unhideEvent: () => {},
        isEventHidden: () => false,
        addToCollection: () => {},
        removeFromCollection: () => {},
        addToWishlist: () => {},
        removeFromWishlist: () => {},
        toggleFavorite: () => {},
        setCoffeeCollection: setCoffeeCollection,
        setCoffeeWishlist: setCoffeeWishlist,
        loadData,
        getRecipesForCoffee, // Add the function to get recipes for coffee
        addRecipe: () => {},
        switchAccount
      }}
    >
      {children}
    </CoffeeContext.Provider>
  );
};

export const useCoffee = () => {
  const context = useContext(CoffeeContext);
  if (context === undefined) {
    throw new Error('useCoffee must be used within a CoffeeProvider');
  }
  return context;
};
