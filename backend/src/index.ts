import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { connectToDatabase } from './db.js';

async function start() {
  const config = loadConfig();
  await connectToDatabase(config.mongoUri);

  const app = createApp(config);
  const server = app.listen(config.port, () => {
    console.log(`Athletix API listening on http://localhost:${config.port}`);
  });

  const shutdown = () => {
    server.close(() => {
      void import('mongoose').then(({ default: mongoose }) => mongoose.disconnect()).finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : '';
  const safeConfigurationError = /^(Missing required environment variable: (MONGODB_URI|PORT|SESSION_SECRET|FRONTEND_ORIGIN)|Invalid (MONGODB_URI|PORT|FRONTEND_ORIGIN|SESSION_SECRET|SESSION_COOKIE_NAME|SESSION_MAX_AGE_MS|SESSION_SAME_SITE|TRUST_PROXY_HOPS|NODE_ENV))/.test(message);
  console.error(safeConfigurationError
    ? `Unable to start Athletix API: ${message}`
    : 'Unable to start Athletix API. Check MongoDB connectivity and backend configuration.');
  process.exit(1);
});
