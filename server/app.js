'use-strict';
import 'dotenv/config';

import express from 'express';
import { createServer } from 'http';
import log from 'debug';
// import { listSubmission } from './controller/submission';
import { getFormStats, getCandidates, getFormStatsDetail, getAllSubmissionsRaw } from './controller/stats';
import { attach } from './config/express';
import { initialProcess } from './lib/odkData';
import './lib/cron';

const debug = log('app');
const app = express();
const port = process.env.PORT || 8092;
const mode = process.env.NODE_ENV;
// server creation and listen to a port
const startingMsg = () => debug(`GF Dashboard: Server started in mode ${mode} on port ${port}.`);
const server = createServer(app);
server.listen(port, startingMsg);

attach(app);


app.get('/api/submissions', getAllSubmissionsRaw);

app.get('/api/stats/:dash_id', getFormStats);
app.get('/api/candidates/:dash_id', getCandidates);
app.get('/api/form-stats-detail/:dash_id', getFormStatsDetail);

initialProcess();
// ensure the process terminates gracefully when an error occurs.
process.on('uncaughtException', (e) => {
  console.log('process.onUncaughException: %o', e);
  process.exit(1);
});

// crash on unhandled promise rejections
process.on('unhandledRejection', (e) => {
  console.log('process.onUnhandledRejection: %o', e);
  process.exit(1);
});

process.on('warning', (warning) => {
  console.log('process.onWarning: %o', warning);
});
