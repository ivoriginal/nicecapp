const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use the same credentials as the main app
const supabaseUrl = 'https://wzawsiaanhriocxrabft.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6YXdzaWFhbmhyaW9jeHJhYmZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2MjUyMSwiZXhwIjoyMDY3MDM4NTIxfQ.vYqS61JkFG9TD84pugIKE5NoVojpVKMrK2R8YiXmhyM';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

// Load mock events
const mockEventsPath = path.join(__dirname, '../src/data/mockEvents.json');
const mockEvents = JSON.parse(fs.readFileSync(mockEventsPath, 'utf8'));

// Mock users mapping for creating profiles
const mockUsers = {
  'user1': {
    id: 'user1',
    email: 'ivo@example.com',
    full_name: 'Ivo Vilches',
    username: 'ivo_vilches',
    avatar_url: 'assets/users/ivo-vilches.jpg'
  },
  'user2': {
    id: 'user2',
    email: 'vertigo@example.com',
    full_name: 'Vértigo y Calambre',
    username: 'vertigo_calambre',
    avatar_url: 'assets/businesses/vertigo-logo.jpg',
    account_type: 'business'
  },
  'user3': {
    id: 'user3',
    email: 'carlos@example.com',
    full_name: 'Carlos Hernández',
    username: 'carlos_hernandez',
    avatar_url: 'assets/users/carlos-hernandez.jpg'
  },
  'user5': {
    id: 'user5',
    email: 'emma@example.com',
    full_name: 'Emma Garcia',
    username: 'emma_garcia',
    avatar_url: 'https://randomuser.me/api/portraits/women/33.jpg'
  },
  'user6': {
    id: 'user6',
    email: 'david@example.com',
    full_name: 'David Kim',
    username: 'david_kim',
    avatar_url: 'https://randomuser.me/api/portraits/men/45.jpg'
  },
  'user7': {
    id: 'user7',
    email: 'sophia@example.com',
    full_name: 'Sophia Miller',
    username: 'sophia_miller',
    avatar_url: 'https://randomuser.me/api/portraits/women/68.jpg'
  },
  'user8': {
    id: 'user8',
    email: 'james@example.com',
    full_name: 'James Wilson',
    username: 'james_wilson',
    avatar_url: 'https://randomuser.me/api/portraits/men/22.jpg'
  },
  'user9': {
    id: 'user9',
    email: 'olivia@example.com',
    full_name: 'Olivia Taylor',
    username: 'olivia_taylor',
    avatar_url: 'https://randomuser.me/api/portraits/women/12.jpg'
  },
  'user10': {
    id: 'user10',
    email: 'lucas@example.com',
    full_name: 'Lucas Brown',
    username: 'lucas_brown',
    avatar_url: 'https://randomuser.me/api/portraits/men/55.jpg'
  },
  'user11': {
    id: 'user11',
    email: 'elias@example.com',
    full_name: 'Elias Veris',
    username: 'elias_veris',
    avatar_url: 'assets/users/elias-veris.jpg'
  },
  'business-kima': {
    id: 'business-kima',
    email: 'kima@example.com',
    full_name: 'Kima Coffee',
    username: 'kima_coffee',
    avatar_url: 'assets/businesses/kima-logo.jpg',
    account_type: 'business'
  }
};

async function createUserProfiles() {
  console.log('Creating user profiles...');
  
  for (const [userId, userData] of Object.entries(mockUsers)) {
    try {
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        console.log(`Profile ${userId} already exists, skipping...`);
        continue;
      }

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          email: userData.email,
          full_name: userData.full_name,
          username: userData.username,
          avatar_url: userData.avatar_url,
          account_type: userData.account_type || 'personal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (profileError) {
        console.error(`Error creating profile for ${userId}:`, profileError);
      } else {
        console.log(`Created profile for ${userId}: ${userData.full_name}`);
      }
    } catch (error) {
      console.error(`Error processing profile ${userId}:`, error);
    }
  }
}

async function migrateEvents() {
  console.log('Migrating coffee events...');
  
  for (const event of mockEvents.coffeeEvents) {
    try {
      // Skip events that don't have required fields
      if (!event.userId || !event.coffeeName) {
        console.log(`Skipping event ${event.id} - missing required fields`);
        continue;
      }

      // Check if event already exists
      const { data: existingEvent, error: checkError } = await supabase
        .from('coffee_events')
        .select('id')
        .eq('id', event.id)
        .single();

      if (existingEvent) {
        console.log(`Event ${event.id} already exists, skipping...`);
        continue;
      }

      // Transform event data for Supabase
      const supabaseEvent = {
        id: event.id,
        user_id: event.userId,
        coffee_id: event.coffeeId,
        coffee_name: event.coffeeName,
        roaster: event.roaster,
        image_url: event.imageUrl,
        rating: event.rating ? parseInt(event.rating) : null,
        notes: event.notes || '',
        brewing_method: event.brewingMethod,
        grind_size: event.grindSize,
        water_volume: event.waterVolume,
        brew_time: event.brewTime,
        amount: event.amount,
        location: event.location,
        is_public: true,
        friends: event.friends ? JSON.stringify(event.friends) : null,
        has_recipe: event.hasRecipe || false,
        recipe_data: event.originalRecipe ? JSON.stringify(event.originalRecipe) : null,
        created_at: event.date || new Date().toISOString(),
        type: event.type || 'coffee_log'
      };

      // Handle special event types
      if (event.type === 'gear_added' || event.gearId) {
        supabaseEvent.gear_id = event.gearId;
        supabaseEvent.gear_name = event.gearName;
        supabaseEvent.gear_brand = event.gearBrand;
        supabaseEvent.gear_type = event.gearType;
      }

      // Insert event
      const { data: insertedEvent, error: insertError } = await supabase
        .from('coffee_events')
        .insert([supabaseEvent])
        .select()
        .single();

      if (insertError) {
        console.error(`Error inserting event ${event.id}:`, insertError);
      } else {
        console.log(`Migrated event ${event.id}: ${event.coffeeName || event.gearName || 'Unknown'}`);
      }
    } catch (error) {
      console.error(`Error processing event ${event.id}:`, error);
    }
  }
}

async function main() {
  try {
    console.log('Starting migration...');
    
    // First create user profiles
    await createUserProfiles();
    
    // Then migrate events
    await migrateEvents();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main }; 