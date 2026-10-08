const { Router } = require('express');

const router = Router();

router.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'assessment-engine' });
});

module.exports = router;
