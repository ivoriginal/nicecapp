import { supabase } from './supabase.js';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrateBusinessColumns() {
  try {
    console.log('Running business columns migration...');
    
    // Execute the SQL function to add business columns
    const { error: sqlError } = await supabase.rpc('add_business_columns');
    
    if (sqlError) {
      console.error('Error executing SQL:', sqlError);
      return;
    }

    console.log('Business columns migration completed successfully');
    
  } catch (error) {
    console.error('Error running business columns migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateBusinessColumns(); 