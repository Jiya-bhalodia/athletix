import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import session from 'express-session';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { provisionInitialAdmin } from '../auth/provision-admin.js';
import { Sport } from '../models/index.js';

const config = { allowedOrigins: ['http://localhost:5173'], sessionSecret: 'api-test-secret-at-least-32-characters-long', cookieName: 'athletix.sid', maxAgeMs: 3600000, sameSite: 'lax' as const, nodeEnv: 'test', trustProxyHops: 0, cookieOptions: { httpOnly: true, secure: false, sameSite: 'lax' as const, path: '/api/v1', maxAge: 3600000 } };

test('feature APIs reject anonymous access and preserve health behavior', async () => {
  const app = createApp(config, new session.MemoryStore()); const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string'); const base = `http://127.0.0.1:${address.port}/api/v1`;
  try {
    const health = await fetch(`${base}/health`); assert.equal(health.status, 200);
    for (const path of ['/admin/resources/players', '/coach/teams', '/portal/player', '/portal/parent/children', '/reports/dashboard']) {
      const response = await fetch(`${base}${path}`); assert.equal(response.status, 401, path); assert.deepEqual(await response.json(), { error: { message: 'Authentication required' } });
    }
  } finally { await new Promise<void>((resolve) => server.close(() => resolve())); }
});

test('isolated API CRUD, persistence and public visibility checks', { skip: !process.env.MONGODB_API_TEST_URI }, async () => {
  const uri = process.env.MONGODB_API_TEST_URI!; const parsed = new URL(uri);
  assert.equal(parsed.pathname.replace(/^\//, ''), 'athletix_api_test', 'MONGODB_API_TEST_URI must target athletix_api_test exactly');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
  assert.equal(mongoose.connection.name, 'athletix_api_test');
  let server: ReturnType<ReturnType<typeof createApp>['listen']> | undefined;
  try {
    await mongoose.connection.dropDatabase(); await Sport.syncIndexes();
    const admin = await provisionInitialAdmin('api-admin@example.test', 'api-test-password-is-long-enough', true);
    const app = createApp(config); server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
    const address = server.address(); assert.ok(address && typeof address !== 'string'); const base = `http://127.0.0.1:${address.port}/api/v1`;
    const me = await fetch(`${base}/auth/me`); const meBody = await me.json() as { csrfToken: string }; const cookie = me.headers.get('set-cookie')?.split(';')[0]; assert.ok(cookie);
    const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { cookie: cookie!, origin: config.allowedOrigins[0]!, 'content-type': 'application/json', 'x-csrf-token': meBody.csrfToken }, body: JSON.stringify({ email: admin.email, password: 'api-test-password-is-long-enough' }) });
    assert.equal(login.status, 200); const identity = await login.json() as { csrfToken: string }; const loginCookie = login.headers.get('set-cookie')?.split(';')[0]; assert.ok(loginCookie);
    const headers = { cookie: loginCookie!, origin: config.allowedOrigins[0]!, 'content-type': 'application/json', 'x-csrf-token': identity.csrfToken };
    const createdResponse = await fetch(`${base}/admin/resources/sports`, { method: 'POST', headers, body: JSON.stringify({ name: 'Test Basketball', category: 'Team', description: 'isolated API test' }) });
    assert.equal(createdResponse.status, 201); const created = await createdResponse.json() as { data: { id: string } };
    assert.ok(await Sport.findById(created.data.id), 'created record persists in MongoDB');
    const publicList = await fetch(`${base}/public/sports`); const publicBody = await publicList.json() as { data: Array<{ id: string }> }; assert.ok(publicBody.data.some((row) => row.id === created.data.id));
    const updated = await fetch(`${base}/admin/resources/sports/${created.data.id}`, { method: 'PATCH', headers, body: JSON.stringify({ description: 'updated test description' }) }); assert.equal(updated.status, 200);
    assert.equal((await Sport.findById(created.data.id))?.description, 'updated test description');
    const deleted = await fetch(`${base}/admin/resources/sports/${created.data.id}`, { method: 'DELETE', headers }); assert.equal(deleted.status, 204);
    assert.equal(await Sport.findById(created.data.id), null);
    const forbidden = await fetch(`${base}/admin/resources/sports`); assert.equal(forbidden.status, 401);
  } finally {
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    if (mongoose.connection.name === 'athletix_api_test') await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
