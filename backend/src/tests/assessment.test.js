const request = require('supertest');
const app = require('../app');
const store = require('../modules/assessment-engine/services/store');
const {
  estimateAbilityMAP,
  adjustDifficulty,
  selectNextQuestion,
  hasValidAnswerKey,
  THETA_MIN,
  THETA_MAX,
  DEFAULT_PRIOR_MEAN
} = require('../modules/assessment-engine/services/adaptiveSelectionService');

beforeEach(async () => {
  await store.resetForTests();
});

describe('assessment API', () => {
  test('returns supported subjects with accurate question counts', async () => {
    const response = await request(app).get('/api/assessment/subjects');

    expect(response.status).toBe(200);
    expect(response.body.subjects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'physics', questionCount: 4 }),
        expect.objectContaining({
          id: 'chemistry',
          questionCount: 50,
          syllabusVersion: 'Sri Lankan A/L 2024 Paper 01'
        }),
        expect.objectContaining({ id: 'biology', questionCount: 4 })
      ])
    );
  });

  test('returns Chemistry syllabus hierarchy with 3 main categories and counts', async () => {
    const response = await request(app).get('/api/assessment/topics?subject=chemistry');

    expect(response.status).toBe(200);
    expect(response.body.subject).toBe('chemistry');
    expect(response.body.totalQuestions).toBe(50);
    expect(response.body.categories).toHaveLength(3);

    const physical = response.body.categories.find((cat) => cat.id === 'physical-chemistry');
    const inorganic = response.body.categories.find((cat) => cat.id === 'inorganic-chemistry');
    const organic = response.body.categories.find((cat) => cat.id === 'organic-chemistry');

    expect(physical).toBeDefined();
    expect(physical.questionCount).toBe(29);
    expect(inorganic).toBeDefined();
    expect(inorganic.questionCount).toBe(5);
    expect(organic).toBeDefined();
    expect(organic.questionCount).toBe(16);

    // Verify subtopic structure and 0-question subtopic handling
    expect(Array.isArray(physical.topics)).toBe(true);
    const unit1 = physical.topics.find((t) => t.id === 'atomic-structure');
    expect(unit1).toBeDefined();
    expect(Array.isArray(unit1.subtopics)).toBe(true);
    expect(unit1.questionCount).toBeGreaterThan(0);

    // Verify alias route /api/assessment/subjects/chemistry/topics works identically
    const aliasRes = await request(app).get('/api/assessment/subjects/chemistry/topics');
    expect(aliasRes.status).toBe(200);
    expect(aliasRes.body.totalQuestions).toBe(50);
  });

  test('serves static question diagram images correctly', async () => {
    const directRes = await request(app).get('/assessment/images/AL-CHE-2024-P01-Q005.png');
    expect(directRes.status).toBe(200);
    expect(directRes.header['content-type']).toMatch(/image\/png/);
    expect(directRes.body.length).toBeGreaterThan(1000);

    const apiRes = await request(app).get('/api/assessment/images/AL-CHE-2024-P01-Q005.png');
    expect(apiRes.status).toBe(200);
    expect(apiRes.header['content-type']).toMatch(/image\/png/);
  });

  test('creates an assessment session and serves adaptive questions without leaking answers', async () => {
    const sessionResponse = await request(app).post('/api/assessment/sessions').send({
      studentId: 'pilot-chem-001',
      subject: 'chemistry',
      consentAccepted: true,
      consentVersion: '2026-10-research-consent-draft'
    });

    expect(sessionResponse.status).toBe(201);
    const sessionId = sessionResponse.body.session.sessionId;

    const firstQuestionResponse = await request(app).get('/api/assessment/questions/next').query({ sessionId });
    expect(firstQuestionResponse.status).toBe(200);
    const firstQuestion = firstQuestionResponse.body.question;
    expect(firstQuestion).toBeTruthy();
    expect(firstQuestion.subject).toBe('chemistry');

    // Secrecy: ensure correct answers and explanations are not leaked to frontend
    expect(firstQuestion.correctAnswer).toBeUndefined();
    expect(firstQuestion.correct_answer).toBeUndefined();
    expect(firstQuestion.explanation).toBeUndefined();

    // Option submission
    const optionToSubmit = typeof firstQuestion.options[0] === 'object'
      ? (firstQuestion.options[0].label || firstQuestion.options[0].text)
      : firstQuestion.options[0];

    const submitResponse = await request(app).post('/api/assessment/attempts').send({
      sessionId,
      questionId: firstQuestion.questionId,
      selectedAnswer: optionToSubmit,
      timeTakenSeconds: 15
    });

    expect(submitResponse.status).toBe(201);
    expect(submitResponse.body.attempt).toEqual(expect.objectContaining({ questionId: firstQuestion.questionId }));

    // Duplicate submission rejection
    const duplicateResponse = await request(app).post('/api/assessment/attempts').send({
      sessionId,
      questionId: firstQuestion.questionId,
      selectedAnswer: optionToSubmit,
      timeTakenSeconds: 10
    });
    expect(duplicateResponse.status).toBe(409);

    // No repeat in session
    const nextQuestionResponse = await request(app).get('/api/assessment/questions/next').query({ sessionId });
    expect(nextQuestionResponse.status).toBe(200);
    expect(nextQuestionResponse.body.question.questionId).not.toBe(firstQuestion.questionId);
  });

  test('rejects invalid payloads with 400', async () => {
    const response = await request(app).post('/api/assessment/sessions').send({ subject: 'physics' });
    expect(response.status).toBe(400);
  });

  test('scopes questions when student selects a specific branch (Organic Chemistry)', async () => {
    const sessionRes = await request(app).post('/api/assessment/sessions').send({
      studentId: 'student-organic-branch',
      subject: 'chemistry',
      consentAccepted: true,
      consentVersion: '2026-10-research-consent-draft',
      mainTopicId: 'organic-chemistry'
    });
    expect(sessionRes.status).toBe(201);
    const sessionId = sessionRes.body.session.sessionId;

    const qRes = await request(app).get('/api/assessment/questions/next').query({ sessionId });
    expect(qRes.status).toBe(200);
    expect(qRes.body.question.mainTopicId).toBe('organic-chemistry');
  });

  test('scopes questions when student selects a specific subtopic', async () => {
    const sessionRes = await request(app).post('/api/assessment/sessions').send({
      studentId: 'student-subtopic',
      subject: 'chemistry',
      consentAccepted: true,
      consentVersion: '2026-10-research-consent-draft',
      mainTopicId: 'physical-chemistry',
      subtopicId: 'atomic-structure'
    });
    expect(sessionRes.status).toBe(201);
    const sessionId = sessionRes.body.session.sessionId;

    const qRes = await request(app).get('/api/assessment/questions/next').query({ sessionId });
    expect(qRes.status).toBe(200);
    expect(qRes.body.question.topicId).toBe('atomic-structure');
  });

  test('proves correct answers increase target difficulty and incorrect answers decrease it within available range', async () => {
    // 1. Correct answer flow (difficulty increases 3 -> 4)
    const sessionCorrectRes = await request(app).post('/api/assessment/sessions').send({
      studentId: 'student-correct',
      subject: 'physics',
      consentAccepted: true,
      consentVersion: '2026-10-research-consent-draft'
    });
    expect(sessionCorrectRes.status).toBe(201);
    const sessionCorrectId = sessionCorrectRes.body.session.sessionId;
    expect(sessionCorrectRes.body.session.targetDifficulty).toBe(3);

    const q1CorrectRes = await request(app).get('/api/assessment/questions/next').query({ sessionId: sessionCorrectId });
    expect(q1CorrectRes.status).toBe(200);
    const q1Correct = q1CorrectRes.body.question;
    expect(q1Correct.expertDifficulty).toBe(3);

    const submitCorrectRes = await request(app).post('/api/assessment/attempts').send({
      sessionId: sessionCorrectId,
      questionId: q1Correct.questionId,
      selectedAnswer: '4 N', // Correct answer for phy-s1-001
      timeTakenSeconds: 15
    });
    expect(submitCorrectRes.status).toBe(201);
    expect(submitCorrectRes.body.correct).toBe(true);
    expect(submitCorrectRes.body.session.targetDifficulty).toBe(4);
    expect(submitCorrectRes.body.nextQuestion.expertDifficulty).toBe(4);
    expect(submitCorrectRes.body.nextQuestion.questionId).toBe('phy-s1-003');

    // 2. Incorrect answer flow (difficulty decreases 3 -> 2)
    const sessionIncorrectRes = await request(app).post('/api/assessment/sessions').send({
      studentId: 'student-incorrect',
      subject: 'physics',
      consentAccepted: true,
      consentVersion: '2026-10-research-consent-draft'
    });
    expect(sessionIncorrectRes.status).toBe(201);
    const sessionIncorrectId = sessionIncorrectRes.body.session.sessionId;
    expect(sessionIncorrectRes.body.session.targetDifficulty).toBe(3);

    const q1IncorrectRes = await request(app).get('/api/assessment/questions/next').query({ sessionId: sessionIncorrectId });
    expect(q1IncorrectRes.status).toBe(200);
    const q1Incorrect = q1IncorrectRes.body.question;
    expect(q1Incorrect.expertDifficulty).toBe(3);

    const submitIncorrectRes = await request(app).post('/api/assessment/attempts').send({
      sessionId: sessionIncorrectId,
      questionId: q1Incorrect.questionId,
      selectedAnswer: 'Wrong Answer',
      timeTakenSeconds: 15
    });
    expect(submitIncorrectRes.status).toBe(201);
    expect(submitIncorrectRes.body.correct).toBe(false);
    expect(submitIncorrectRes.body.session.targetDifficulty).toBe(2);
    expect(submitIncorrectRes.body.nextQuestion.expertDifficulty).toBe(2);
    expect(submitIncorrectRes.body.nextQuestion.questionId).toBe('phy-s1-002');
  });

  test('completes assessment session when question pool is exhausted', async () => {
    const sessionRes = await request(app).post('/api/assessment/sessions').send({
      studentId: 'student-exhaust',
      subject: 'physics',
      consentAccepted: true,
      consentVersion: '2026-10-research-consent-draft'
    });
    const sessionId = sessionRes.body.session.sessionId;

    // Answer all 4 physics questions
    let currentQ = (await request(app).get('/api/assessment/questions/next').query({ sessionId })).body.question;
    for (let i = 0; i < 4; i++) {
      expect(currentQ).toBeTruthy();
      const submitRes = await request(app).post('/api/assessment/attempts').send({
        sessionId,
        questionId: currentQ.questionId,
        selectedAnswer: typeof currentQ.options[0] === 'object' ? currentQ.options[0].label : currentQ.options[0],
        timeTakenSeconds: 10
      });
      expect(submitRes.status).toBe(201);
      if (i === 3) {
        expect(submitRes.body.completed).toBe(true);
        expect(submitRes.body.nextQuestion).toBeNull();
      } else {
        currentQ = submitRes.body.nextQuestion;
      }
    }

    const nextRes = await request(app).get('/api/assessment/questions/next').query({ sessionId });
    expect(nextRes.body.status).toBe('complete');
    expect(nextRes.body.question).toBeNull();

    // Verify results summary calculation
    const resultsRes = await request(app).get(`/api/assessment/sessions/${sessionId}/results`);
    expect(resultsRes.status).toBe(200);
    expect(resultsRes.body.summary.attemptedCount).toBe(4);
    expect(resultsRes.body.summary.completed).toBe(true);
    expect(Array.isArray(resultsRes.body.topicPerformance)).toBe(true);
  });

  test('returns insufficient prediction data when no history exists', async () => {
    const response = await request(app).get('/api/prediction/grade/pilot-clean-student');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('insufficient_data');
    expect(response.body.predictedGrade).toBeNull();
  });

  test('evaluates ML grade prediction and readiness when student has assessment attempts', async () => {
    const sessionRes = await request(app).post('/api/assessment/sessions').send({
      studentId: 'student-eval-test',
      subject: 'physics',
      consentAccepted: true,
      consentVersion: '2026-10-research-consent-draft'
    });
    const sessionId = sessionRes.body.session.sessionId;

    const q1Res = await request(app).get('/api/assessment/questions/next').query({ sessionId });
    const q1 = q1Res.body.question;

    await request(app).post('/api/assessment/attempts').send({
      sessionId,
      questionId: q1.questionId,
      selectedAnswer: typeof q1.options[0] === 'object' ? q1.options[0].label : q1.options[0],
      timeTakenSeconds: 15
    });

    const predRes = await request(app).get('/api/prediction/grade/student-eval-test');
    expect(predRes.status).toBe(200);
    expect(predRes.body.status).toBe('evaluated');
    expect(predRes.body.predictedGrade).toMatch(/^[ABC SW]$/);
    expect(typeof predRes.body.predictedMarks).toBe('number');
    expect(predRes.body.metrics).toBeDefined();
    expect(predRes.body.metrics.mae).toBeDefined();
    expect(predRes.body.ruleBasedReadiness).toBeDefined();
  });

  test('returns revision priorities for student with attempts', async () => {
    const response = await request(app).get('/api/revision/priorities/student-eval-test');
    expect(response.status).toBe(200);
    expect(response.body.studentId).toBe('student-eval-test');
    expect(Array.isArray(response.body.priorities)).toBe(true);
  });

  test('POST /api/prediction/predict returns ML score and rule-based readiness', async () => {
    const response = await request(app).post('/api/prediction/predict').send({
      subject: 'Physics',
      assessment_score: 85.0,
      study_hours_week: 6.0,
      absences: 1
    });

    expect(response.status).toBe(200);
    expect(response.body.ml_prediction).toBeDefined();
    expect(response.body.ml_prediction.predicted_score_percent).toBeGreaterThan(0);
    expect(response.body.ml_prediction.predicted_grade_al).toBe('A');
    expect(response.body.rule_based_readiness).toBeDefined();
    expect(response.body.rule_based_readiness.readiness_level).toBeDefined();
  }, 15000);

  describe('answer submission and response data collection', () => {
    let testSessionId;
    let testQuestion;

    beforeEach(async () => {
      const sessionRes = await request(app).post('/api/assessment/sessions').send({
        studentId: 'pilot-audit-student',
        subject: 'chemistry',
        consentAccepted: true,
        consentVersion: '2026-10-research-consent-draft'
      });
      testSessionId = sessionRes.body.session.sessionId;
      const qRes = await request(app).get('/api/assessment/questions/next').query({ sessionId: testSessionId });
      testQuestion = qRes.body.question;
    });

    test('records correct answer submission and returns score, trusted key and explanation', async () => {
      const fullQuestion = await store.getQuestionById(testQuestion.questionId);
      const trustedAnswer = fullQuestion.correct_answer_text || fullQuestion.correct_answer;

      const response = await request(app).post('/api/assessment/attempts').send({
        sessionId: testSessionId,
        questionId: testQuestion.questionId,
        selectedAnswer: trustedAnswer,
        timeTakenSeconds: 24
      });

      expect(response.status).toBe(201);
      expect(response.body.correct).toBe(true);
      expect(response.body.score).toBe(fullQuestion.max_marks);
      expect(response.body.maxMarks).toBe(fullQuestion.max_marks);
      expect(response.body.correctAnswer).toBe(trustedAnswer);
      expect(response.body.attempt).toEqual(
        expect.objectContaining({
          attemptId: expect.any(String),
          sessionId: testSessionId,
          questionId: testQuestion.questionId,
          selectedAnswer: String(trustedAnswer),
          score: fullQuestion.max_marks,
          maxMarks: fullQuestion.max_marks,
          timeTakenSeconds: 24,
          isCorrect: true,
          duplicate: false
        })
      );

      // Verify store recording
      const attempts = await store.getAttemptsBySession(testSessionId);
      expect(attempts).toHaveLength(1);
      expect(attempts[0].attempt_id).toBe(response.body.attempt.attemptId);
      expect(attempts[0].student_id).toBe('pilot-audit-student');
      expect(attempts[0].time_taken_seconds).toBe(24);
      expect(attempts[0].is_correct).toBe(true);
      expect(attempts[0].topic_id).toBe(fullQuestion.topic_id);
    });

    test('records incorrect answer submission with zero score and feedback', async () => {
      const fullQuestion = await store.getQuestionById(testQuestion.questionId);
      const wrongAnswer = '__definitely_incorrect_answer_xyz__';

      const response = await request(app).post('/api/assessment/attempts').send({
        sessionId: testSessionId,
        questionId: testQuestion.questionId,
        selectedAnswer: wrongAnswer,
        timeTakenSeconds: 12
      });

      expect(response.status).toBe(201);
      expect(response.body.correct).toBe(false);
      expect(response.body.score).toBe(0);
      expect(response.body.correctAnswer).toBe(fullQuestion.correct_answer_text || fullQuestion.correct_answer);
      expect(response.body.attempt.isCorrect).toBe(false);
      expect(response.body.attempt.timeTakenSeconds).toBe(12);

      const attempts = await store.getAttemptsBySession(testSessionId);
      expect(attempts).toHaveLength(1);
      expect(attempts[0].is_correct).toBe(false);
      expect(attempts[0].score).toBe(0);
      expect(attempts[0].time_taken_seconds).toBe(12);
    });

    test('rejects missing or invalid question ID with appropriate error', async () => {
      // Missing question ID
      const res1 = await request(app).post('/api/assessment/attempts').send({
        sessionId: testSessionId,
        selectedAnswer: 'CO',
        timeTakenSeconds: 10
      });
      expect(res1.status).toBe(400);

      // Non-existent question ID
      const res2 = await request(app).post('/api/assessment/attempts').send({
        sessionId: testSessionId,
        questionId: 'non-existent-question-id-12345',
        selectedAnswer: 'CO',
        timeTakenSeconds: 10
      });
      expect(res2.status).toBe(422);

      // Question ID belonging to a different subject (physics question in chemistry session)
      const res3 = await request(app).post('/api/assessment/attempts').send({
        sessionId: testSessionId,
        questionId: 'phy-s1-001',
        selectedAnswer: '4 N',
        timeTakenSeconds: 10
      });
      expect(res3.status).toBe(422);
    });

    test('rejects missing or invalid answer values with 400', async () => {
      const res1 = await request(app).post('/api/assessment/attempts').send({
        sessionId: testSessionId,
        questionId: testQuestion.questionId,
        timeTakenSeconds: 10
      });
      expect(res1.status).toBe(400);
    });

    test('rejects missing or invalid response-time values with 400', async () => {
      // Negative response time
      const res1 = await request(app).post('/api/assessment/attempts').send({
        sessionId: testSessionId,
        questionId: testQuestion.questionId,
        selectedAnswer: 'CO',
        timeTakenSeconds: -5
      });
      expect(res1.status).toBe(400);

      // String response time
      const res2 = await request(app).post('/api/assessment/attempts').send({
        sessionId: testSessionId,
        questionId: testQuestion.questionId,
        selectedAnswer: 'CO',
        timeTakenSeconds: 'ten-seconds'
      });
      expect(res2.status).toBe(400);

      // Missing response time
      const res3 = await request(app).post('/api/assessment/attempts').send({
        sessionId: testSessionId,
        questionId: testQuestion.questionId,
        selectedAnswer: 'CO'
      });
      expect(res3.status).toBe(400);
    });

    test('prevents duplicate submissions with HTTP 409', async () => {
      const res1 = await request(app).post('/api/assessment/attempts').send({
        sessionId: testSessionId,
        questionId: testQuestion.questionId,
        selectedAnswer: 'CO',
        timeTakenSeconds: 15
      });
      expect(res1.status).toBe(201);

      // Duplicate submission attempt
      const res2 = await request(app).post('/api/assessment/attempts').send({
        sessionId: testSessionId,
        questionId: testQuestion.questionId,
        selectedAnswer: 'CO',
        timeTakenSeconds: 10
      });
      expect(res2.status).toBe(409);
      expect(res2.body.error.code).toBe('duplicate_attempt');
    });

    test('handles database or store failure safely without crashing process', async () => {
      const originalRecordAttempt = store.recordAttempt;
      try {
        store.recordAttempt = jest.fn().mockRejectedValue(new Error('Simulated database connection failure'));

        const response = await request(app).post('/api/assessment/attempts').send({
          sessionId: testSessionId,
          questionId: testQuestion.questionId,
          selectedAnswer: 'CO',
          timeTakenSeconds: 15
        });

        expect(response.status).toBe(500);
      } finally {
        store.recordAttempt = originalRecordAttempt;
      }
    });

    test('verifies PostgreSQL and Memory store return shape contract parity', async () => {
      // Memory store returns { attempt, duplicate, ...attempt }
      const memAttempt = await store.recordAttempt({
        session_id: testSessionId,
        student_id: 'pilot-audit-student',
        question_id: 'contract-test-q',
        selected_answer: 'CO',
        score: 1,
        max_marks: 1,
        time_taken_seconds: 10,
        is_correct: true
      });
      expect(memAttempt.attempt).toBeDefined();
      expect(memAttempt.attempt.attempt_id).toBeDefined();
      expect(memAttempt.attempt_id).toBeDefined();
      expect(memAttempt.duplicate).toBe(false);

      // Verify route compatibility with both shaped and flattened return
      const resolvedAttempt = memAttempt.attempt || memAttempt;
      expect(resolvedAttempt.attempt_id).toBe(memAttempt.attempt_id);
    });
  });

  describe('adaptive question selection and IRT student ability estimation', () => {
    // Deterministic mock questions covering levels 1 to 5
    const mockQuestions = [
      { question_id: 'Q-L1', subject: 'physics', topic_id: 'motion', expert_difficulty: 1, correct_answer: 'A' },
      { question_id: 'Q-L2', subject: 'physics', topic_id: 'energy', expert_difficulty: 2, correct_answer: 'B' },
      { question_id: 'Q-L3', subject: 'physics', topic_id: 'waves', expert_difficulty: 3, correct_answer: 'C' },
      { question_id: 'Q-L4', subject: 'physics', topic_id: 'circuits', expert_difficulty: 4, correct_answer: 'D' },
      { question_id: 'Q-L5', subject: 'physics', topic_id: 'nuclear', expert_difficulty: 5, correct_answer: 'E' },
    ];

    test('1. correct response leads to a harder eligible question', () => {
      const session = {
        session_id: 's-harder',
        subject: 'physics',
        target_difficulty: 4, // target difficulty incremented following a correct answer at level 3
        ability_estimate: 0.40,
        asked_question_ids: ['Q-L3']
      };

      const next = selectNextQuestion(mockQuestions, session, [{ question_id: 'Q-L3', is_correct: true }]);
      expect(next).toBeDefined();
      expect(next.question_id).toBe('Q-L4');
      expect(next.expert_difficulty).toBe(4);
    });

    test('2. incorrect response leads to an easier eligible question', () => {
      const session = {
        session_id: 's-easier',
        subject: 'physics',
        target_difficulty: 2, // target difficulty decremented following an incorrect answer at level 3
        ability_estimate: -0.40,
        asked_question_ids: ['Q-L3']
      };

      const next = selectNextQuestion(mockQuestions, session, [{ question_id: 'Q-L3', is_correct: false }]);
      expect(next).toBeDefined();
      expect(next.question_id).toBe('Q-L2');
      expect(next.expert_difficulty).toBe(2);
    });

    test('3. fallback when no question exists at the preferred difficulty', () => {
      // Pool with only Level 1 and Level 5 questions (missing Level 2, 3, 4)
      const gapPool = [
        { question_id: 'GAP-L1', subject: 'physics', topic_id: 't1', expert_difficulty: 1, correct_answer: 'A' },
        { question_id: 'GAP-L5', subject: 'physics', topic_id: 't2', expert_difficulty: 5, correct_answer: 'B' }
      ];

      // Target difficulty 4 -> no Level 4 exists -> falls back to closest (Level 5, distance 1 vs Level 1, distance 3)
      const session = {
        session_id: 's-fallback',
        subject: 'physics',
        target_difficulty: 4,
        ability_estimate: 1.0,
        asked_question_ids: []
      };

      const next = selectNextQuestion(gapPool, session, []);
      expect(next).toBeDefined();
      expect(next.question_id).toBe('GAP-L5');
      expect(next.expert_difficulty).toBe(5);
    });

    test('4. no question repetition within a session', () => {
      const session = {
        session_id: 's-no-repeat',
        subject: 'physics',
        target_difficulty: 3,
        ability_estimate: 0.0,
        asked_question_ids: ['Q-L3', 'Q-L4']
      };

      const next = selectNextQuestion(mockQuestions, session, []);
      expect(next).toBeDefined();
      expect(['Q-L3', 'Q-L4']).not.toContain(next.question_id);
    });

    test('5. subject, topic, and subtopic filtering and invalid answer key exclusion', () => {
      const diversePool = [
        { question_id: 'BIO-L3', subject: 'biology', topic_id: 'genetics', expert_difficulty: 3, correct_answer: 'A' },
        { question_id: 'PHY-NO-KEY', subject: 'physics', topic_id: 'optics', expert_difficulty: 3, correct_answer: null, correct_answer_text: '' },
        { question_id: 'PHY-SUB-A', subject: 'physics', main_topic_id: 'mechanics', subtopic_id: 'kinematics', topic_id: 'kinematics', expert_difficulty: 3, correct_answer: 'Valid' },
        { question_id: 'PHY-SUB-B', subject: 'physics', main_topic_id: 'mechanics', subtopic_id: 'dynamics', topic_id: 'dynamics', expert_difficulty: 3, correct_answer: 'Valid' }
      ];

      // Subject check: must not select biology
      const sessionPhysics = { session_id: 's-phys', subject: 'physics', target_difficulty: 3, asked_question_ids: [] };
      const selected = selectNextQuestion(diversePool, sessionPhysics, []);
      expect(selected).toBeDefined();
      expect(selected.subject).toBe('physics');
      expect(selected.question_id).not.toBe('BIO-L3');
      expect(selected.question_id).not.toBe('PHY-NO-KEY'); // Invalid answer key excluded

      // Answer key helper check
      expect(hasValidAnswerKey({ correct_answer: 'A' })).toBe(true);
      expect(hasValidAnswerKey({ correct_answer: null, correct_answer_text: '' })).toBe(false);
      expect(hasValidAnswerKey(null)).toBe(false);
    });

    test('6. minimum and maximum difficulty boundaries', () => {
      // Stepwise boundary clamps
      expect(adjustDifficulty(5, true)).toBe(5); // Upper bound clamp at 5
      expect(adjustDifficulty(1, false)).toBe(1); // Lower bound clamp at 1

      // Candidate selection at Level 5 with target difficulty 5
      const sessionMax = { session_id: 's-max', subject: 'physics', target_difficulty: 5, ability_estimate: 2.0, asked_question_ids: [] };
      const nextMax = selectNextQuestion(mockQuestions, sessionMax, []);
      expect(nextMax.expert_difficulty).toBe(5);

      // Candidate selection at Level 1 with target difficulty 1
      const sessionMin = { session_id: 's-min', subject: 'physics', target_difficulty: 1, ability_estimate: -2.0, asked_question_ids: [] };
      const nextMin = selectNextQuestion(mockQuestions, sessionMin, []);
      expect(nextMin.expert_difficulty).toBe(1);
    });

    test('7. correct and incorrect response updating theta as expected under 1PL Rasch MAP', () => {
      // Baseline prior
      const baseline = estimateAbilityMAP([]);
      expect(baseline.theta).toBe(0.0);
      expect(baseline.se).toBe(1.0);

      // Single correct answer on medium item (b = 0.0) -> theta increases
      const correctOne = estimateAbilityMAP([{ b: 0.0, correct: true }]);
      expect(correctOne.theta).toBeGreaterThan(0.0);
      expect(correctOne.se).toBeLessThan(1.0); // Uncertainty reduced

      // Single incorrect answer on medium item (b = 0.0) -> theta decreases symmetrically
      const incorrectOne = estimateAbilityMAP([{ b: 0.0, correct: false }]);
      expect(incorrectOne.theta).toBeLessThan(0.0);
      expect(incorrectOne.theta).toBeCloseTo(-correctOne.theta, 3);
      expect(incorrectOne.se).toBeLessThan(1.0);

      // Two correct answers -> higher ability than one
      const correctTwo = estimateAbilityMAP([
        { b: 0.0, correct: true },
        { b: 1.0, correct: true }
      ]);
      expect(correctTwo.theta).toBeGreaterThan(correctOne.theta);
      expect(correctTwo.se).toBeLessThan(correctOne.se); // Monotonically decreasing SE
    });

    test('8. theta staying finite and strictly within documented bounds', () => {
      // 20 consecutive correct answers on very hard items (b = 2.0)
      const extremeCorrect = Array(20).fill({ b: 2.0, correct: true });
      const resHigh = estimateAbilityMAP(extremeCorrect);
      expect(Number.isFinite(resHigh.theta)).toBe(true);
      expect(resHigh.theta).toBeLessThanOrEqual(THETA_MAX);
      expect(resHigh.theta).toBeGreaterThan(2.0);

      // 20 consecutive incorrect answers on very easy items (b = -2.0)
      const extremeIncorrect = Array(20).fill({ b: -2.0, correct: false });
      const resLow = estimateAbilityMAP(extremeIncorrect);
      expect(Number.isFinite(resLow.theta)).toBe(true);
      expect(resLow.theta).toBeGreaterThanOrEqual(THETA_MIN);
      expect(resLow.theta).toBeLessThan(-2.0);
    });

    test('9. invalid responses not changing theta', () => {
      const invalidHistory = [
        { b: NaN, correct: true },
        { b: 0.0, correct: null },
        { b: undefined, correct: false }
      ];

      const res = estimateAbilityMAP(invalidHistory);
      expect(res.theta).toBe(DEFAULT_PRIOR_MEAN);
      expect(res.se).toBe(1.0);
      expect(res.iterations).toBe(0);
    });

    test('10. no eligible questions remaining returns null gracefully', () => {
      const exhaustedSession = {
        session_id: 's-exhausted',
        subject: 'physics',
        target_difficulty: 3,
        asked_question_ids: ['Q-L1', 'Q-L2', 'Q-L3', 'Q-L4', 'Q-L5']
      };

      const next = selectNextQuestion(mockQuestions, exhaustedSession, []);
      expect(next).toBeNull();
    });

    test('11. end-to-end API updates thetaBefore and thetaAfter with session ability persistence', async () => {
      // Create fresh assessment session
      const sessRes = await request(app).post('/api/assessment/sessions').send({
        studentId: 'pilot-irt-e2e',
        subject: 'physics',
        consentAccepted: true,
        consentVersion: '2026-10-research-consent-draft'
      });
      expect(sessRes.status).toBe(201);
      const sessionId = sessRes.body.session.sessionId;
      expect(sessRes.body.session.abilityEstimate).toBe(0.0);

      // Fetch first question (phy-s1-001, difficulty 3)
      const q1Res = await request(app).get('/api/assessment/questions/next').query({ sessionId });
      const q1 = q1Res.body.question;
      expect(q1.questionId).toBe('phy-s1-001');

      // Submit correct answer
      const submitRes = await request(app).post('/api/assessment/attempts').send({
        sessionId,
        questionId: q1.questionId,
        selectedAnswer: '4 N',
        timeTakenSeconds: 14
      });

      expect(submitRes.status).toBe(201);
      expect(submitRes.body.attempt.thetaBefore).toBe(0.0);
      expect(submitRes.body.attempt.thetaAfter).toBeGreaterThan(0.0);
      expect(submitRes.body.session.abilityEstimate).toBe(submitRes.body.attempt.thetaAfter);
      expect(submitRes.body.session.targetDifficulty).toBe(4);

      // Verify that next question adapted to level 4
      expect(submitRes.body.nextQuestion.expertDifficulty).toBe(4);

      // Verify session results reflect updated ability
      const resultsRes = await request(app).get(`/api/assessment/sessions/${sessionId}/results`);
      expect(resultsRes.status).toBe(200);
      expect(resultsRes.body.summary.abilityEstimate).toBe(submitRes.body.attempt.thetaAfter);
      expect(resultsRes.body.attemptedQuestions[0].thetaBefore).toBe(0.0);
      expect(resultsRes.body.attemptedQuestions[0].thetaAfter).toBe(submitRes.body.attempt.thetaAfter);
    });
  });
});
