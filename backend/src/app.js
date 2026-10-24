const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const assessmentEngineRouter = require('./modules/assessment-engine/routes');
const predictionRouter = require('./modules/assessment-engine/routes/prediction');
const revisionRouter = require('./modules/assessment-engine/routes/revision');
const contentEngineRouter = require('./modules/content-engine/routes');
const digitalTwinRouter = require('./modules/digital-twin/routes');
const skillsTrainerRouter = require('./modules/skills-trainer/routes');
const path = require('node:path');
const { corsOrigins } = require('./config/env');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: corsOrigins,
    credentials: true
  })
);
app.use(express.json());
app.use(morgan('dev'));

const imagesDir = path.resolve(__dirname, '../data/assessment/images');
app.use('/assessment/images', express.static(imagesDir));
app.use('/api/assessment/images', express.static(imagesDir));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'backend' });
});

app.use('/api/skills-trainer', skillsTrainerRouter);
app.use('/api/assessment', assessmentEngineRouter);
app.use('/api/assessment-engine', assessmentEngineRouter);
app.use('/api/prediction', predictionRouter);
app.use('/api/revision', revisionRouter);
app.use('/api/content-engine', contentEngineRouter);
app.use('/api/digital-twin', digitalTwinRouter);

module.exports = app;
