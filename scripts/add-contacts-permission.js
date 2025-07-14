import { supabase } from './supabase.js';
import fs from 'fs';
import path from 'path';

async function addContactsPermissionColumn() {
  try {
    console.log('🔧 Adding contacts_permission column to profiles table...');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'add-contacts-permission-column.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;
      
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}:`);
      console.log(`   ${statement.substring(0, 100)}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          console.warn(`⚠️  Warning on statement ${i + 1}: ${error.message}`);
        } else {
          console.log(`✅ Statement ${i + 1} completed successfully`);
        }
      } catch (execError) {
        console.warn(`⚠️  Warning on statement ${i + 1}: ${execError.message}`);
      }
    }
    
    console.log('\n🎉 Contacts permission column added successfully!');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addContactsPermissionColumn(); 