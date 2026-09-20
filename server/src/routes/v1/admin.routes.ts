import { NextFunction, Request, Response, Router } from 'express';
import * as productController from '../../controllers/product.controller';
import * as heroBannerController from '../../controllers/heroBanner.controller';
import * as homeHighlightController from '../../controllers/homeHighlight.controller';
import * as categoryController from '../../controllers/category.controller';
import * as fulfillmentController from '../../controllers/fulfillment.controller';
import * as earningsController from '../../controllers/earnings.controller';
import * as pickupLocationController from '../../controllers/pickupLocation.controller';
import * as settlementController from '../../controllers/settlement.controller';
import * as reviewController from '../../controllers/review.controller';
import * as couponController from '../../controllers/coupon.controller';
import * as returnController from '../../controllers/returnRequest.controller';
import * as orderController from '../../controllers/order.controller';
import * as userController from '../../controllers/user.controller';
import * as auditLogController from '../../controllers/auditLog.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { uploadSingleImage } from '../../middleware/upload.middleware';
import { createProductSchema, updateProductSchema, productStatusDecisionSchema } from '../../schemas/product.schema';
import { updateHeroBannerSchema } from '../../schemas/heroBanner.schema';
import { updateHomeHighlightSchema } from '../../schemas/homeHighlight.schema';
import { pickupLocationSchema, pickupLocationUpdateSchema } from '../../schemas/seller.schema';
import { updateFulfillmentStatusSchema } from '../../schemas/fulfillment.schema';
import { markPayoutStatusSchema } from '../../schemas/settlement.schema';
import { moderateReviewSchema } from '../../schemas/review.schema';
import { createCouponSchema, updateCouponSchema } from '../../schemas/coupon.schema';
import { decideReturnSchema } from '../../schemas/returnRequest.schema';
import { setUserStatusSchema } from '../../schemas/user.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { getOrCreateHouseSeller } from '../../services/seller.service';

export const adminRouter = Router();

adminRouter.use(requireAuth(), requireRole('ADMIN'));

/**
 * Gara has no independent sellers — the admin manages the single product
 * catalog directly, and product/fulfillment/earnings/pickup-location records
 * still key off a `Seller` document under the hood (see seller.service.ts).
 * This lazily provisions that one-per-admin "house" Seller before any of the
 * routes below that reuse the original seller-scoped controllers.
 */
async function ensureHouseSeller(req: Request, _res: Response, next: NextFunction) {
  await getOrCreateHouseSeller(req.user!.sub);
  next();
}

adminRouter.get('/audit-logs', asyncHandler(auditLogController.listHandler));

adminRouter.get('/orders/summary', asyncHandler(orderController.adminSummaryHandler));
adminRouter.get('/orders', asyncHandler(orderController.adminListHandler));
adminRouter.get('/orders/:id', asyncHandler(orderController.adminGetHandler));

adminRouter.get('/hero', asyncHandler(heroBannerController.getHandler));
adminRouter.patch('/hero', validateBody(updateHeroBannerSchema), asyncHandler(heroBannerController.updateHandler));
adminRouter.post(
  '/hero/image',
  uploadSingleImage('image'),
  asyncHandler(heroBannerController.updateImageHandler)
);
adminRouter.delete('/hero/image', asyncHandler(heroBannerController.removeImageHandler));

adminRouter.get('/home-highlights', asyncHandler(homeHighlightController.getHandler));
adminRouter.patch(
  '/home-highlights',
  validateBody(updateHomeHighlightSchema),
  asyncHandler(homeHighlightController.updateHandler)
);

adminRouter.get('/categories', asyncHandler(categoryController.adminListHandler));

adminRouter.get('/users', asyncHandler(userController.listHandler));
adminRouter.patch(
  '/users/:id/status',
  validateBody(setUserStatusSchema),
  asyncHandler(userController.setStatusHandler)
);

adminRouter.get('/products', asyncHandler(productController.listForModerationHandler));
adminRouter.post(
  '/products',
  asyncHandler(ensureHouseSeller),
  validateBody(createProductSchema),
  asyncHandler(productController.adminCreateHandler)
);
adminRouter.patch(
  '/products/:id/status',
  validateBody(productStatusDecisionSchema),
  asyncHandler(productController.decideStatusHandler)
);
adminRouter.patch(
  '/products/:id',
  validateBody(updateProductSchema),
  asyncHandler(productController.adminUpdateHandler)
);
adminRouter.delete('/products/:id', asyncHandler(productController.adminDeleteHandler));
adminRouter.post(
  '/products/:id/images',
  uploadSingleImage('image'),
  asyncHandler(productController.addImageHandler)
);
adminRouter.delete('/products/:id/images/:publicId', asyncHandler(productController.removeImageHandler));

adminRouter.get('/pickup-locations', asyncHandler(ensureHouseSeller), asyncHandler(pickupLocationController.listHandler));
adminRouter.post(
  '/pickup-locations',
  asyncHandler(ensureHouseSeller),
  validateBody(pickupLocationSchema),
  asyncHandler(pickupLocationController.createHandler)
);
adminRouter.patch(
  '/pickup-locations/:id',
  validateBody(pickupLocationUpdateSchema),
  asyncHandler(pickupLocationController.updateHandler)
);
adminRouter.delete('/pickup-locations/:id', asyncHandler(pickupLocationController.deleteHandler));

adminRouter.get('/fulfillments', asyncHandler(ensureHouseSeller), asyncHandler(fulfillmentController.listMineHandler));
adminRouter.get('/fulfillments/:id', asyncHandler(fulfillmentController.getHandler));
adminRouter.patch(
  '/fulfillments/:id/status',
  validateBody(updateFulfillmentStatusSchema),
  asyncHandler(fulfillmentController.updateStatusHandler)
);

adminRouter.get('/earnings', asyncHandler(ensureHouseSeller), asyncHandler(earningsController.listMineHandler));
adminRouter.get('/earnings/summary', asyncHandler(ensureHouseSeller), asyncHandler(earningsController.summaryHandler));

adminRouter.get('/settlements', asyncHandler(settlementController.listHandler));
adminRouter.post('/settlements', asyncHandler(settlementController.createHandler));
adminRouter.post('/settlements/:id/finalize', asyncHandler(settlementController.finalizeHandler));
adminRouter.post('/settlements/:id/payout', asyncHandler(settlementController.createPayoutHandler));

adminRouter.get('/reviews', asyncHandler(reviewController.listForAdminHandler));
adminRouter.patch(
  '/reviews/:id',
  validateBody(moderateReviewSchema),
  asyncHandler(reviewController.moderateHandler)
);

adminRouter.get('/coupons', asyncHandler(couponController.listHandler));
adminRouter.post('/coupons', validateBody(createCouponSchema), asyncHandler(couponController.createHandler));
adminRouter.patch('/coupons/:id', validateBody(updateCouponSchema), asyncHandler(couponController.updateHandler));

adminRouter.get('/returns', asyncHandler(returnController.listForAdminHandler));
adminRouter.patch('/returns/:id/decision', validateBody(decideReturnSchema), asyncHandler(returnController.decideHandler));

adminRouter.get('/payouts', asyncHandler(settlementController.listPayoutsHandler));
adminRouter.patch(
  '/payouts/:id',
  validateBody(markPayoutStatusSchema),
  asyncHandler(settlementController.markPayoutStatusHandler)
);
