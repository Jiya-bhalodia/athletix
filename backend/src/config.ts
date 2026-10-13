import 'dotenv/config';
import type { CookieOptions } from 'express-session';

export interface AuthConfig {
  allowedOrigins: string[];
  sessionSecret: string;
  cookieName: string;
  maxAgeMs: number;
  sameSite: 'lax' | 'strict' | 'none';
  nodeEnv: string;
  trustProxyHops: number;
  cookieOptions: CookieOptions;
}

function required(name: string, value: string | undefined): string {
  const result = value?.trim();
  if (!result) {
    throw new Error(`Missing required environment variable: ${name}. Copy backend/.env.example to backend/.env and configure it.`);
  }
  return result;
}

export function loadConfig() {
  const mongoUri = required('MONGODB_URI', process.env.MONGODB_URI);
  let parsedMongoUri: URL;
  try {
    parsedMongoUri = new URL(mongoUri);
  } catch {
    throw new Error('Invalid MONGODB_URI: expected a mongodb:// or mongodb+srv:// connection string.');
  }
  if (!['mongodb:', 'mongodb+srv:'].includes(parsedMongoUri.protocol)) {
    throw new Error('Invalid MONGODB_URI: expected a mongodb:// or mongodb+srv:// connection string.');
  }

  const portValue = process.env.PORT?.trim() || '4000';
  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid PORT: expected an integer from 1 to 65535.');
  }

  const nodeEnv = process.env.NODE_ENV?.trim() || 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) throw new Error('Invalid NODE_ENV.');
  const configuredOrigins = process.env.FRONTEND_ORIGIN?.trim();
  if (nodeEnv === 'production' && !configuredOrigins) {
    throw new Error('Missing required environment variable: FRONTEND_ORIGIN. Set the exact HTTPS frontend origin(s) for production.');
  }
  const allowedOrigins = (configuredOrigins || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0 || allowedOrigins.some((origin) => {
    try {
      const parsed = new URL(origin);
      const hostname = parsed.hostname.toLowerCase();
      const isLocalhost = hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '::1' || hostname === '[::1]' || /^127(?:\.\d{1,3}){3}$/.test(hostname);
      return parsed.origin !== origin || (nodeEnv === 'production' && (parsed.protocol !== 'https:' || isLocalhost));
    } catch { return true; }
  })) throw new Error('Invalid FRONTEND_ORIGIN: provide exact browser origins separated by commas.');

  const sessionSecret = required('SESSION_SECRET', process.env.SESSION_SECRET);
  if (sessionSecret.length < 32) throw new Error('Invalid SESSION_SECRET: use at least 32 characters.');
  const cookieName = process.env.SESSION_COOKIE_NAME?.trim() || 'athletix.sid';
  if (!/^[A-Za-z0-9_.-]{1,64}$/.test(cookieName)) throw new Error('Invalid SESSION_COOKIE_NAME.');
  const maxAgeMs = Number(process.env.SESSION_MAX_AGE_MS?.trim() || '28800000');
  if (!Number.isInteger(maxAgeMs) || maxAgeMs < 60000 || maxAgeMs > 604800000) {
    throw new Error('Invalid SESSION_MAX_AGE_MS: expected 60000 to 604800000.');
  }
  const sameSite = process.env.SESSION_SAME_SITE?.trim().toLowerCase() || 'lax';
  if (!['lax', 'strict', 'none'].includes(sameSite)) throw new Error('Invalid SESSION_SAME_SITE: expected lax, strict, or none.');
  if (sameSite === 'none' && nodeEnv !== 'production') throw new Error('Invalid SESSION_SAME_SITE: none requires production HTTPS cookies.');
  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS?.trim() || '0');
  if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 5) {
    throw new Error('Invalid TRUST_PROXY_HOPS: expected an integer from 0 to 5.');
  }

  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: nodeEnv === 'production',
    sameSite: sameSite as 'lax' | 'strict' | 'none',
    path: '/api/v1',
    maxAge: maxAgeMs,
  };
  return { mongoUri, port, allowedOrigins, sessionSecret, cookieName, maxAgeMs, sameSite: sameSite as 'lax' | 'strict' | 'none', nodeEnv, trustProxyHops, cookieOptions };
}
