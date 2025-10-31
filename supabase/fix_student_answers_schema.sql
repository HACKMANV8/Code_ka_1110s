-- Fix student_answers table to work with JSONB questions (not UUID references)
-- This migration changes question_id from UUID to INTEGER to match the question IDs in exams.questions JSONB

-- Drop the existing student_answers table if it has wrong schema
DROP TABLE IF EXISTS student_answers CASCADE;

-- Create student_answers table with INTEGER question_id (matching JSONB question IDs)
CREATE TABLE student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL, -- Changed from UUID to INTEGER to match JSONB questions
  selected_options TEXT[], -- Array of selected option texts (not UUIDs)
  text_answer TEXT, -- For text/essay questions
  is_correct BOOLEAN DEFAULT NULL, -- Calculated after submission
  marks_obtained DECIMAL(5,2) DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, question_id) -- One answer per question per session
);

-- Create indexes for performance
CREATE INDEX idx_student_answers_session_id ON student_answers(session_id);
CREATE INDEX idx_student_answers_question_id ON student_answers(question_id);

-- Enable RLS
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Students can view their own answers" ON student_answers;
DROP POLICY IF EXISTS "Students can insert their own answers" ON student_answers;
DROP POLICY IF EXISTS "Students can update their own answers" ON student_answers;
DROP POLICY IF EXISTS "Admins can view all answers" ON student_answers;

-- Create RLS policies
CREATE POLICY "Students can view their own answers" ON student_answers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM exam_sessions 
    WHERE exam_sessions.id = student_answers.session_id 
    AND exam_sessions.student_id = auth.uid()
  )
);

CREATE POLICY "Students can insert their own answers" ON student_answers FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM exam_sessions 
    WHERE exam_sessions.id = student_answers.session_id 
    AND exam_sessions.student_id = auth.uid()
    AND exam_sessions.status = 'in_progress'
  )
);

CREATE POLICY "Students can update their own answers" ON student_answers FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM exam_sessions 
    WHERE exam_sessions.id = student_answers.session_id 
    AND exam_sessions.student_id = auth.uid()
    AND exam_sessions.status = 'in_progress'
  )
);

CREATE POLICY "Admins can view all answers" ON student_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_student_answers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_student_answers_updated_at ON student_answers;
CREATE TRIGGER update_student_answers_updated_at
  BEFORE UPDATE ON student_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_student_answers_updated_at();

-- Grant necessary permissions
GRANT ALL ON student_answers TO authenticated;
