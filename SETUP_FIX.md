# Fix for "Forbidden" Error When Creating Exams

## Problem
The application is returning a 403 Forbidden error when trying to create exams. This happens because:

1. The `profiles` table doesn't exist in the database
2. The current user doesn't have admin privileges
3. Environment variables might not be configured properly

## Solution

### Step 1: Set Up Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

   You can find these values in your Supabase project dashboard under Settings > API.

### Step 2: Run Database Migrations

1. Apply the profiles table migration:
   ```sql
   -- Run this in your Supabase SQL editor or via CLI
   -- The migration file is: supabase/migrations/000_create_profiles_table.sql
   ```

   Or if you're using Supabase CLI:
   ```bash
   supabase db push
   ```

### Step 3: Create an Admin User

1. First, sign up for an account through the application's signup page
2. Note the email address you used
3. Run the following SQL in your Supabase SQL editor:
   ```sql
   -- Replace 'your-email@example.com' with your actual email
   UPDATE profiles 
   SET role = 'admin' 
   WHERE id = (
     SELECT id 
     FROM auth.users 
     WHERE email = 'your-email@example.com'
   );
   ```

### Step 4: Verify the Fix

1. Visit `/api/auth/status` to check your authentication status
2. The response should show:
   ```json
   {
     "authenticated": true,
     "hasProfile": true,
     "isAdmin": true
   }
   ```

3. Try creating an exam again - the 403 error should be resolved

### Step 5: Alternative Quick Fix (If migrations fail)

If you can't run migrations, you can create the profiles table manually:

```sql
-- Run this in Supabase SQL editor
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## Troubleshooting

### Still getting 403 errors?
1. Check `/api/auth/status` to verify your admin status
2. Clear browser cookies and log in again
3. Verify the profiles table exists: `SELECT * FROM profiles;`
4. Check that RLS policies are correctly set up

### Authentication not working?
1. Verify environment variables are correct
2. Check Supabase project status
3. Ensure you're using the correct project URL and anon key

### Need to make multiple users admin?
Use this query for each user:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'user-uuid-here';
```

## Files Modified/Created

- `supabase/migrations/000_create_profiles_table.sql` - Main profiles table setup
- `supabase/make_user_admin.sql` - Helper script to promote users to admin
- `app/api/auth/status/route.ts` - Debug endpoint to check auth status
- `.env.local.example` - Environment variables template