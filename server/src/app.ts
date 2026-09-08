import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { v1Router } from './routes/v1';
import { sanitizeRequest } from './middleware/sanitize.middleware';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';
import { CSRF_COOKIE, setCsrfCookie } from './middleware/csrf.middleware';

export function createApp() {
  const app = express();

  app.use(helmet());
  // MockStorageProvider's local uploads dir — served with a relaxed CORP so
  // the frontend (a different origin in dev) can load these as <img> src.
  // Only this static path gets the relaxation; every other response keeps
  // helmet's default same-origin policy.
  app.use(
    '/uploads',
    (_req, res, next) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      // Uploaded files are served with their detected content-type but the
      // browser must never MIME-sniff them into something else (e.g.
      // treating an uploaded file as HTML/script) — nosniff plus the fact
      // that we generate the storage filename/extension ourselves (never
      // the client's original filename) is what makes this directory safe
      // to serve statically at all.
      res.setHeader('X-Content-Type-Options', 'nosniff');
      next();
    },
    express.static(path.join(__dirname, '../uploads'))
  );
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(sanitizeRequest);

  // Primes the CSRF double-submit cookie on literally any request that
  // doesn't already have one — guarantees it exists before the first
  // user-initiated mutation, since the SPA's own bootstrap call (GET
  // /auth/me, fired on every page load) always runs first. A double-submit
  // token can never be validated on the same response that first issues
  // it, so without this priming step, a brand-new session's very first
  // mutating request would always fail the CSRF check.
  app.use((req, res, next) => {
    if (!req.cookies?.[CSRF_COOKIE]) {
      setCsrfCookie(res);
    }
    next();
  });

  // Note: credential-guessing-sensitive auth endpoints (login/register/password
  // reset) carry their own stricter limiter applied directly on those routes
  // (see auth.routes.ts) — not here, since /auth/me and /auth/refresh are
  // called on every page load and must not share that tight budget.
  const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 });

  app.use(`/api/${env.API_VERSION}`, generalLimiter);
  app.use(`/api/${env.API_VERSION}`, v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
