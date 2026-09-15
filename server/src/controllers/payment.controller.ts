import { Request, Response } from 'express';
import * as paymentService from '../services/payment.service';
import { webhookSchema } from '../schemas/payment.schema';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export async function createPaymentOrderHandler(req: Request, res: Response) {
  const result = await paymentService.createPaymentOrder(req.user!.sub, req.body.orderId);
  return sendSuccess(res, result, 201);
}

// Branches on the live provider mode rather than request shape, since a
// real Razorpay payload and the mock/client-side payload can't be told
// apart reliably by content alone. Body validation happens here (not via
// the validateBody middleware on the route) because the two branches need
// two entirely different schemas — a real Razorpay envelope would always
// fail the strict mock-shaped schema.
export async function webhookHandler(req: Request, res: Response) {
  if (env.PAYMENT_PROVIDER_MODE === 'real') {
    const signature = req.header('x-razorpay-signature') ?? '';
    if (!req.rawBody) {
      throw AppError.badRequest('Missing raw request body for webhook verification', 'MISSING_RAW_BODY');
    }
    const result = await paymentService.handleRazorpayWebhook(req.rawBody, signature, req.body);
    return sendSuccess(res, result);
  }

  const payload = webhookSchema.parse(req.body);
  const result = await paymentService.handleWebhook(payload);
  return sendSuccess(res, result);
}

export async function mockCompleteHandler(req: Request, res: Response) {
  const result = await paymentService.simulateGatewayWebhook(req.params.providerOrderId, req.body.status);
  return sendSuccess(res, result);
}
