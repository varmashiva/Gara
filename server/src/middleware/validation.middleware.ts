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
