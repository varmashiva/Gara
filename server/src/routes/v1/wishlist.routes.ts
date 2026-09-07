import { Router } from 'express';
import * as wishlistController from '../../controllers/wishlist.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { addWishlistItemSchema, moveToCartSchema } from '../../schemas/wishlist.schema';
import { asyncHandler } from '../../utils/asyncHandler';

export const wishlistRouter = Router();

wishlistRouter.use(requireAuth());

wishlistRouter.get('/', asyncHandler(wishlistController.getHandler));
wishlistRouter.post('/items', validateBody(addWishlistItemSchema), asyncHandler(wishlistController.addHandler));
wishlistRouter.delete('/items/:productId', asyncHandler(wishlistController.removeHandler));
wishlistRouter.post(
  '/items/:productId/move-to-cart',
  validateBody(moveToCartSchema),
  asyncHandler(wishlistController.moveToCartHandler)
);
