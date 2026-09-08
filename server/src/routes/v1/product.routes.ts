import { Router } from 'express';
import * as productController from '../../controllers/product.controller';
import * as reviewController from '../../controllers/review.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validateBody, validateQuery } from '../../middleware/validation.middleware';
import { createProductSchema, updateProductSchema, productQuerySchema } from '../../schemas/product.schema';
import { asyncHandler } from '../../utils/asyncHandler';

export const productRouter = Router();

// Public discovery
productRouter.get('/', validateQuery(productQuerySchema), asyncHandler(productController.listPublicHandler));
productRouter.get('/:id', asyncHandler(productController.getPublicHandler));
productRouter.get('/:productId/reviews', asyncHandler(reviewController.listForProductHandler));
