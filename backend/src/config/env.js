const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  port: process.env.BACKEND_PORT || process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  corsOrigins: (process.env.CORS_ORIGINS || process.env.FRONTEND_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175,http://localhost:5176,http://127.0.0.1:5176')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  aiServiceUrls: {
    skillsTrainer: process.env.SKILLS_TRAINER_URL || '',
    assessmentEngine: process.env.ASSESSMENT_ENGINE_URL || '',
    contentEngine: process.env.CONTENT_ENGINE_URL || '',
    digitalTwin: process.env.DIGITAL_TWIN_URL || '',
  },
};
