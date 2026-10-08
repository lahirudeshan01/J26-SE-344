const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const assessmentEngineRouter = require('./modules/assessment-engine/routes');
const contentEngineRouter = require('./modules/content-engine/routes');
const digitalTwinRouter = require('./modules/digital-twin/routes');
const skillsTrainerRouter = require('./modules/skills-trainer/routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'backend' });
});

app.use('/api/skills-trainer', skillsTrainerRouter);
app.use('/api/assessment-engine', assessmentEngineRouter);
app.use('/api/content-engine', contentEngineRouter);
app.use('/api/digital-twin', digitalTwinRouter);

module.exports = app;
