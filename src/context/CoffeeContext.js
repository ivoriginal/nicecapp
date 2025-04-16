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
  isAuthenticated: false,
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
  addRecipe: () => {}
});

export function CoffeeProvider({ children }) {
  const [coffeeEvents, setCoffeeEvents] = useState([]);
  const [hiddenEvents, setHiddenEvents] = useState(new Set());
  const [coffeeCollection, setCoffeeCollection] = useState([]);
  const [coffeeWishlist, setCoffeeWishlist] = useState([]);
  const [favorites, setFavorites] = useState([]);
  // Force authentication to be true for development
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [recipes, setRecipes] = useState([
    {
      id: '1',
      name: 'Ethiopian Yirgacheffe V60',
      method: 'V60',
      userId: 'user2',
      userName: 'Sarah Williams',
      userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      coffeeId: 'coffee-0',
      steps: [
        { time: '0:00', action: 'Rinse filter and warm vessel', water: 0 },
        { time: '0:00', action: 'Add 15g coffee (medium-fine grind)', water: 0 },
        { time: '0:00', action: 'Add 30g water for bloom', water: 30 },
        { time: '0:30', action: 'Gently stir bloom', water: 0 },
        { time: '0:45', action: 'Add water to 100g', water: 70 },
        { time: '1:15', action: 'Add water to 150g', water: 50 },
        { time: '1:45', action: 'Add water to 200g', water: 50 },
        { time: '2:15', action: 'Add water to 250g', water: 50 },
        { time: '2:45', action: 'Drawdown complete', water: 0 }
      ],
      tips: [
        'Use filtered water at 200°F (93°C)',
        'Grind coffee just before brewing',
        'Rinse paper filter thoroughly',
        'Keep water temperature consistent',
        'Time your pours carefully'
      ],
      notes: 'Bright, floral, with notes of bergamot and honey',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085'
    },
    {
      id: '2',
      name: 'Colombian Supremo AeroPress',
      method: 'AeroPress',
      userId: 'user3',
      userName: 'Michael Chen',
      userAvatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      coffeeId: 'coffee-1',
      steps: [
        { time: '0:00', action: 'Add 17g coffee (fine grind)', water: 0 },
        { time: '0:00', action: 'Add 50g water (94°C)', water: 50 },
        { time: '0:10', action: 'Stir gently', water: 0 },
        { time: '0:30', action: 'Add water to 150g', water: 100 },
        { time: '1:00', action: 'Stir gently', water: 0 },
        { time: '1:30', action: 'Press slowly', water: 0 },
        { time: '2:00', action: 'Add 100g water to dilute', water: 100 }
      ],
      tips: [
        'Pre-heat the AeroPress with hot water',
        'Use a fine grind, similar to espresso',
        'Press gently to avoid bitter extraction',
        'Clean all parts thoroughly after use',
        'Experiment with inverted method'
      ],
      notes: 'Rich chocolate, caramel, with a smooth finish',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd'
    },
    {
      id: '3',
      name: 'Kenya AA Chemex',
      method: 'Chemex',
      userId: 'user4',
      userName: 'Emily Rodriguez',
      userAvatar: 'https://randomuser.me/api/portraits/women/22.jpg',
      coffeeId: 'coffee-2',
      steps: [
        { time: '0:00', action: 'Rinse filter and warm vessel', water: 0 },
        { time: '0:00', action: 'Add 22g coffee (medium-coarse grind)', water: 0 },
        { time: '0:00', action: 'Add 44g water for bloom', water: 44 },
        { time: '0:45', action: 'Add water to 150g', water: 106 },
        { time: '1:30', action: 'Add water to 250g', water: 100 },
        { time: '2:15', action: 'Add water to 350g', water: 100 },
        { time: '3:00', action: 'Add water to 400g', water: 50 },
        { time: '3:45', action: 'Drawdown complete', water: 0 }
      ],
      tips: [
        'Fold the filter properly along the seams',
        'Rinse filter thoroughly with hot water',
        'Use medium-coarse ground coffee',
        'Pour in circular motions',
        'Maintain water level below the top'
      ],
      notes: 'Complex, bright acidity with blackberry and citrus notes',
      image: 'https://images.unsplash.com/photo-1520970014086-2208d157c9e2'
    },
    {
      id: '4',
      name: 'Guatemala Antigua French Press',
      method: 'French Press',
      userId: 'user5',
      userName: 'Alex Johnson',
      userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      coffeeId: 'coffee-3',
      steps: [
        { time: '0:00', action: 'Add 30g coffee (coarse grind)', water: 0 },
        { time: '0:00', action: 'Add 500g water (94°C)', water: 500 },
        { time: '0:00', action: 'Stir gently to ensure all grounds are wet', water: 0 },
        { time: '4:00', action: 'Break the crust and stir gently', water: 0 },
        { time: '4:30', action: 'Press slowly and serve', water: 0 }
      ],
      tips: [
        'Use coarse ground coffee',
        'Pre-heat the French Press',
        'Break and remove the crust at 4 minutes',
        'Press plunger slowly and steadily',
        'Serve immediately after pressing'
      ],
      notes: 'Nutty with a subtle sweetness. Very balanced cup with medium body.',
      image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6'
    },
    {
      id: '5',
      name: 'Sumatra Mandheling Moka Pot',
      method: 'Moka Pot',
      userId: 'user6',
      userName: 'Maria Garcia',
      userAvatar: 'https://randomuser.me/api/portraits/women/28.jpg',
      coffeeId: 'coffee-4',
      steps: [
        { time: '0:00', action: 'Fill bottom chamber with hot water', water: 0 },
        { time: '0:00', action: 'Add 20g coffee (fine grind) to filter basket', water: 0 },
        { time: '0:00', action: 'Assemble Moka Pot and place on medium heat', water: 0 },
        { time: '3:00', action: 'Coffee begins to flow into top chamber', water: 0 },
        { time: '5:00', action: 'Remove from heat when coffee flow slows', water: 0 },
        { time: '5:30', action: 'Serve immediately or dilute to taste', water: 0 }
      ],
      tips: [
        'Start with hot water in the base',
        'Use medium-fine ground coffee',
        'Don\'t tamp the coffee grounds',
        'Use medium heat to avoid burning',
        'Remove from heat when brewing is complete'
      ],
      notes: 'Earthy with low acidity. Perfect for espresso-style drinks or Americano.',
      image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6'
    },
    {
      id: '6',
      name: 'Ethiopian Yirgacheffe V60',
      method: 'V60',
      userId: 'currentUser',
      userName: 'Coffee Lover',
      userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      coffeeId: 'coffee-0',
      roaster: 'Blue Bottle Coffee',
      steps: [
        { time: '0:00', action: 'Rinse filter and warm vessel', water: 0 },
        { time: '0:00', action: 'Add 18g coffee (medium-fine grind)', water: 0 },
        { time: '0:00', action: 'Add 36g water for bloom', water: 36 },
        { time: '0:30', action: 'Gently stir bloom', water: 0 },
        { time: '0:45', action: 'Add water to 120g', water: 84 },
        { time: '1:15', action: 'Add water to 180g', water: 60 },
        { time: '1:45', action: 'Add water to 240g', water: 60 },
        { time: '2:15', action: 'Add water to 300g', water: 60 },
        { time: '3:00', action: 'Drawdown complete', water: 0 }
      ],
      tips: [
        'Use filtered water at 200°F (93°C)',
        'Grind coffee just before brewing',
        'Rinse paper filter thoroughly',
        'Keep water temperature consistent',
        'Time your pours carefully'
      ],
      notes: 'Bright, floral, with notes of bergamot and honey',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085'
    },
    {
      id: '7',
      name: 'Colombian Supremo French Press',
      method: 'French Press',
      userId: 'currentUser',
      userName: 'Coffee Lover',
      userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      coffeeId: 'coffee-1',
      roaster: 'Stumptown Coffee Roasters',
      steps: [
        { time: '0:00', action: 'Add 30g coffee (coarse grind)', water: 0 },
        { time: '0:00', action: 'Add 500g water (94°C)', water: 500 },
        { time: '0:00', action: 'Stir gently to ensure all grounds are wet', water: 0 },
        { time: '4:00', action: 'Break the crust and stir gently', water: 0 },
        { time: '4:30', action: 'Press slowly and serve', water: 0 }
      ],
      tips: [
        'Use coarse ground coffee',
        'Pre-heat the French Press',
        'Break and remove the crust at 4 minutes',
        'Press plunger slowly and steadily',
        'Serve immediately after pressing'
      ],
      notes: 'Rich chocolate notes with a hint of caramel. Good body.',
      image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6'
    },
    {
      id: '8',
      name: 'Kenya AA AeroPress',
      method: 'AeroPress',
      userId: 'currentUser',
      userName: 'Coffee Lover',
      userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      coffeeId: 'coffee-2',
      roaster: 'Intelligentsia Coffee',
      steps: [
        { time: '0:00', action: 'Add 17g coffee (fine grind)', water: 0 },
        { time: '0:00', action: 'Add 50g water (94°C)', water: 50 },
        { time: '0:10', action: 'Stir gently', water: 0 },
        { time: '0:30', action: 'Add water to 150g', water: 100 },
        { time: '1:00', action: 'Stir gently', water: 0 },
        { time: '1:30', action: 'Press slowly', water: 0 },
        { time: '2:00', action: 'Add 100g water to dilute', water: 100 }
      ],
      tips: [
        'Pre-heat the AeroPress with hot water',
        'Use a fine grind, similar to espresso',
        'Press gently to avoid bitter extraction',
        'Clean all parts thoroughly after use',
        'Experiment with inverted method'
      ],
      notes: 'Complex berry notes with a clean finish. Excellent!',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd'
    },
    {
      id: '9',
      name: 'Guatemala Antigua Chemex',
      method: 'Chemex',
      userId: 'currentUser',
      userName: 'Coffee Lover',
      userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      coffeeId: 'coffee-3',
      roaster: 'Counter Culture Coffee',
      steps: [
        { time: '0:00', action: 'Rinse filter and warm vessel', water: 0 },
        { time: '0:00', action: 'Add 22g coffee (medium-coarse grind)', water: 0 },
        { time: '0:00', action: 'Add 44g water for bloom', water: 44 },
        { time: '0:45', action: 'Add water to 150g', water: 106 },
        { time: '1:30', action: 'Add water to 250g', water: 100 },
        { time: '2:15', action: 'Add water to 350g', water: 100 },
        { time: '3:00', action: 'Add water to 400g', water: 50 },
        { time: '3:45', action: 'Drawdown complete', water: 0 }
      ],
      tips: [
        'Fold the filter properly along the seams',
        'Rinse filter thoroughly with hot water',
        'Use medium-coarse ground coffee',
        'Pour in circular motions',
        'Maintain water level below the top'
      ],
      notes: 'Nutty with a subtle sweetness. Very balanced.',
      image: 'https://images.unsplash.com/photo-1520970014086-2208d157c9e2'
    },
    {
      id: '10',
      name: 'Sumatra Mandheling Moka Pot',
      method: 'Moka Pot',
      userId: 'currentUser',
      userName: 'Coffee Lover',
      userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      coffeeId: 'coffee-4',
      roaster: 'Starbucks Reserve',
      steps: [
        { time: '0:00', action: 'Fill bottom chamber with hot water', water: 0 },
        { time: '0:00', action: 'Add 20g coffee (fine grind) to filter basket', water: 0 },
        { time: '0:00', action: 'Assemble Moka Pot and place on medium heat', water: 0 },
        { time: '3:00', action: 'Coffee begins to flow into top chamber', water: 0 },
        { time: '5:00', action: 'Remove from heat when coffee flow slows', water: 0 },
        { time: '5:30', action: 'Serve immediately or dilute to taste', water: 0 }
      ],
      tips: [
        'Start with hot water in the base',
        'Use medium-fine ground coffee',
        'Don\'t tamp the coffee grounds',
        'Use medium heat to avoid burning',
        'Remove from heat when brewing is complete'
      ],
      notes: 'Earthy with low acidity. Good for espresso-style drinks.',
      image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6'
    }
  ]);

  useEffect(() => {
    // Skip authentication check for development
    // checkAuth();
    
    // Load data from Supabase
    loadData();
    
    // Add fake coffee logs for development
    setTimeout(() => {
      addFakeCoffeeLogs();
    }, 500);
    
    // Disable auth state listener for development
    /*
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setIsAuthenticated(true);
          loadData();
        } else {
          // Don't set isAuthenticated to false for development
          // setIsAuthenticated(false);
          // Clear data when user signs out
          // setCoffeeEvents([]);
          // setCoffeeCollection([]);
          // setCoffeeWishlist([]);
          // setFavorites([]);
        }
      }
    );

    return () => {
      if (authListener) authListener.subscription.unsubscribe();
    };
    */
  }, []);

  const checkAuth = async () => {
    try {
      // For development: Skip actual auth check and just set authenticated to true
      setIsAuthenticated(true);
      loadData();
      
      // Original code commented out
      /*
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.log('No auth session:', error.message);
        setIsAuthenticated(false);
      } else if (data?.session?.user) {
        setIsAuthenticated(true);
        loadData();
      } else {
        setIsAuthenticated(false);
      }
      */
    } catch (error) {
      console.error('Error checking auth state:', error);
      // Don't set isAuthenticated to false for development
      // setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    // Skip authentication check for development
    // if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      // In a real app, this would fetch from Supabase
      // For now, we'll generate some mock coffee events
      const mockEvents = generateMockEvents();
      setCoffeeEvents(mockEvents);
      
      // Initialize with empty arrays
      setCoffeeCollection([]);
      setCoffeeWishlist([]);
      setFavorites([]);

      // Add all coffees from mock events to collection
      const loggedCoffees = mockEvents.map(event => ({
        id: event.coffeeId,
        name: event.coffeeName,
        roaster: event.roaster,
        image: event.imageUrl,
        description: event.notes || 'No description available',
        origin: 'Unknown',
        process: 'Unknown',
        roastLevel: 'Medium',
        price: '$18.00',
        stats: {
          rating: event.rating,
          reviews: Math.floor(Math.random() * 100) + 10,
          brews: Math.floor(Math.random() * 50) + 5,
          wishlist: Math.floor(Math.random() * 30) + 3
        }
      }));
      setCoffeeCollection(loggedCoffees);
      
      // Skip loading from Supabase for development
      /*
      // Load collection data
      const collection = await getCollection();
      setCoffeeCollection(collection || []);
      
      // Load wishlist data
      const wishlist = await getWishlist();
      setCoffeeWishlist(wishlist || []);
      
      // Load favorites
      const userFavorites = await getFavorites();
      setFavorites(userFavorites || []);
      */
      
    } catch (error) {
      console.error('Error loading coffee data:', error);
      // For development, add fake data if there's an error
      if (coffeeEvents.length === 0) {
        addFakeCoffeeLogs();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock coffee events
  const generateMockEvents = () => {
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
    
    // Generate events using specific coffees first, then random ones
    return Array(10).fill(null).map((_, index) => {
      if (index < specificCoffees.length) {
        const coffee = specificCoffees[index];
        return {
          id: `event-${index}`,
          coffeeId: coffee.id,
          coffeeName: coffee.name,
          roaster: coffee.roaster,
          imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
          rating: Math.floor(Math.random() * 5) + 1,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          brewingMethod: methods[Math.floor(Math.random() * methods.length)],
          grindSize: grindSizes[Math.floor(Math.random() * grindSizes.length)],
          notes: 'A delicious cup of coffee with notes of chocolate and caramel.',
          userId: 'currentUser',
          userName: 'Coffee Lover',
          userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg'
        };
      } else {
        // For remaining events, use random data
        const origins = ['Ethiopia', 'Colombia', 'Kenya', 'Brazil', 'Guatemala'];
        const roasters = ['Blue Bottle', 'Stumptown', 'Intelligentsia', 'Counter Culture', 'Verve'];
        return {
          id: `event-${index}`,
          coffeeId: `coffee-${index}`,
          coffeeName: `${origins[Math.floor(Math.random() * origins.length)]} ${Math.floor(Math.random() * 1000)}`,
          roaster: roasters[Math.floor(Math.random() * roasters.length)],
          imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
          rating: Math.floor(Math.random() * 5) + 1,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          brewingMethod: methods[Math.floor(Math.random() * methods.length)],
          grindSize: grindSizes[Math.floor(Math.random() * grindSizes.length)],
          notes: 'A delicious cup of coffee with notes of chocolate and caramel.',
          userId: 'currentUser',
          userName: 'Coffee Lover',
          userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg'
        };
      }
    });
  };

  const addCoffeeEvent = async (event) => {
    try {
      const newEvent = await saveCoffeeEvent(event);
      setCoffeeEvents(prev => [newEvent, ...prev]);
      return newEvent;
    } catch (error) {
      console.error('Error adding coffee event:', error);
      throw error;
    }
  };

  const hideEvent = (eventId) => {
    setHiddenEvents(prev => new Set([...prev, eventId]));
  };

  const unhideEvent = (eventId) => {
    setHiddenEvents(prev => {
      const newSet = new Set(prev);
      newSet.delete(eventId);
      return newSet;
    });
  };

  const removeCoffeeEvent = async (eventToRemove) => {
    try {
      await supabase
        .from('coffee_events')
        .delete()
        .eq('id', eventToRemove.id);
      
      setCoffeeEvents(prev => 
        prev.filter(event => event.id !== eventToRemove.id)
      );
    } catch (error) {
      console.error('Error removing coffee event:', error);
      throw error;
    }
  };

  const isEventHidden = (eventId) => {
    return hiddenEvents.has(eventId);
  };

  const addToCollection = async (coffee) => {
    try {
      // Remove from wishlist if it's there
      if (coffeeWishlist.some(c => c.id === coffee.id)) {
        await removeFromWishlist(coffee.id);
      }
      
      // Add to collection
      const newCoffee = await saveToCollection(coffee);
      setCoffeeCollection(prev => {
        // Check if coffee already exists in collection
        if (prev.some(c => c.id === coffee.id)) {
          return prev;
        }
        return [...prev, newCoffee];
      });
      return newCoffee;
    } catch (error) {
      console.error('Error adding to collection:', error);
      throw error;
    }
  };

  const removeFromCollection = async (coffeeId) => {
    try {
      // For development, just update the state
      setCoffeeCollection(prev => {
        const newCollection = prev.filter(c => c.id !== coffeeId);
        return newCollection;
      });
      
      // Skip Supabase call for development
      /*
      const updatedCollection = await removeFromCollectionSupabase(coffeeId);
      setCoffeeCollection(updatedCollection);
      */
      
      return coffeeId;
    } catch (error) {
      console.error('Error removing from collection:', error);
      throw error;
    }
  };

  const addToWishlist = async (coffee) => {
    try {
      // Remove from collection if it's there
      if (coffeeCollection.some(c => c.id === coffee.id)) {
        removeFromCollection(coffee.id);
      }
      
      // Add to wishlist
      const newCoffee = await saveToWishlist(coffee);
      setCoffeeWishlist(prev => [...prev, newCoffee]);
      return newCoffee;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  };

  const removeFromWishlist = async (coffeeId) => {
    try {
      // For development, just update the state
      setCoffeeWishlist(prev => prev.filter(c => c.id !== coffeeId));
      
      // Skip Supabase call for development
      /*
      await removeFromWishlistSupabase(coffeeId);
      const wishlist = await getWishlist();
      setCoffeeWishlist(wishlist || []);
      */
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  };

  const toggleFavorite = async (coffeeId) => {
    try {
      // Check if the coffee exists in either collection or wishlist
      const coffeeExists = 
        coffeeCollection.some(coffee => coffee.id === coffeeId) || 
        coffeeWishlist.some(coffee => coffee.id === coffeeId);
      
      if (!coffeeExists) {
        console.warn('Cannot favorite a coffee that is not in collection or wishlist');
        return;
      }
      
      const newFavorites = favorites.includes(coffeeId)
        ? favorites.filter(id => id !== coffeeId)
        : [...favorites, coffeeId];
      
      await saveFavorites(newFavorites);
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };

  // Function to add fake coffee logs for development
  const addFakeCoffeeLogs = () => {
    const fakeLogs = [
      {
        id: 'fake1',
        coffeeName: 'Ethiopian Yirgacheffe',
        method: 'Pour Over',
        amount: 18,
        grindSize: 'Medium-Fine',
        waterVolume: 300,
        brewTime: '3:30',
        rating: 4.5,
        notes: 'Bright acidity with floral notes. Very clean cup.',
        bloomTime: '0:30',
        bloomWater: 36,
        pour2Time: '1:30',
        pour2Water: 150,
        pour3Time: '2:30',
        pour3Water: 300,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        userId: 'user1',
        userName: 'Alex Johnson',
        userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        actionType: 'logged',
        coffeeId: 'coffee-0',
        recipeId: 'recipe1',
        roasterName: 'Blue Bottle Coffee'
      },
      {
        id: 'fake2',
        coffeeName: 'Colombian Supremo',
        method: 'French Press',
        amount: 30,
        grindSize: 'Coarse',
        waterVolume: 500,
        brewTime: '4:00',
        rating: 4.0,
        notes: 'Rich chocolate notes with a hint of caramel. Good body.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        userId: 'user2',
        userName: 'Sarah Williams',
        userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        actionType: 'logged',
        coffeeId: 'coffee-1',
        recipeId: 'recipe2',
        roasterName: 'Stumptown Coffee Roasters'
      },
      {
        id: 'fake3',
        coffeeName: 'Kenya AA',
        method: 'AeroPress',
        amount: 17,
        grindSize: 'Fine',
        waterVolume: 250,
        brewTime: '2:00',
        rating: 4.8,
        notes: 'Complex berry notes with a clean finish. Excellent!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        userId: 'user3',
        userName: 'Michael Chen',
        userAvatar: 'https://randomuser.me/api/portraits/men/67.jpg',
        actionType: 'logged',
        coffeeId: 'coffee-2',
        recipeId: 'recipe3',
        roasterName: 'Intelligentsia Coffee'
      },
      {
        id: 'fake4',
        coffeeName: 'Guatemala Antigua',
        method: 'Chemex',
        amount: 22,
        grindSize: 'Medium',
        waterVolume: 350,
        brewTime: '4:30',
        rating: 4.2,
        notes: 'Nutty with a subtle sweetness. Very balanced.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
        userId: 'user4',
        userName: 'Emily Rodriguez',
        userAvatar: 'https://randomuser.me/api/portraits/women/22.jpg',
        actionType: 'logged',
        coffeeId: 'coffee-3',
        recipeId: 'recipe4',
        roasterName: 'Counter Culture Coffee'
      },
      {
        id: 'fake5',
        coffeeName: 'Sumatra Mandheling',
        method: 'Moka Pot',
        amount: 20,
        grindSize: 'Fine',
        waterVolume: 120,
        brewTime: '5:00',
        rating: 3.8,
        notes: 'Earthy with low acidity. Good for espresso-style drinks.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
        userId: 'currentUser',
        userName: 'You',
        userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        actionType: 'logged',
        coffeeId: 'coffee-4',
        recipeId: 'recipe5',
        roasterName: 'Starbucks Reserve'
      }
    ];
    
    setCoffeeEvents(prevEvents => {
      // Only add fake logs if there are no existing events
      if (prevEvents.length === 0) {
        return fakeLogs;
      }
      return prevEvents;
    });
  };

  // Function to get recipes for a specific coffee
  const getRecipesForCoffee = (coffeeId) => {
    // Get all recipes for this coffee
    const allRecipes = recipes.filter(recipe => recipe.coffeeId === coffeeId);
    
    // Create a map to store unique recipes by user
    const uniqueRecipes = new Map();
    
    // Process recipes in reverse order (newest first)
    allRecipes.reverse().forEach(recipe => {
      const key = `${recipe.userId}-${recipe.method}`;
      if (!uniqueRecipes.has(key)) {
        uniqueRecipes.set(key, recipe);
      }
    });
    
    // Convert map back to array and sort by timestamp
    return Array.from(uniqueRecipes.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // Function to add a new recipe
  const addRecipe = (recipe) => {
    const newRecipe = {
      id: recipe.id || `recipe-${Date.now()}`,
      timestamp: recipe.timestamp || new Date().toISOString(),
      ...recipe
    };
    setRecipes(prev => [...prev, newRecipe]);
    return newRecipe;
  };

  const value = {
    coffeeEvents,
    coffeeCollection,
    coffeeWishlist,
    favorites,
    recipes,
    isLoading,
    isAuthenticated,
    addCoffeeEvent,
    removeCoffeeEvent,
    hideEvent,
    unhideEvent,
    isEventHidden,
    addToCollection,
    removeFromCollection,
    addToWishlist,
    removeFromWishlist,
    toggleFavorite,
    setCoffeeCollection,
    setCoffeeWishlist,
    loadData,
    getRecipesForCoffee,
    addRecipe
  };

  return (
    <CoffeeContext.Provider value={value}>
      {children}
    </CoffeeContext.Provider>
  );
}

export function useCoffee() {
  return useContext(CoffeeContext);
} 