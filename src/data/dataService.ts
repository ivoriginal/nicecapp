const { supabase } = require('../lib/supabase');
const mockUsers = require('./mockUsers.json');
const mockCoffees = require('./mockCoffees.json');
const mockCafes = require('./mockCafes.json');
const mockEvents = require('./mockEvents.json');
const mockGear = require('./mockGear.json');
const mockRecipes = require('./mockRecipes.json');

// Flag to toggle between mock and real data
const MOCK_MODE = false;

// Add connection check function
const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count');
    if (error) {
      console.error('❌ Supabase connection error:', error.message);
      return false;
    }
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
    return false;
  }
};

// Add logging to key functions
const getUsers = async () => {
  console.log(`🔍 getUsers called - Using ${MOCK_MODE ? 'mock' : 'Supabase'} data`);
  if (MOCK_MODE) {
    console.log('Returning mock users:', mockUsers.users.length);
    return mockUsers.users;
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*');
    
  if (error) {
    console.error('❌ Supabase error:', error.message);
    throw error;
  }
  console.log('✅ Fetched users from Supabase:', data?.length);
  return data;
};

const getCoffees = async () => {
  console.log(`🔍 getCoffees called - Using ${MOCK_MODE ? 'mock' : 'Supabase'} data`);
  if (MOCK_MODE) {
    console.log('Returning mock coffees:', mockCoffees.coffees.length);
    return mockCoffees.coffees;
  }
  
  const { data, error } = await supabase
    .from('coffees')
    .select('*');
    
  if (error) {
    console.error('❌ Supabase error:', error.message);
    throw error;
  }
  console.log('✅ Fetched coffees from Supabase:', data?.length);
  return data;
};

// Types
export type User = typeof mockUsers.users[0];
export type SuggestedUser = typeof mockUsers.suggestedUsers[0];
export type Coffee = typeof mockCoffees.coffees[0];
export type CoffeeSuggestion = typeof mockCoffees.coffeeSuggestions[0];
export type Seller = typeof mockCoffees.sellers["coffee-villa-rosario"][0];
export type Business = typeof mockCafes.roasters[0];
export type GoodCafe = typeof mockCafes.cafes[0];
export type CoffeeEvent = typeof mockEvents.coffeeEvents[0];
export type Notification = typeof mockEvents.notifications[0];
export type Gear = typeof mockGear.gear[0];
export type Recipe = typeof mockRecipes.recipes[0];

// User functions
export const getUserById = async (userId: string): Promise<User | undefined> => {
  if (MOCK_MODE) {
    console.log("Mock getUserById called with:", userId);
    return mockUsers.users.find(user => user.id === userId);
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data;
};

export const getSuggestedUsers = async (): Promise<SuggestedUser[]> => {
  if (MOCK_MODE) {
    console.log("Mock getSuggestedUsers called");
    return mockUsers.suggestedUsers;
  }
  
  // For now, return random users as suggestions
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);
    
  if (error) throw error;
  return data;
};

// Coffee functions
export const getCoffeeById = async (coffeeId: string): Promise<Coffee | undefined> => {
  if (MOCK_MODE) {
    console.log("Mock getCoffeeById called with:", coffeeId);
    return mockCoffees.coffees.find(coffee => coffee.id === coffeeId);
  }
  
  const { data, error } = await supabase
    .from('coffees')
    .select('*')
    .eq('id', coffeeId)
    .single();
    
  if (error) throw error;
  return data;
};

export const getCoffeeSuggestions = async (): Promise<CoffeeSuggestion[]> => {
  if (MOCK_MODE) {
    console.log("Mock getCoffeeSuggestions called");
    return mockCoffees.coffeeSuggestions;
  }
  
  // For now, return random coffees as suggestions
  const { data, error } = await supabase
    .from('coffees')
    .select('*')
    .limit(5);
    
  if (error) throw error;
  return data;
};

export const getCoffeeSellers = async (coffeeId: string): Promise<Seller[]> => {
  if (MOCK_MODE) {
    console.log("Mock getCoffeeSellers called with:", coffeeId);
    return mockCoffees.sellers[coffeeId] || [];
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

// Business/Cafe functions
export const getBusinesses = async (): Promise<Business[]> => {
  if (MOCK_MODE) {
    console.log("Mock getBusinesses called");
    return mockCafes.roasters;
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

export const getBusinessById = async (businessId: string): Promise<Business | undefined> => {
  if (MOCK_MODE) {
    console.log("Mock getBusinessById called with:", businessId);
    return mockCafes.roasters.find(business => business.id === businessId);
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

export const getGoodCafes = async (): Promise<GoodCafe[]> => {
  if (MOCK_MODE) {
    console.log("Mock getGoodCafes called");
    const goodCafeIds = mockCafes.goodCafes || [];
    return goodCafeIds.map(cafeId => {
      return mockCafes.cafes.find(cafe => cafe.id === cafeId);
    }).filter(Boolean) as GoodCafe[];
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

// Event functions
export const getCoffeeEvents = async (): Promise<CoffeeEvent[]> => {
  if (MOCK_MODE) {
    console.log("Mock getCoffeeEvents called");
    return mockEvents.coffeeEvents;
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

export const getCoffeeEventsByUserId = async (userId: string): Promise<CoffeeEvent[]> => {
  if (MOCK_MODE) {
    console.log("Mock getCoffeeEventsByUserId called with:", userId);
    return mockEvents.coffeeEvents.filter(event => event.userId === userId);
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

export const addCoffeeEvent = async (newEvent: Omit<CoffeeEvent, "id">): Promise<CoffeeEvent> => {
  if (MOCK_MODE) {
    console.log("Mock addCoffeeEvent called with:", newEvent);
    // In a real app, this would add to the database
    // For now, we just generate a mock ID and return the complete event
    const id = `event-${Date.now()}`;
    const createdEvent = { ...newEvent, id } as CoffeeEvent;
    
    // Log the "write" action
    console.log("Mock write - New event:", createdEvent);
    
    return createdEvent;
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

// Notification functions
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  if (MOCK_MODE) {
    console.log("Mock getNotifications called for user:", userId);
    return mockEvents.notifications.filter(notification => notification.targetUserId === userId);
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  if (MOCK_MODE) {
    console.log("Mock markNotificationAsRead called for:", notificationId);
    // In a real app, this would update the database
    // For now, we just log that we would mark it as read
    console.log("Mock write - Marked notification as read:", notificationId);
    return true;
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

// Gear functions
export const getGear = async (): Promise<Gear[]> => {
  if (MOCK_MODE) {
    console.log("Mock getGear called");
    return mockGear.gear;
  }
  
  const { data, error } = await supabase
    .from('gear')
    .select('*');
    
  if (error) throw error;
  return data;
};

export const getGearById = async (gearId: string): Promise<Gear | undefined> => {
  if (MOCK_MODE) {
    console.log("Mock getGearById called with:", gearId);
    return mockGear.gear.find(item => item.id === gearId);
  }
  
  const { data, error } = await supabase
    .from('gear')
    .select('*')
    .eq('id', gearId)
    .single();
    
  if (error) throw error;
  return data;
};

// Recipe functions
export const getRecipes = async (): Promise<Recipe[]> => {
  if (MOCK_MODE) {
    console.log("Mock getRecipes called");
    return mockRecipes.recipes;
  }
  
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      author:profiles(id, full_name, avatar_url),
      coffee:coffees(id, name, roaster)
    `);
    
  if (error) throw error;
  return data;
};

export const getRecipeById = async (recipeId: string): Promise<Recipe | undefined> => {
  if (MOCK_MODE) {
    console.log("Mock getRecipeById called with:", recipeId);
    return mockRecipes.recipes.find(recipe => recipe.id === recipeId);
  }
  
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      author:profiles(id, full_name, avatar_url),
      coffee:coffees(id, name, roaster)
    `)
    .eq('id', recipeId)
    .single();
    
  if (error) throw error;
  return data;
};

export const getRecipesByCoffeeId = async (coffeeId: string): Promise<Recipe[]> => {
  if (MOCK_MODE) {
    console.log("Mock getRecipesByCoffeeId called with:", coffeeId);
    return mockRecipes.recipes.filter(recipe => recipe.coffeeId === coffeeId);
  }
  
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      author:profiles(id, full_name, avatar_url),
      coffee:coffees(id, name, roaster)
    `)
    .eq('coffee_id', coffeeId);
    
  if (error) throw error;
  return data;
};

export const addRecipe = async (newRecipe: Omit<Recipe, "id" | "date" | "likes" | "saves" | "savedUsers">): Promise<Recipe> => {
  if (MOCK_MODE) {
    console.log("Mock addRecipe called with:", newRecipe);
    const id = `recipe-${Date.now()}`;
    return {
      ...newRecipe,
      id,
      date: new Date().toISOString(),
      likes: 0,
      saves: 0,
      savedUsers: []
    } as Recipe;
  }
  
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      ...newRecipe,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select(`
      *,
      author:profiles(id, full_name, avatar_url),
      coffee:coffees(id, name, roaster)
    `)
    .single();
    
  if (error) throw error;
  return data;
};

export const updateRecipeInDb = async (recipeId: string, updates: Partial<Recipe>): Promise<Recipe> => {
  if (MOCK_MODE) {
    console.log("Mock updateRecipeInDb called with:", { recipeId, updates });
    return { ...updates, id: recipeId } as Recipe;
  }
  
  const { data, error } = await supabase
    .from('recipes')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', recipeId)
    .select(`
      *,
      author:profiles(id, full_name, avatar_url),
      coffee:coffees(id, name, roaster)
    `)
    .single();
    
  if (error) throw error;
  return data;
};

// Auth-related functions (placeholders for when you add Supabase Auth)
export const getCurrentUser = async (): Promise<User | null> => {
  if (MOCK_MODE) {
    console.log("Mock getCurrentUser called");
    return mockUsers.users[0];
  }
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  
  if (!user) return null;
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (profileError) throw profileError;
  return profile;
};

export const signIn = async (email: string, password: string): Promise<User | null> => {
  if (MOCK_MODE) {
    console.log("Mock signIn called with:", email);
    return mockUsers.users.find(user => user.email === email) || null;
  }
  
  const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (signInError) throw signInError;
  if (!user) return null;
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (profileError) throw profileError;
  return profile;
};

export const signOut = async (): Promise<void> => {
  if (MOCK_MODE) {
    console.log("Mock signOut called");
    return;
  }
  
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Example of how to toggle mock mode if needed
export const setMockMode = (enabled: boolean): void => {
  // This function is kept for testing purposes
  console.log(`Setting mock mode to: ${enabled}`);
};

// Add or update the getMockUser function to load from mockUsers.json
export const getMockUser = (userId: string) => {
  // This function is kept for testing purposes
  return mockUsers.users.find(user => user.id === userId);
};

// Add connection check to exports
module.exports = {
  checkSupabaseConnection,
  getUsers,
  getUserById,
  getSuggestedUsers,
  getCoffees,
  getCoffeeById,
  getCoffeeSuggestions,
  getGear,
  getGearById,
  getRecipes,
  getRecipeById,
  getRecipesByCoffeeId,
  addRecipe,
  getCurrentUser,
  signIn,
  signOut,
  setMockMode,
  getMockUser,
  updateRecipeInDb
}; 