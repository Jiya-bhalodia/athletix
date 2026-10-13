import { Router } from 'express';
import { isDatabaseConnected } from '../db.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'athletix-api' });
});

healthRouter.get('/db', (_req, res) => {
  const connected = isDatabaseConnected();
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    database: connected ? 'connected' : 'disconnected',
  });
});
