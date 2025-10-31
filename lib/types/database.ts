export interface Profile {
  id: string;
  full_name: string | null;
  role: "student" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExamSession {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  status: "in_progress" | "submitted" | "flagged";
  created_at: string;
  updated_at: string;
  student?: Profile;
  exam?: Exam;
}

export interface CheatScore {
  id: string;
  session_id: string;
  score: number;
  confidence: number | null;
  detected_behavior: string[] | null;
  timestamp: string;
  created_at: string;
  session?: ExamSession;
}

export interface VideoMetadata {
  id: string;
  session_id: string;
  storage_path: string;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  uploaded_at: string;
  created_at: string;
}

export interface StudentLeaderboardItem {
  student_id: string;
  student_name: string;
  session_id: string;
  exam_title: string;
  cheat_score: number;
  confidence: number;
  status: "in_progress" | "submitted" | "flagged";
  detected_behaviors: string[];
  last_updated: string;
}

export interface SuspiciousSnapshot {
  id: string;
  session_id: string;
  storage_path: string;
  captured_at: string;
  created_at: string;
  session?: ExamSession;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: "mcq" | "multiple_select" | "true_false" | "short_answer" | "long_answer";
  marks: number;
  order_index: number;
  explanation: string | null;
  difficulty_level: "easy" | "medium" | "hard" | null;
  topic: string | null;
  created_at: string;
  updated_at: string;
  exam?: Exam;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  option_label: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
  question?: ExamQuestion;
}

export interface StudentAnswer {
  id: string;
  session_id: string;
  question_id: string;
  selected_options: string[] | null; // Array of option IDs
  text_answer: string | null;
  is_correct: boolean | null;
  marks_obtained: number;
  time_spent_seconds: number | null;
  answered_at: string;
  created_at: string;
  updated_at: string;
  session?: ExamSession;
  question?: ExamQuestion;
}

export interface ExamResult {
  id: string;
  session_id: string;
  student_id: string;
  exam_id: string;
  
  // Academic Performance
  total_questions: number;
  attempted_questions: number;
  correct_answers: number;
  wrong_answers: number;
  total_marks: number;
  marks_obtained: number;
  percentage: number;
  
  // Grading
  grade: string | null;
  pass_status: boolean;
  
  // Proctoring Score
  cheat_score: number | null;
  focus_score: number | null;
  proctoring_status: "clean" | "suspicious" | "flagged" | null;
  
  // Timing
  time_taken_minutes: number | null;
  submitted_at: string | null;
  
  // Additional Info
  remarks: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  student?: Profile;
  exam?: Exam;
  session?: ExamSession;
}

export interface StudentAnalytics {
  id: string;
  student_id: string;
  
  // Overall Stats
  total_exams_taken: number;
  total_exams_passed: number;
  total_exams_failed: number;
  average_percentage: number;
  average_cheat_score: number;
  
  // Performance by Topic
  topic_performance: Record<string, { avg: number; count: number }>;
  
  // Streaks
  current_streak: number;
  best_streak: number;
  
  // Ranking
  overall_rank: number | null;
  percentile: number | null;
  
  // Last Activity
  last_exam_date: string | null;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  student?: Profile;
}

export interface ExamReviewHistory {
  id: string;
  session_id: string;
  student_id: string;
  question_id: string | null;
  
  // AI Explanation Tracking
  requested_ai_explanation: boolean;
  ai_explanation_text: string | null;
  ai_explanation_tokens: number | null;
  
  viewed_at: string;
  
  // Relations
  session?: ExamSession;
  student?: Profile;
  question?: ExamQuestion;
}

// Dashboard Types
export interface StudentDashboardStats {
  totalExams: number;
  averageScore: number;
  averageFocusScore: number;
  passRate: number;
  currentStreak: number;
  recentExams: ExamResult[];
  topicPerformance: Array<{
    topic: string;
    average: number;
    count: number;
  }>;
  performanceTrend: Array<{
    date: string;
    score: number;
    exam: string;
  }>;
}

export interface ExamReviewData {
  exam: Exam;
  result: ExamResult;
  questions: Array<{
    question: ExamQuestion;
    options: QuestionOption[];
    studentAnswer: StudentAnswer;
  }>;
  session: ExamSession;
}
