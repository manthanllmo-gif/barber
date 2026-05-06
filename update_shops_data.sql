-- Add latitude and longitude columns if they don't exist
ALTER TABLE shops ADD COLUMN IF NOT EXISTS latitude FLOAT8;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS longitude FLOAT8;

-- Update Shop Names and Coordinates using specific IDs
UPDATE shops SET 
    name = 'K11 Family Salon', 
    city = 'Mumbai',
    address = '123 Marine Drive, Mumbai',
    image_url = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80',
    description = 'Premium grooming for the modern family.'
WHERE name = 'K11 Family Salon';

UPDATE shops SET 
    name = 'Blade Menz Salon', 
    city = 'Delhi',
    latitude = 23.192716606258806, 
    longitude = 77.4331641195496 
WHERE id = '00000000-0000-0000-0000-000000000000';

UPDATE shops SET 
    name = 'Javed Habib Hair and Beauty', 
    latitude = 23.210861067355857, 
    longitude = 77.43659734712729 
WHERE id = '0306e56a-f94f-4a98-afc6-6cb3f9a6e1b6';

UPDATE shops SET 
    name = 'Cutz and Scissors', 
    latitude = 23.189403003978274, 
    longitude = 77.46509313602199 
WHERE id = '4cd3f3d6-5d56-48be-96c2-53b9ee069e82';

UPDATE shops SET 
    name = 'Truefit & Hill Bhopal', 
    latitude = 23.215513832458406, 
    longitude = 77.43257184755223 
WHERE id = 'bbbe22c1-f44b-48bc-b345-c1afcccd13b3';
