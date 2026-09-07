import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export function notFoundHandler(req: Request, res: Response) {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND');
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.message, err.code);
  }

  logger.error('Unhandled error', {
    message: err instanceof Error ? err.message : String(err),
    path: req.originalUrl,
  });

  return sendError(res, 500, 'Internal server error', 'INTERNAL_ERROR');
}
