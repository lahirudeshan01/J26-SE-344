const { Router } = require('express');
const store = require('../services/store');
const { evaluatePredictionResults, runPythonPrediction } = require('../services/predictionService');

const router = Router();

router.get('/grade/:studentId', async (request, response, next) => {
  try {
    const { studentId } = request.params;
    if (!studentId) {
      return response.status(400).json({ error: { code: 'bad_request', message: 'studentId is required' } });
    }

    const [mockRows, attempts, sessions] = await Promise.all([
      store.getMockExamResultsByStudent(studentId),
      store.getAttemptsByStudent(studentId),
      store.getSessionsByStudent(studentId)
    ]);

    const result = evaluatePredictionResults({ mockRows, attempts, sessions });

    response.json({
      studentId,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

router.post('/predict', async (request, response, next) => {
  try {
    const params = request.body || {};
    const result = await runPythonPrediction(params);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;