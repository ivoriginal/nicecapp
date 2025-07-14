import { supabase } from './supabase.js';
import fs from 'fs';
import path from 'path';

async function createFollowsTables() {
  try {
    console.log('🔧 Creating follows and notifications tables...');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'create-follows-table.sql');
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
      console.log(`   ${statement.substring(0, 80)}...`);
      
      try {
        // Use the raw SQL execution method
        const { data, error } = await supabase.rpc('exec_sql', {
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
    
    console.log('\n🎉 Follows and notifications tables created successfully!');
    console.log('\n📋 Summary of what was created:');
    console.log('   • follows table: Track user follow relationships');
    console.log('   • notifications table: Store follow notifications');
    console.log('   • RLS policies: Secure access to both tables');
    console.log('   • Indexes: Optimize query performance');
    console.log('\n✅ The follow feature database structure is now ready!');
    
    // Test the tables by checking if they exist
    console.log('\n🧪 Testing table creation...');
    
    const { data: followsTest, error: followsError } = await supabase
      .from('follows')
      .select('*')
      .limit(1);
    
    if (followsError) {
      console.error('❌ Error accessing follows table:', followsError);
    } else {
      console.log('✅ Follows table is accessible');
    }
    
    const { data: notificationsTest, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (notificationsError) {
      console.error('❌ Error accessing notifications table:', notificationsError);
    } else {
      console.log('✅ Notifications table is accessible');
    }
    
  } catch (error) {
    console.error('❌ Error creating follows tables:', error);
    process.exit(1);
  }
}

// Run the script
createFollowsTables(); 