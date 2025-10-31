-- Complete database setup for exam functionality
-- Run this in Supabase SQL Editor to fix all exam-related issues

-- ============================================================================
-- 1. ENSURE PROFILES TABLE EXISTS AND IS PROPERLY SET UP
-- ============================================================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- 2. ENSURE EXAMS TABLE EXISTS AND IS PROPERLY SET UP
-- ============================================================================

-- Create exams table if it doesn't exist
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  questions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_exam_times CHECK (end_time > start_time)
);

-- Enable RLS for exams
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view published exams" ON exams;
DROP POLICY IF EXISTS "Admins can create exams" ON exams;
DROP POLICY IF EXISTS "Admins can update their exams" ON exams;
DROP POLICY IF EXISTS "Admins can delete their exams" ON exams;

-- Create policies for exams table
CREATE POLICY "Anyone can view published exams" ON exams FOR SELECT USING (true);
CREATE POLICY "Admins can create exams" ON exams FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update their exams" ON exams FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete their exams" ON exams FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- 3. CREATE EXAM_SESSIONS TABLE (CRITICAL FOR STARTING EXAMS)
-- ============================================================================

-- Create exam_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'flagged')),
  final_cheat_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, student_id) -- Prevent duplicate sessions
);

-- Enable RLS for exam_sessions
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Students can view their own sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Students can create their own sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Students can update their own sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON exam_sessions;

-- Create policies for exam_sessions
CREATE POLICY "Students can view their own sessions" ON exam_sessions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create their own sessions" ON exam_sessions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update their own sessions" ON exam_sessions FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Admins can view all sessions" ON exam_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- 4. CREATE AUTO-PROFILE CREATION FOR NEW USERS
-- ============================================================================

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 5. CREATE PROFILES FOR EXISTING USERS
-- ============================================================================

-- Insert profiles for any existing auth users who don't have profiles yet
INSERT INTO profiles (id, full_name, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  'student' as role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_exams_created_by ON exams(created_by);
CREATE INDEX IF NOT EXISTS idx_exams_start_time ON exams(start_time);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_id ON exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_student_id ON exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_unique ON exam_sessions(exam_id, student_id);

-- ============================================================================
-- 7. VERIFICATION QUERIES
-- ============================================================================

-- Check if all tables exist
SELECT 
  'profiles' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'exams' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'exams') THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
  'exam_sessions' as table_name,
  CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'exam_sessions') THEN 'EXISTS' ELSE 'MISSING' END as status;