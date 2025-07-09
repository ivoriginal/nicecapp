import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { 
  saveCoffeeEvent, 
  getCoffeeEvents, 
  saveToCollection as saveToCollectionLocal, 
  removeFromCollection as removeFromCollectionLocal,
  getCollection,
  saveToWishlist,
  removeFromWishlist,
  getWishlist,
  saveFavorites,
  getFavorites
} from '../lib/dataProvider';
import { supabase, saveToCollection as saveToCollectionDB } from '../lib/supabase';
import mockEvents from '../data/mockEvents.json';
import mockUsers from '../data/mockUsers.json';
import mockCoffees from '../data/mockCoffees.json';
import mockCoffeesData from '../data/mockCoffees.json';
import mockRecipes from '../data/mockRecipes.json';
import dataService from '../services/dataService';

// Helper function to map Supabase profile format to app format
const mapSupabaseProfileToAppFormat = (supabaseProfile) => {
  if (!supabaseProfile) return null;
  
  return {
    id: supabaseProfile.id,
    email: supabaseProfile.email,
    userName: supabaseProfile.full_name || supabaseProfile.username || supabaseProfile.email?.split('@')[0] || 'User',
    userHandle: supabaseProfile.username || supabaseProfile.email?.split('@')[0] || 'user',
    userAvatar: supabaseProfile.avatar_url,
    location: supabaseProfile.location || '',
    bio: supabaseProfile.bio,
    gear: supabaseProfile.gear || [],
    gearWishlist: supabaseProfile.gearWishlist || [],
    // Keep original Supabase fields as well for compatibility
    full_name: supabaseProfile.full_name,
    username: supabaseProfile.username,
    avatar_url: supabaseProfile.avatar_url,
    created_at: supabaseProfile.created_at,
    updated_at: supabaseProfile.updated_at
  };
};

// Create the context with a default value
const CoffeeContext = createContext({
  coffeeEvents: [],
  coffeeCollection: [],
  coffeeWishlist: [],
  favorites: [],
  recipes: [],
  userAddedCoffees: [], // Add state for user-added coffees
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
  addCoffeeToCatalog: () => {}, // Add function for adding coffee to global catalog
  getAllAvailableCoffees: () => [], // Add function to get all coffees
  switchAccount: () => {},
  signIn: () => {},
  signOut: () => {},
  followUser: () => {},
  unfollowUser: () => {},
  isFollowing: () => false,
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
  const [userAddedCoffees, setUserAddedCoffees] = useState([]); // State for user-added coffees
  const [hiddenEvents, setHiddenEvents] = useState(new Set());
  const [currentAccount, setCurrentAccount] = useState(null); // Will be set to real Supabase user ID
  const [allEvents, setAllEvents] = useState([]); // All events from all users
  const [following, setFollowing] = useState([]); // Users that the current user follows
  const [followers, setFollowers] = useState([]); // Users that follow the current user
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Remove mock accounts - use real Supabase users only
  const [accounts] = useState([]); // Empty array since we're using real auth

  // Initialize on mount
  useEffect(() => {
    console.log('CoffeeContext initializing...');
    console.log('Initial authentication state:', isAuthenticated);
    console.log('Initial current account:', currentAccount);
    
    // Check for existing session on initialization
    const checkExistingSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        if (session?.user?.id) {
          console.log('Found existing session for user:', session.user.id);
          setCurrentAccount(session.user.id);
          setIsAuthenticated(true);
          await loadData(session.user.id);
        } else {
          console.log('No existing session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user?.id) {
        console.log('User signed in:', session.user.id);
        setCurrentAccount(session.user.id);
        setIsAuthenticated(true);
        // Only load data if we don't already have it for this user
        if (!user || user.id !== session.user.id) {
          await loadData(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setCurrentAccount(null);
        setIsAuthenticated(false);
        setUser(null);
        setCoffeeEvents([]);
        setCoffeeCollection([]);
        setCoffeeWishlist([]);
        setFavorites([]);
        setRecipes([]);
        setAllEvents([]);
        setFollowing([]);
        setFollowers([]);
        setInitialized(false);
        setError(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user?.id) {
        console.log('Token refreshed for user:', session.user.id);
        // Update current account if needed but don't reload data
        if (currentAccount !== session.user.id) {
          setCurrentAccount(session.user.id);
          setIsAuthenticated(true);
          // Only load data if the user ID changed
          if (!user || user.id !== session.user.id) {
            await loadData(session.user.id);
          }
        }
      }
    });

    // Only check session if we're not already authenticated
    if (!isAuthenticated && !currentAccount) {
      checkExistingSession();
    } else if (!isAuthenticated) {
      setLoading(false);
    }

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []); // Empty dependency array to run only once on mount

  // Load data for a specific account - memoized to prevent re-renders
  const loadData = useCallback(async (accountToLoad) => {
    console.log('=== LOADDATA DEBUG ===');
    console.log('accountToLoad:', accountToLoad);
    console.log('typeof accountToLoad:', typeof accountToLoad);
    console.log('loading state:', loading);
    
    if (!accountToLoad) {
      console.error('No account ID provided to loadData');
      console.error('accountToLoad is:', accountToLoad);
      setError('No account ID provided');
      return;
    }

    if (loading) {
      console.log('Already loading data, skipping loadData');
      return;
    }

    console.log('Loading data for account:', accountToLoad);
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting to fetch profile from Supabase...');
      
      // Get the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', accountToLoad)
        .single();

      console.log('Supabase profile query result:', { profile, profileError });

      if (profileError) {
        // If profile doesn't exist (PGRST116 error), try to create one from auth user
        if (profileError.code === 'PGRST116') {
          console.log('Profile not found, attempting to create from auth user...');
          
          try {
            // Get the auth user data
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user || user.id !== accountToLoad) {
              throw new Error('Unable to get auth user data');
            }
            
            // First, check if a profile exists with this email (but different ID)
            const { data: existingProfile, error: existingProfileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', user.email)
              .single();
            
            if (existingProfile && !existingProfileError) {
              console.log('Found existing profile with same email:', existingProfile);
              const mappedProfile = mapSupabaseProfileToAppFormat(existingProfile);
              setUser(mappedProfile);
            } else {
              // Create a basic profile
              const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
              const full_name = user.user_metadata?.full_name || username;
              
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert([
                  {
                    id: user.id,
                    email: user.email,
                    username: username,
                    full_name: full_name,
                    avatar_url: user.user_metadata?.avatar_url || null,
                    bio: user.user_metadata?.bio || null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }
                ])
                .select()
                .single();
                
              if (createError) {
                console.error('Error creating profile:', createError);
                
                // If it's still a duplicate key error, try to find the profile by email again
                if (createError.code === '23505') {
                  const { data: duplicateProfile, error: duplicateError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('email', user.email)
                    .single();
                    
                  if (duplicateProfile && !duplicateError) {
                    console.log('Using existing profile found after duplicate error:', duplicateProfile);
                    const mappedProfile = mapSupabaseProfileToAppFormat(duplicateProfile);
                    setUser(mappedProfile);
                  } else {
                    throw new Error('Profile creation failed due to duplicate constraint');
                  }
                } else {
                  throw new Error('Failed to create user profile');
                }
              } else {
                console.log('Successfully created profile:', newProfile);
                const mappedProfile = mapSupabaseProfileToAppFormat(newProfile);
                setUser(mappedProfile);
              }
            }
          } catch (createProfileError) {
            console.error('Error creating profile:', createProfileError);
            
            // Fallback: create a minimal user object from auth data
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (user && !userError) {
              const fallbackUser = {
                id: user.id,
                email: user.email,
                username: user.email?.split('@')[0] || 'user',
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                avatar_url: user.user_metadata?.avatar_url || null,
                bio: null
              };
              console.log('Using fallback user object:', fallbackUser);
              const mappedFallback = mapSupabaseProfileToAppFormat(fallbackUser);
              setUser(mappedFallback);
            } else {
              throw new Error('Failed to create or load user profile');
            }
          }
        } else {
          console.error('Error fetching profile:', profileError);
          throw new Error('Failed to fetch profile data');
        }
      } else if (!profile) {
        console.error('Profile not found for account:', accountToLoad);
        throw new Error('Profile not found');
      } else {
        console.log('Setting user profile:', profile);
        const mappedProfile = mapSupabaseProfileToAppFormat(profile);
        setUser(mappedProfile);
      }
      
      // Load coffee events from Supabase
      console.log('Loading coffee events from Supabase...');
      console.log('=== LOADING COFFEE EVENTS DEBUG ===');
      console.log('Loading events for user_id:', accountToLoad);
      console.log('Profile object:', profile);
      
      let { data: coffeeEventsData, error: eventsError } = await supabase
        .from('coffee_events')
        .select('*')
        .eq('user_id', accountToLoad)
        .order('created_at', { ascending: false });

      console.log('=== COFFEE EVENTS QUERY RESULT ===');
      console.log('Events found:', coffeeEventsData?.length || 0);
      console.log('Query error:', eventsError);
      console.log('Raw events data:', coffeeEventsData);

      // Remove any legacy seeded test events that were inserted previously
      const seededCoffeeNames = ['Ethiopia Yirgacheffe', 'Colombia Huila', 'Kenya Nyeri'];
      if (coffeeEventsData && coffeeEventsData.length > 0) {
        const seedIds = coffeeEventsData
          .filter(ev => seededCoffeeNames.includes(ev.coffee_name))
          .map(ev => ev.id);

        if (seedIds.length > 0) {
          console.log('Cleaning up legacy seeded events:', seedIds);
          const { error: deleteError } = await supabase
            .from('coffee_events')
            .delete()
            .in('id', seedIds);

          if (deleteError) {
            console.error('Failed to delete seeded events:', deleteError);
          }

          // Filter them out locally as well
          coffeeEventsData = coffeeEventsData.filter(ev => !seedIds.includes(ev.id));
        }
      }

      if (eventsError) {
        console.error('Error loading coffee events:', eventsError);
      } else {
        console.log(`Loaded ${coffeeEventsData?.length || 0} coffee events from Supabase`);
        
        // Transform Supabase events to UI format
        const transformedEvents = (coffeeEventsData || []).map(event => ({
          id: event.id,
          coffeeId: event.coffee_id,
          coffeeName: event.coffee_name,
          roaster: event.roaster,
          imageUrl: event.image_url,
          rating: event.rating,
          date: event.created_at,
          brewingMethod: event.brewing_method,
          grindSize: event.grind_size,
          waterVolume: event.water_volume,
          brewTime: event.brew_time,
          amount: event.amount,
          notes: event.notes,
          userId: event.user_id,
          userName: profile?.full_name || profile?.username || profile?.email?.split('@')[0] || 'User',
          userAvatar: profile?.avatar_url,
          friends: event.friends ? JSON.parse(event.friends) : [],
          location: event.location,
          isPublic: event.is_public,
          hasRecipe: event.has_recipe,
          originalRecipe: event.recipe_data ? JSON.parse(event.recipe_data) : null,
          timestamp: event.created_at
        }));
        
        setCoffeeEvents(transformedEvents);
        setAllEvents(transformedEvents);

        // === Fallback: load public events for new users with no posts ===
        if (transformedEvents.length === 0) {
          try {
            // Fetch recent public events from Supabase for discovery feed
            const { data: publicEvents, error: publicEventsError } = await supabase
              .from('coffee_events')
              .select('*')
              .eq('is_public', true)
              .order('created_at', { ascending: false })
              .limit(20);

            if (!publicEventsError && publicEvents && publicEvents.length > 0) {
              // Get unique author IDs
              const authorIds = [...new Set(publicEvents.map(ev => ev.user_id))];

              // Fetch author profiles in one query
              const { data: authorProfiles, error: authorProfilesError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', authorIds);

              const profileMap = {};
              if (!authorProfilesError && authorProfiles) {
                authorProfiles.forEach(p => {
                  profileMap[p.id] = p;
                });
              }

              const fallbackEvents = publicEvents
                .filter(ev => profileMap[ev.user_id]) // ensure author exists
                .map(ev => {
                const author = profileMap[ev.user_id];
                return {
                  id: ev.id,
                  coffeeId: ev.coffee_id,
                  coffeeName: ev.coffee_name,
                  roaster: ev.roaster,
                  imageUrl: ev.image_url,
                  rating: ev.rating,
                  date: ev.created_at,
                  brewingMethod: ev.brewing_method,
                  grindSize: ev.grind_size,
                  waterVolume: ev.water_volume,
                  brewTime: ev.brew_time,
                  amount: ev.amount,
                  notes: ev.notes,
                  userId: ev.user_id,
                  userName: author.full_name || author.username || author.email?.split('@')[0] || 'User',
                  userAvatar: author.avatar_url,
                  friends: ev.friends ? JSON.parse(ev.friends) : [],
                  location: ev.location,
                  isPublic: ev.is_public,
                  hasRecipe: ev.has_recipe,
                  originalRecipe: ev.recipe_data ? JSON.parse(ev.recipe_data) : null,
                  timestamp: ev.created_at
                };
              });

              // Show discovery feed on Home only – don't mix into user's personal timeline
              setAllEvents(fallbackEvents);
            } else if (publicEventsError) {
              console.error('Error fetching fallback events:', publicEventsError);
            }
          } catch (fallbackErr) {
            console.error('Unexpected error fetching fallback events:', fallbackErr);
          }
        }
      }

      // Initialize empty collections for new users
      setCoffeeCollection([]);
      setCoffeeWishlist([]);
      setFavorites([]);
      setRecipes([]);
      
      // Get all other users for following/followers
      const { data: otherProfiles, error: otherProfilesError } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', accountToLoad);

      if (otherProfilesError) {
        console.error('Error fetching other profiles:', otherProfilesError);
      } else {
        setFollowing(otherProfiles || []);
        setFollowers(otherProfiles || []);
      }

      setInitialized(true);
      console.log('CoffeeContext - Data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message);
      setInitialized(false);
    } finally {
      setLoading(false);
      console.log('CoffeeContext - Loading complete');
    }
  }, [loading]);

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
  
  // Function to switch between accounts - since we're using real auth, this just refreshes current user data
  const switchAccount = useCallback(async (account) => {
    try {
      console.log('CoffeeContext - Refreshing user data for account:', account);
      
      // For real authentication, we don't switch accounts, we just refresh the current user's data
      if (account && account === currentAccount) {
        console.log('Refreshing data for current authenticated user');
        await loadData(account);
      } else {
        console.warn('Cannot switch to different account with real authentication');
        throw new Error('Account switching not supported with real authentication');
      }
    } catch (error) {
      console.error('Error refreshing account data:', error);
      setError('Failed to refresh account data');
    }
  }, [currentAccount, loadData]);

  const addCoffeeEvent = async (eventData) => {
    try {
      console.log('=== ADDCOFFEEEVENT DEBUG ===');
      console.log('Adding coffee event for user:', currentAccount, user?.id);
      console.log('User object:', user);
      console.log('Event data:', eventData);
      
      if (!currentAccount || !user?.id) {
        throw new Error('No authenticated user found');
      }

      // Create event data for Supabase with proper structure
      const supabaseEventData = {
        user_id: user.id, // Use the authenticated user's ID
        coffee_name: eventData.coffeeName || eventData.name,
        coffee_id: eventData.coffeeId,
        rating: eventData.rating || null,
        notes: eventData.notes || '',
        brewing_method: eventData.brewingMethod || eventData.method || null,
        grind_size: eventData.grindSize || null,
        water_volume: eventData.waterVolume || null,
        brew_time: eventData.brewTime || null,
        amount: eventData.amount || null,
        roaster: eventData.roaster || null,
        location: eventData.location || null,
        image_url: eventData.imageUrl || null,
        is_public: eventData.isPublic !== undefined ? eventData.isPublic : true,
        friends: eventData.friends ? JSON.stringify(eventData.friends) : null,
        has_recipe: eventData.hasRecipe || false,
        recipe_data: eventData.originalRecipe ? JSON.stringify(eventData.originalRecipe) : null
      };

      console.log('=== SAVING TO SUPABASE ===');
      console.log('Saving to Supabase with user_id:', supabaseEventData.user_id);
      console.log('Full supabase event data:', supabaseEventData);

      // Save to Supabase
      const { data: savedEvent, error: saveError } = await supabase
        .from('coffee_events')
        .insert([supabaseEventData])
        .select()
        .single();

      if (saveError) {
        console.error('Error saving to Supabase:', saveError);
        throw new Error(`Failed to save coffee event: ${saveError.message}`);
      }

      console.log('Successfully saved to Supabase:', savedEvent);

      // Create a display event object for the UI
      const newEvent = {
        id: savedEvent.id,
        type: eventData.type || 'coffee_log',
        coffeeId: eventData.coffeeId,
        coffeeName: eventData.coffeeName || eventData.name,
        roaster: eventData.roaster,
        imageUrl: eventData.imageUrl,
        rating: eventData.rating,
        date: savedEvent.created_at,
        brewingMethod: eventData.brewingMethod || eventData.method,
        grindSize: eventData.grindSize,
        notes: eventData.notes,
        userId: user.id,
        userName: user.full_name || user.username || user.email?.split('@')[0] || 'User',
        userAvatar: user.avatar_url,
        friends: eventData.friends || [],
        location: eventData.location,
        isPublic: eventData.isPublic !== undefined ? eventData.isPublic : true,
        hasRecipe: eventData.hasRecipe || false,
        originalRecipe: eventData.originalRecipe || null,
        timestamp: savedEvent.created_at
      };
      
      // Log the new event data for debugging
      console.log('Adding new coffee event to UI state:', {
        eventId: newEvent.id,
        friends: newEvent.friends,
        friendsCount: newEvent.friends?.length
      });
      
      // Add the new event to the coffeeEvents state
      setCoffeeEvents(prevEvents => [newEvent, ...prevEvents]);
      
      // Add the new event to the allEvents state too
      setAllEvents(prevEvents => [newEvent, ...prevEvents]);
      
      // If this wasn't already an "added_to_collection" event, automatically add the coffee to the collection
      if (eventData.type !== 'added_to_collection') {
        const coffeeData = {
          id: newEvent.coffeeId,
          name: newEvent.coffeeName,
          roaster: newEvent.roaster,
          image: newEvent.imageUrl,
          origin: eventData.origin || '',
          process: eventData.process || '',
          roastLevel: eventData.roastLevel || 'Medium'
        };

        setCoffeeCollection(prevCollection => {
          const isInCollection = prevCollection.some(c => c.id === newEvent.coffeeId);
          if (!isInCollection) {
            console.log('Automatically adding coffee to collection after logging event:', coffeeData.name);
            const coffeeItem = {
              id: coffeeData.id,
              name: coffeeData.name,
              roaster: coffeeData.roaster || '',
              image: coffeeData.image || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
              origin: coffeeData.origin || '',
              process: coffeeData.process || '',
              roastLevel: coffeeData.roastLevel || 'Medium',
              timestamp: new Date().toISOString(),
              userId: user.id
            };
            return [...prevCollection, coffeeItem];
          }
          return prevCollection;
        });
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
  const removeCoffeeEvent = async (eventId) => {
    try {
      console.log('Removing coffee event with ID:', eventId);

      // Optimistic UI update – remove from local state first
      setCoffeeEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
      setAllEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));

      if (accountData[currentAccount] && accountData[currentAccount].coffeeEvents) {
        accountData[currentAccount].coffeeEvents = accountData[currentAccount].coffeeEvents.filter(
          event => event.id !== eventId
        );
      }

      // Persist deletion to Supabase
      if (eventId) {
        const { error: deleteError } = await supabase
          .from('coffee_events')
          .delete()
          .eq('id', eventId)
          .eq('user_id', user?.id);

        if (deleteError) {
          console.error('Supabase delete error:', deleteError);
          // Re-add event locally if deletion failed so UI stays consistent
          // NOTE: Ideally we would re-fetch from backend, but this is simpler for now.
          throw deleteError;
        }
      }

      return true;
    } catch (err) {
      console.error('Error removing event:', err);
      setError(err.message || 'Failed to delete coffee log');
      return false;
    }
  };

  // Add to collection function - implements the "Mark as Tried" button functionality
  const addToCollection = async (coffee) => {
    console.log('Adding coffee to collection:', coffee.name);
    
    // First, add the coffee to the global catalog if it's a new user-added coffee
    if (coffee.id && coffee.id.startsWith('coffee-')) {
      addCoffeeToCatalog(coffee);
    }
    
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

      // Persist the collection entry to Supabase
      try {
        await saveToCollectionDB(coffeeItem);
        console.log('Saved coffee to Supabase collection');
      } catch (error) {
        console.error('Error saving coffee to Supabase:', error);
      }

      // Create an event indicating the user added this coffee to their collection
      try {
        await addCoffeeEvent({
          type: 'added_to_collection',
          coffeeId: coffeeItem.id,
          coffeeName: coffeeItem.name,
          roaster: coffeeItem.roaster,
          imageUrl: coffeeItem.image
        });
      } catch (error) {
        console.error('Error creating collection event:', error);
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
  const updateRecipe = async (updatedRecipe) => {
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
        
        // Persist to Supabase
        try {
          await dataService.updateRecipeInDb(updatedRecipe.id, updatedRecipe);
          console.log('Recipe updated in Supabase successfully');
        } catch (error) {
          console.error('Error updating recipe in Supabase:', error);
          // Revert the state if the update fails
          const revertedRecipes = [...recipes];
          revertedRecipes[recipeIndex] = recipes[recipeIndex];
          setRecipes(revertedRecipes);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
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

  // Add coffee to global catalog (for discovery)
  const addCoffeeToCatalog = (coffee) => {
    console.log('Adding coffee to global catalog:', coffee.name);
    
    // Create a standardized coffee object for the catalog
    const catalogCoffee = {
      id: coffee.id,
      name: coffee.name,
      roaster: coffee.roaster || '',
      origin: coffee.origin || '',
      region: coffee.region || '',
      producer: coffee.producer || '',
      altitude: coffee.altitude || '',
      varietal: coffee.varietal || '',
      process: coffee.process || '',
      profile: coffee.profile || coffee.description || '',
      price: parseFloat(coffee.price) || 0,
      description: coffee.description || '',
      image: coffee.image || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
      roastLevel: coffee.roastLevel || 'Medium',
      roastDate: coffee.roastDate || '',
      bagSize: coffee.bagSize || '',
      certifications: coffee.certifications || '',
      stats: coffee.stats || null,
      addedBy: currentAccount,
      addedAt: new Date().toISOString(),
      isUserAdded: true
    };
    
    // Check if this coffee is already in the catalog
    const isInCatalog = userAddedCoffees.some(c => c.id === coffee.id);
    
    if (!isInCatalog) {
      // Add to user-added coffees state
      setUserAddedCoffees(prev => [...prev, catalogCoffee]);
      console.log('Coffee added to catalog successfully');
    } else {
      console.log('Coffee already exists in catalog');
    }
    
    return catalogCoffee;
  };

  // Get all available coffees (mock + user-added)
  const getAllAvailableCoffees = () => {
    // Get mock coffees
    const mockCoffeesList = mockCoffees?.coffees || [];
    
    // Create a Map to track unique coffees by ID
    const uniqueCoffees = new Map();
    
    // Add mock coffees first
    mockCoffeesList.forEach(coffee => {
      uniqueCoffees.set(coffee.id, coffee);
    });
    
    // Add user-added coffees, overwriting mock coffees if IDs match
    userAddedCoffees.forEach(coffee => {
      uniqueCoffees.set(coffee.id, coffee);
    });
    
    // Convert Map back to array
    const allCoffees = Array.from(uniqueCoffees.values());
    
    // Sort the coffees
    return allCoffees.sort((a, b) => {
      // Put user-added coffees first (newest first)
      if (a.isUserAdded && !b.isUserAdded) return -1;
      if (!a.isUserAdded && b.isUserAdded) return 1;
      if (a.isUserAdded && b.isUserAdded) {
        return new Date(b.addedAt) - new Date(a.addedAt);
      }
      return a.name.localeCompare(b.name);
    });
  };

  // Authentication functions
  const signIn = async () => {
    console.log('SignIn function called - auth state listener will handle the rest');
    // The auth state listener will automatically handle:
    // - Setting currentAccount
    // - Setting isAuthenticated
    // - Loading user data
    // So we don't need to do anything here
  };

  const signOut = async () => {
    console.log('Signing out...');
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Reset all state
      setCurrentAccount(null);
      setIsAuthenticated(false);
      setUser(null);
      setCoffeeEvents([]);
      setCoffeeCollection([]);
      setCoffeeWishlist([]);
      setFavorites([]);
      setRecipes([]);
      setAllEvents([]);
      setFollowing([]);
      setFollowers([]);
      setInitialized(false);
      setError(null);
    } catch (error) {
      console.error('Error during sign out:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Follow a user
  const followUser = async (userIdToFollow) => {
    try {
      // Update local state immediately for better UX
      setFollowing(prev => [...prev, userIdToFollow]);

      // Update in database
      const { error } = await supabase
        .from('follows')
        .insert([
          { follower_id: currentAccount, following_id: userIdToFollow }
        ]);

      if (error) {
        // Revert on error
        setFollowing(prev => prev.filter(id => id !== userIdToFollow));
        throw error;
      }

      // Trigger notification for the followed user
      await supabase
        .from('notifications')
        .insert([{
          user_id: userIdToFollow,
          type: 'follow',
          actor_id: currentAccount,
          read: false
        }]);

      // Reload data to get updated follower counts
      await loadData(currentAccount);

    } catch (error) {
      console.error('Error following user:', error.message || error);
      throw error;
    }
  };

  // Unfollow a user
  const unfollowUser = async (userIdToUnfollow) => {
    try {
      // Update local state immediately for better UX
      setFollowing(prev => prev.filter(id => id !== userIdToUnfollow));

      // Update in database
      const { error } = await supabase
        .from('follows')
        .delete()
        .match({ 
          follower_id: currentAccount, 
          following_id: userIdToUnfollow 
        });

      if (error) {
        // Revert on error
        setFollowing(prev => [...prev, userIdToUnfollow]);
        throw error;
      }

      // Reload data to get updated follower counts
      await loadData(currentAccount);

    } catch (error) {
      console.error('Error unfollowing user:', error.message || error);
      throw error;
    }
  };

  // Check if following a user
  const isFollowing = (userId) => {
    return following.includes(userId);
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    coffeeEvents,
    coffeeCollection,
    coffeeWishlist,
    favorites,
    recipes,
    userAddedCoffees,
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
    addCoffeeToCatalog,
    getAllAvailableCoffees,
    switchAccount,
    loadSavedRecipes,
    setRecipes,
    updateRecipe,
    signIn,
    signOut,
    followUser,
    unfollowUser,
    isFollowing,
  }), [
    coffeeEvents,
    coffeeCollection,
    coffeeWishlist,
    favorites,
    recipes,
    userAddedCoffees,
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
    addCoffeeToCatalog,
    getAllAvailableCoffees,
    switchAccount,
    loadSavedRecipes,
    setRecipes,
    updateRecipe,
    signIn,
    signOut,
    followUser,
    unfollowUser,
    isFollowing,
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
