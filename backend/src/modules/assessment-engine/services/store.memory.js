const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const seedQuestions = require('../data/questions');

const { mapQuestionToSyllabus } = require('../data/chemistrySyllabus');

const DATA_DIR = path.resolve(__dirname, '../../../../data');
const STORE_PATH = path.join(DATA_DIR, 'assessment-store.json');

function loadAllQuestions() {
  const nonChem = seedQuestions.filter((q) => q.subject !== 'chemistry');
  try {
    const jsonPath = path.join(DATA_DIR, 'questions.json');
    const raw = require('node:fs').readFileSync(jsonPath, 'utf8');
    const clean = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
    const parsed = JSON.parse(clean);
    const questions = parsed.questions || parsed || [];
    const chemQuestions = questions.map((q) => {
      const syllabus = mapQuestionToSyllabus(q);
      const diffScore = q.difficulty_score || (q.difficulty_level === 'Easy' ? 1 : q.difficulty_level === 'Hard' ? 3 : 2);
      const expertDiff = diffScore === 1 ? 2 : diffScore === 3 ? 4 : 3;
      const optionsArray = Array.isArray(q.options)
        ? q.options.map((opt) => (typeof opt === 'object' && opt !== null ? (opt.text || opt.label) : String(opt)))
        : [];
      return {
        question_id: q.question_id,
        subject: 'chemistry',
        topic_id: syllabus.topic_id,
        topic_name: syllabus.topic_name,
        main_topic_id: syllabus.main_topic_id,
        main_topic_name: syllabus.main_topic_name,
        subtopic_id: syllabus.subtopic_id,
        subtopic_name: syllabus.subtopic_name,
        question_text: q.question_text,
        options: optionsArray,
        correct_answer: String(q.correct_answer_text || q.correct_answer).trim(),
        correct_answer_text: q.correct_answer_text || null,
        max_marks: Number(q.marks || 1),
        expert_difficulty: expertDiff,
        difficulty_level: q.difficulty_level || (diffScore === 1 ? 'Easy' : diffScore === 3 ? 'Hard' : 'Medium'),
        source_reference: `Sri Lankan G.C.E. A/L Chemistry ${q.exam_year || 2024} Paper 01`,
        syllabus_version: '2024 Paper 01',
        is_synthetic: false,
        image_path: q.image_path || null,
        explanation: q.explanation || null
      };
    });
    return [...nonChem, ...chemQuestions];
  } catch (_err) {
    return seedQuestions;
  }
}

const ALL_QUESTIONS = loadAllQuestions();

const DEFAULT_STATE = {
  questions: ALL_QUESTIONS,
  sessions: [],
  attempts: [],
  mockExamResults: [],
  consentRecords: []
};

let cache = null;
let writeQueue = Promise.resolve();

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readState() {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    cache = JSON.parse(raw);
  } catch {
    cache = JSON.parse(JSON.stringify(DEFAULT_STATE));
    await writeState(cache);
  }
  cache.questions = Array.isArray(cache.questions) && cache.questions.length > 0 ? cache.questions : ALL_QUESTIONS;
  cache.sessions = Array.isArray(cache.sessions) ? cache.sessions : [];
  cache.attempts = Array.isArray(cache.attempts) ? cache.attempts : [];
  cache.mockExamResults = Array.isArray(cache.mockExamResults) ? cache.mockExamResults : [];
  cache.consentRecords = Array.isArray(cache.consentRecords) ? cache.consentRecords : [];
  return cache;
}

async function writeState(nextState) {
  await ensureDataDir();
  cache = nextState;
  writeQueue = writeQueue.then(() => fs.writeFile(STORE_PATH, JSON.stringify(nextState, null, 2)));
  await writeQueue;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function withState(mutator) {
  const state = await readState();
  const next = clone(state);
  const result = await mutator(next);
  await writeState(next);
  return result;
}

async function getQuestionsBySubject(subject) {
  const state = await readState();
  return state.questions.filter((question) => question.subject === subject);
}

async function getQuestionById(questionId) {
  const state = await readState();
  return state.questions.find((question) => question.question_id === questionId) || null;
}

async function getSessionById(sessionId) {
  const state = await readState();
  return state.sessions.find((session) => session.session_id === sessionId) || null;
}

async function getAttemptsBySession(sessionId) {
  const state = await readState();
  return state.attempts.filter((attempt) => attempt.session_id === sessionId);
}

async function getAttemptsByStudent(studentId) {
  const state = await readState();
  return state.attempts.filter((attempt) => attempt.student_id === studentId);
}

async function getSessionsByStudent(studentId) {
  const state = await readState();
  return state.sessions.filter((session) => session.student_id === studentId);
}

async function createSession(input) {
  return withState((state) => {
    const session = {
      session_id: input.session_id || randomUUID(),
      student_id: input.student_id,
      subject: input.subject,
      consent_version: input.consent_version,
      status: 'active',
      target_difficulty: 3,
      current_question_id: null,
      asked_question_ids: [],
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      main_topic_id: input.main_topic_id || input.mainTopicId || null,
      subtopic_id: input.subtopic_id || input.subtopicId || null,
      ability_estimate: Number(input.ability_estimate ?? 0.0)
    };
    state.sessions.push(session);
    return clone(session);
  });
}

async function updateSession(sessionId, patch) {
  return withState((state) => {
    const session = state.sessions.find((item) => item.session_id === sessionId);
    if (!session) return null;
    Object.assign(session, patch, { updated_at: new Date().toISOString() });
    return clone(session);
  });
}

async function recordConsent(recordOrStudentId, consentVersion) {
  const sid =
    typeof recordOrStudentId === 'object' && recordOrStudentId !== null
      ? recordOrStudentId.student_id
      : recordOrStudentId;
  const cVer =
    typeof recordOrStudentId === 'object' && recordOrStudentId !== null
      ? recordOrStudentId.consent_version || consentVersion
      : consentVersion;

  return withState((state) => {
    const next = {
      student_id: sid,
      consent_version: cVer || '2026-10-research-consent-draft',
      agreed_at: new Date().toISOString()
    };
    const index = state.consentRecords.findIndex((item) => item.student_id === sid);
    if (index >= 0) state.consentRecords[index] = next; else state.consentRecords.push(next);
    return clone(next);
  });
}

async function getConsent(studentId) {
  const state = await readState();
  return state.consentRecords.find((record) => record.student_id === studentId) || null;
}

async function recordAttempt(attempt) {
  return withState((state) => {
    const duplicate = state.attempts.find(
      (item) => item.session_id === attempt.session_id && item.question_id === attempt.question_id
    );
    if (duplicate) {
      const dup = clone(duplicate);
      return { attempt: dup, duplicate: true, ...dup };
    }
    const next = {
      attempt_id: attempt.attempt_id || randomUUID(),
      session_id: attempt.session_id,
      student_id: attempt.student_id,
      question_id: attempt.question_id,
      topic_id: attempt.topic_id || null,
      selected_answer: attempt.selected_answer,
      score: attempt.score,
      max_marks: attempt.max_marks,
      time_taken_seconds: attempt.time_taken_seconds,
      timestamp: new Date().toISOString(),
      is_correct: attempt.is_correct,
      theta_before: attempt.theta_before !== undefined ? attempt.theta_before : null,
      theta_after: attempt.theta_after !== undefined ? attempt.theta_after : null
    };
    state.attempts.push(next);
    const session = state.sessions.find((item) => item.session_id === attempt.session_id);
    if (session && !session.asked_question_ids.includes(attempt.question_id)) {
      session.asked_question_ids.push(attempt.question_id);
      session.current_question_id = null;
      session.status = 'active';
      session.updated_at = new Date().toISOString();
    }
    const clonedNext = clone(next);
    return { attempt: clonedNext, duplicate: false, ...clonedNext };
  });
}

async function updateSessionDifficulty(sessionId, nextDifficulty, currentQuestionId, askedQuestionId, abilityEstimate) {
  return withState((state) => {
    const session = state.sessions.find((item) => item.session_id === sessionId);
    if (!session) return null;
    session.target_difficulty = nextDifficulty;
    session.current_question_id = currentQuestionId || null;
    if (askedQuestionId && !session.asked_question_ids.includes(askedQuestionId)) {
      session.asked_question_ids.push(askedQuestionId);
    }
    if (abilityEstimate !== undefined && abilityEstimate !== null) {
      session.ability_estimate = Number(abilityEstimate);
    }
    session.updated_at = new Date().toISOString();
    return clone(session);
  });
}

async function completeSession(sessionId) {
  return updateSession(sessionId, { status: 'completed' });
}

async function getMockExamResultsByStudent(studentId) {
  const state = await readState();
  return state.mockExamResults.filter((result) => result.student_id === studentId);
}

async function appendMockExamResult(result) {
  return withState((state) => {
    state.mockExamResults.push({ ...result, created_at: new Date().toISOString() });
    return clone(result);
  });
}

async function upsertQuestions(questions) {
  return withState((state) => {
    const byId = new Map(state.questions.map((question) => [question.question_id, question]));
    for (const question of questions) {
      byId.set(question.question_id, question);
    }
    state.questions = [...byId.values()];
    return clone(state.questions);
  });
}

async function resetForTests() {
  await writeState(JSON.parse(JSON.stringify(DEFAULT_STATE)));
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
  resetForTests
};