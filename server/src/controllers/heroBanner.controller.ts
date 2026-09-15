import { Request, Response } from 'express';
import * as heroBannerService from '../services/heroBanner.service';
import { sendSuccess } from '../utils/response';

export async function getHandler(_req: Request, res: Response) {
  const hero = await heroBannerService.getHeroBanner();
  return sendSuccess(res, hero);
}

export async function updateHandler(req: Request, res: Response) {
  const hero = await heroBannerService.updateHeroBanner(req.user!.sub, req.body);
  return sendSuccess(res, hero);
}

export async function updateImageHandler(req: Request, res: Response) {
  const hero = await heroBannerService.updateHeroBannerImage(req.user!.sub, req.file!);
  return sendSuccess(res, hero);
}

export async function removeImageHandler(req: Request, res: Response) {
  const hero = await heroBannerService.removeHeroBannerImage(req.user!.sub);
  return sendSuccess(res, hero);
}
