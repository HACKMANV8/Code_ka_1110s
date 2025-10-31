-- Helper script to make a user an admin
-- Run this after creating a user account to grant admin privileges

-- Replace 'your-email@example.com' with the email of the user you want to make admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'your-email@example.com'
);

-- Alternatively, if you know the user ID, you can use:
-- UPDATE profiles SET role = 'admin' WHERE id = 'user-uuid-here';

-- To check current user roles:
-- SELECT u.email, p.role, p.full_name 
-- FROM auth.users u 
-- JOIN profiles p ON u.id = p.id;