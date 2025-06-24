import mockUsers from './mockUsers.json';
import mockCoffees from './mockCoffees.json';
import mockCafes from './mockCafes.json';
import mockEvents from './mockEvents.json';
import mockGear from './mockGear.json';
import mockRecipes from './mockRecipes.json';

// Flag to toggle between mock and real data
const MOCK_MODE = true;

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
export const getUsers = async (): Promise<User[]> => {
  if (MOCK_MODE) {
    console.log("Mock getUsers called");
    return mockUsers.users;
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

export const getUserById = async (userId: string): Promise<User | undefined> => {
  if (MOCK_MODE) {
    console.log("Mock getUserById called with:", userId);
    return mockUsers.users.find(user => user.id === userId);
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

export const getSuggestedUsers = async (): Promise<SuggestedUser[]> => {
  if (MOCK_MODE) {
    console.log("Mock getSuggestedUsers called");
    return mockUsers.suggestedUsers;
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

// Coffee functions
export const getCoffees = async (): Promise<Coffee[]> => {
  if (MOCK_MODE) {
    console.log("Mock getCoffees called");
    return mockCoffees.coffees;
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

export const getCoffeeById = async (coffeeId: string): Promise<Coffee | undefined> => {
  if (MOCK_MODE) {
    console.log("Mock getCoffeeById called with:", coffeeId);
    return mockCoffees.coffees.find(coffee => coffee.id === coffeeId);
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

export const getCoffeeSuggestions = async (): Promise<CoffeeSuggestion[]> => {
  if (MOCK_MODE) {
    console.log("Mock getCoffeeSuggestions called");
    return mockCoffees.coffeeSuggestions;
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
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
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

export const getGearById = async (gearId: string): Promise<Gear | undefined> => {
  if (MOCK_MODE) {
    console.log("Mock getGearById called with:", gearId);
    return mockGear.gear.find(item => item.id === gearId);
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

// Recipe functions
export const getRecipes = async (): Promise<Recipe[]> => {
  if (MOCK_MODE) {
    console.log("Mock getRecipes called");
    return mockRecipes.recipes;
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

export const getRecipeById = async (recipeId: string): Promise<Recipe | undefined> => {
  if (MOCK_MODE) {
    console.log("Mock getRecipeById called with:", recipeId);
    return mockRecipes.recipes.find(recipe => recipe.id === recipeId);
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

export const getRecipesByCoffeeId = async (coffeeId: string): Promise<Recipe[]> => {
  if (MOCK_MODE) {
    console.log("Mock getRecipesByCoffeeId called with:", coffeeId);
    return mockRecipes.recipes.filter(recipe => recipe.coffeeId === coffeeId);
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

export const addRecipe = async (newRecipe: Omit<Recipe, "id" | "date" | "likes" | "saves" | "savedUsers">): Promise<Recipe> => {
  if (MOCK_MODE) {
    console.log("Mock addRecipe called with:", newRecipe);
    // In a real app, this would add to the database
    // For now, we just generate a mock ID and return the complete recipe
    const id = `recipe-${Date.now()}`;
    const date = new Date().toISOString();
    const createdRecipe = { 
      ...newRecipe, 
      id,
      date,
      likes: 0,
      saves: 0,
      savedUsers: [],
      isTrending: false,
      type: "recipe"
    } as Recipe;
    
    // Log the "write" action
    console.log("Mock write - New recipe:", createdRecipe);
    
    return createdRecipe;
  }
  // Real API call would go here
  throw new Error("Real API not implemented yet");
};

// Auth-related functions (placeholders for when you add Supabase Auth)
export const getCurrentUser = async (): Promise<User | null> => {
  if (MOCK_MODE) {
    console.log("Mock getCurrentUser called");
    // For mock purposes, return the currentUser from mockUsers
    return mockUsers.users.find(user => user.id === "currentUser") || null;
  }
  // Real Supabase Auth call would go here
  throw new Error("Real API not implemented yet");
};

export const signIn = async (email: string, password: string): Promise<User | null> => {
  if (MOCK_MODE) {
    console.log("Mock signIn called with:", email);
    // For mock purposes, we'll just find a user with matching email
    const user = mockUsers.users.find(u => u.email === email);
    
    if (user) {
      console.log("Mock sign in successful");
      return user;
    }
    
    console.log("Mock sign in failed: user not found");
    return null;
  }
  // Real Supabase Auth call would go here
  throw new Error("Real API not implemented yet");
};

export const signOut = async (): Promise<void> => {
  if (MOCK_MODE) {
    console.log("Mock signOut called");
    // Nothing to do in mock mode
    return;
  }
  // Real Supabase Auth call would go here
  throw new Error("Real API not implemented yet");
};

// Example of how to toggle mock mode if needed
export const setMockMode = (enabled: boolean): void => {
  // This would be used during development or testing
  (MOCK_MODE as any) = enabled;
};

// Add or update the getMockUser function to load from mockUsers.json
export const getMockUser = (userId: string) => {
  console.log("Mock getMockUser called with:", userId);
  if (!mockUsers || !mockUsers.users) {
    console.warn('mockUsers data is not available');
    return null;
  }
  return mockUsers.users.find(user => user.id === userId);
}; 