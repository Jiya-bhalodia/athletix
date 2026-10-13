import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from '../config.js';

test('security config validates required values and accepts the default cookie name', () => {
  const names = ['MONGODB_URI', 'SESSION_SECRET', 'SESSION_COOKIE_NAME', 'NODE_ENV', 'FRONTEND_ORIGIN', 'SESSION_SAME_SITE'];
  const before = new Map(names.map((name) => [name, process.env[name]]));
  try {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/athletix';
    process.env.SESSION_SECRET = 'unit-test-session-secret-with-more-than-32-characters';
    process.env.SESSION_COOKIE_NAME = 'athletix.sid';
    process.env.NODE_ENV = 'test';
    process.env.FRONTEND_ORIGIN = 'http://localhost:8080';
    const config = loadConfig();
    assert.equal(config.cookieName, 'athletix.sid');
    assert.equal(config.cookieOptions.httpOnly, true);
    assert.equal(config.cookieOptions.path, '/api/v1');
    assert.equal(config.cookieOptions.secure, false);
  } finally {
    for (const [name, value] of before) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});

test('production requires an explicit HTTPS frontend origin', () => {
  const names = ['MONGODB_URI', 'SESSION_SECRET', 'SESSION_COOKIE_NAME', 'NODE_ENV', 'FRONTEND_ORIGIN', 'SESSION_SAME_SITE'];
  const before = new Map(names.map((name) => [name, process.env[name]]));
  try {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/athletix';
    process.env.SESSION_SECRET = 'unit-test-session-secret-with-more-than-32-characters';
    process.env.SESSION_COOKIE_NAME = 'athletix.sid';
    process.env.NODE_ENV = 'production';
    delete process.env.FRONTEND_ORIGIN;
    assert.throws(() => loadConfig(), /Missing required environment variable: FRONTEND_ORIGIN/);
    process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
    assert.throws(() => loadConfig(), /Invalid FRONTEND_ORIGIN/);
    process.env.FRONTEND_ORIGIN = 'https://academy.example.test';
    process.env.SESSION_SAME_SITE = 'none';
    const config = loadConfig();
    assert.equal(config.cookieOptions.secure, true);
    assert.equal(config.cookieOptions.sameSite, 'none');
  } finally {
    for (const [name, value] of before) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});
