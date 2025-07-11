const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = 'https://wzawsiaanhriocxrabft.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6YXdzaWFhbmhyaW9jeHJhYmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NjI1MjEsImV4cCI6MjA2NzAzODUyMX0.oO6QH-0ZTwyRUOJTJ5KS7LbUG5dYbUnrJsI73bbOg1Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUSINESSES_DIR = path.join(__dirname, '../assets/businesses');

async function uploadBusinessImages() {
  try {
    console.log('Uploading business images...');
    const files = fs.readdirSync(BUSINESSES_DIR);
    
    // Filter only image files
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    });
    
    console.log(`Found ${imageFiles.length} image files to upload`);
    
    for (const file of imageFiles) {
      const filePath = path.join(BUSINESSES_DIR, file);
      const fileContent = fs.readFileSync(filePath);
      const fileExt = path.extname(file).toLowerCase();
      
      // Fix MIME type based on extension
      let contentType;
      switch (fileExt) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
        default:
          console.log(`Skipping unsupported file type: ${file}`);
          continue;
      }
      
      console.log(`Uploading ${file} (${contentType})...`);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('businesses')
        .upload(file, fileContent, {
          contentType,
          upsert: true
        });
      
      if (error) {
        console.error(`Error uploading ${file}:`, error);
        continue;
      }
      
      console.log(`Successfully uploaded ${file}`);
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('businesses')
        .getPublicUrl(file);
      
      console.log(`Public URL: ${publicUrl}`);
    }
    
    console.log('All business images uploaded successfully!');
  } catch (error) {
    console.error('Error uploading business images:', error);
    throw error;
  }
}

uploadBusinessImages(); 