const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://wzawsiaanhriocxrabft.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6YXdzaWFhbmhyaW9jeHJhYmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NjI1MjEsImV4cCI6MjA2NzAzODUyMX0.oO6QH-0ZTwyRUOJTJ5KS7LbUG5dYbUnrJsI73bbOg1Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addProfileColumns() {
  try {
    console.log('Adding missing columns to profiles table...');
    
    // Note: Column addition typically needs to be done via SQL or the Supabase dashboard
    // This script will verify if we can write to these columns
    
    // Test if we can update a profile with the new columns
    const { data: testProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single();
    
    if (fetchError) {
      console.error('Error fetching test profile:', fetchError);
      return;
    }
    
    console.log('Test profile fetched successfully');
    console.log('Available columns:', Object.keys(testProfile));
    
    // Check if the columns exist by trying to update
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        cover_url: testProfile.cover_url || null,
        rating: testProfile.rating || null,
        review_count: testProfile.review_count || 0
      })
      .eq('id', testProfile.id);
    
    if (updateError) {
      console.error('Columns do not exist or cannot be updated:', updateError);
      console.log('\nPlease run this SQL in your Supabase dashboard:');
      console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;');
      console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT NULL;');
      console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;');
    } else {
      console.log('✅ Columns exist and can be updated');
    }
    
  } catch (error) {
    console.error('Error checking columns:', error);
  }
}

addProfileColumns(); 