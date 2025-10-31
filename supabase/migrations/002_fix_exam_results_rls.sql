-- Migration: Fix Row-Level Security (RLS) for exam tables
-- Date: 2025-11-01
-- Issue: Students couldn't insert exam results due to missing RLS policy
-- Error: "new row violates row-level security policy for table 'exam_results'"
-- Also: Similar issues with student_analytics and exam_review_history

-- ============================================================================
-- FIX 1: EXAM_RESULTS TABLE - Add missing INSERT and UPDATE policies
-- ============================================================================
DROP POLICY IF EXISTS "Students can view their own results" ON exam_results;
DROP POLICY IF EXISTS "Admins can do everything with exam_results" ON exam_results;

-- Policy 1: Students can INSERT their own exam results
CREATE POLICY "Students can insert their own exam results" ON exam_results
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
  );

-- Policy 2: Students can UPDATE their own exam results
CREATE POLICY "Students can update their own exam results" ON exam_results
  FOR UPDATE USING (
    student_id = auth.uid()
  );

-- Policy 3: Students can SELECT (view) their own exam results
CREATE POLICY "Students can view their own exam results" ON exam_results
  FOR SELECT USING (student_id = auth.uid());

-- Policy 4: Admins can do everything with exam_results
CREATE POLICY "Admins can do everything with exam_results" ON exam_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIX 2: STUDENT_ANALYTICS TABLE - Add missing INSERT and UPDATE policies
-- ============================================================================
DROP POLICY IF EXISTS "Students can view their own analytics" ON student_analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON student_analytics;
DROP POLICY IF EXISTS "System can update analytics" ON student_analytics;

-- Policy 1: Students can INSERT their own analytics records
CREATE POLICY "Students can insert their own analytics" ON student_analytics
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
  );

-- Policy 2: Students can UPDATE their own analytics
CREATE POLICY "Students can update their own analytics" ON student_analytics
  FOR UPDATE USING (
    student_id = auth.uid()
  );

-- Policy 3: Students can SELECT (view) their own analytics
CREATE POLICY "Students can view their own analytics" ON student_analytics
  FOR SELECT USING (student_id = auth.uid());

-- Policy 4: Admins can view all analytics
CREATE POLICY "Admins can view all analytics" ON student_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy 5: System can do everything (for backend functions)
CREATE POLICY "System can manage analytics" ON student_analytics
  FOR ALL USING (true);

ALTER TABLE student_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIX 3: EXAM_REVIEW_HISTORY TABLE - Clarify and fix policies
-- ============================================================================
DROP POLICY IF EXISTS "Students can view and create their own review history" ON exam_review_history;
DROP POLICY IF EXISTS "Admins can view all review history" ON exam_review_history;

-- Policy 1: Students can INSERT their own review history
CREATE POLICY "Students can create their own review history" ON exam_review_history
  FOR INSERT WITH CHECK (
    student_id = auth.uid()
  );

-- Policy 2: Students can SELECT (view) their own review history
CREATE POLICY "Students can view their own review history" ON exam_review_history
  FOR SELECT USING (student_id = auth.uid());

-- Policy 3: Students can UPDATE their own review history
CREATE POLICY "Students can update their own review history" ON exam_review_history
  FOR UPDATE USING (student_id = auth.uid());

-- Policy 4: Admins can view all review history
CREATE POLICY "Admins can view all review history" ON exam_review_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TABLE exam_review_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
