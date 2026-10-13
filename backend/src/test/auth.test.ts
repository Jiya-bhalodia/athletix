import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import argon2 from 'argon2';
import { once } from 'node:events';
import session from 'express-session';
import express from 'express';
import { createApp } from '../app.js';
import { provisionInitialAdmin } from '../auth/provision-admin.js';
import { authenticate, authorizeRoles } from '../auth/middleware.js';
import { User } from '../models/index.js';

const isolatedDbUri = process.env.MONGODB_TEST_URI;
const testConfig = { allowedOrigins: ['http://localhost:8080'], sessionSecret: 'auth-integration-test-secret-at-least-32-chars', cookieName: 'athletix.sid', maxAgeMs: 3600000, sameSite: 'lax' as const, nodeEnv: 'test', trustProxyHops: 0, cookieOptions: { httpOnly: true, secure: false, sameSite: 'lax' as const, path: '/api/v1', maxAge: 3600000 } };

test('provisioning requires explicit confirmation and strong passwords', async () => {
  await assert.rejects(provisionInitialAdmin('admin@example.test', 'a-long-password', false), /requires --confirm-admin-provisioning/);
  await assert.rejects(provisionInitialAdmin('admin@example.test', 'short', true), /between 12 and 128/);
});

test('authentication middleware denies missing sessions and roles outside the allowed set', async () => {
  const app = express();
  app.use(session({ secret: 'middleware-test-secret-at-least-32-characters', resave: false, saveUninitialized: false }));
  app.get('/private', authenticate, (_req, res) => res.json({ ok: true }));
  app.get('/admin-only', (_req, res, next) => { res.locals.auth = { userId: 'test-player', role: 'player' }; next(); }, authorizeRoles('admin'), (_req, res) => res.json({ ok: true }));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  try {
    assert.equal((await fetch(`http://127.0.0.1:${address.port}/private`)).status, 401);
    assert.equal((await fetch(`http://127.0.0.1:${address.port}/admin-only`)).status, 403);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('session auth flows and duplicate account safeguards use only the isolated auth test database', { skip: !isolatedDbUri }, async () => {
  const parsed = new URL(isolatedDbUri!);
  assert.equal(parsed.pathname.replace(/^\//, ''), 'athletix_auth_test', 'MONGODB_TEST_URI must target athletix_auth_test exactly');
  await mongoose.connect(isolatedDbUri!, { serverSelectionTimeoutMS: 3000 });
  assert.equal(mongoose.connection.name, 'athletix_auth_test');
  let server: ReturnType<ReturnType<typeof createApp>['listen']> | undefined;
  try {
    await mongoose.connection.dropDatabase();
    await User.syncIndexes();
    const attempts = await Promise.allSettled([
      provisionInitialAdmin(' Admin@Example.Test ', 'correct-horse-example-passphrase', true),
      provisionInitialAdmin('alternate@example.test', 'correct-horse-example-passphrase', true),
    ]);
    assert.equal(attempts.filter((result) => result.status === 'fulfilled').length, 1, 'concurrent initial-admin attempts must have a single winner');
    const user = await User.findOne({ role: 'admin' }).select('+passwordHash');
    assert.ok(user);
    assert.ok(['admin@example.test', 'alternate@example.test'].includes(user.email));
    assert.equal(user.role, 'admin');
    await assert.rejects(provisionInitialAdmin('other@example.test', 'correct-horse-example-passphrase', true), /already run|already exists/);
    await assert.rejects(provisionInitialAdmin(user.email, 'correct-horse-example-passphrase', true), /already run|already exists/);

    const app = createApp(testConfig);
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}/api/v1/auth`;
    const origin = 'http://localhost:8080';
    const first = await fetch(`${base}/me`);
    assert.equal(first.status, 200);
    const anonymous = await first.json() as { user: null; csrfToken: string };
    assert.equal(anonymous.user, null);
    const firstCookie = first.headers.get('set-cookie')?.split(';')[0];
    assert.ok(firstCookie);

    const noOrigin = await fetch(`${base}/login`, { method: 'POST', headers: { cookie: firstCookie!, 'content-type': 'application/json', 'x-csrf-token': anonymous.csrfToken }, body: JSON.stringify({ email: 'admin@example.test', password: 'correct-horse-example-passphrase' }) });
    assert.equal(noOrigin.status, 403);
    const noCsrf = await fetch(`${base}/login`, { method: 'POST', headers: { cookie: firstCookie!, origin, 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.test', password: 'correct-horse-example-passphrase' }) });
    assert.equal(noCsrf.status, 403);

    const login = await fetch(`${base}/login`, { method: 'POST', headers: { cookie: firstCookie!, origin, 'content-type': 'application/json', 'x-csrf-token': anonymous.csrfToken }, body: JSON.stringify({ email: user.email.toUpperCase(), password: 'correct-horse-example-passphrase' }) });
    assert.equal(login.status, 200);
    const identity = await login.json() as { user: { id: string; email: string; role: string }; csrfToken: string };
    assert.equal(identity.user.email, user.email);
    assert.equal(identity.user.role, 'admin');
    assert.equal('passwordHash' in identity.user, false);
    const authCookie = login.headers.get('set-cookie')?.split(';')[0];
    assert.ok(authCookie);
    assert.notEqual(authCookie, firstCookie, 'login regenerates the session cookie');
    const me = await fetch(`${base}/me`, { headers: { cookie: authCookie! } });
    assert.equal((await me.json() as { user: { id: string } }).user.id, identity.user.id);

    const freshAnonymous = await fetch(`${base}/me`);
    const freshAnonymousBody = await freshAnonymous.json() as { csrfToken: string };
    const freshCookie = freshAnonymous.headers.get('set-cookie')?.split(';')[0];
    assert.ok(freshCookie);
    for (const credentials of [
      { email: user.email, password: 'not-the-password' },
      { email: 'nobody@example.test', password: 'not-the-password' },
    ]) {
      const loginFailure: Response = await fetch(`${base}/login`, { method: 'POST', headers: { cookie: freshCookie!, origin, 'content-type': 'application/json', 'x-csrf-token': freshAnonymousBody.csrfToken }, body: JSON.stringify(credentials) });
      assert.equal(loginFailure.status, 401);
      assert.deepEqual(await loginFailure.json(), { error: { message: 'Invalid email or password' } });
    }
    const malformed = await fetch(`${base}/login`, { method: 'POST', headers: { cookie: freshCookie!, origin, 'content-type': 'application/json', 'x-csrf-token': freshAnonymousBody.csrfToken }, body: JSON.stringify({ email: user.email, password: 'pass', role: 'admin' }) });
    assert.equal(malformed.status, 400);
    const stored = await User.findById(user._id).select('+passwordHash');
    assert.ok(stored?.passwordHash && await argon2.verify(stored.passwordHash, 'correct-horse-example-passphrase'));
    const safe = await User.findById(user._id);
    assert.equal(safe?.toObject().passwordHash, undefined);

    const logout = await fetch(`${base}/logout`, { method: 'POST', headers: { cookie: authCookie!, origin, 'x-csrf-token': identity.csrfToken } });
    assert.equal(logout.status, 204);
    const invalidated = await fetch(`${base}/me`, { headers: { cookie: authCookie! } });
    assert.equal((await invalidated.json() as { user: null }).user, null);
  } finally {
    if (server?.listening) await new Promise<void>((resolve) => server!.close(() => resolve()));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
