import { Request, Response } from 'express';
import * as returnService from '../services/returnRequest.service';
import { sendSuccess } from '../utils/response';

export async function createHandler(req: Request, res: Response) {
  const returnRequest = await returnService.requestReturn(req.user!.sub, req.body);
  return sendSuccess(res, returnRequest, 201);
}

export async function listMineHandler(req: Request, res: Response) {
  const returns = await returnService.listMyReturns(req.user!.sub);
  return sendSuccess(res, returns);
}

export async function listForAdminHandler(_req: Request, res: Response) {
  const returns = await returnService.listAllReturnsForAdmin();
  return sendSuccess(res, returns);
}

export async function decideHandler(req: Request, res: Response) {
  const returnRequest = await returnService.decideReturn(
    req.params.id,
    req.user!.sub,
    req.body.decision,
    req.body.notes
  );
  return sendSuccess(res, returnRequest);
}
