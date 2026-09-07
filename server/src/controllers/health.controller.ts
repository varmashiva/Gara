import { Request, Response } from 'express';
import { isDatabaseReady } from '../config/db';
import { env } from '../config/env';

export function healthHandler(_req: Request, res: Response) {
  res.status(200).json({ status: 'ok' });
}

export function readyHandler(_req: Request, res: Response) {
  const mongoOk = isDatabaseReady();
  const checks = {
    mongo: mongoOk ? 'ok' : 'down',
    redis: env.REDIS_ENABLED ? 'ok' : 'disabled',
  };
  const ready = mongoOk;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready', checks });
}
