import { Router } from 'express';
import * as paymentController from '../../controllers/payment.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { createPaymentOrderSchema, webhookSchema, mockCompleteSchema } from '../../schemas/payment.schema';
import { asyncHandler } from '../../utils/asyncHandler';

export const paymentRouter = Router();

paymentRouter.post(
  '/create-order',
  requireAuth(),
  validateBody(createPaymentOrderSchema),
  asyncHandler(paymentController.createPaymentOrderHandler)
);

// No requireAuth() — this is the gateway calling us, not a logged-in user.
// Trust is established by signature verification inside handleWebhook, not
// by a session.
paymentRouter.post('/webhook', validateBody(webhookSchema), asyncHandler(paymentController.webhookHandler));

// Dev/test only — simulateGatewayWebhook itself refuses to run outside
// PAYMENT_PROVIDER_MODE=mock, this is just the HTTP entry point to it.
paymentRouter.post(
  '/mock/:providerOrderId/complete',
  validateBody(mockCompleteSchema),
  asyncHandler(paymentController.mockCompleteHandler)
);
