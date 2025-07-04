import { supabase } from './supabase.js';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrateGear() {
  try {
    console.log('Running gear column migration...');
    
    // Read the SQL file
    const sqlPath = join(__dirname, 'add-gear-column.sql');
    const sql = await readFile(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error: sqlError } = await supabase.rpc('add_gear_column');
    
    if (sqlError) {
      console.error('Error executing SQL:', sqlError);
      return;
    }

    console.log('Gear column migration completed successfully');
    
  } catch (error) {
    console.error('Error running gear migration:', error);
    process.exit(1);
  }
}

migrateGear(); 