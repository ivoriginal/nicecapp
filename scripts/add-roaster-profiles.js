import { supabase } from './supabase.js';
import { v4 as uuidv4 } from 'uuid';

// Roaster profiles to add to Supabase
const roasterProfiles = [
  {
    originalId: 'toma-cafe',
    name: 'Toma Café',
    email: 'info@tomacafe.com',
    username: 'tomacafe',
    location: 'Madrid',
    avatar_url: 'https://wzawsiaanhriocxrabft.supabase.co/storage/v1/object/public/businesses/toma-logo.jpg',
    cover_url: 'https://wzawsiaanhriocxrabft.supabase.co/storage/v1/object/public/businesses/toma-1-cover.jpg',
    account_type: 'roaster',
    rating: 4.8,
    review_count: 156,
    bio: 'Specialty coffee roasters from Madrid, committed to quality and sustainability.'
  },
  {
    originalId: 'kima-coffee',
    name: 'Kima Coffee',
    email: 'hello@kimacoffee.com',
    username: 'kimacoffee',
    location: 'Madrid',
    avatar_url: 'https://wzawsiaanhriocxrabft.supabase.co/storage/v1/object/public/businesses/kima-logo.jpg',
    account_type: 'roaster',
    rating: 4.7,
    review_count: 89,
    bio: 'Artisanal coffee roasting with a focus on single origin beans.'
  },
  {
    originalId: 'cafelab-roaster',
    name: 'CaféLab',
    email: 'info@cafelab.es',
    username: 'cafelab',
    location: 'Murcia',
    avatar_url: 'https://wzawsiaanhriocxrabft.supabase.co/storage/v1/object/public/businesses/cafelab-logo.png',
    cover_url: 'https://wzawsiaanhriocxrabft.supabase.co/storage/v1/object/public/businesses/cafelab-murcia-cover.png',
    account_type: 'roaster',
    rating: 4.6,
    review_count: 73,
    bio: 'Premium coffee laboratory bringing science to coffee roasting.'
  },
  {
    originalId: 'nomad-coffee',
    name: 'Nomad Coffee Roasters',
    email: 'hello@nomadcoffee.es',
    username: 'nomadcoffee',
    location: 'Barcelona',
    avatar_url: 'https://nomadcoffee.es/cdn/shop/files/NOMAD_LOGO_NEGRO.png',
    account_type: 'roaster',
    rating: 4.9,
    review_count: 234,
    bio: 'Nomadic coffee culture bringing the best beans from around the world to Barcelona.'
  },
  {
    originalId: 'the-fix',
    name: 'The Fix',
    email: 'info@thefix.coffee',
    username: 'thefix',
    location: 'Madrid',
    avatar_url: 'https://wzawsiaanhriocxrabft.supabase.co/storage/v1/object/public/businesses/thefix-logo.jpg',
    cover_url: 'https://wzawsiaanhriocxrabft.supabase.co/storage/v1/object/public/businesses/thefix-cover.jpg',
    account_type: 'roaster',
    rating: 4.5,
    review_count: 67,
    bio: 'Your daily coffee fix with precision roasted specialty beans.'
  }
];

async function addRoasterProfiles() {
  try {
    console.log('Starting to add roaster profiles to Supabase...');
    
    for (const roaster of roasterProfiles) {
      console.log(`Processing roaster: ${roaster.name}`);
      
      // Check if roaster already exists by email
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, account_type, email')
        .eq('email', roaster.email)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error(`Error checking existing profile for ${roaster.name}:`, fetchError);
        continue;
      }

      if (existingProfile) {
        console.log(`Roaster ${roaster.name} already exists with email ${roaster.email}, updating...`);
        
        // Update existing profile (without rating and review_count for now)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: roaster.name,
            username: roaster.username,
            location: roaster.location,
            avatar_url: roaster.avatar_url,
            account_type: roaster.account_type,
            bio: roaster.bio,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProfile.id);

        if (updateError) {
          console.error(`Error updating roaster ${roaster.name}:`, updateError);
        } else {
          console.log(`Successfully updated roaster ${roaster.name}`);
        }
      } else {
        console.log(`Adding new roaster: ${roaster.name}`);
        
        // Generate a new UUID for the roaster
        const newId = uuidv4();
        
        // Insert new profile (without rating and review_count for now)
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: newId,
            full_name: roaster.name,
            username: roaster.username,
            email: roaster.email,
            location: roaster.location,
            avatar_url: roaster.avatar_url,
            account_type: roaster.account_type,
            bio: roaster.bio,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`Error inserting roaster ${roaster.name}:`, insertError);
        } else {
          console.log(`Successfully added roaster ${roaster.name} with ID ${newId}`);
        }
      }
    }
    
    console.log('Roaster profiles migration completed!');
    
    // Verify the data
    console.log('\nVerifying roaster profiles...');
    const { data: roasters, error: verifyError } = await supabase
      .from('profiles')
      .select('id, full_name, account_type, location')
      .eq('account_type', 'roaster')
      .order('full_name');
    
    if (verifyError) {
      console.error('Error verifying roasters:', verifyError);
    } else {
      console.log('Roasters in database:');
      roasters.forEach(roaster => {
        console.log(`- ${roaster.full_name} (${roaster.location})`);
      });
    }
    
  } catch (error) {
    console.error('Error during roaster profiles migration:', error);
    process.exit(1);
  }
}

// Run the migration
addRoasterProfiles(); 