import { Request, Response } from 'express';
import * as paymentService from '../services/payment.service';
import { sendSuccess } from '../utils/response';

export async function createPaymentOrderHandler(req: Request, res: Response) {
  const result = await paymentService.createPaymentOrder(req.user!.sub, req.body.orderId);
  return sendSuccess(res, result, 201);
}

export async function webhookHandler(req: Request, res: Response) {
  const result = await paymentService.handleWebhook(req.body);
  return sendSuccess(res, result);
}

export async function mockCompleteHandler(req: Request, res: Response) {
  const result = await paymentService.simulateGatewayWebhook(req.params.providerOrderId, req.body.status);
  return sendSuccess(res, result);
}
