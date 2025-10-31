-- Make admin@test.com an admin user
-- Run this AFTER creating the user account

-- First, ensure the profiles table exists and the user has a profile
INSERT INTO profiles (id, full_name, role)
SELECT 
  u.id,
  'Admin User' as full_name,
  'admin' as role
FROM auth.users u
WHERE u.email = 'admin@test.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = COALESCE(profiles.full_name, 'Admin User');

-- Verify the admin user was created
SELECT 
  u.email,
  p.role,
  p.full_name,
  p.created_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@test.com';