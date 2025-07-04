import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Update this URL with your new ngrok URL when it changes
const NGROK_URL = 'https://ca27-95-22-36-105.ngrok-free.app';

const supabaseUrl = 'https://wzawsiaanhriocxrabft.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6YXdzaWFhbmhyaW9jeHJhYmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NjI1MjEsImV4cCI6MjA2NzAzODUyMX0.oO6QH-0ZTwyRUOJTJ5KS7LbUG5dYbUnrJsI73bbOg1Q';

// For development: Set this to false to enable authentication
const SKIP_AUTH = false;

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// User Authentication Functions
export const signUp = async ({ email, password, userData }) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData?.user) {
      // Create user profile in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email: email,
            ...userData,
          },
        ]);

      if (profileError) throw profileError;
    }

    return { data: authData, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signIn = async ({ email, password }) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { error };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      return { data: { ...user, profile }, error: null };
    }
    
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

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
      user_id: user.id,
      coffee_id: event.coffeeId,
      coffee_name: event.coffeename || event.coffeeName,
      roaster: event.roaster || null,
      method: event.method || null,
      amount: event.amount || null,
      grind_size: event.grindsize || event.grindSize || null,
      water_volume: event.watervolume || event.waterVolume || null,
      brew_time: event.brewTime || null,
      rating: event.rating || null,
      notes: event.notes || null,
      is_public: event.ispublic !== undefined ? event.ispublic : (event.isPublic !== undefined ? event.isPublic : true),
      image_url: event.imageurl || event.imageUrl || null,
      bloom_time: event.bloomtime || event.bloomTime || null,
      bloom_water: event.bloomwater || event.bloomWater || null,
      pour2_time: event.pour2time || event.pour2Time || null,
      pour2_water: event.pour2water || event.pour2Water || null,
      pour3_time: event.pour3time || event.pour3Time || null,
      pour3_water: event.pour3water || event.pour3Water || null,
      type: event.type || 'coffee_log'
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
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