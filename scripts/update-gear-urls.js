const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with the correct URL and key
const supabaseUrl = 'https://wzawsiaanhriocxrabft.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6YXdzaWFhbmhyaW9jeHJhYmZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2MjUyMSwiZXhwIjoyMDY3MDM4NTIxfQ.vYqS61JkFG9TD84pugIKE5NoVojpVKMrK2R8YiXmhyM';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const GEAR_DIR = path.join(__dirname, '../assets/gear');
const BUCKET_NAME = 'gear';

async function ensureBucketExists() {
  try {
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;

    // Check if gear bucket exists
    const gearBucket = buckets.find(bucket => bucket.name === BUCKET_NAME);
    if (!gearBucket) {
      // Create gear bucket if it doesn't exist
      const { data, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png']
      });
      if (createError) throw createError;
      console.log('Created gear bucket');
    } else {
      console.log('Gear bucket already exists');
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    throw error;
  }
}

async function updateGearUrls() {
  try {
    // Ensure the gear bucket exists
    await ensureBucketExists();

    // Get all gear items from the database
    const { data: gear, error } = await supabase
      .from('gear')
      .select('*');

    if (error) throw error;

    for (const item of gear) {
      const id = item.id;
      const filepath = path.join(GEAR_DIR, `${id}.jpg`);

      // Skip if image doesn't exist
      if (!fs.existsSync(filepath)) {
        console.log(`Skipping ${id}: Image not found`);
        continue;
      }

      // Upload to Supabase Storage
      const fileContent = fs.readFileSync(filepath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(`${id}.jpg`, fileContent, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error(`Error uploading ${id}:`, uploadError);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`${id}.jpg`);

      // Update gear table with new URL
      const { error: updateError } = await supabase
        .from('gear')
        .update({ image_url: publicUrl })
        .eq('id', id);

      if (updateError) {
        console.error(`Error updating ${id}:`, updateError);
      } else {
        console.log(`Updated ${id} with URL: ${publicUrl}`);
      }
    }

    console.log('All gear URLs updated successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateGearUrls(); 