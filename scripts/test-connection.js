import { supabase } from './supabase.js';

async function testConnection() {
  try {
    // Test profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select()
      .limit(1);

    if (profilesError) {
      console.error('Error querying profiles:', profilesError);
    } else {
      console.log('Profiles table exists');
    }

    // Test coffees table
    const { data: coffees, error: coffeesError } = await supabase
      .from('coffees')
      .select()
      .limit(1);

    if (coffeesError) {
      console.error('Error querying coffees:', coffeesError);
    } else {
      console.log('Coffees table exists');
    }

    // Test recipes table
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select()
      .limit(1);

    if (recipesError) {
      console.error('Error querying recipes:', recipesError);
    } else {
      console.log('Recipes table exists');
    }

    // Test gear table
    const { data: gear, error: gearError } = await supabase
      .from('gear')
      .select()
      .limit(1);

    if (gearError) {
      console.error('Error querying gear:', gearError);
    } else {
      console.log('Gear table exists');
    }

    // Test saved_coffees table
    const { data: savedCoffees, error: savedCoffeesError } = await supabase
      .from('saved_coffees')
      .select()
      .limit(1);

    if (savedCoffeesError) {
      console.error('Error querying saved_coffees:', savedCoffeesError);
    } else {
      console.log('Saved coffees table exists');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testConnection(); 