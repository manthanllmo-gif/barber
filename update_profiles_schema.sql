-- Add Profile Columns to staff table
ALTER TABLE public.staff
ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 1) DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS past_saloons TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS certificates TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS certificate_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS trainings TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add Profile Columns to shops table
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS about_text TEXT,
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{}'::jsonb;

-- Optional: Populate some dummy data for existing records to see changes immediately
UPDATE public.staff 
SET 
  skills = ARRAY['Fade', 'Scissor Cut', 'Beard Trim'],
  certificates = ARRAY['Master Barber 2023', 'Color Specialist'],
  past_saloons = ARRAY['The Vintage Barbershop', 'Elite Cutz'],
  experience_years = 5,
  rating = 4.8
WHERE skills = '{}';

UPDATE public.shops 
SET 
  about_text = 'A premium grooming experience combining classic techniques with modern style.',
  amenities = ARRAY['Free Wi-Fi', 'Coffee', 'Parking', 'AC'],
  gallery_urls = ARRAY['https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
  opening_hours = '{"monday": "09:00 - 20:00", "tuesday": "09:00 - 20:00", "wednesday": "09:00 - 20:00", "thursday": "09:00 - 20:00", "friday": "09:00 - 21:00", "saturday": "09:00 - 21:00", "sunday": "10:00 - 18:00"}'::jsonb
WHERE about_text IS NULL;

-- --------------------------------------------------------
-- Create 'images' storage bucket if it doesn't exist
-- --------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the 'images' bucket
-- Allow public read access to the bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'images' );

-- Allow authenticated users to upload files to the bucket
DROP POLICY IF EXISTS "Auth Upload Access" ON storage.objects;
CREATE POLICY "Auth Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'images' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update their own files
DROP POLICY IF EXISTS "Auth Update Access" ON storage.objects;
CREATE POLICY "Auth Update Access" 
ON storage.objects FOR UPDATE 
WITH CHECK ( bucket_id = 'images' AND auth.role() = 'authenticated' );

-- Allow authenticated users to delete files
DROP POLICY IF EXISTS "Auth Delete Access" ON storage.objects;
CREATE POLICY "Auth Delete Access" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'images' AND auth.role() = 'authenticated' );
