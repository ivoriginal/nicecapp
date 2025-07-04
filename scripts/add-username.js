import { supabase } from './supabase.js';
import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function addUsernameColumn() {
  try {
    // Read the SQL file
    const sqlPath = join(__dirname, 'add-username-column.sql');
    const sql = await readFile(sqlPath, 'utf8');
    
    // Execute the SQL to create the function
    const { error: createFunctionError } = await supabase.rpc('add_username_column', {}, {
      headers: {
        'Content-Profile': 'postgres',
        'Content-Type': 'application/json'
      }
    });

    if (createFunctionError) {
      console.error('Error creating function:', createFunctionError);
      return;
    }

    console.log('Successfully added username column');
  } catch (error) {
    console.error('Error:', error);
  }
}

addUsernameColumn(); 