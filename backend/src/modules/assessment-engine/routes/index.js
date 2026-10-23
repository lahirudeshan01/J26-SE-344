const { randomUUID } = require('node:crypto');
const { Router } = require('express');
const store = require('../services/store');
const {
  adjustDifficulty,
  selectNextQuestion,
  summarizeTopicPerformance,
  mapQuestionToDifficulty,
  estimateAbilityMAP
} = require('../services/adaptiveSelectionService');
const { CHEMISTRY_SYLLABUS } = require('../data/chemistrySyllabus');

const router = Router();

const SUBJECTS = [
  {
    id: 'physics',
    name: 'Physics',
    description: 'Adaptive assessment for Physics with rule-based difficulty adjustment.',
    syllabusVersion: 'A/L 2026 draft'
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    description: 'Adaptive assessment for Sri Lankan G.C.E. A/L Chemistry with full topic hierarchy and 2024 Paper 01 integration.',
    syllabusVersion: '2024 Paper 01'
  },
  {
    id: 'biology',
    name: 'Biology',
    description: 'Adaptive assessment for Biology with subject-aligned question coverage.',
    syllabusVersion: 'A/L 2026 draft'
  }
];

function badRequest(response, message) {
  return response.status(400).json({ error: { code: 'bad_request', message } });
}

function notFound(response, message) {
  return response.status(404).json({ error: { code: 'not_found', message } });
}

function validationError(response, message) {
  return response.status(422).json({ error: { code: 'validation_error', message } });
}

function sanitizeQuestion(question) {
  if (!question) return null;
  return {
    questionId: question.question_id,
    subject: question.subject,
    topicId: question.topic_id,
    topicName: question.topic_name,
    mainTopicId: question.main_topic_id || null,
    mainTopicName: question.main_topic_name || null,
    subtopicId: question.subtopic_id || null,
    subtopicName: question.subtopic_name || null,
    questionText: question.question_text,
    options: question.options,
    maxMarks: question.max_marks,
    expertDifficulty: question.expert_difficulty,
    difficultyLevel: question.difficulty_level || (question.expert_difficulty <= 2 ? 'Easy' : question.expert_difficulty >= 4 ? 'Hard' : 'Medium'),
    sourceReference: question.source_reference,
    syllabusVersion: question.syllabus_version,
    imagePath: question.image_path || null
  };
}

function normalizeSession(session) {
  return {
    sessionId: session.session_id,
    studentId: session.student_id,
    subject: session.subject,
    status: session.status,
    targetDifficulty: session.target_difficulty,
    abilityEstimate: Number(session.ability_estimate ?? 0.0),
    currentQuestionId: session.current_question_id,
    askedQuestionIds: session.asked_question_ids || [],
    startedAt: session.started_at,
    updatedAt: session.updated_at,
    consentVersion: session.consent_version,
    mainTopicId: session.main_topic_id || null,
    subtopicId: session.subtopic_id || null
  };
}

function evaluateAnswer(selectedAnswer, question) {
  if (selectedAnswer === undefined || selectedAnswer === null || !question) return false;
  const sel = String(selectedAnswer).trim().toLowerCase();
  const corr = String(question.correct_answer || '').trim().toLowerCase();
  const corrText = question.correct_answer_text ? String(question.correct_answer_text).trim().toLowerCase() : null;

  if (sel === corr || (corrText && sel === corrText)) return true;

  if (Array.isArray(question.options)) {
    const idx = Number(sel) - 1;
    if (!Number.isNaN(idx) && idx >= 0 && idx < question.options.length) {
      const opt = question.options[idx];
      const optStr = typeof opt === 'string' ? opt.trim().toLowerCase() : (opt.text || '').trim().toLowerCase();
      if (optStr === corr || (corrText && optStr === corrText)) return true;
    }

    const foundIdx = question.options.findIndex((opt) => {
      const optStr = typeof opt === 'string' ? opt.trim().toLowerCase() : (opt.text || '').trim().toLowerCase();
      return optStr === sel;
    });
    if (foundIdx >= 0 && (String(foundIdx + 1) === corr || String(foundIdx + 1) === String(question.correct_answer).trim())) {
      return true;
    }
  }

  return false;
}

router.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'assessment-engine' });
});

router.get('/subjects', async (_request, response, next) => {
  try {
    const state = await store.readState();
    const questionSubjects = [...new Set(state.questions.map((question) => String(question.subject).toLowerCase()))];
    const subjects = SUBJECTS.filter((subject) => questionSubjects.includes(subject.id.toLowerCase())).map((subject) => {
      const subjectQuestions = state.questions.filter((question) => String(question.subject).toLowerCase() === subject.id.toLowerCase());
      const topics = [...new Set(subjectQuestions.map((question) => question.topic_id))].length;
      return {
        ...subject,
        questionCount: subjectQuestions.length,
        topicCount: topics,
        syllabusVersion: subject.id === 'chemistry' ? 'Sri Lankan A/L 2024 Paper 01' : subject.syllabusVersion
      };
    });
    response.json({ subjects });
  } catch (error) {
    next(error);
  }
});

async function getTopicsHandler(request, response, next) {
  try {
    const subject = String(request.params.subjectId || request.query.subject || 'chemistry').toLowerCase();
    if (subject !== 'chemistry') {
      return response.json({ subject, categories: [] });
    }

    const state = await store.readState();
    const chemQuestions = state.questions.filter((q) => String(q.subject).toLowerCase() === 'chemistry');

    const categories = CHEMISTRY_SYLLABUS.map((cat) => {
      let catCount = 0;
      const topics = cat.topics.map((t) => {
        let topicCount = 0;
        const subtopics = t.subtopics.map((st) => {
          const matching = chemQuestions.filter((q) => q.subtopic_id === st.id);
          const count = matching.length;
          topicCount += count;
          return {
            ...st,
            questionCount: count
          };
        });

        const directTopicQuestions = chemQuestions.filter((q) => q.topic_id === t.id);
        const effectiveTopicCount = Math.max(topicCount, directTopicQuestions.length);
        catCount += effectiveTopicCount;

        return {
          ...t,
          questionCount: effectiveTopicCount,
          subtopics
        };
      });

      const directCatQuestions = chemQuestions.filter((q) => q.main_topic_id === cat.id);
      const effectiveCatCount = Math.max(catCount, directCatQuestions.length);

      return {
        ...cat,
        questionCount: effectiveCatCount,
        topics
      };
    });

    response.json({
      subject: 'chemistry',
      totalQuestions: chemQuestions.length,
      categories
    });
  } catch (error) {
    next(error);
  }
}

router.get('/topics', getTopicsHandler);
router.get('/subjects/:subjectId/topics', getTopicsHandler);

router.post('/sessions', async (request, response, next) => {
  try {
    const { studentId, subject, consentAccepted, consentVersion, mainTopicId, subtopicId, topicId } = request.body || {};
    if (!studentId || typeof studentId !== 'string') return badRequest(response, 'studentId is required');
    if (!subject || typeof subject !== 'string') return badRequest(response, 'subject is required');
    if (!SUBJECTS.some((item) => item.id.toLowerCase() === subject.toLowerCase())) return validationError(response, 'Unsupported subject');
    if (consentAccepted !== true) return validationError(response, 'Consent must be accepted before starting');

    const session = await store.createSession({
      session_id: randomUUID(),
      student_id: studentId,
      subject: subject.toLowerCase(),
      consent_version: consentVersion || '2026-10-research-consent-draft',
      main_topic_id: mainTopicId || null,
      subtopic_id: subtopicId || topicId || null
    });
    await store.recordConsent({ student_id: studentId, consent_version: consentVersion || '2026-10-research-consent-draft' });

    response.status(201).json({ session: normalizeSession(session) });
  } catch (error) {
    next(error);
  }
});

router.get('/questions/next', async (request, response, next) => {
  try {
    const { sessionId } = request.query;
    if (!sessionId || typeof sessionId !== 'string') return badRequest(response, 'sessionId is required');

    const session = await store.getSessionById(sessionId);
    if (!session) return notFound(response, 'Assessment session not found');
    if (session.status === 'completed') {
      return response.json({ status: 'complete', session: normalizeSession(session), question: null });
    }

    if (session.current_question_id) {
      const currentQuestion = await store.getQuestionById(session.current_question_id);
      if (!currentQuestion) return notFound(response, 'Current question was not found');
      return response.json({
        status: 'question',
        session: normalizeSession(session),
        question: sanitizeQuestion(currentQuestion)
      });
    }

    let questions = await store.getQuestionsBySubject(session.subject);

    // Apply topic/subtopic scoping if chosen by student
    if (session.main_topic_id) {
      const filteredByMain = questions.filter((q) => q.main_topic_id === session.main_topic_id);
      if (filteredByMain.length > 0) questions = filteredByMain;
    }
    if (session.subtopic_id) {
      const filteredBySub = questions.filter(
        (q) => q.subtopic_id === session.subtopic_id || q.topic_id === session.subtopic_id
      );
      if (filteredBySub.length > 0) questions = filteredBySub;
    }

    const attempts = await store.getAttemptsBySession(session.session_id);
    const nextQuestion = selectNextQuestion(questions, session, attempts);

    if (!nextQuestion) {
      const completed = await store.completeSession(session.session_id);
      return response.json({ status: 'complete', session: normalizeSession(completed), question: null });
    }

    const updated = await store.updateSession(session.session_id, { current_question_id: nextQuestion.question_id });
    response.json({
      status: 'question',
      session: normalizeSession(updated),
      question: sanitizeQuestion(nextQuestion)
    });
  } catch (error) {
    next(error);
  }
});

router.post('/attempts', async (request, response, next) => {
  try {
    const { sessionId, questionId, selectedAnswer, timeTakenSeconds } = request.body || {};
    if (!sessionId || typeof sessionId !== 'string') return badRequest(response, 'sessionId is required');
    if (!questionId || typeof questionId !== 'string') return badRequest(response, 'questionId is required');
    if (selectedAnswer === undefined || selectedAnswer === null) return badRequest(response, 'selectedAnswer is required');
    if (typeof timeTakenSeconds !== 'number' || Number.isNaN(timeTakenSeconds) || timeTakenSeconds < 0) {
      return badRequest(response, 'timeTakenSeconds must be a non-negative number');
    }

    const session = await store.getSessionById(sessionId);
    if (!session) return notFound(response, 'Assessment session not found');

    const question = await store.getQuestionById(questionId);
    if (!question || String(question.subject).toLowerCase() !== String(session.subject).toLowerCase()) {
      return validationError(response, 'Question does not belong to the session subject');
    }

    const duplicateCheck = await store.getAttemptsBySession(session.session_id);
    if (duplicateCheck.some((attempt) => attempt.question_id === questionId)) {
      return response.status(409).json({ error: { code: 'duplicate_attempt', message: 'This attempt has already been submitted' } });
    }

    const currentQuestionId = session.current_question_id || questionId;
    if (currentQuestionId !== questionId) {
      return validationError(response, 'This question is not the active question for the session');
    }

    const correct = evaluateAnswer(selectedAnswer, question);
    const score = correct ? question.max_marks : 0;

    // IRT Ability Estimation: Maximum A Posteriori (MAP) update
    const currentTheta = Number(session.ability_estimate ?? 0.0);
    const existingAttempts = await store.getAttemptsBySession(session.session_id);
    const subjectQuestions = await store.getQuestionsBySubject(session.subject);
    const questionMap = new Map(subjectQuestions.map((q) => [q.question_id, q]));

    const responseHistory = existingAttempts.map((att) => {
      const q = questionMap.get(att.question_id);
      const diffInfo = mapQuestionToDifficulty(q);
      return {
        b: diffInfo.b,
        correct: Boolean(att.is_correct)
      };
    });

    const currentDiffInfo = mapQuestionToDifficulty(question);
    responseHistory.push({
      b: currentDiffInfo.b,
      correct
    });

    const irtResult = estimateAbilityMAP(responseHistory, { initialTheta: currentTheta });
    const thetaAfter = irtResult.theta;

    const recorded = await store.recordAttempt({
      attempt_id: randomUUID(),
      session_id: session.session_id,
      student_id: session.student_id,
      question_id: question.question_id,
      topic_id: question.topic_id,
      selected_answer: String(selectedAnswer),
      score,
      max_marks: question.max_marks,
      time_taken_seconds: timeTakenSeconds,
      is_correct: correct,
      theta_before: currentTheta,
      theta_after: thetaAfter
    });

    const nextDifficulty = adjustDifficulty(session.target_difficulty || 3, correct);
    await store.updateSessionDifficulty(session.session_id, nextDifficulty, null, question.question_id, thetaAfter);

    const refreshedSession = await store.getSessionById(session.session_id);
    let questions = await store.getQuestionsBySubject(session.subject);

    if (refreshedSession.main_topic_id) {
      const filteredByMain = questions.filter((q) => q.main_topic_id === refreshedSession.main_topic_id);
      if (filteredByMain.length > 0) questions = filteredByMain;
    }
    if (refreshedSession.subtopic_id) {
      const filteredBySub = questions.filter(
        (q) => q.subtopic_id === refreshedSession.subtopic_id || q.topic_id === refreshedSession.subtopic_id
      );
      if (filteredBySub.length > 0) questions = filteredBySub;
    }

    const attempts = await store.getAttemptsBySession(session.session_id);
    const nextQuestion = selectNextQuestion(questions, refreshedSession, attempts);

    let completed = false;
    let sessionAfterNext = refreshedSession;
    let nextQuestionPayload = null;

    if (nextQuestion) {
      sessionAfterNext = await store.updateSession(session.session_id, { current_question_id: nextQuestion.question_id });
      nextQuestionPayload = sanitizeQuestion(nextQuestion);
    } else {
      completed = true;
      sessionAfterNext = await store.completeSession(session.session_id);
    }

    const attemptRecord = (recorded && recorded.attempt) ? recorded.attempt : recorded;
    const isDuplicate = Boolean(recorded && recorded.duplicate);

    response.status(201).json({
      attempt: {
        attemptId: attemptRecord.attempt_id,
        sessionId: attemptRecord.session_id,
        questionId: attemptRecord.question_id,
        selectedAnswer: attemptRecord.selected_answer,
        score: attemptRecord.score,
        maxMarks: attemptRecord.max_marks,
        timeTakenSeconds: attemptRecord.time_taken_seconds,
        timestamp: attemptRecord.timestamp,
        isCorrect: attemptRecord.is_correct,
        thetaBefore: attemptRecord.theta_before !== null && attemptRecord.theta_before !== undefined
          ? Number(attemptRecord.theta_before)
          : currentTheta,
        thetaAfter: attemptRecord.theta_after !== null && attemptRecord.theta_after !== undefined
          ? Number(attemptRecord.theta_after)
          : thetaAfter,
        duplicate: isDuplicate
      },
      correct,
      score,
      maxMarks: question.max_marks,
      correctAnswer: question.correct_answer_text || question.correct_answer,
      explanation: question.explanation || null,
      completed,
      session: normalizeSession(sessionAfterNext),
      nextQuestion: nextQuestionPayload
    });
  } catch (error) {
    next(error);
  }
});

router.get('/sessions/:sessionId/results', async (request, response, next) => {
  try {
    const { sessionId } = request.params;
    const session = await store.getSessionById(sessionId);
    if (!session) return notFound(response, 'Assessment session not found');

    const attempts = await store.getAttemptsBySession(sessionId);
    const questions = await store.getQuestionsBySubject(session.subject);
    const attemptedQuestions = attempts.map((attempt) => {
      const question = questions.find((item) => item.question_id === attempt.question_id);
      return {
        attemptId: attempt.attempt_id,
        questionId: attempt.question_id,
        topicId: question ? question.topic_id : null,
        topicName: question ? question.topic_name : null,
        subtopicName: question ? question.subtopic_name : null,
        selectedAnswer: attempt.selected_answer,
        score: attempt.score,
        maxMarks: attempt.max_marks,
        isCorrect: attempt.is_correct,
        timeTakenSeconds: attempt.time_taken_seconds,
        timestamp: attempt.timestamp,
        thetaBefore: attempt.theta_before !== null && attempt.theta_before !== undefined
          ? Number(attempt.theta_before)
          : null,
        thetaAfter: attempt.theta_after !== null && attempt.theta_after !== undefined
          ? Number(attempt.theta_after)
          : null
      };
    });

    const topicPerformance = summarizeTopicPerformance(questions, attempts);
    const totalScore = attempts.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0);
    const maxScore = attempts.reduce((sum, attempt) => sum + Number(attempt.max_marks || 0), 0);
    const attemptedCount = attempts.length;
    const correctCount = attempts.filter((attempt) => attempt.is_correct).length;

    response.json({
      session: normalizeSession(session),
      summary: {
        totalScore,
        maxScore,
        attemptedCount,
        correctCount,
        accuracy: attemptedCount > 0 ? correctCount / attemptedCount : null,
        abilityEstimate: Number(session.ability_estimate ?? 0.0),
        completed: session.status === 'completed'
      },
      attemptedQuestions,
      topicPerformance,
      message:
        questions.length === 0
          ? 'No verified questions are loaded for this subject yet.'
          : 'Results are based on verified question metadata and submitted attempts.'
    });
  } catch (error) {
    next(error);
  }
});

router.get('/progress/:studentId', async (request, response, next) => {
  try {
    const { studentId } = request.params;
    if (!studentId) return badRequest(response, 'studentId is required');

    const [sessions, attempts, questions] = await Promise.all([
      store.getSessionsByStudent(studentId),
      store.getAttemptsByStudent(studentId),
      store.readState().then((s) => s.questions)
    ]);

    const sessionSummaries = sessions.map((session) => {
      const sessionAttempts = attempts.filter((item) => item.session_id === session.session_id);
      const score = sessionAttempts.reduce((sum, item) => sum + Number(item.score || 0), 0);
      const maxScore = sessionAttempts.reduce((sum, item) => sum + Number(item.max_marks || 0), 0);
      return {
        sessionId: session.session_id,
        subject: session.subject,
        startedAt: session.started_at,
        status: session.status,
        score,
        maxScore,
        accuracy: sessionAttempts.length > 0 ? sessionAttempts.filter((a) => a.is_correct).length / sessionAttempts.length : null
      };
    });

    response.json({
      studentId,
      totalSessions: sessions.length,
      totalAttempts: attempts.length,
      completedSessions: sessions.filter((session) => session.status === 'completed').length,
      sessionSummaries,
      topicPerformance: summarizeTopicPerformance(questions, attempts)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;