-- Drop existing tables in correct order
DROP TABLE IF EXISTS coffee_events CASCADE;
DROP TABLE IF EXISTS gear_wishlist CASCADE;
DROP TABLE IF EXISTS user_gear CASCADE;
DROP TABLE IF EXISTS saved_coffees CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS gear CASCADE;
DROP TABLE IF EXISTS coffees CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS insert_coffee CASCADE;
DROP FUNCTION IF EXISTS insert_profile CASCADE;
DROP FUNCTION IF EXISTS insert_recipe CASCADE;
DROP FUNCTION IF EXISTS insert_gear CASCADE;
DROP FUNCTION IF EXISTS insert_saved_coffee CASCADE;

-- Create profiles table (v2)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create coffees table (v2)
CREATE TABLE IF NOT EXISTS coffees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  roaster TEXT NOT NULL,
  origin TEXT,
  process TEXT,
  roast_level TEXT,
  tasting_notes TEXT,
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create recipes table (v2)
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  coffee_id TEXT REFERENCES coffees(id) ON DELETE SET NULL,
  method TEXT,
  grind_size TEXT,
  dose DECIMAL(10,2),
  yield DECIMAL(10,2),
  temperature DECIMAL(10,2),
  total_time TEXT,
  rating INTEGER,
  steps JSONB,
  notes TEXT,
  difficulty TEXT,
  equipment TEXT[],
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create gear table (v2)
CREATE TABLE IF NOT EXISTS gear (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create saved_coffees table (v2)
CREATE TABLE IF NOT EXISTS saved_coffees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  coffee_id TEXT REFERENCES coffees(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, coffee_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coffees ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gear ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_coffees ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Coffees policies
CREATE POLICY "Coffees are viewable by everyone"
  ON coffees FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert coffees"
  ON coffees FOR INSERT
  WITH CHECK (true);

-- Recipes policies
CREATE POLICY "Recipes are viewable by everyone"
  ON recipes FOR SELECT
  USING (true);

CREATE POLICY "Users can create recipes"
  ON recipes FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Service role can insert recipes"
  ON recipes FOR INSERT
  WITH CHECK (true);

-- Gear policies
CREATE POLICY "Gear is viewable by everyone"
  ON gear FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert gear"
  ON gear FOR INSERT
  WITH CHECK (true);

-- Saved coffees policies
CREATE POLICY "Saved coffees are viewable by everyone"
  ON saved_coffees FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their saved coffees"
  ON saved_coffees FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert saved coffees"
  ON saved_coffees FOR INSERT
  WITH CHECK (true);

-- Create stored procedures for data insertion
CREATE OR REPLACE FUNCTION insert_coffee(
  p_id TEXT,
  p_name TEXT,
  p_roaster TEXT,
  p_origin TEXT,
  p_process TEXT,
  p_roast_level TEXT,
  p_tasting_notes TEXT,
  p_description TEXT,
  p_price DECIMAL,
  p_image_url TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO coffees (
    id, name, roaster, origin, process, roast_level, tasting_notes,
    description, price, image_url, created_at, updated_at
  ) VALUES (
    p_id, p_name, p_roaster, p_origin, p_process, p_roast_level,
    p_tasting_notes, p_description, p_price, p_image_url,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    roaster = EXCLUDED.roaster,
    origin = EXCLUDED.origin,
    process = EXCLUDED.process,
    roast_level = EXCLUDED.roast_level,
    tasting_notes = EXCLUDED.tasting_notes,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    image_url = EXCLUDED.image_url,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION insert_profile(
  p_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_avatar_url TEXT,
  p_bio TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO profiles (
    id, email, full_name, avatar_url, bio, created_at, updated_at
  ) VALUES (
    p_id, p_email, p_full_name, p_avatar_url, p_bio,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    bio = EXCLUDED.bio,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION insert_recipe(
  p_id TEXT,
  p_title TEXT,
  p_author_id UUID,
  p_coffee_id TEXT,
  p_method TEXT,
  p_grind_size TEXT,
  p_dose DECIMAL,
  p_yield DECIMAL,
  p_temperature DECIMAL,
  p_total_time TEXT,
  p_rating INTEGER,
  p_steps JSONB,
  p_notes TEXT,
  p_difficulty TEXT,
  p_equipment TEXT[],
  p_image_url TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO recipes (
    id, title, author_id, coffee_id, method, grind_size, dose,
    yield, temperature, total_time, rating, steps, notes,
    difficulty, equipment, image_url, created_at, updated_at
  ) VALUES (
    p_id, p_title, p_author_id, p_coffee_id, p_method, p_grind_size,
    p_dose, p_yield, p_temperature, p_total_time, p_rating, p_steps,
    p_notes, p_difficulty, p_equipment, p_image_url,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    author_id = EXCLUDED.author_id,
    coffee_id = EXCLUDED.coffee_id,
    method = EXCLUDED.method,
    grind_size = EXCLUDED.grind_size,
    dose = EXCLUDED.dose,
    yield = EXCLUDED.yield,
    temperature = EXCLUDED.temperature,
    total_time = EXCLUDED.total_time,
    rating = EXCLUDED.rating,
    steps = EXCLUDED.steps,
    notes = EXCLUDED.notes,
    difficulty = EXCLUDED.difficulty,
    equipment = EXCLUDED.equipment,
    image_url = EXCLUDED.image_url,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION insert_gear(
  p_id TEXT,
  p_name TEXT,
  p_brand TEXT,
  p_category TEXT,
  p_description TEXT,
  p_price DECIMAL,
  p_image_url TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO gear (
    id, name, brand, category, description, price,
    image_url, created_at, updated_at
  ) VALUES (
    p_id, p_name, p_brand, p_category, p_description,
    p_price, p_image_url, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    image_url = EXCLUDED.image_url,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION insert_saved_coffee(
  p_user_id UUID,
  p_coffee_id TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO saved_coffees (
    user_id, coffee_id, created_at
  ) VALUES (
    p_user_id, p_coffee_id, CURRENT_TIMESTAMP
  )
  ON CONFLICT (user_id, coffee_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 