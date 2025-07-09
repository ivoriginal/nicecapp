import { supabase } from '../lib/supabase';

// Constants
const MOCK_MODE = true; // Set to false when ready to use real Supabase

// Recipe functions
export const updateRecipeInDb = async (recipeId, updates) => {
  if (MOCK_MODE) {
    console.log("Mock updateRecipeInDb called with:", { recipeId, updates });
    return { ...updates, id: recipeId };
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

export default {
  updateRecipeInDb
}; 