const { spawn } = require('child_process');
const path = require('path');

// Function to run a script and wait for it to complete
function runScript(scriptPath, env) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn('node', [scriptPath], {
      stdio: 'inherit',
      env: {
        ...env,
        SUPABASE_URL: 'https://wzawsiaanhriocxrabft.supabase.co',
        SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6YXdzaWFhbmhyaW9jeHJhYmZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ2MjUyMSwiZXhwIjoyMDY3MDM4NTIxfQ.vYqS61JkFG9TD84pugIKE5NoVojpVKMrK2R8YiXmhyM'
      }
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });
  });
}

async function migrateGearImages() {
  try {
    console.log('Step 1: Downloading gear images...');
    await runScript(path.join(__dirname, 'download-gear-images.js'), process.env);
    
    console.log('Step 2: Uploading images to Supabase storage...');
    await runScript(path.join(__dirname, 'upload-business-images.js'), process.env);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrateGearImages(); 