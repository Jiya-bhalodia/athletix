import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    sessionVersion?: number;
    csrfToken?: string;
  }
}
