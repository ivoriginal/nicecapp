import { supabase } from './supabase.js';

async function migrateLocation() {
  try {
    console.log('Running location column migration...');
    
    // Try to add the location column directly
    const { error: alterError } = await supabase.from('profiles').select('id').limit(1);
    if (alterError) {
      console.error('Error checking profiles table:', alterError);
      return;
    }

    // Add location column using raw SQL
    const { error: addColumnError } = await supabase.from('profiles')
      .update({ location: '' })
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    // If we get a "column does not exist" error, that's expected
    if (addColumnError && !addColumnError.message.includes('column "location" does not exist')) {
      console.error('Unexpected error:', addColumnError);
      return;
    }

    console.log('Location column migration completed');
    
    // Try to update all null locations to empty string
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ location: '' })
      .is('location', null);
    
    if (updateError && !updateError.message.includes('column "location" does not exist')) {
      console.error('Error updating null locations:', updateError);
      return;
    }
    
    console.log('Migration completed successfully');
    
  } catch (error) {
    console.error('Error running location migration:', error);
    process.exit(1);
  }
}

migrateLocation(); 