import { Request, Response } from 'express';
import * as fulfillmentService from '../services/sellerFulfillment.service';
import { sendSuccess } from '../utils/response';
import { SellerFulfillmentStatus } from '../models/SellerFulfillment';

export async function listMineHandler(req: Request, res: Response) {
  const status = req.query.status as SellerFulfillmentStatus | undefined;
  const fulfillments = await fulfillmentService.listMyFulfillments(req.user!.sub, status);
  return sendSuccess(res, fulfillments);
}

export async function getHandler(req: Request, res: Response) {
  const fulfillment = await fulfillmentService.getMyFulfillment(req.user!.sub, req.params.id);
  return sendSuccess(res, fulfillment);
}

export async function updateStatusHandler(req: Request, res: Response) {
  const fulfillment = await fulfillmentService.updateFulfillmentStatus(
    req.user!.sub,
    req.params.id,
    req.body.status
  );
  return sendSuccess(res, fulfillment);
}
