import { Router } from 'express';
import * as categoryController from '../../controllers/category.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { createCategorySchema, updateCategorySchema } from '../../schemas/category.schema';
import { asyncHandler } from '../../utils/asyncHandler';

export const categoryRouter = Router();

categoryRouter.get('/', asyncHandler(categoryController.listHandler));

categoryRouter.post(
  '/',
  requireAuth(),
  requireRole('ADMIN'),
  validateBody(createCategorySchema),
  asyncHandler(categoryController.createHandler)
);
categoryRouter.patch(
  '/:id',
  requireAuth(),
  requireRole('ADMIN'),
  validateBody(updateCategorySchema),
  asyncHandler(categoryController.updateHandler)
);
categoryRouter.delete('/:id', requireAuth(), requireRole('ADMIN'), asyncHandler(categoryController.deleteHandler));
