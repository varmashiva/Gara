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
