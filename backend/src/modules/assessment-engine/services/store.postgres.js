
const { randomUUID } = require('node:crypto');
const pool = require('../../../config/db');


function normalizeRow(row) {
  if (!row) return row;

  const normalized = { ...row };

  for (const key of [
    'started_at',
    'updated_at',
    'timestamp',
    'agreed_at',
    'created_at',
  ]) {
    if (normalized[key] instanceof Date) {
      normalized[key] = normalized[key].toISOString();
    }
  }

  for (const key of [
    'score',
    'max_marks',
    'achieved_marks',
    'accuracy',
    'avg_difficulty',
    'ability_estimate',
    'theta_before',
    'theta_after',
  ]) {
    if (normalized[key] !== null && normalized[key] !== undefined) {
      normalized[key] = Number(normalized[key]);
    }
  }

  if (normalized.asked_question_ids == null) {
    normalized.asked_question_ids = [];
  }

  if (typeof normalized.asked_question_ids === 'string') {
    try {
      normalized.asked_question_ids = JSON.parse(
        normalized.asked_question_ids
      );
    } catch {
      normalized.asked_question_ids = [];
    }
  }

  if (typeof normalized.options === 'string') {
    try {
      normalized.options = JSON.parse(normalized.options);
    } catch {
      // Keep the original value if it is not valid JSON.
    }
  }

  return normalized;
}

function normalizeRows(rows) {
  return rows.map(normalizeRow);
}

async function readState() {
  const [
    questionsResult,
    sessionsResult,
    attemptsResult,
    mockResultsResult,
    consentResult,
  ] = await Promise.all([
    pool.query('SELECT * FROM assessment_questions ORDER BY question_id'),
    pool.query('SELECT * FROM assessment_sessions ORDER BY started_at'),
    pool.query('SELECT * FROM assessment_attempts ORDER BY timestamp'),
    pool.query('SELECT * FROM mock_exam_results ORDER BY created_at'),
    pool.query('SELECT * FROM consent_records ORDER BY agreed_at'),
  ]);

  return {
    questions: normalizeRows(questionsResult.rows),
    sessions: normalizeRows(sessionsResult.rows),
    attempts: normalizeRows(attemptsResult.rows),
    mockExamResults: normalizeRows(mockResultsResult.rows),
    consentRecords: normalizeRows(consentResult.rows),
  };
}

async function getQuestionsBySubject(subject) {
  const result = await pool.query(
    `SELECT * FROM assessment_questions
     WHERE LOWER(subject) = LOWER($1)
     ORDER BY question_id`,
    [subject]
  );

  return normalizeRows(result.rows);
}

async function getQuestionById(questionId) {
  const result = await pool.query(
    'SELECT * FROM assessment_questions WHERE question_id = $1 LIMIT 1',
    [questionId]
  );

  return normalizeRow(result.rows[0] || null);
}

async function getSessionById(sessionId) {
  const result = await pool.query(
    'SELECT * FROM assessment_sessions WHERE session_id = $1 LIMIT 1',
    [sessionId]
  );

  return normalizeRow(result.rows[0] || null);
}

async function getAttemptsBySession(sessionId) {
  const result = await pool.query(
    `SELECT * FROM assessment_attempts
     WHERE session_id = $1
     ORDER BY timestamp`,
    [sessionId]
  );

  return normalizeRows(result.rows);
}

async function getAttemptsByStudent(studentId) {
  const result = await pool.query(
    `SELECT * FROM assessment_attempts
     WHERE student_id = $1
     ORDER BY timestamp`,
    [studentId]
  );

  return normalizeRows(result.rows);
}

async function getSessionsByStudent(studentId) {
  const result = await pool.query(
    `SELECT * FROM assessment_sessions
     WHERE student_id = $1
     ORDER BY started_at DESC`,
    [studentId]
  );

  return normalizeRows(result.rows);
}

async function createSession(session) {
  const sessionId = session.session_id || randomUUID();
  const now = new Date().toISOString();

  const values = [
    sessionId,
    session.student_id,
    session.subject,
    session.consent_version || null,
    session.status || 'active',
    session.target_difficulty ?? 3,
    session.current_question_id || null,
    JSON.stringify(session.asked_question_ids || []),
    session.started_at || now,
    session.updated_at || now,
    session.main_topic_id || null,
    session.subtopic_id || null,
    session.ability_estimate ?? 0.0,
  ];

  const result = await pool.query(
    `INSERT INTO assessment_sessions (
      session_id, student_id, subject, consent_version, status,
      target_difficulty, current_question_id, asked_question_ids,
      started_at, updated_at, main_topic_id, subtopic_id, ability_estimate
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13)
    RETURNING *`,
    values
  );

  return normalizeRow(result.rows[0]);
}

async function updateSession(sessionId, updates) {
  const allowedFields = new Set([
    'student_id',
    'subject',
    'consent_version',
    'status',
    'target_difficulty',
    'current_question_id',
    'asked_question_ids',
    'started_at',
    'main_topic_id',
    'subtopic_id',
    'ability_estimate',
  ]);

  const entries = Object.entries(updates || {}).filter(([key]) =>
    allowedFields.has(key)
  );

  if (entries.length === 0) {
    return getSessionById(sessionId);
  }

  const values = [sessionId];
  const assignments = [];

  for (const [key, value] of entries) {
    values.push(
      key === 'asked_question_ids' ? JSON.stringify(value || []) : value
    );

    const position = values.length;
    assignments.push(
      key === 'asked_question_ids'
        ? `${key} = $${position}::jsonb`
        : `${key} = $${position}`
    );
  }

  assignments.push('updated_at = NOW()');

  const result = await pool.query(
    `UPDATE assessment_sessions
     SET ${assignments.join(', ')}
     WHERE session_id = $1
     RETURNING *`,
    values
  );

  return normalizeRow(result.rows[0] || null);
}

async function recordConsent(studentId, consentVersion) {
  const sid =
    typeof studentId === 'object' && studentId !== null
      ? studentId.student_id
      : studentId;
  const cVer =
    typeof studentId === 'object' && studentId !== null
      ? studentId.consent_version || consentVersion
      : consentVersion;

  const result = await pool.query(
    `INSERT INTO consent_records (student_id, consent_version, agreed_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (student_id)
     DO UPDATE SET
       consent_version = EXCLUDED.consent_version,
       agreed_at = EXCLUDED.agreed_at
     RETURNING *`,
    [sid, cVer || '2026-10-research-consent-draft']
  );

  return normalizeRow(result.rows[0]);
}

async function getConsent(studentId) {
  const result = await pool.query(
    `SELECT * FROM consent_records
     WHERE student_id = $1
     ORDER BY agreed_at DESC
     LIMIT 1`,
    [studentId]
  );

  return normalizeRow(result.rows[0] || null);
}

async function recordAttempt(attempt) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const attemptId = attempt.attempt_id || randomUUID();

    const insertResult = await client.query(
      `INSERT INTO assessment_attempts (
        attempt_id, session_id, student_id, question_id,
        selected_answer, score, max_marks, time_taken_seconds,
        timestamp, is_correct, topic_id, theta_before, theta_after
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        COALESCE($9::timestamptz, NOW()), $10, $11, $12, $13
      )
      ON CONFLICT (session_id, question_id) DO NOTHING
      RETURNING *`,
      [
        attemptId,
        attempt.session_id,
        attempt.student_id,
        attempt.question_id,
        attempt.selected_answer ?? null,
        attempt.score ?? 0,
        attempt.max_marks ?? 1,
        attempt.time_taken_seconds ?? 0,
        attempt.timestamp || null,
        attempt.is_correct ?? false,
        attempt.topic_id || null,
        attempt.theta_before ?? null,
        attempt.theta_after ?? null,
      ]
    );

    let savedAttempt = insertResult.rows[0];
    let duplicate = false;

    if (!savedAttempt) {
      const existingResult = await client.query(
        `SELECT * FROM assessment_attempts
         WHERE session_id = $1 AND question_id = $2
         LIMIT 1`,
        [attempt.session_id, attempt.question_id]
      );

      savedAttempt = existingResult.rows[0];
      duplicate = true;
    }

    if (!savedAttempt) {
      throw new Error('Unable to save or retrieve assessment attempt.');
    }

    if (!duplicate) {
      const sessionResult = await client.query(
        `SELECT asked_question_ids
         FROM assessment_sessions
         WHERE session_id = $1
         FOR UPDATE`,
        [attempt.session_id]
      );

      if (sessionResult.rows[0]) {
        let askedIds = sessionResult.rows[0].asked_question_ids || [];

        if (typeof askedIds === 'string') {
          try {
            askedIds = JSON.parse(askedIds);
          } catch {
            askedIds = [];
          }
        }

        if (!askedIds.includes(attempt.question_id)) {
          askedIds.push(attempt.question_id);
        }

        await client.query(
          `UPDATE assessment_sessions
           SET asked_question_ids = $2::jsonb,
               updated_at = NOW()
           WHERE session_id = $1`,
          [attempt.session_id, JSON.stringify(askedIds)]
        );
      }
    }

    await client.query('COMMIT');

    const normalized = normalizeRow(savedAttempt);
    return {
      attempt: normalized,
      duplicate,
      ...normalized,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateSessionDifficulty(
  sessionId,
  targetDifficulty,
  currentQuestionId,
  _unusedAskedQuestionId,
  abilityEstimate
) {
  const session = await getSessionById(sessionId);

  if (!session) {
    return null;
  }

  const askedIds = Array.isArray(session.asked_question_ids)
    ? [...session.asked_question_ids]
    : [];

  if (currentQuestionId && !askedIds.includes(currentQuestionId)) {
    askedIds.push(currentQuestionId);
  }

  const patch = {
    target_difficulty: targetDifficulty,
    current_question_id: currentQuestionId || null,
    asked_question_ids: askedIds,
  };

  if (abilityEstimate !== undefined && abilityEstimate !== null) {
    patch.ability_estimate = abilityEstimate;
  }

  return updateSession(sessionId, patch);
}

async function completeSession(sessionId) {
  return updateSession(sessionId, { status: 'completed' });
}

async function getMockExamResultsByStudent(studentId) {
  const result = await pool.query(
    `SELECT * FROM mock_exam_results
     WHERE student_id = $1
     ORDER BY exam_date DESC, created_at DESC`,
    [studentId]
  );

  return normalizeRows(result.rows);
}

async function appendMockExamResult(result) {
  const resultId = result.result_id || randomUUID();

  const insertResult = await pool.query(
    `INSERT INTO mock_exam_results (
      result_id, student_id, subject, achieved_marks, max_marks,
      exam_date, source_reference, attempt_count, accuracy,
      avg_difficulty, created_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      COALESCE($6::date, CURRENT_DATE), $7, $8, $9,
      $10, NOW()
    )
    RETURNING *`,
    [
      resultId,
      result.student_id,
      result.subject,
      result.achieved_marks ?? 0,
      result.max_marks ?? 0,
      result.exam_date || null,
      result.source_reference || null,
      result.attempt_count ?? 1,
      result.accuracy ?? 0,
      result.avg_difficulty ?? null,
    ]
  );

  return normalizeRow(insertResult.rows[0]);
}

async function upsertQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return [];
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const savedQuestions = [];

    for (const question of questions) {
      const values = [
        question.question_id,
        question.subject,
        question.topic_id || null,
        question.topic_name || '',
        question.question_text || '',
        JSON.stringify(question.options || []),
        question.correct_answer || '',
        question.max_marks ?? 1,
        question.expert_difficulty ?? 3,
        question.source_reference || null,
        question.syllabus_version || null,
        question.is_synthetic ?? false,
        question.image_path || null,
        question.explanation || null,
        question.main_topic_id || null,
        question.main_topic_name || null,
        question.subtopic_id || null,
        question.subtopic_name || null,
        question.correct_answer_text || null,
        question.difficulty_level || null,
      ];

      const result = await client.query(
        `INSERT INTO assessment_questions (
          question_id, subject, topic_id, topic_name, question_text,
          options, correct_answer, max_marks, expert_difficulty,
          source_reference, syllabus_version, is_synthetic,
          image_path, explanation, main_topic_id, main_topic_name,
          subtopic_id, subtopic_name, correct_answer_text, difficulty_level
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6::jsonb, $7, $8, $9,
          $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19, $20
        )
        ON CONFLICT (question_id) DO UPDATE SET
          subject = EXCLUDED.subject,
          topic_id = EXCLUDED.topic_id,
          topic_name = EXCLUDED.topic_name,
          question_text = EXCLUDED.question_text,
          options = EXCLUDED.options,
          correct_answer = EXCLUDED.correct_answer,
          max_marks = EXCLUDED.max_marks,
          expert_difficulty = EXCLUDED.expert_difficulty,
          source_reference = EXCLUDED.source_reference,
          syllabus_version = EXCLUDED.syllabus_version,
          is_synthetic = EXCLUDED.is_synthetic,
          image_path = EXCLUDED.image_path,
          explanation = EXCLUDED.explanation,
          main_topic_id = EXCLUDED.main_topic_id,
          main_topic_name = EXCLUDED.main_topic_name,
          subtopic_id = EXCLUDED.subtopic_id,
          subtopic_name = EXCLUDED.subtopic_name,
          correct_answer_text = EXCLUDED.correct_answer_text,
          difficulty_level = EXCLUDED.difficulty_level
        RETURNING *`,
        values
      );

      savedQuestions.push(normalizeRow(result.rows[0]));
    }

    await client.query('COMMIT');
    return savedQuestions;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function resetForTests() {
  throw new Error(
    'resetForTests() is disabled for PostgreSQL storage to protect database data.'
  );
}

module.exports = {
  readState,
  getQuestionsBySubject,
  getQuestionById,
  getSessionById,
  getAttemptsBySession,
  getAttemptsByStudent,
  getSessionsByStudent,
  createSession,
  updateSession,
  recordConsent,
  getConsent,
  recordAttempt,
  updateSessionDifficulty,
  completeSession,
  getMockExamResultsByStudent,
  appendMockExamResult,
  upsertQuestions,
  resetForTests,
};
