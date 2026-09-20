import { Request, Response } from 'express';
import * as homeHighlightService from '../services/homeHighlight.service';
import { sendSuccess } from '../utils/response';

export async function getHandler(_req: Request, res: Response) {
  const highlight = await homeHighlightService.getHomeHighlight();
  return sendSuccess(res, highlight);
}

export async function updateHandler(req: Request, res: Response) {
  const highlight = await homeHighlightService.updateHomeHighlight(req.user!.sub, req.body);
  return sendSuccess(res, highlight);
}
