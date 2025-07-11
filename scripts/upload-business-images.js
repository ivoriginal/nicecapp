const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUSINESSES_DIR = path.join(__dirname, '../assets/businesses');
const GEAR_DIR = path.join(__dirname, '../assets/gear');

async function uploadImages(directory, bucketName) {
  try {
    const files = fs.readdirSync(directory);
    console.log(`Uploading images from ${directory} to ${bucketName}...`);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const fileContent = fs.readFileSync(filePath);
      const fileExt = path.extname(file);
      const fileName = path.basename(file, fileExt);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(`${fileName}${fileExt}`, fileContent, {
          contentType: `image/${fileExt.slice(1)}`,
          upsert: true
        });
      
      if (error) {
        console.error(`Error uploading ${file}:`, error);
        continue;
      }
      
      console.log(`Successfully uploaded ${file}`);
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(`${fileName}${fileExt}`);
      
      console.log(`Public URL: ${publicUrl}`);
      
      // Update database record with new image URL
      if (bucketName === 'businesses') {
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ logo_url: publicUrl })
          .eq('id', fileName);
          
        if (updateError) {
          console.error(`Error updating business ${fileName}:`, updateError);
        }
      } else if (bucketName === 'gear') {
        const { error: updateError } = await supabase
          .from('gear')
          .update({ image_url: publicUrl })
          .eq('id', fileName);
          
        if (updateError) {
          console.error(`Error updating gear ${fileName}:`, updateError);
        }
      }
    }
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
}

async function uploadAllImages() {
  try {
    // Upload business images
    if (fs.existsSync(BUSINESSES_DIR)) {
      console.log('Uploading business images...');
      await uploadImages(BUSINESSES_DIR, 'businesses');
    }
    
    // Upload gear images
    if (fs.existsSync(GEAR_DIR)) {
      console.log('Uploading gear images...');
      await uploadImages(GEAR_DIR, 'gear');
    }
    
    console.log('All images uploaded successfully!');
  } catch (error) {
    console.error('Error during upload:', error);
    process.exit(1);
  }
}

uploadAllImages(); 