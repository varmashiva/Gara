import { randomBytes } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';

export const CSRF_COOKIE = 'csrfToken';
const isProd = process.env.NODE_ENV === 'production';

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Sets a readable (non-httpOnly, by design — the frontend must be able to
 * read it to echo it back) companion cookie alongside any httpOnly auth
 * cookie. Call this whenever the refresh cookie or guest-cart cookie is
 * (re)issued.
 */
export function setCsrfCookie(res: Response): string {
  const token = generateCsrfToken();
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    // Unlike the refresh cookie (scoped to /api/v1/auth) this needs path
    // '/' — it has to accompany requests to both /api/v1/auth/* and
    // /api/v1/cart/*. That's fine: this token isn't a credential (it's
    // readable by design, just double-submitted), so there's no downside
    // to sending it everywhere.
    path: '/',
  });
  return token;
}

/**
 * Double-submit cookie check. Requests carrying a Bearer Authorization
 * header are exempt — that header is never attached ambiently by a
 * browser to a cross-site request the way a cookie is, so it isn't a
 * forgeable credential in the CSRF sense; only the two cookie-only-
 * authenticated surfaces (refresh/logout, and guest cart mutations) need
 * this. A request with no CSRF cookie at all (nothing to double-submit
 * against) is rejected rather than silently allowed.
 */
export function requireCsrfToken() {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.headers.authorization?.startsWith('Bearer ')) {
      return next();
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE];
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw AppError.forbidden('Missing or invalid CSRF token', 'CSRF_TOKEN_INVALID');
    }
    next();
  };
}
