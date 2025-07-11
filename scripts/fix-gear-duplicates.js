import { supabase } from './supabase.js';

// Map of known duplicate IDs to their canonical ID
const ID_MAPPING = {
  'aeropress': 'gear6',  // Map AeroPress entries to gear6
  'chemex': 'gear7',     // Map Chemex entries to gear7
  'hario-v60': 'gear4',  // Map Hario V60 entries to gear4
  'fellow-stagg': 'gear1' // Map Fellow Stagg entries to gear1
};

async function fixGearDuplicates() {
  try {
    console.log('Starting gear duplicates fix...');
    
    // Get all gear items
    const { data: gear, error } = await supabase
      .from('gear')
      .select('*');
      
    if (error) {
      throw error;
    }
    
    console.log(`Found ${gear.length} gear items`);
    
    // Group gear by name to find duplicates
    const gearByName = gear.reduce((acc, item) => {
      const name = item.name.toLowerCase();
      if (!acc[name]) {
        acc[name] = [];
      }
      acc[name].push(item);
      return acc;
    }, {});
    
    // Process each group of gear
    for (const [name, items] of Object.entries(gearByName)) {
      if (items.length > 1) {
        console.log(`Found ${items.length} duplicates for ${name}`);
        
        // Find the canonical item (the one we want to keep)
        const canonicalItem = items.find(item => {
          // If we have a known mapping for this ID, check if this is the canonical ID
          const duplicateId = Object.keys(ID_MAPPING).find(key => key === item.id);
          return duplicateId ? ID_MAPPING[duplicateId] === item.id : true;
        }) || items[0];
        
        // Get IDs of items to delete (all except canonical)
        const idsToDelete = items
          .filter(item => item.id !== canonicalItem.id)
          .map(item => item.id);
          
        if (idsToDelete.length > 0) {
          console.log(`Deleting duplicate entries with IDs: ${idsToDelete.join(', ')}`);
          
          // Delete duplicate entries
          const { error: deleteError } = await supabase
            .from('gear')
            .delete()
            .in('id', idsToDelete);
            
          if (deleteError) {
            console.error(`Error deleting duplicates for ${name}:`, deleteError);
          } else {
            console.log(`Successfully deleted ${idsToDelete.length} duplicates for ${name}`);
          }
        }
      }
    }
    
    console.log('Gear duplicates fix completed!');
    
  } catch (error) {
    console.error('Error fixing gear duplicates:', error);
    process.exit(1);
  }
}

fixGearDuplicates(); 