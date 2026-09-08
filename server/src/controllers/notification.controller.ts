import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';
import { sendSuccess } from '../utils/response';

export async function listHandler(req: Request, res: Response) {
  const notifications = await notificationService.listMyNotifications(req.user!.sub);
  return sendSuccess(res, notifications);
}

export async function markReadHandler(req: Request, res: Response) {
  await notificationService.markNotificationRead(req.user!.sub, req.params.id);
  return sendSuccess(res, { read: true });
}

export async function markAllReadHandler(req: Request, res: Response) {
  await notificationService.markAllRead(req.user!.sub);
  return sendSuccess(res, { read: true });
}
