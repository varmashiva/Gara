import { Request, Response } from 'express';
import * as shippingService from '../services/shipping.service';
import { sendSuccess } from '../utils/response';

export async function webhookHandler(req: Request, res: Response) {
  const result = await shippingService.handleShipmentWebhook(req.body);
  return sendSuccess(res, result);
}

export async function mockCompleteHandler(req: Request, res: Response) {
  const result = await shippingService.simulateCourierWebhook(req.params.externalShipmentId, req.body.status);
  return sendSuccess(res, result);
}
