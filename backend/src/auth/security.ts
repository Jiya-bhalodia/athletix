import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, RequestHandler } from 'express';
import type { UserRole } from '../models/index.js';

export function newCsrfToken(): string { return randomBytes(32).toString('hex'); }

export function constantTimeEqual(expected: string, provided: string): boolean {
  const a = Buffer.from(expected); const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function originAllowed(req: Request, allowedOrigins: string[]): boolean {
  const origin = req.get('origin');
  return Boolean(origin && allowedOrigins.includes(origin));
}

export function requireTrustedOrigin(allowedOrigins: string[]): RequestHandler {
  return (req, res, next) => originAllowed(req, allowedOrigins)
    ? next()
    : res.status(403).json({ error: { message: 'Request origin is not allowed' } });
}

export function requireCsrf(allowedOrigins: string[]): RequestHandler {
  return (req, res, next) => {
    const expected = req.session.csrfToken;
    const provided = req.get('x-csrf-token');
    if (!originAllowed(req, allowedOrigins) || !expected || !provided || !constantTimeEqual(expected, provided)) {
      return res.status(403).json({ error: { message: 'Invalid request token' } });
    }
    next();
  };
}

/** Protect cookie-authenticated API mutations; reads and intentionally public routes are not mounted through this guard. */
export function requireApiWriteCsrf(allowedOrigins: string[]): RequestHandler {
  const verify = requireCsrf(allowedOrigins);
  const publicOrigin = requireTrustedOrigin(allowedOrigins);
  return (req, res, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
    if (req.path.startsWith('/public/')) return publicOrigin(req, res, next);
    return verify(req, res, next);
  };
}

export const permittedRoles: readonly UserRole[] = ['admin', 'coach', 'player', 'parent'];
