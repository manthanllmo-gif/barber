-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add category_id to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Policies for product_categories
DROP POLICY IF EXISTS "Public View Categories" ON product_categories;
CREATE POLICY "Public View Categories" ON product_categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super Admin Manage Categories" ON product_categories;
CREATE POLICY "Super Admin Manage Categories" ON product_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
        )
    );

-- Insert some default categories
INSERT INTO product_categories (name, image_url)
VALUES 
('Hair Care', 'https://images.unsplash.com/photo-1527799822344-42ad8c562a2d?w=400&q=80'),
('Beard Care', 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400&q=80'),
('Styling', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&q=80'),
('Tools', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80')
ON CONFLICT (name) DO NOTHING;
