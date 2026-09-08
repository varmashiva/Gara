import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { sendSuccess } from '../utils/response';

export async function listHandler(req: Request, res: Response) {
  const users = await userService.listUsers(req.query.search as string | undefined);
  return sendSuccess(res, users);
}

export async function setStatusHandler(req: Request, res: Response) {
  const result = await userService.setUserStatus(req.user!.sub, req.params.id, req.body.status);
  return sendSuccess(res, result);
}
