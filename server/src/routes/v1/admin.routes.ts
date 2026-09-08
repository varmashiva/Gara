import { Router } from 'express';
import * as sellerController from '../../controllers/seller.controller';
import * as productController from '../../controllers/product.controller';
import * as settlementController from '../../controllers/settlement.controller';
import * as reviewController from '../../controllers/review.controller';
import * as couponController from '../../controllers/coupon.controller';
import * as returnController from '../../controllers/returnRequest.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { applicationDecisionSchema } from '../../schemas/seller.schema';
import { productStatusDecisionSchema } from '../../schemas/product.schema';
import { createSettlementSchema, markPayoutStatusSchema } from '../../schemas/settlement.schema';
import { moderateReviewSchema } from '../../schemas/review.schema';
import { createCouponSchema, updateCouponSchema } from '../../schemas/coupon.schema';
import { decideReturnSchema } from '../../schemas/returnRequest.schema';
import { asyncHandler } from '../../utils/asyncHandler';

export const adminRouter = Router();

adminRouter.use(requireAuth(), requireRole('ADMIN'));

adminRouter.get('/sellers/applications', asyncHandler(sellerController.listApplicationsHandler));
adminRouter.patch(
  '/sellers/applications/:id',
  validateBody(applicationDecisionSchema),
  asyncHandler(sellerController.decideApplicationHandler)
);
adminRouter.patch('/sellers/:id/suspend', asyncHandler(sellerController.suspendSellerHandler));
adminRouter.get('/sellers', asyncHandler(sellerController.listApprovedSellersHandler));

adminRouter.get('/products', asyncHandler(productController.listForModerationHandler));
adminRouter.patch(
  '/products/:id/status',
  validateBody(productStatusDecisionSchema),
  asyncHandler(productController.decideStatusHandler)
);

adminRouter.get('/settlements', asyncHandler(settlementController.listHandler));
adminRouter.post(
  '/settlements',
  validateBody(createSettlementSchema),
  asyncHandler(settlementController.createHandler)
);
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
