import { Router } from 'express';
import * as couponController from '../../controllers/coupon.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { previewCouponSchema } from '../../schemas/coupon.schema';
import { asyncHandler } from '../../utils/asyncHandler';

export const couponRouter = Router();

couponRouter.post(
  '/preview',
  requireAuth(),
  validateBody(previewCouponSchema),
  asyncHandler(couponController.previewHandler)
);
