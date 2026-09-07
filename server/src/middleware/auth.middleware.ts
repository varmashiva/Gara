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
