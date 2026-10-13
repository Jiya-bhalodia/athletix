import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { User, USER_ROLES } from '../models/index.js';
import { newCsrfToken, requireCsrf, requireTrustedOrigin } from '../auth/security.js';
import type { AuthConfig } from '../config.js';
import { authenticate, resolveProfile } from '../auth/middleware.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dummyHash = await argon2.hash(randomBytes(32), { type: argon2.argon2id });

export function authRouter(config: AuthConfig) {
  const router = Router();
  router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  const origin = requireTrustedOrigin(config.allowedOrigins);
  const csrf = requireCsrf(config.allowedOrigins);
  const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { message: 'Too many login attempts. Try again later.' } } });

  router.get('/me', async (req, res, next) => {
    try {
      const csrfToken = req.session.csrfToken ?? newCsrfToken();
      req.session.csrfToken = csrfToken;
      const userId = req.session.userId;
      if (!userId) return res.json({ user: null, csrfToken });
      const user = await User.findById(userId);
      const linkedProfile = user ? await resolveProfile(user) : false;
      if (!user || user.status !== 'active' || !USER_ROLES.includes(user.role) || linkedProfile === false) {
        req.session.userId = undefined;
        req.session.csrfToken = newCsrfToken();
        await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
        return res.json({ user: null, csrfToken: req.session.csrfToken });
      }
      if (req.session.sessionVersion !== (user.sessionVersion ?? 0)) {
        await new Promise<void>((resolve, reject) => req.session.destroy((error) => error ? reject(error) : resolve()));
        res.clearCookie(config.cookieName, clearOptions(config));
        const freshCsrfToken = newCsrfToken();
        return res.json({ user: null, csrfToken: freshCsrfToken });
      }
      return res.json({ user: { id: String(user._id), email: user.email, role: user.role, ...(linkedProfile ? { profileId: linkedProfile } : {}) }, csrfToken });
    } catch (error) { next(error); }
  });

  router.post('/login', origin, csrf, loginLimiter, async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown> | null;
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !['email', 'password'].includes(key)) ||
        typeof body.email !== 'string' || typeof body.password !== 'string' || body.email.length > 254 || body.password.length < 1 || body.password.length > 128) {
        return res.status(400).json({ error: { message: 'Email and password are required' } });
      }
      const email = body.email.trim().toLowerCase();
      if (!emailPattern.test(email)) return res.status(400).json({ error: { message: 'Enter a valid email address' } });
      const user = await User.findOne({ email }).select('+passwordHash');
      const matches = await argon2.verify(user?.passwordHash ?? dummyHash, body.password).catch(() => false);
      if (!user || !user.passwordHash || !matches || user.status !== 'active' || !USER_ROLES.includes(user.role)) {
        return res.status(401).json({ error: { message: 'Invalid email or password' } });
      }
      const linkedProfile = await resolveProfile(user);
      if (linkedProfile === false) return res.status(401).json({ error: { message: 'Invalid email or password' } });
      await new Promise<void>((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
      req.session.userId = String(user._id);
      req.session.sessionVersion = user.sessionVersion ?? 0;
      req.session.csrfToken = newCsrfToken();
      await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
      return res.json({ user: { id: String(user._id), email: user.email, role: user.role, ...(linkedProfile ? { profileId: linkedProfile } : {}) }, csrfToken: req.session.csrfToken });
    } catch (error) { next(error); }
  });

  router.post('/logout', origin, csrf, authenticate, async (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie(config.cookieName, clearOptions(config));
      return res.status(204).end();
    });
  });

  return router;
}

function clearOptions(config: AuthConfig) {
  return { httpOnly: true, secure: config.nodeEnv === 'production', sameSite: config.sameSite, path: '/api/v1' };
}
