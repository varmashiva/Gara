import { Router } from 'express';
import * as shipmentController from '../../controllers/shipment.controller';
import { validateBody } from '../../middleware/validation.middleware';
import { shiprocketWebhookSchema, mockShipmentCompleteSchema } from '../../schemas/shipment.schema';
import { asyncHandler } from '../../utils/asyncHandler';

export const shipmentRouter = Router();

// No requireAuth() — this is Shiprocket calling us. Trust comes from the
// x-api-key token check inside handleShiprocketWebhook. Register this URL
// (https://<api-host>/api/v1/shipments/webhook) in Shiprocket under
// Settings > API > Webhooks, with SHIPROCKET_WEBHOOK_SECRET as the token.
shipmentRouter.post('/webhook', validateBody(shiprocketWebhookSchema), asyncHandler(shipmentController.webhookHandler));

// Dev/test only — simulateCourierWebhook refuses to run outside
// SHIPPING_PROVIDER_MODE=mock.
shipmentRouter.post(
  '/mock/:externalShipmentId/complete',
  validateBody(mockShipmentCompleteSchema),
  asyncHandler(shipmentController.mockCompleteHandler)
);
