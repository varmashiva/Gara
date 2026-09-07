import { Router } from 'express';
import * as sellerController from '../../controllers/seller.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { applicationDecisionSchema } from '../../schemas/seller.schema';
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
