import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../utils/jwt';
import { AppError } from '../utils/errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function requireAuth() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken;

    if (!token) {
      throw AppError.unauthorized('Authentication required');
    }

    try {
      req.user = verifyAccessToken(token);
      next();
    } catch {
      throw AppError.unauthorized('Invalid or expired token');
    }
  };
}

/**
 * For routes usable by both guests and logged-in users (cart). Attaches
 * req.user when a valid token is present; never rejects the request when
 * one isn't — an invalid/expired token here just means "treat as guest",
 * not "reject". Cart ownership is resolved from req.user when present, or
 * a guest cart cookie otherwise (see cart.middleware.ts).
 */
export function optionalAuth() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken;

    if (token) {
      try {
        req.user = verifyAccessToken(token);
      } catch {
        // Fall through as a guest.
      }
    }
    next();
  };
}
