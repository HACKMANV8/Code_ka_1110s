# Fix for Exam Start Error

## The Problem
When you try to start an exam on the first attempt, you're getting an error. This is likely because:

1. The `exam_sessions` table doesn't exist
2. Missing database policies 
3. Missing user profile
4. Database permission issues

## Step-by-Step Solution

### Step 1: Run Complete Database Setup

1. **Go to your Supabase dashboard**: https://supabase.com/dashboard/project/povokpovvyapwllgxvdi
2. **Navigate to SQL Editor**
3. **Copy and paste the entire contents** of `complete_exam_setup.sql`
4. **Click "Run"** to execute the SQL

This will:
- Create all required tables (`profiles`, `exams`, `exam_sessions`)
- Set up proper Row Level Security policies
- Create profiles for existing users
- Add necessary database indexes

### Step 2: Verify Your User Profile

After running the setup, verify that your user has a profile:

```sql
-- Check your user profile (run this in SQL Editor)
SELECT 
  u.email,
  p.role,
  p.full_name,
  p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'your-email@example.com'; -- Replace with your email
```

If no profile is returned, create one manually:

```sql
-- Create profile for your user (replace email)
INSERT INTO profiles (id, full_name, role)
SELECT 
  u.id,
  'Your Name', -- Replace with your name
  'student'
FROM auth.users u
WHERE u.email = 'your-email@example.com' -- Replace with your email
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;
```

### Step 3: Test the Debug Endpoint

1. **Open your browser** and go to: http://localhost:3000/api/auth/status
2. **Check the response** - it should show:
   ```json
   {
     "authenticated": true,
     "hasProfile": true,
     "isAdmin": false
   }
   ```

If `hasProfile` is false, repeat Step 2.

### Step 4: Test Exam Start Again

1. **Go to your dashboard**: http://localhost:3000/dashboard
2. **Try to start the exam** by clicking "Start Exam"
3. **The error should be resolved**

## Common Issues and Solutions

### Issue: "Table 'exam_sessions' doesn't exist"
**Solution**: Run the complete database setup from Step 1

### Issue: "Row Level Security policy violation"  
**Solution**: The setup script includes proper RLS policies. If still having issues, temporarily disable RLS:
```sql
-- Temporary fix (NOT recommended for production)
ALTER TABLE exam_sessions DISABLE ROW LEVEL SECURITY;
```

### Issue: "User not found" or authentication errors
**Solution**: 
1. Clear browser cookies
2. Sign out and sign back in
3. Verify environment variables in `.env.local`

### Issue: Still getting permission errors
**Solution**: Check if your user profile exists and has correct permissions:
```sql
-- Verify current user and permissions
SELECT 
  auth.uid() as current_user_id,
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid()) as has_profile,
  (SELECT role FROM profiles WHERE id = auth.uid()) as user_role;
```

## Emergency Bypass (Development Only)

If you're still having issues and need to test immediately, you can temporarily bypass RLS:

```sql
-- DEVELOPMENT ONLY - Remove RLS temporarily
ALTER TABLE exam_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
```

**Important**: Re-enable RLS after testing:
```sql
-- Re-enable RLS after fixing issues
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY; 
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
```

## Verification

After completing all steps, verify everything works:

1. ✅ Can access dashboard without errors
2. ✅ Can see available exams
3. ✅ Can start exam without errors
4. ✅ Debug endpoint shows correct authentication status

The exam start error should now be completely resolved!