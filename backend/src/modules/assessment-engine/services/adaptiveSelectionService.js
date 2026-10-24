/**
 * Adaptive Selection & IRT Ability Estimation Service
 * NeuroLearn AI - Adaptive Assessment Engine
 *
 * Implements:
 * 1. 1PL / Rasch Item Response Theory (IRT) probability model:
 *    P(correct | theta, b) = 1 / (1 + exp(-(theta - b)))
 * 2. Maximum A Posteriori (MAP) Bayesian latent ability estimation with
 *    standard normal prior theta ~ N(0, 1), strictly concave log-posterior,
 *    and bounded Newton-Raphson optimization.
 * 3. Computerized Adaptive Testing (CAT) question selection balancing
 *    target difficulty / Fisher Information with syllabus topic coverage.
 *
 * IMPORTANT METHODOLOGICAL NOTE:
 * The item difficulty parameters (b) currently in use are mapped from expert-assigned
 * integer difficulty levels (1 to 5) to the standard logit scale [-2.0, +2.0] centered
 * at b=0.0 (Medium). They represent expert-designed initial priors and are NOT yet
 * empirically calibrated from a large-scale standardized field test sample.
 */

const DEFAULT_PRIOR_MEAN = 0.0;
const DEFAULT_PRIOR_VARIANCE = 1.0;
const THETA_MIN = -3.5;
const THETA_MAX = 3.5;

/**
 * Maps a question to its IRT difficulty parameter (b) and integer difficulty level (1-5).
 * Explicitly distinguishes expert-assigned ratings from calibrated IRT parameters.
 *
 * @param {object} question
 * @returns {{ b: number, difficulty: number, isCalibrated: boolean }}
 */
function mapQuestionToDifficulty(question) {
  if (!question) {
    return { b: 0.0, difficulty: 3, isCalibrated: false };
  }

  // If empirical IRT parameter exists from field calibration, prioritize it
  if (typeof question.irt_b === 'number' && Number.isFinite(question.irt_b)) {
    const clampedB = Math.max(THETA_MIN, Math.min(THETA_MAX, question.irt_b));
    const targetDiff = Math.max(1, Math.min(5, Math.round(clampedB + 3.0)));
    return { b: clampedB, difficulty: targetDiff, isCalibrated: true };
  }

  // Explicit mapping from expert difficulty (1 to 5) to standard logit scale [-2.0, +2.0]
  // 1 (Very Easy) -> -2.0, 2 (Easy) -> -1.0, 3 (Medium) -> 0.0, 4 (Hard) -> +1.0, 5 (Very Hard) -> +2.0
  const expertDiff = Number(question.expert_difficulty ?? question.expertDifficulty);
  if (Number.isFinite(expertDiff) && expertDiff >= 1 && expertDiff <= 5) {
    const integerDiff = Math.round(expertDiff);
    const logitB = (integerDiff - 3.0) * 1.0;
    return { b: logitB, difficulty: integerDiff, isCalibrated: false };
  }

  // Fallback for string-based difficulty levels
  const levelStr = String(question.difficulty_level || question.difficultyLevel || '').toLowerCase();
  if (levelStr === 'easy') {
    return { b: -1.0, difficulty: 2, isCalibrated: false };
  }
  if (levelStr === 'hard') {
    return { b: 1.0, difficulty: 4, isCalibrated: false };
  }

  // Safe default: Medium baseline (b = 0.0, level 3)
  return { b: 0.0, difficulty: 3, isCalibrated: false };
}

/**
 * Evaluates the 1PL / Rasch probability of a correct response:
 * P(u=1 | theta, b) = 1 / (1 + exp(-(theta - b)))
 *
 * @param {number} theta - Student latent ability
 * @param {number} b - Item difficulty
 * @returns {number} Probability in (0, 1)
 */
function calculateRaschProbability(theta, b) {
  const safeTheta = Number.isFinite(theta) ? theta : DEFAULT_PRIOR_MEAN;
  const safeB = Number.isFinite(b) ? b : 0.0;
  const diff = safeTheta - safeB;

  // Numerical stability guards against overflow / underflow
  if (diff > 30.0) return 1.0;
  if (diff < -30.0) return 0.0;

  return 1.0 / (1.0 + Math.exp(-diff));
}

/**
 * Calculates Fisher Item Information for a 1PL item:
 * I(theta) = P(theta) * (1 - P(theta))
 * Maximized at b = theta (I_max = 0.25).
 *
 * @param {number} theta
 * @param {number} b
 * @returns {number}
 */
function calculateItemInformation(theta, b) {
  const p = calculateRaschProbability(theta, b);
  return p * (1.0 - p);
}

/**
 * Numerically stable Bayesian Maximum A Posteriori (MAP) estimation of theta.
 *
 * Objective:
 * ln p(theta | u) = sum_i [ u_i ln P_i + (1 - u_i) ln(1 - P_i) ] - (theta - mu0)^2 / (2 * sigma0^2)
 *
 * First derivative:
 * f(theta) = sum_i (u_i - P_i(theta)) - (theta - mu0) / sigma0^2
 *
 * Second derivative:
 * f'(theta) = - sum_i P_i(1 - P_i) - 1 / sigma0^2  <  0  for all theta.
 *
 * Because f'(theta) < 0 everywhere, the log-posterior is strictly concave with a single
 * global maximum. Newton-Raphson is guaranteed to converge quadratically and never diverge.
 *
 * @param {Array<{ b: number, correct: boolean }>} history - Item response history
 * @param {object} [options]
 * @returns {{ theta: number, se: number, iterations: number }}
 */
function estimateAbilityMAP(history, options = {}) {
  const priorMean = options.priorMean ?? DEFAULT_PRIOR_MEAN;
  const priorVariance = options.priorVariance ?? DEFAULT_PRIOR_VARIANCE;
  const maxIterations = options.maxIterations ?? 25;
  const tolerance = options.tolerance ?? 1e-4;
  const minTheta = options.minTheta ?? THETA_MIN;
  const maxTheta = options.maxTheta ?? THETA_MAX;

  if (!Array.isArray(history) || history.length === 0) {
    return { theta: priorMean, se: Math.sqrt(priorVariance), iterations: 0 };
  }

  const validItems = history.filter(
    (item) =>
      item &&
      (item.correct === true || item.correct === false || item.is_correct === true || item.is_correct === false) &&
      Number.isFinite(item.b)
  );

  if (validItems.length === 0) {
    return { theta: priorMean, se: Math.sqrt(priorVariance), iterations: 0 };
  }

  let theta = options.initialTheta ?? priorMean;
  if (!Number.isFinite(theta)) theta = priorMean;
  theta = Math.max(minTheta, Math.min(maxTheta, theta));

  let iteration = 0;
  for (; iteration < maxIterations; iteration++) {
    let firstDeriv = -(theta - priorMean) / priorVariance;
    let secondDeriv = -1.0 / priorVariance;

    for (const item of validItems) {
      const u = (item.correct === true || item.is_correct === true) ? 1.0 : 0.0;
      const p = calculateRaschProbability(theta, item.b);
      firstDeriv += (u - p);
      secondDeriv -= (p * (1.0 - p));
    }

    if (Math.abs(secondDeriv) < 1e-12) break;

    // delta = f(theta) / f'(theta)
    const delta = firstDeriv / secondDeriv;
    // Damped step to prevent oscillation
    const step = Math.max(-1.0, Math.min(1.0, -delta));
    theta += step;
    theta = Math.max(minTheta, Math.min(maxTheta, theta));

    if (Math.abs(step) < tolerance) {
      break;
    }
  }

  // Calculate posterior Fisher Information and Standard Error: SE = 1 / sqrt(I_post)
  let postInfo = 1.0 / priorVariance;
  for (const item of validItems) {
    postInfo += calculateItemInformation(theta, item.b);
  }
  const se = 1.0 / Math.sqrt(postInfo);

  return {
    theta: Number(theta.toFixed(4)),
    se: Number(se.toFixed(4)),
    iterations: iteration + 1
  };
}

/**
 * Maps a continuous latent ability (theta) to integer target difficulty level (1-5).
 * theta = -2 -> Level 1
 * theta = -1 -> Level 2
 * theta =  0 -> Level 3
 * theta = +1 -> Level 4
 * theta = +2 -> Level 5
 *
 * @param {number} theta
 * @returns {number} Integer between 1 and 5
 */
function thetaToTargetDifficulty(theta) {
  if (!Number.isFinite(theta)) return 3;
  return Math.max(1, Math.min(5, Math.round(theta + 3.0)));
}

/**
 * Stepwise discrete difficulty adjustment for backward compatibility.
 * Increases difficulty by 1 on correct, decreases by 1 on incorrect, bounded in [1, 5].
 *
 * @param {number} currentDifficulty
 * @param {boolean} isCorrect
 * @returns {number}
 */
function adjustDifficulty(currentDifficulty, isCorrect) {
  const safeCurr = Number.isFinite(currentDifficulty) ? currentDifficulty : 3;
  if (isCorrect) return Math.min(5, safeCurr + 1);
  return Math.max(1, safeCurr - 1);
}

/**
 * Topic coverage penalty to prevent repeatedly asking the same topic
 * when other topics in scope remain unexplored.
 *
 * @param {object} question
 * @param {Array} attempts
 * @returns {number}
 */
function topicCoveragePenalty(question, attempts) {
  const topicAttempts = (attempts || []).filter(
    (attempt) => (attempt.topic_id || attempt.topicId) === question.topic_id
  ).length;
  return topicAttempts * 0.35;
}

/**
 * Validates whether a question has a trusted, non-empty answer key.
 *
 * @param {object} question
 * @returns {boolean}
 */
function hasValidAnswerKey(question) {
  if (!question) return false;
  const corr = question.correct_answer || question.correctAnswer;
  const corrText = question.correct_answer_text || question.correctAnswerText;
  return Boolean((corr && String(corr).trim().length > 0) || (corrText && String(corrText).trim().length > 0));
}

/**
 * Adaptive Computerized Question Selection algorithm.
 * Selects the optimal next question from eligible candidates based on:
 * 1. Scope filtering (subject, main topic, subtopic)
 * 2. Unanswered verification (never repeats questions answered in current session)
 * 3. Answer-key validation (strictly excludes questions without answer key)
 * 4. Difficulty proximity & IRT latent ability alignment
 * 5. Topic coverage balance
 * 6. Maximum Fisher Information tie-breaking
 * 7. Graceful fallback when exact target difficulty is unavailable
 *
 * @param {Array<object>} questions - Pool of candidate questions in subject
 * @param {object} session - Current session object
 * @param {Array<object>} attempts - Prior attempts in session
 * @returns {object|null} Next question or null if pool exhausted
 */
function selectNextQuestion(questions, session, attempts = []) {
  if (!Array.isArray(questions) || questions.length === 0 || !session) {
    return null;
  }

  const askedIds = new Set(session.asked_question_ids || []);
  const sessionSubject = String(session.subject || '').toLowerCase();

  // Filter available candidate questions:
  // - Subject alignment
  // - Exclude already-answered questions in current session
  // - Exclude questions without valid answer key
  const available = questions.filter((q) => {
    if (!q || !q.question_id) return false;
    if (askedIds.has(q.question_id)) return false;
    if (String(q.subject || '').toLowerCase() !== sessionSubject) return false;
    if (!hasValidAnswerKey(q)) return false;
    return true;
  });

  if (available.length === 0) return null;

  const targetDifficulty = session.target_difficulty || 3;
  const currentTheta = typeof session.ability_estimate === 'number' && Number.isFinite(session.ability_estimate)
    ? session.ability_estimate
    : (targetDifficulty - 3.0);

  const scored = available.map((question) => {
    const diffInfo = mapQuestionToDifficulty(question);

    // Primary distance: discrete distance to preferred target difficulty
    const diffDistance = Math.abs(diffInfo.difficulty - targetDifficulty);

    // Secondary fine-grained IRT distance: absolute difference from current theta
    const irtDistance = Math.abs(diffInfo.b - currentTheta) * 0.15;

    // Topic diversification penalty
    const covPenalty = topicCoveragePenalty(question, attempts);

    // Initial preference for medium (level 3) on question 1
    const startBonus = (diffInfo.difficulty === 3 && askedIds.size === 0) ? -0.4 : 0;

    const totalScore = diffDistance + irtDistance + covPenalty + startBonus;

    // Fisher Information at current student ability
    const fisherInfo = calculateItemInformation(currentTheta, diffInfo.b);

    return {
      question,
      diffInfo,
      score: totalScore,
      fisherInfo
    };
  });

  scored.sort((left, right) => {
    // 1. Lower composite score wins (closest difficulty + lowest topic repetition)
    if (Math.abs(left.score - right.score) > 1e-4) {
      return left.score - right.score;
    }

    // 2. Tie-break: prefer higher Fisher Information at current ability
    if (Math.abs(left.fisherInfo - right.fisherInfo) > 1e-4) {
      return right.fisherInfo - left.fisherInfo;
    }

    // 3. Directional preference based on target difficulty
    if (left.diffInfo.difficulty !== right.diffInfo.difficulty) {
      if (targetDifficulty >= 3) {
        return right.diffInfo.difficulty - left.diffInfo.difficulty;
      }
      return left.diffInfo.difficulty - right.diffInfo.difficulty;
    }

    // 4. Deterministic fallback: question_id sort
    return left.question.question_id.localeCompare(right.question.question_id);
  });

  return scored[0].question;
}

/**
 * Summarizes performance by syllabus topic across an assessment session.
 *
 * @param {Array<object>} questions
 * @param {Array<object>} attempts
 * @returns {Array<object>}
 */
function summarizeTopicPerformance(questions, attempts) {
  const byTopic = new Map();

  for (const question of questions) {
    const current = byTopic.get(question.topic_id) || {
      topicId: question.topic_id,
      topicName: question.topic_name,
      attempted: 0,
      correct: 0,
      score: 0,
      maxMarks: 0,
      questionsSeen: 0
    };
    current.questionsSeen += 1;
    byTopic.set(question.topic_id, current);
  }

  for (const attempt of attempts) {
    const question = questions.find((item) => item.question_id === attempt.question_id);
    if (!question) continue;
    const current = byTopic.get(question.topic_id) || {
      topicId: question.topic_id,
      topicName: question.topic_name,
      attempted: 0,
      correct: 0,
      score: 0,
      maxMarks: 0,
      questionsSeen: 0
    };
    current.attempted += 1;
    current.correct += attempt.is_correct ? 1 : 0;
    current.score += Number(attempt.score || 0);
    current.maxMarks += Number(attempt.max_marks || 0);
    byTopic.set(question.topic_id, current);
  }

  return [...byTopic.values()]
    .map((topic) => ({
      topicId: topic.topicId,
      topicName: topic.topicName,
      attempted: topic.attempted,
      correct: topic.correct,
      accuracy: topic.attempted > 0 ? topic.correct / topic.attempted : null,
      score: topic.score,
      maxMarks: topic.maxMarks,
      questionsSeen: topic.questionsSeen
    }))
    .sort((left, right) => {
      if (left.accuracy === null && right.accuracy === null) return right.questionsSeen - left.questionsSeen;
      if (left.accuracy === null) return 1;
      if (right.accuracy === null) return -1;
      return left.accuracy - right.accuracy;
    });
}

module.exports = {
  mapQuestionToDifficulty,
  calculateRaschProbability,
  calculateItemInformation,
  estimateAbilityMAP,
  thetaToTargetDifficulty,
  adjustDifficulty,
  selectNextQuestion,
  summarizeTopicPerformance,
  hasValidAnswerKey,
  THETA_MIN,
  THETA_MAX,
  DEFAULT_PRIOR_MEAN
};