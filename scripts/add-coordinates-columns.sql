-- Add latitude and longitude columns to profiles table for location data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Update cafe profiles with realistic coordinates
UPDATE profiles SET 
  latitude = 40.4168, 
  longitude = -3.7038 
WHERE username = 'littlehavanacafe';

UPDATE profiles SET 
  latitude = 37.9922, 
  longitude = -1.1307 
WHERE username = 'cafelabmurcia';

UPDATE profiles SET 
  latitude = 37.6063, 
  longitude = -0.9868 
WHERE username = 'cafelabcartagena';

UPDATE profiles SET 
  latitude = 40.4216, 
  longitude = -3.7016 
WHERE username = 'tomacafe1';

UPDATE profiles SET 
  latitude = 40.4095, 
  longitude = -3.6934 
WHERE username = 'tomacafe2';

UPDATE profiles SET 
  latitude = 40.4312, 
  longitude = -3.6926 
WHERE username = 'tomacafe3';

UPDATE profiles SET 
  latitude = 40.4237, 
  longitude = -3.6947 
WHERE username = 'thefixmadrid';

UPDATE profiles SET 
  latitude = 37.9838, 
  longitude = -1.1280 
WHERE username = 'vertigocalambre'; 