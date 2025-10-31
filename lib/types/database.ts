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
