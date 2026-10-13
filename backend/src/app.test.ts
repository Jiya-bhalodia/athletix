import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import session from 'express-session';
import { createApp } from './app.js';

const testConfig = { allowedOrigins: ['http://localhost:8080'], sessionSecret: 'test-session-secret-that-is-long-enough-32', cookieName: 'athletix.sid', maxAgeMs: 3600000, sameSite: 'lax' as const, nodeEnv: 'test', trustProxyHops: 0, cookieOptions: { httpOnly: true, secure: false, sameSite: 'lax' as const, path: '/api/v1', maxAge: 3600000 } };
const app = () => createApp(testConfig, new session.MemoryStore());

test('health endpoint returns a basic service status', async () => {
  const server = app().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok', service: 'athletix-api' });
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('unknown routes return JSON 404', async () => {
  const server = app().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/missing`);
    assert.equal(response.status, 404);
    assert.match(response.headers.get('content-type') ?? '', /application\/json/);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('database health reports disconnected without leaking configuration', async () => {
  const server = app().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/health/db`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: 'unavailable', database: 'disconnected' });
  } finally {
    server.close();
    await once(server, 'close');
  }
});
