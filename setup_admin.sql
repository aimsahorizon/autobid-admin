-- First, get or create the super_admin role
INSERT INTO admin_roles (id, role_name, display_name, description)
VALUES (gen_random_uuid(), 'super_admin', 'Super Admin', 'Full system access')
ON CONFLICT (role_name) DO NOTHING;

-- Create admin user (you'll need to sign up first via Supabase Auth, then run this with your user_id)
-- Replace 'YOUR_AUTH_USER_ID' with the actual UUID from auth.users after signing up

-- To get your user_id after signing up:
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Then insert:
-- INSERT INTO admin_users (id, user_id, role_id, is_active)
-- SELECT gen_random_uuid(), 'YOUR_AUTH_USER_ID', id, true
-- FROM admin_roles WHERE role_name = 'super_admin';
