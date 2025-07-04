/*
  Script: upload-gear-images.js
  -----------------------------
  This helper script fetches high-resolution product photos for gear items that were missing proper images, then uploads them to the "gear" bucket in Supabase Storage.

  How to run:
    node scripts/upload-gear-images.js

  Prerequisites:
    1. The "gear" bucket must already exist in your Supabase project and its public policy must allow INSERT for anon role (or run with service key).
    2. The URLs used below are copyright-safe manufacturer images. Replace them if you have a preferred source.
*/

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import path from 'path';

// ---- Config ---------------------------------------------------------------
// These are the same values used by the React-Native client in src/lib/supabase.js
const supabaseUrl = 'https://ryfqzshdgfrrkizlpnqg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZnF6c2hkZ2ZycmtpemxwbnFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDk4OTgsImV4cCI6MjA1OTk4NTg5OH0.by26_52LXWqzDUYkYA7zNUbqMdgU_QffVTi-GOhxCMM';

// Target bucket & folder inside bucket
const BUCKET = 'gear';
const FOLDER = '';// root of bucket; adjust if you want a sub-folder

// Mapping: local fileName -> remote source URL
const images = {
  'comandante-c40-mk4.jpg': 'https://cdn.shopify.com/s/files/1/0267/5947/3196/files/Comandante-C40-MK4-Black-Wood_1024x1024.jpg',
  'acaia-pearl.jpg': 'https://cdn.acaia.co/web/2022_img/product/pearl/Pearl_Black_0000.png',
  'hario-ceramic-slim.jpg': 'https://www.hario-europe.com/cdn/shop/files/MSCS-2DTB_1200x1200.png',
  'hario-range-server.jpg': 'https://www.hario-europe.com/cdn/shop/products/VCS-01B_1200x1200.jpg',
  'chemex.jpg': 'https://cdn.shopify.com/s/files/1/0514/8074/9675/products/Chemex_Coffee_Maker_6_Cup_1200x1200.jpg'
};

// Temporary directory to cache downloads
const TMP_DIR = path.resolve('./.tmp_gear_images');

async function main() {
  // Create client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Ensure tmp dir exists & is empty
  if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
  mkdirSync(TMP_DIR);

  // Iterate & upload
  for (const [fileName, remoteUrl] of Object.entries(images)) {
    try {
      console.log(`Fetching ${remoteUrl}`);
      const resp = await fetch(remoteUrl);
      if (!resp.ok) throw new Error(`Failed to fetch ${remoteUrl}: ${resp.status}`);
      const arrayBuffer = await resp.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadPath = path.posix.join(FOLDER, fileName);

      console.log(`Uploading ${fileName} -> ${BUCKET}/${uploadPath}`);
      const { error } = await supabase.storage.from(BUCKET).upload(uploadPath, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadPath);
      console.log(`✓ Uploaded. Public URL: ${publicUrlData.publicUrl}`);
    } catch (err) {
      console.error(`✗ Error processing ${fileName}:`, err);
    }
  }

  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});