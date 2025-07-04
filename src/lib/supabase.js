import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Update this URL with your new ngrok URL when it changes
const NGROK_URL = 'https://ca27-95-22-36-105.ngrok-free.app';

const supabaseUrl = 'https://ryfqzshdgfrrkizlpnqg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZnF6c2hkZ2ZycmtpemxwbnFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDk4OTgsImV4cCI6MjA1OTk4NTg5OH0.by26_52LXWqzDUYkYA7zNUbqMdgU_QffVTi-GOhxCMM';

// For development: Set this to true to skip authentication
const SKIP_AUTH = true;

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      redirectTo: `${NGROK_URL}/auth/callback`,
    },
  }
);

// Helper function to save a coffee event
export const saveCoffeeEvent = async (event) => {
  try {
    // Skip authentication check for development
    if (SKIP_AUTH) {
      console.log('Development mode: Skipping authentication check');
      return {
        id: 'mock-event-id',
        ...event,
        timestamp: new Date().toISOString()
      };
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Create a database event object with lowercase column names to match the schema
    const dbEvent = {
      coffeename: event.coffeename || event.coffeeName,
      username: user.email,
      method: event.method || null,
      amount: event.amount || null,
      grindsize: event.grindsize || event.grindSize || null,
      watervolume: event.watervolume || event.waterVolume || null,
      "brewTime": event.brewTime || null,
      rating: event.rating || null,
      notes: event.notes || null,
      ispublic: event.ispublic !== undefined ? event.ispublic : (event.isPublic !== undefined ? event.isPublic : true),
      imageurl: event.imageurl || event.imageUrl || null,
      bloomtime: event.bloomtime || event.bloomTime || null,
      bloomwater: event.bloomwater || event.bloomWater || null,
      pour2time: event.pour2time || event.pour2Time || null,
      pour2water: event.pour2water || event.pour2Water || null,
      pour3time: event.pour3time || event.pour3Time || null,
      pour3water: event.pour3water || event.pour3Water || null
    };
    
    console.log('Saving coffee event:', dbEvent);
    
    const { data, error } = await supabase
      .from('coffee_events')
      .insert(dbEvent)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving coffee event:', error);
      throw new Error(`Failed to save coffee event: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error in saveCoffeeEvent:', error);
    throw error;
  }
};

// Helper function to get coffee events
export const getCoffeeEvents = async () => {
  try {
    // Skip authentication check for development
    if (SKIP_AUTH) {
      console.log('Development mode: Skipping authentication check');
      return [];
    }
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      throw new Error('Authentication error. Please sign in again.');
    }
    
    if (!user) {
      throw new Error('You must be signed in to view coffee events');
    }
    
    // Query coffee events for the current user
    const { data, error } = await supabase
      .from('coffee_events')
      .select('*')
      .eq('username', user.email)
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching coffee events:', error);
      throw new Error(`Failed to fetch coffee events: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error in getCoffeeEvents:', error);
    throw error;
  }
};

// Collection operations
export const saveToCollection = async (coffee) => {
  try {
    // Skip authentication check for development
    if (SKIP_AUTH) {
      console.log('Development mode: Skipping authentication check');
      return coffee;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('collection')
      .insert([{ ...coffee, username: user.email }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in saveToCollection:', error);
    throw error;
  }
};

export const getCollection = async () => {
  try {
    // Skip authentication check for development
    if (SKIP_AUTH) {
      console.log('Development mode: Skipping authentication check');
      return [];
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('collection')
      .select('*')
      .eq('username', user.email);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in getCollection:', error);
    throw error;
  }
};

export const removeFromCollection = async (coffeeName) => {
  try {
    // Skip authentication check for development
    if (SKIP_AUTH) {
      console.log('Development mode: Skipping authentication check');
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('collection')
      .delete()
      .eq('name', coffeeName)
      .eq('username', user.email);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error in removeFromCollection:', error);
    throw error;
  }
};

// Wishlist operations
export const saveToWishlist = async (coffee) => {
  try {
    // Skip authentication check for development
    if (SKIP_AUTH) {
      console.log('Development mode: Skipping authentication check');
      return coffee;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('wishlist')
      .insert([{ ...coffee, username: user.email }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in saveToWishlist:', error);
    throw error;
  }
};

export const getWishlist = async () => {
  try {
    // Skip authentication check for development
    if (SKIP_AUTH) {
      console.log('Development mode: Skipping authentication check');
      return [];
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('username', user.email);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in getWishlist:', error);
    throw error;
  }
};

// Favorites operations
export const saveFavorites = async (favorites) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('favorites')
      .upsert({ username: user.email, favorites })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in saveFavorites:', error);
    throw error;
  }
};

export const getFavorites = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('favorites')
      .select('favorites')
      .eq('username', user.email)
      .single();
    
    if (error) throw error;
    return data?.favorites || [];
  } catch (error) {
    console.error('Error in getFavorites:', error);
    throw error;
  }
};

export const getUser = async () => {
  // For development: Return a fake user instead of checking auth
  return {
    id: 'fake-user-id',
    email: 'fake@example.com',
    user_metadata: {
      name: 'Fake User',
      avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg'
    }
  };

  // Original code commented out
  /*
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!session) throw new Error('Auth session missing!');
  return session.user;
  */
};

// Add coffee catalog operations
export const saveCoffee = async (coffee) => {
  try {
    // Skip authentication check for development / offline mode
    if (SKIP_AUTH) {
      console.log('Development mode: Skipping authentication – mock saveCoffee');
      return {
        ...coffee,
        id: coffee.id || `coffee-${Date.now()}`,
        created_at: new Date().toISOString()
      };
    }

    // Make sure we have an authenticated user (this also verifies the session)
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error('User not authenticated');

    // Insert coffee row – adjust column names to match database schema
    const { data, error } = await supabase
      .from('coffees')
      .insert([
        {
          id: coffee.id,
          name: coffee.name,
          roaster: coffee.roaster,
          origin: coffee.origin,
          region: coffee.region,
          producer: coffee.producer,
          altitude: coffee.altitude,
          varietal: coffee.varietal,
          process: coffee.process,
          profile: coffee.profile || coffee.description,
          price: coffee.price ? parseFloat(coffee.price) : null,
          description: coffee.description,
          image: coffee.image,
          roast_level: coffee.roastLevel,
          roast_date: coffee.roastDate,
          bag_size: coffee.bagSize,
          certifications: coffee.certifications,
          stats: coffee.stats,
          added_by: user.id,
          added_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving coffee:', error);
      throw new Error(`Failed to save coffee: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in saveCoffee:', error);
    throw error;
  }
}; 