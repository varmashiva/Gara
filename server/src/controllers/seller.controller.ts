import { Request, Response } from 'express';
import * as sellerService from '../services/seller.service';
import { sendSuccess } from '../utils/response';

export async function applyHandler(req: Request, res: Response) {
  const result = await sellerService.applyToBecomeSeller(req.user!.sub, req.body);
  return sendSuccess(res, result, 201);
}

export async function myStatusHandler(req: Request, res: Response) {
  const result = await sellerService.getMySellerStatus(req.user!.sub);
  return sendSuccess(res, result);
}

export async function listApplicationsHandler(req: Request, res: Response) {
  const status = req.query.status as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined;
  const applications = await sellerService.listApplications(status);
  return sendSuccess(res, applications);
}

export async function decideApplicationHandler(req: Request, res: Response) {
  const result = await sellerService.decideApplication(req.params.id, req.user!.sub, req.body);
  return sendSuccess(res, result);
}

export async function suspendSellerHandler(req: Request, res: Response) {
  const seller = await sellerService.suspendSeller(req.params.id);
  return sendSuccess(res, seller);
}
