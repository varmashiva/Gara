import { Router } from 'express';
import * as sellerController from '../../controllers/seller.controller';
import * as pickupLocationController from '../../controllers/pickupLocation.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { sellerApplicationSchema, pickupLocationSchema, pickupLocationUpdateSchema } from '../../schemas/seller.schema';
import { asyncHandler } from '../../utils/asyncHandler';

export const sellerRouter = Router();

sellerRouter.post(
  '/apply',
  requireAuth(),
  requireRole('CUSTOMER'),
  validateBody(sellerApplicationSchema),
  asyncHandler(sellerController.applyHandler)
);

sellerRouter.get('/me/status', requireAuth(), asyncHandler(sellerController.myStatusHandler));

sellerRouter.get(
  '/pickup-locations',
  requireAuth(),
  requireRole('SELLER'),
  asyncHandler(pickupLocationController.listHandler)
);
sellerRouter.post(
  '/pickup-locations',
  requireAuth(),
  requireRole('SELLER'),
  validateBody(pickupLocationSchema),
  asyncHandler(pickupLocationController.createHandler)
);
sellerRouter.patch(
  '/pickup-locations/:id',
  requireAuth(),
  requireRole('SELLER'),
  validateBody(pickupLocationUpdateSchema),
  asyncHandler(pickupLocationController.updateHandler)
);
sellerRouter.delete(
  '/pickup-locations/:id',
  requireAuth(),
  requireRole('SELLER'),
  asyncHandler(pickupLocationController.deleteHandler)
);
