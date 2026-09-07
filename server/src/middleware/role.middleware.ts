import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { AccessTokenPayload } from '../utils/jwt';

export function requireRole(...roles: AccessTokenPayload['role'][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw AppError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
}
