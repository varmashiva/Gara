import { NextFunction, Request, Response } from 'express';

function stripDangerousKeys(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map(stripDangerousKeys);
  }
  if (input !== null && typeof input === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      clean[key] = stripDangerousKeys(value);
    }
    return clean;
  }
  return input;
}

export function sanitizeRequest(req: Request, _res: Response, next: NextFunction) {
  if (req.body) req.body = stripDangerousKeys(req.body);
  if (req.params) req.params = stripDangerousKeys(req.params) as typeof req.params;
  if (req.query) req.query = stripDangerousKeys(req.query) as typeof req.query;
  next();
}
