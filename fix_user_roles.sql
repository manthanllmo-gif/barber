-- Fix the role check constraint to allow 'customer' role
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users ADD CONSTRAINT users_role_check 
CHECK (role = ANY (ARRAY['super_admin'::text, 'shop_owner'::text, 'customer'::text]));

-- Verify the change
COMMENT ON CONSTRAINT users_role_check ON public.users IS 'Allows super_admin, shop_owner, and customer roles';
