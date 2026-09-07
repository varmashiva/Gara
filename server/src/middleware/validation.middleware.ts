import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/response';

export function validateBody(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return sendError(res, 400, err.errors[0]?.message ?? 'Invalid request body', 'VALIDATION_ERROR');
      }
      next(err);
    }
  };
}

// Express 5 makes req.query a read-only getter, but we're on Express 4 here
// where it's a plain writable property — safe to reassign the parsed/coerced
// result directly.
export function validateQuery(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return sendError(res, 400, err.errors[0]?.message ?? 'Invalid query parameters', 'VALIDATION_ERROR');
      }
      next(err);
    }
  };
}
