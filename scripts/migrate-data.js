import { supabase } from './supabase.js';
import { loadJSON } from './utils.js';
import { v4 as uuidv4 } from 'uuid';

async function addUsernameColumn() {
  try {
    const { error } = await supabase.rpc('add_username_column');
    
    if (error) {
      console.error('Error adding username column:', error);
    } else {
      console.log('Successfully added username column');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Create a mapping of old IDs to new UUIDs
const userIdMap = {};

const coffeeIdMap = {};

async function migrateData() {
  try {
    // First migrate coffees since they're referenced by other tables
    console.log('Migrating coffees...');
    const mockCoffeesData = await loadJSON('../src/data/mockCoffees.json');
    for (const coffee of mockCoffeesData.coffees) {
      // Generate and store a new UUID for this coffee
      const newCoffeeId = uuidv4();
      coffeeIdMap[coffee.id] = newCoffeeId;

      const { error } = await supabase
        .from('coffees')
        .upsert({
          id: newCoffeeId,
          name: coffee.name,
          roaster: coffee.roaster,
          origin: coffee.origin,
          process: coffee.process,
          roast_level: coffee.roastLevel || 'medium',
          tasting_notes: coffee.profile,
          description: coffee.description,
          price: coffee.price,
          image_url: coffee.image || coffee.images?.[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error(`Error migrating coffee ${coffee.name}:`, error);
      } else {
        console.log(`Successfully migrated coffee ${coffee.name}`);
      }
    }

    // Then migrate users
    console.log('Migrating users...');
    const mockUsersData = await loadJSON('../src/data/mockUsers.json');
    for (const user of mockUsersData.users) {
      // First, check if the user already exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(`Error fetching user ${user.email}:`, fetchError);
        continue;
      }

      let userId;
      if (existingUser) {
        userId = existingUser.id;
        console.log(`User ${user.email} already exists with ID ${userId}`);
      } else {
        userId = uuidv4();
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: user.email,
            full_name: user.fullName || user.userName,
            avatar_url: user.avatarUrl || user.userAvatar,
            bio: user.bio || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error(`Error migrating user ${user.email}:`, profileError);
          continue;
        }
        console.log(`Successfully migrated user ${user.email}`);
      }

      // Store the user ID mapping
      userIdMap[user.id] = userId;

      // Now that both users and coffees exist, we can add saved coffees
      if (user.savedCoffees && user.savedCoffees.length > 0) {
        for (const coffee of user.savedCoffees) {
          const oldCoffeeId = typeof coffee === 'string' ? coffee : coffee.id;
          const newCoffeeId = coffeeIdMap[oldCoffeeId];
          
          const { error: savedCoffeesError } = await supabase
            .from('saved_coffees')
            .upsert({
              id: uuidv4(),
              user_id: userId,
              coffee_id: newCoffeeId,
              created_at: new Date().toISOString()
            });

          if (savedCoffeesError) {
            console.error(`Error inserting saved coffee ${oldCoffeeId} for ${user.email}:`, savedCoffeesError);
          }
        }
      }
    }

    // Migrate recipes
    console.log('Migrating recipes...');
    const mockRecipesData = await loadJSON('../src/data/mockRecipes.json');
    for (const recipe of mockRecipesData.recipes) {
      const { error } = await supabase
        .from('recipes')
        .upsert({
          id: uuidv4(),
          title: recipe.title || recipe.name || 'Untitled Recipe',
          author_id: userIdMap[recipe.authorId],
          coffee_id: coffeeIdMap[recipe.coffeeId],
          method: recipe.method || null,
          grind_size: recipe.grindSize || null,
          dose: recipe.dose || null,
          yield: recipe.yield || null,
          temperature: recipe.temperature || null,
          total_time: recipe.totalTime || recipe.time || null,
          rating: recipe.rating || null,
          steps: recipe.steps || null,
          notes: recipe.notes || null,
          difficulty: recipe.difficulty || null,
          equipment: recipe.equipment || null,
          image_url: recipe.imageUrl || recipe.image || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error(`Error inserting recipe ${recipe.title || recipe.name}:`, error);
      } else {
        console.log(`Successfully migrated recipe ${recipe.title || recipe.name}`);
      }
    }

    // Finally migrate gear
    console.log('Migrating gear...');
    const mockGearData = await loadJSON('../src/data/mockGear.json');
    for (const gear of mockGearData.gear) {
      const { error } = await supabase
        .from('gear')
        .upsert({
          id: uuidv4(),
          name: gear.name,
          brand: gear.brand || null,
          category: gear.category || null,
          description: gear.description || null,
          price: gear.price || null,
          image_url: gear.imageUrl || gear.image || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error(`Error migrating gear ${gear.name}:`, error);
      } else {
        console.log(`Successfully migrated gear ${gear.name}`);
      }
    }

    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

migrateData(); 