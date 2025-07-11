const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const GEAR_DIR = path.join(__dirname, '../assets/gear');

// Create gear directory if it doesn't exist
if (!fs.existsSync(GEAR_DIR)) {
  fs.mkdirSync(GEAR_DIR);
}

// Function to download an image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// More reliable image URLs from Unsplash
const GEAR_IMAGES = {
  'aeropress': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
  'chemex': 'https://images.unsplash.com/photo-1521302080334-4bebac2763a6',
  'v60': 'https://images.unsplash.com/photo-1544776527-68e63addedf7',
  'stagg': 'https://images.unsplash.com/photo-1610889556528-9a770e32642f',
  'comandante': 'https://images.unsplash.com/photo-1587888637140-849b25d80ef9',
  'pearl': 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6',
  'filters': 'https://images.unsplash.com/photo-1516577165541-1ed0d4b7b40b',
  'server': 'https://images.unsplash.com/photo-1516577165541-1ed0d4b7b40b',
  'default': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735'
};

async function downloadGearImages() {
  try {
    // Get all gear items from the database
    const { data: gear, error } = await supabase
      .from('gear')
      .select('*');

    if (error) throw error;

    for (const item of gear) {
      const id = item.id;
      const name = item.name.toLowerCase();
      let imageUrl = null;

      // Try to find a matching reliable image URL
      for (const [key, url] of Object.entries(GEAR_IMAGES)) {
        if (name.includes(key)) {
          imageUrl = url;
          break;
        }
      }

      // If no reliable URL found, use the default coffee gear image
      if (!imageUrl) {
        imageUrl = GEAR_IMAGES.default;
      }

      // Add Unsplash parameters for proper sizing and format
      imageUrl = `${imageUrl}?w=800&q=80&fm=jpg&fit=crop`;

      const filepath = path.join(GEAR_DIR, `${id}.jpg`);

      try {
        await downloadImage(imageUrl, filepath);
        console.log(`Downloaded: ${filepath}`);
      } catch (downloadError) {
        console.error(`Error downloading image for ${item.name}:`, downloadError);
      }
    }

    console.log('All gear images downloaded successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

downloadGearImages(); 