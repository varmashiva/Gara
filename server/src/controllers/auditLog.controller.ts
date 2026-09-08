import { Request, Response } from 'express';
import { AuditLog } from '../models/AuditLog';
import { sendSuccess } from '../utils/response';

export async function listHandler(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};
  if (req.query.entityType) filter.entityType = req.query.entityType;
  if (req.query.actorId) filter.actorId = req.query.actorId;

  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(200);
  return sendSuccess(res, logs);
}
