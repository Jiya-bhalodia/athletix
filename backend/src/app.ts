import cors from 'cors';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { adminApiRouter } from './routes/admin-api.js';
import { publicApiRouter } from './routes/public-api.js';
import { coachApiRouter } from './routes/coach-api.js';
import { portalApiRouter } from './routes/portal-api.js';
import { paymentApiRouter } from './routes/payment-api.js';
import { reportApiRouter } from './routes/report-api.js';
import { requireApiWriteCsrf } from './auth/security.js';
import type { AuthConfig } from './config.js';

export function createApp(config: AuthConfig, testStore?: session.Store) {
  const app = express();
  if (config.trustProxyHops > 0) app.set('trust proxy', config.trustProxyHops);
  app.use(helmet());

  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
      return callback(Object.assign(new Error('Origin is not allowed by CORS'), { status: 403 }));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '16kb' }));
  app.use(session({
    name: config.cookieName,
    secret: config.sessionSecret,
    store: testStore ?? MongoStore.create({ client: mongoose.connection.getClient(), collectionName: 'sessions', ttl: Math.ceil(config.maxAgeMs / 1000), autoRemove: 'native' }),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: config.cookieOptions,
  }));
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/auth', authRouter(config));
  app.use('/api/v1', requireApiWriteCsrf(config.allowedOrigins));
  app.use('/api/v1/public', publicApiRouter);
  app.use('/api/v1/admin', adminApiRouter);
  app.use('/api/v1/coach', coachApiRouter);
  app.use('/api/v1/portal', portalApiRouter);
  app.use('/api/v1', paymentApiRouter);
  app.use('/api/v1/reports', reportApiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
