CREATE TABLE IF NOT EXISTS assessment_questions (
  question_id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  max_marks INTEGER NOT NULL DEFAULT 1,
  expert_difficulty INTEGER NOT NULL CHECK (expert_difficulty BETWEEN 1 AND 5),
  source_reference TEXT NOT NULL,
  syllabus_version TEXT NOT NULL,
  is_synthetic BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS assessment_sessions (
  session_id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  target_difficulty INTEGER NOT NULL DEFAULT 3,
  current_question_id TEXT,
  asked_question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  attempt_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES assessment_sessions(session_id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  question_id TEXT NOT NULL REFERENCES assessment_questions(question_id),
  selected_answer TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  max_marks NUMERIC NOT NULL DEFAULT 1,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (session_id, question_id)
);

CREATE TABLE IF NOT EXISTS consent_records (
  student_id TEXT PRIMARY KEY,
  consent_version TEXT NOT NULL,
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mock_exam_results (
  result_id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  achieved_marks NUMERIC NOT NULL,
  max_marks NUMERIC NOT NULL,
  exam_date DATE NOT NULL,
  source_reference TEXT NOT NULL,
  attempt_count INTEGER,
  accuracy NUMERIC,
  avg_difficulty NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessment_sessions_student ON assessment_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student ON assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_session ON assessment_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_subject ON assessment_questions(subject);
CREATE INDEX IF NOT EXISTS idx_mock_exam_results_student ON mock_exam_results(student_id);