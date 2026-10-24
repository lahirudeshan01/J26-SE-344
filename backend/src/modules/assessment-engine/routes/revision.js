const { Router } = require('express');
const store = require('../services/store');
const seedQuestions = require('../data/questions');
const { summarizeTopicPerformance } = require('../services/adaptiveSelectionService');

const router = Router();

router.get('/priorities/:studentId', async (request, response, next) => {
  try {
    const { studentId } = request.params;
    if (!studentId) {
      return response.status(400).json({ error: { code: 'bad_request', message: 'studentId is required' } });
    }

    const attempts = await store.getAttemptsByStudent(studentId);
    const state = await store.readState();
    const priorities = summarizeTopicPerformance(state.questions.length > 0 ? state.questions : seedQuestions, attempts)
      .map((topic) => ({
        topicId: topic.topicId,
        topicName: topic.topicName,
        accuracy: topic.accuracy,
        attempted: topic.attempted,
        questionsSeen: topic.questionsSeen,
        priorityScore: topic.accuracy === null ? 1 : Number((1 - topic.accuracy).toFixed(2)),
        recommendedAction:
          topic.accuracy === null
            ? 'Practice at least one verified question in this topic.'
            : topic.accuracy < 0.5
              ? 'Revise concept notes and attempt easier questions first.'
              : topic.accuracy < 0.8
                ? 'Review worked examples and mixed practice.'
                : 'Keep the topic warm with short mixed practice.'
      }))
      .sort((left, right) => right.priorityScore - left.priorityScore);

    response.json({
      studentId,
      status: attempts.length === 0 ? 'insufficient_data' : 'prototype',
      priorities,
      message:
        attempts.length === 0
          ? 'There is not enough assessment history to produce reliable revision priorities.'
          : 'Revision priorities are derived from topic-level performance on verified question metadata.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;