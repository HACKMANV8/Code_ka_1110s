-- Migration: Fix Row-Level Security (RLS) for exam tables - FIX DUPLICATE POLICIES
-- Date: 2025-11-01
-- Issue: Students couldn't insert exam results due to missing RLS policy
-- Previous attempt created duplicate policies, this version drops ALL before creating

-- ============================================================================
-- FIX 1: EXAM_RESULTS TABLE - Drop ALL policies then create correct ones
-- ============================================================================
-- Drop ALL existing policies (both old and new names to avoid conflicts)
DROP POLICY IF EXISTS "Students can view their own results" ON exam_results;
DROP POLICY IF EXISTS "Admins can do everything with exam_results" ON exam_results;
DROP POLICY IF EXISTS "Students can insert their own exam results" ON exam_results;
DROP POLICY IF EXISTS "Students can update their own exam results" ON exam_results;
DROP POLICY IF EXISTS "Students can view their own exam results" ON exam_results;

-- Now create fresh policies
CREATE POLICY "Students can insert their own exam results" ON exam_results
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
  );

CREATE POLICY "Students can update their own exam results" ON exam_results
  FOR UPDATE USING (
    student_id = auth.uid()
  );

CREATE POLICY "Students can view their own exam results" ON exam_results
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can do everything with exam results" ON exam_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIX 2: STUDENT_ANALYTICS TABLE - Drop ALL policies then create correct ones
-- ============================================================================
-- Drop ALL existing policies (both old and new names to avoid conflicts)
DROP POLICY IF EXISTS "Students can view their own analytics" ON student_analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON student_analytics;
DROP POLICY IF EXISTS "System can update analytics" ON student_analytics;
DROP POLICY IF EXISTS "Students can insert their own analytics" ON student_analytics;
DROP POLICY IF EXISTS "Students can update their own analytics" ON student_analytics;
DROP POLICY IF EXISTS "System can manage analytics" ON student_analytics;

-- Now create fresh policies
CREATE POLICY "Students can insert their own analytics" ON student_analytics
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
  );

CREATE POLICY "Students can update their own analytics" ON student_analytics
  FOR UPDATE USING (
    student_id = auth.uid()
  );

CREATE POLICY "Students can view their own analytics" ON student_analytics
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can view all analytics" ON student_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can manage analytics" ON student_analytics
  FOR ALL USING (true);

ALTER TABLE student_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIX 3: EXAM_REVIEW_HISTORY TABLE - Drop ALL policies then create correct ones
-- ============================================================================
-- Drop ALL existing policies (both old and new names to avoid conflicts)
DROP POLICY IF EXISTS "Students can view and create their own review history" ON exam_review_history;
DROP POLICY IF EXISTS "Admins can view all review history" ON exam_review_history;
DROP POLICY IF EXISTS "Students can create their own review history" ON exam_review_history;
DROP POLICY IF EXISTS "Students can view their own review history" ON exam_review_history;
DROP POLICY IF EXISTS "Students can update their own review history" ON exam_review_history;

-- Now create fresh policies
CREATE POLICY "Students can create their own review history" ON exam_review_history
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
  );

CREATE POLICY "Students can view their own review history" ON exam_review_history
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can update their own review history" ON exam_review_history
  FOR UPDATE USING (
    student_id = auth.uid()
  );

CREATE POLICY "Admins can view all review history" ON exam_review_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE exam_review_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
