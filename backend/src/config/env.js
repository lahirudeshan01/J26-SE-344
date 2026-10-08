const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

module.exports = {
  port: process.env.BACKEND_PORT || process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  aiServiceUrls: {
    skillsTrainer: process.env.SKILLS_TRAINER_URL || '',
    assessmentEngine: process.env.ASSESSMENT_ENGINE_URL || '',
    contentEngine: process.env.CONTENT_ENGINE_URL || '',
    digitalTwin: process.env.DIGITAL_TWIN_URL || '',
  },
};
