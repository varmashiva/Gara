import { Router } from 'express';
import * as shipmentController from '../../controllers/shipment.controller';
import { validateBody } from '../../middleware/validation.middleware';
import { shipmentWebhookSchema, mockShipmentCompleteSchema } from '../../schemas/shipment.schema';
import { asyncHandler } from '../../utils/asyncHandler';

export const shipmentRouter = Router();

// No requireAuth() — this is the courier/aggregator calling us. Trust comes
// from verifyWebhookSignature inside handleShipmentWebhook.
shipmentRouter.post('/webhook', validateBody(shipmentWebhookSchema), asyncHandler(shipmentController.webhookHandler));

// Dev/test only — simulateCourierWebhook refuses to run outside
// SHIPPING_PROVIDER_MODE=mock.
shipmentRouter.post(
  '/mock/:externalShipmentId/complete',
  validateBody(mockShipmentCompleteSchema),
  asyncHandler(shipmentController.mockCompleteHandler)
);
