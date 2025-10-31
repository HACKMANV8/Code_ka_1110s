-- Migration: Create tables for exam questions, options, student answers, and results
-- Date: 2025-10-31
-- Description: Tables needed for student dashboard and exam review functionality

-- ============================================================================
-- 1. EXAM QUESTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('mcq', 'multiple_select', 'true_false', 'short_answer', 'long_answer')),
  marks INTEGER NOT NULL DEFAULT 1 CHECK (marks > 0),
  order_index INTEGER NOT NULL,
  explanation TEXT, -- Optional explanation for the correct answer
  difficulty_level VARCHAR(10) CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  topic VARCHAR(100), -- For analytics by subject/topic
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, order_index)
);

-- Index for faster queries
CREATE INDEX idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX idx_exam_questions_topic ON exam_questions(topic);

-- ============================================================================
-- 2. QUESTION OPTIONS TABLE (for MCQs and Multiple Select)
-- ============================================================================
CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_label VARCHAR(5) NOT NULL, -- 'A', 'B', 'C', 'D', etc.
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_id, option_label),
  UNIQUE(question_id, order_index)
);

-- Index for faster queries
CREATE INDEX idx_question_options_question_id ON question_options(question_id);

-- ============================================================================
-- 3. STUDENT ANSWERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  selected_options UUID[], -- Array of option IDs for MCQ/Multiple Select
  text_answer TEXT, -- For short/long answer questions
  is_correct BOOLEAN, -- Auto-calculated for MCQ, manual for text answers
  marks_obtained DECIMAL(5,2) DEFAULT 0,
  time_spent_seconds INTEGER, -- Time spent on this question
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

-- Indexes for faster queries
CREATE INDEX idx_student_answers_session_id ON student_answers(session_id);
CREATE INDEX idx_student_answers_question_id ON student_answers(question_id);
CREATE INDEX idx_student_answers_is_correct ON student_answers(is_correct);

-- ============================================================================
-- 4. EXAM RESULTS TABLE (Summary of each exam attempt)
-- ============================================================================
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE UNIQUE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  
  -- Academic Performance
  total_questions INTEGER NOT NULL DEFAULT 0,
  attempted_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  wrong_answers INTEGER NOT NULL DEFAULT 0,
  total_marks DECIMAL(6,2) NOT NULL,
  marks_obtained DECIMAL(6,2) NOT NULL DEFAULT 0,
  percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_marks > 0 THEN ROUND((marks_obtained / total_marks * 100)::numeric, 2)
      ELSE 0
    END
  ) STORED,
  
  -- Grading
  grade VARCHAR(5), -- 'A+', 'A', 'B+', 'B', 'C', 'D', 'F'
  pass_status BOOLEAN DEFAULT FALSE,
  
  -- Proctoring Score
  cheat_score INTEGER, -- From exam_sessions.final_cheat_score
  focus_score INTEGER, -- Inverse of cheat score (100 - cheat_score)
  proctoring_status VARCHAR(20) CHECK (proctoring_status IN ('clean', 'suspicious', 'flagged')),
  
  -- Timing
  time_taken_minutes INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional Info
  remarks TEXT,
  reviewed_by UUID REFERENCES profiles(id), -- Admin who reviewed
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_exam_results_student_id ON exam_results(student_id);
CREATE INDEX idx_exam_results_exam_id ON exam_results(exam_id);
CREATE INDEX idx_exam_results_session_id ON exam_results(session_id);
CREATE INDEX idx_exam_results_percentage ON exam_results(percentage);
CREATE INDEX idx_exam_results_pass_status ON exam_results(pass_status);

-- ============================================================================
-- 5. STUDENT PERFORMANCE ANALYTICS TABLE (Aggregated Stats)
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Overall Stats
  total_exams_taken INTEGER DEFAULT 0,
  total_exams_passed INTEGER DEFAULT 0,
  total_exams_failed INTEGER DEFAULT 0,
  average_percentage DECIMAL(5,2) DEFAULT 0,
  average_cheat_score DECIMAL(5,2) DEFAULT 0,
  
  -- Performance by Topic (JSONB for flexibility)
  topic_performance JSONB DEFAULT '{}', -- {"Math": {"avg": 85, "count": 5}, "Science": {...}}
  
  -- Streaks
  current_streak INTEGER DEFAULT 0, -- Consecutive exams passed
  best_streak INTEGER DEFAULT 0,
  
  -- Ranking (will be calculated periodically)
  overall_rank INTEGER,
  percentile DECIMAL(5,2),
  
  -- Last Activity
  last_exam_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id)
);

-- Index for faster queries
CREATE INDEX idx_student_analytics_student_id ON student_analytics(student_id);
CREATE INDEX idx_student_analytics_overall_rank ON student_analytics(overall_rank);

-- ============================================================================
-- 6. EXAM REVIEW HISTORY TABLE (Track when students review their exams)
-- ============================================================================
CREATE TABLE IF NOT EXISTS exam_review_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES exam_questions(id) ON DELETE SET NULL,
  
  -- AI Explanation Tracking
  requested_ai_explanation BOOLEAN DEFAULT FALSE,
  ai_explanation_text TEXT,
  ai_explanation_tokens INTEGER, -- Track API usage
  
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_exam_review_history_session_id ON exam_review_history(session_id);
CREATE INDEX idx_exam_review_history_student_id ON exam_review_history(student_id);

-- ============================================================================
-- 7. ADD MISSING COLUMN TO EXAM_SESSIONS (if not exists)
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'exam_sessions' AND column_name = 'final_cheat_score'
  ) THEN
    ALTER TABLE exam_sessions ADD COLUMN final_cheat_score INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exam_questions_updated_at BEFORE UPDATE ON exam_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_answers_updated_at BEFORE UPDATE ON student_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_results_updated_at BEFORE UPDATE ON exam_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_analytics_updated_at BEFORE UPDATE ON student_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_review_history ENABLE ROW LEVEL SECURITY;

-- Exam Questions Policies
CREATE POLICY "Admins can do everything with exam_questions" ON exam_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Students can view questions for their active exams" ON exam_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_sessions 
      WHERE exam_sessions.exam_id = exam_questions.exam_id 
        AND exam_sessions.student_id = auth.uid()
    )
  );

-- Question Options Policies
CREATE POLICY "Admins can do everything with question_options" ON question_options
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Students can view options for their exam questions" ON question_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_questions eq
      JOIN exam_sessions es ON es.exam_id = eq.exam_id
      WHERE eq.id = question_options.question_id
        AND es.student_id = auth.uid()
    )
  );

-- Student Answers Policies
CREATE POLICY "Students can insert their own answers" ON student_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_sessions 
      WHERE exam_sessions.id = session_id 
        AND exam_sessions.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own answers" ON student_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_sessions 
      WHERE exam_sessions.id = session_id 
        AND exam_sessions.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own answers during exam" ON student_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM exam_sessions 
      WHERE exam_sessions.id = session_id 
        AND exam_sessions.student_id = auth.uid()
        AND exam_sessions.status = 'in_progress'
    )
  );

CREATE POLICY "Admins can view all answers" ON student_answers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update answers for grading" ON student_answers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Exam Results Policies
CREATE POLICY "Students can view their own results" ON exam_results
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can do everything with exam_results" ON exam_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Student Analytics Policies
CREATE POLICY "Students can view their own analytics" ON student_analytics
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Admins can view all analytics" ON student_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can update analytics" ON student_analytics
  FOR ALL USING (true); -- Will be called from secure backend functions

-- Exam Review History Policies
CREATE POLICY "Students can view and create their own review history" ON exam_review_history
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Admins can view all review history" ON exam_review_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate grade based on percentage
CREATE OR REPLACE FUNCTION calculate_grade(percentage DECIMAL)
RETURNS VARCHAR(5) AS $$
BEGIN
  RETURN CASE
    WHEN percentage >= 95 THEN 'A+'
    WHEN percentage >= 90 THEN 'A'
    WHEN percentage >= 85 THEN 'B+'
    WHEN percentage >= 80 THEN 'B'
    WHEN percentage >= 75 THEN 'C+'
    WHEN percentage >= 70 THEN 'C'
    WHEN percentage >= 65 THEN 'D+'
    WHEN percentage >= 60 THEN 'D'
    ELSE 'F'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update student analytics after exam submission
CREATE OR REPLACE FUNCTION update_student_analytics_after_exam()
RETURNS TRIGGER AS $$
DECLARE
  student_record RECORD;
  topic_stats JSONB;
BEGIN
  -- Get or create student analytics record
  INSERT INTO student_analytics (student_id)
  VALUES (NEW.student_id)
  ON CONFLICT (student_id) DO NOTHING;

  -- Update overall stats
  UPDATE student_analytics
  SET
    total_exams_taken = total_exams_taken + 1,
    total_exams_passed = total_exams_passed + CASE WHEN NEW.pass_status THEN 1 ELSE 0 END,
    total_exams_failed = total_exams_failed + CASE WHEN NOT NEW.pass_status THEN 1 ELSE 0 END,
    average_percentage = (
      SELECT AVG(percentage)
      FROM exam_results
      WHERE student_id = NEW.student_id
    ),
    average_cheat_score = (
      SELECT AVG(cheat_score)
      FROM exam_results
      WHERE student_id = NEW.student_id AND cheat_score IS NOT NULL
    ),
    last_exam_date = NEW.submitted_at,
    updated_at = NOW()
  WHERE student_id = NEW.student_id;

  -- Update streak
  IF NEW.pass_status THEN
    UPDATE student_analytics
    SET
      current_streak = current_streak + 1,
      best_streak = GREATEST(best_streak, current_streak + 1)
    WHERE student_id = NEW.student_id;
  ELSE
    UPDATE student_analytics
    SET current_streak = 0
    WHERE student_id = NEW.student_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update analytics when exam result is inserted/updated
CREATE TRIGGER trigger_update_student_analytics
  AFTER INSERT OR UPDATE ON exam_results
  FOR EACH ROW
  EXECUTE FUNCTION update_student_analytics_after_exam();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE exam_questions IS 'Stores all questions for exams';
COMMENT ON TABLE question_options IS 'Stores multiple choice options for questions';
COMMENT ON TABLE student_answers IS 'Stores student responses to exam questions';
COMMENT ON TABLE exam_results IS 'Summary of student exam performance';
COMMENT ON TABLE student_analytics IS 'Aggregated analytics for student dashboard';
COMMENT ON TABLE exam_review_history IS 'Tracks when students review their exams and request AI explanations';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
