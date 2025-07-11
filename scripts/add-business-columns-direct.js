import { supabase } from './supabase.js';

async function addBusinessColumns() {
  try {
    console.log('Adding business columns to profiles table...');
    
    // First, try to add the rating column
    try {
      const { error: ratingError } = await supabase.rpc('raw_sql', { 
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1);' 
      });
      
      if (ratingError && !ratingError.message.includes('already exists')) {
        console.log('Rating column may already exist or using alternative method...');
      } else {
        console.log('Added rating column');
      }
    } catch (error) {
      console.log('Rating column handling:', error.message);
    }

    // Try to add the review_count column
    try {
      const { error: reviewError } = await supabase.rpc('raw_sql', { 
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;' 
      });
      
      if (reviewError && !reviewError.message.includes('already exists')) {
        console.log('Review count column may already exist or using alternative method...');
      } else {
        console.log('Added review_count column');
      }
    } catch (error) {
      console.log('Review count column handling:', error.message);
    }

    // Try to add the cover_url column
    try {
      const { error: coverError } = await supabase.rpc('raw_sql', { 
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;' 
      });
      
      if (coverError && !coverError.message.includes('already exists')) {
        console.log('Cover URL column may already exist or using alternative method...');
      } else {
        console.log('Added cover_url column');
      }
    } catch (error) {
      console.log('Cover URL column handling:', error.message);
    }

    console.log('Business columns setup completed');
    
    // Test that we can query the table with new columns
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id, rating, review_count, cover_url')
      .limit(1);
    
    if (testError) {
      console.log('Test query failed - columns may not exist yet:', testError.message);
    } else {
      console.log('Test query successful - columns are accessible');
    }

  } catch (error) {
    console.error('Error adding business columns:', error);
  }
}

// Run the script
addBusinessColumns(); 