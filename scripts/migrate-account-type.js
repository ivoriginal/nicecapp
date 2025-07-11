import { supabase } from './supabase.js';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrateAccountType() {
  try {
    console.log('Running account_type column migration...');
    
    // Read the SQL file
    const sqlPath = join(__dirname, 'add-account-type-column.sql');
    const sql = await readFile(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error: sqlError } = await supabase.rpc('add_account_type_column');
    
    if (sqlError) {
      console.error('Error executing SQL:', sqlError);
      return;
    }

    console.log('Account type column migration completed successfully');
    
  } catch (error) {
    console.error('Error running account type migration:', error);
    process.exit(1);
  }
}

migrateAccountType(); 