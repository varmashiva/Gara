import { Router } from 'express';
import * as sellerController from '../../controllers/seller.controller';
import * as pickupLocationController from '../../controllers/pickupLocation.controller';
import * as productController from '../../controllers/product.controller';
import * as fulfillmentController from '../../controllers/fulfillment.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { sellerApplicationSchema, pickupLocationSchema, pickupLocationUpdateSchema } from '../../schemas/seller.schema';
import { createProductSchema, updateProductSchema } from '../../schemas/product.schema';
import { updateFulfillmentStatusSchema } from '../../schemas/fulfillment.schema';
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

sellerRouter.use('/products', requireAuth(), requireRole('SELLER'));
sellerRouter.get('/products', asyncHandler(productController.listMineHandler));
sellerRouter.post('/products', validateBody(createProductSchema), asyncHandler(productController.createHandler));
sellerRouter.patch(
  '/products/:id',
  validateBody(updateProductSchema),
  asyncHandler(productController.updateHandler)
);
sellerRouter.post('/products/:id/submit', asyncHandler(productController.submitForReviewHandler));
sellerRouter.post('/products/:id/deactivate', asyncHandler(productController.deactivateHandler));
sellerRouter.post('/products/:id/reactivate', asyncHandler(productController.reactivateHandler));
sellerRouter.delete('/products/:id', asyncHandler(productController.deleteHandler));

sellerRouter.use('/fulfillments', requireAuth(), requireRole('SELLER'));
sellerRouter.get('/fulfillments', asyncHandler(fulfillmentController.listMineHandler));
sellerRouter.get('/fulfillments/:id', asyncHandler(fulfillmentController.getHandler));
sellerRouter.patch(
  '/fulfillments/:id/status',
  validateBody(updateFulfillmentStatusSchema),
  asyncHandler(fulfillmentController.updateStatusHandler)
);
