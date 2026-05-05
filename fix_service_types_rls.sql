-- 1. Enable RLS on service_types table
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone to VIEW service types (needed for home page / explore)
DROP POLICY IF EXISTS "Anyone can view service types" ON public.service_types;
CREATE POLICY "Anyone can view service types" ON public.service_types
    FOR SELECT USING (true);

-- 3. Allow Super Admins to MANAGE service types (Insert, Update, Delete)
DROP POLICY IF EXISTS "Super Admins can manage service types" ON public.service_types;
CREATE POLICY "Super Admins can manage service types" ON public.service_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
        )
    );

-- Note: Ensure your user role is 'super_admin' in the 'profiles' table.
