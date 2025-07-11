const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = 'https://wzawsiaanhriocxrabft.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6YXdzaWFhbmhyaW9jeHJhYmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NjI1MjEsImV4cCI6MjA2NzAzODUyMX0.oO6QH-0ZTwyRUOJTJ5KS7LbUG5dYbUnrJsI73bbOg1Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateCafesToSupabase() {
  try {
    console.log('Loading café data from mockCafes.json...');
    
    // Load the mock café data
    const mockCafesPath = path.join(__dirname, '../src/data/mockCafes.json');
    const mockCafesData = JSON.parse(fs.readFileSync(mockCafesPath, 'utf8'));
    
    console.log(`Found ${mockCafesData.cafes.length} cafés to migrate`);
    
    // Convert café data to Supabase profile format
    const cafeProfiles = mockCafesData.cafes.map(cafe => {
      // Generate a consistent UUID based on the café ID
      const uuid = require('crypto').createHash('md5').update(cafe.id).digest('hex');
      const formattedUuid = [
        uuid.substring(0, 8),
        uuid.substring(8, 12),
        uuid.substring(12, 16),
        uuid.substring(16, 20),
        uuid.substring(20, 32)
      ].join('-');
      
      return {
        id: formattedUuid,
        full_name: cafe.name,
        username: cafe.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
        avatar_url: cafe.avatar,
        cover_url: cafe.coverImage,
        location: cafe.location,
        account_type: 'cafe',
        rating: cafe.rating,
        review_count: cafe.reviewCount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    console.log('Café profiles to insert:');
    cafeProfiles.forEach(profile => {
      console.log(`- ${profile.full_name} (${profile.username})`);
    });
    
    // Insert cafés into Supabase
    for (const profile of cafeProfiles) {
      console.log(`\nInserting ${profile.full_name}...`);
      
      // Check if café already exists
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('username', profile.username)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`Error checking for existing café ${profile.full_name}:`, checkError);
        continue;
      }
      
      if (existing) {
        console.log(`${profile.full_name} already exists, updating...`);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            cover_url: profile.cover_url,
            location: profile.location,
            rating: profile.rating,
            review_count: profile.review_count,
            updated_at: profile.updated_at
          })
          .eq('id', existing.id);
        
        if (updateError) {
          console.error(`Error updating ${profile.full_name}:`, updateError);
        } else {
          console.log(`✓ Updated ${profile.full_name}`);
        }
      } else {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([profile]);
        
        if (insertError) {
          console.error(`Error inserting ${profile.full_name}:`, insertError);
        } else {
          console.log(`✓ Inserted ${profile.full_name}`);
        }
      }
    }
    
    console.log('\n✅ Café migration completed!');
    
    // Verify the results
    console.log('\nVerifying cafés in Supabase...');
    const { data: allCafes, error: verifyError } = await supabase
      .from('profiles')
      .select('id, full_name, username, location, account_type')
      .eq('account_type', 'cafe')
      .order('full_name');
    
    if (verifyError) {
      console.error('Error verifying cafés:', verifyError);
    } else {
      console.log(`Found ${allCafes.length} cafés in Supabase:`);
      allCafes.forEach(cafe => {
        console.log(`- ${cafe.full_name} (@${cafe.username}) - ${cafe.location}`);
      });
    }
    
  } catch (error) {
    console.error('Error migrating cafés:', error);
    process.exit(1);
  }
}

migrateCafesToSupabase(); 