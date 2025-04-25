import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  saveCoffeeEvent, 
  getCoffeeEvents, 
  saveToCollection, 
  removeFromCollection as removeFromCollectionSupabase,
  getCollection,
  saveToWishlist,
  removeFromWishlist as removeFromWishlistSupabase,
  getWishlist,
  saveFavorites,
  getFavorites,
  supabase
} from '../lib/supabase';
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
    { id: 'user1', userName: 'Ivo Vilches', userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg', email: 'ivo.vilches@example.com' },
    { id: 'user2', userName: 'Vértigo y Calambre', userAvatar: 'https://instagram.fvlc6-1.fna.fbcdn.net/v/t51.2885-19/336824776_569041758334218_6485683640258084106_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fvlc6-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2QG9yijX6AYS-LyAN9vATpVAGPTj3dueZAwrz_3RB68vu_PtQKtRFxeVRSPP84eYFZw&_nc_ohc=mD1tNAu2Bp0Q7kNvwHFAMaF&_nc_gid=a2z4gQ9o-xKDwiAyIMflPA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfHHhBR9AddwcSMHdDw7WSR00XBUUwYOp5v4FuY-lTj-vw&oe=680ED603&_nc_sid=8b3546', email: 'contacto@vertigoycalambre.com' },
    { id: 'user3', userName: 'Carlos Hernández', userAvatar: 'https://randomuser.me/api/portraits/men/67.jpg', email: 'carlos.hernandez@example.com' }
  ]);
  
  // Initialize on mount
  useEffect(() => {
    console.log('CoffeeContext initializing...');
    loadData('user1'); // Force Ivo Vilches on initial load
  }, []);

  // Load data for a specific account
  const loadData = async (specificAccount = null) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use provided account, or current account, or default to user1
      const accountToLoad = specificAccount || currentAccount || 'user1';
      console.log('CoffeeContext - Loading data for account:', accountToLoad);
      
      // Find the user in accounts array
      const userData = accounts.find(u => u.id === accountToLoad);
      if (!userData) {
        console.error('User data not found for account:', accountToLoad);
        throw new Error('Account data not found');
      }
      
      console.log('CoffeeContext - Found user data:', userData);

      // Set user data immediately
      setUser(userData);
      
      // Make sure current account is set
      if (currentAccount !== accountToLoad) {
        console.log(`Updating currentAccount from ${currentAccount} to ${accountToLoad}`);
        setCurrentAccount(accountToLoad);
      }

      // Load account-specific data
      if (accountData[accountToLoad]) {
        console.log('Using existing account data for:', accountToLoad);
        // Use existing data if available
        const data = accountData[accountToLoad];
        console.log('Events count:', data.coffeeEvents?.length);
        console.log('Collection count:', data.coffeeCollection?.length);
        setCoffeeEvents(data.coffeeEvents || []);
        setCoffeeCollection(data.coffeeCollection || []);
        setCoffeeWishlist(data.coffeeWishlist || []);
        setFavorites(data.favorites || []);
        setRecipes(data.recipes || []);
        
        // Set following and followers - for the social feed, everyone follows everyone
        const otherUsers = accounts.filter(acc => acc.id !== accountToLoad);
        setFollowing(otherUsers);
        setFollowers(otherUsers);
        
        // Collect all events from all users for the social feed
        let allUserEvents = [];
        for (const acct in accountData) {
          if (accountData[acct]?.coffeeEvents) {
            allUserEvents = [...allUserEvents, ...accountData[acct].coffeeEvents];
          }
        }
        
        // Sort by date (newest first)
        allUserEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAllEvents(allUserEvents);
      } else {
        console.log('Generating new account data for:', accountToLoad);
        // Generate mock data for new accounts
        const mockEvents = generateMockEvents(accountToLoad, 5).map(event => ({
          ...event,
          userId: accountToLoad,
          userName: userData.userName,
          userAvatar: userData.userAvatar
        }));
        
        const mockCollection = [
          {
            id: 'coffee-0',
            name: 'Ethiopian Yirgacheffe',
            roaster: 'Blue Bottle Coffee',
            image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd',
            userId: accountToLoad
          },
          {
            id: 'coffee-1',
            name: 'Colombian Supremo',
            roaster: 'Stumptown Coffee Roasters',
            image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
            userId: accountToLoad
          }
        ];
        
        const mockWishlist = [
          {
            id: 'coffee-3',
            name: 'Guatemala Antigua',
            roaster: 'Counter Culture Coffee',
            image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd',
            userId: accountToLoad
          }
        ];
        
        setCoffeeEvents(mockEvents);
        setCoffeeCollection(mockCollection);
        setCoffeeWishlist(mockWishlist);
        setFavorites(['coffee-0']);
        setRecipes([]);
        
        // Set following and followers - everyone follows everyone
        const otherUsers = accounts.filter(acc => acc.id !== accountToLoad);
        setFollowing(otherUsers);
        setFollowers(otherUsers);
        
        // Collect all events for social feed
        let allUserEvents = [];
        for (const acct in accountData) {
          if (accountData[acct]?.coffeeEvents) {
            allUserEvents = [...allUserEvents, ...accountData[acct].coffeeEvents];
          }
        }
        
        // Add the new mock events
        allUserEvents = [...allUserEvents, ...mockEvents];
        
        // Sort by date (newest first)
        allUserEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAllEvents(allUserEvents);
        
        // Store the generated data for future use
        accountData[accountToLoad] = {
          coffeeEvents: mockEvents,
          coffeeCollection: mockCollection,
          coffeeWishlist: mockWishlist,
          favorites: ['coffee-0'],
          recipes: []
        };
      }
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
          userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg'
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
          userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg'
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
          userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg'
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
          userAvatar: 'https://instagram.fvlc6-1.fna.fbcdn.net/v/t51.2885-19/336824776_569041758334218_6485683640258084106_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fvlc6-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2QG9yijX6AYS-LyAN9vATpVAGPTj3dueZAwrz_3RB68vu_PtQKtRFxeVRSPP84eYFZw&_nc_ohc=mD1tNAu2Bp0Q7kNvwHFAMaF&_nc_gid=a2z4gQ9o-xKDwiAyIMflPA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfHHhBR9AddwcSMHdDw7WSR00XBUUwYOp5v4FuY-lTj-vw&oe=680ED603&_nc_sid=8b3546'
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
          userAvatar: 'https://randomuser.me/api/portraits/men/67.jpg'
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
        userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
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
        userAvatar: 'https://instagram.fvlc6-1.fna.fbcdn.net/v/t51.2885-19/336824776_569041758334218_6485683640258084106_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fvlc6-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2QG9yijX6AYS-LyAN9vATpVAGPTj3dueZAwrz_3RB68vu_PtQKtRFxeVRSPP84eYFZw&_nc_ohc=mD1tNAu2Bp0Q7kNvwHFAMaF&_nc_gid=a2z4gQ9o-xKDwiAyIMflPA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfHHhBR9AddwcSMHdDw7WSR00XBUUwYOp5v4FuY-lTj-vw&oe=680ED603&_nc_sid=8b3546',
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
        userAvatar: 'https://randomuser.me/api/portraits/men/67.jpg',
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
        userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
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

  // Function to get recipes for a specific coffee
  const getRecipesForCoffee = (coffeeId) => {
    return mockRecipes[coffeeId] || [];
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
        removeCoffeeEvent: () => {},
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
