-- Create gear table
CREATE TABLE IF NOT EXISTS gear (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial gear data
INSERT INTO gear (id, name, brand, category, description, price, image_url) VALUES
  ('aeropress', 'AeroPress', 'AeroPress', 'Brewers', 'The original AeroPress coffee maker - Makes delicious coffee without bitterness', 29.99, 'https://m.media-amazon.com/images/I/71pxZkT0rVL.jpg'),
  ('chemex', 'Chemex', 'Chemex', 'Brewers', 'Classic 6-cup Chemex coffee maker - Elegant design and pure flavor', 44.99, 'https://static.fnac-static.com/multimedia/Images/ES/NR/ac/87/6d/7178156/1541-1.jpg'),
  ('hario-v60', 'Hario V60', 'Hario', 'Brewers', 'Hario V60 Ceramic Coffee Dripper - The perfect pour-over brewer', 24.99, 'https://m.media-amazon.com/images/I/61ndwQWYYSL.jpg'),
  ('fellow-stagg', 'Fellow Stagg EKG', 'Fellow', 'Kettles', 'Electric Pour-Over Kettle - Variable temperature control for the perfect brew', 159.99, 'https://m.media-amazon.com/images/I/61TFYwB+iKL.jpg')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  updated_at = CURRENT_TIMESTAMP; 