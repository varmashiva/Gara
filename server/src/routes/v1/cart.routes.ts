import { Router } from 'express';
import * as cartController from '../../controllers/cart.controller';
import { optionalAuth } from '../../middleware/auth.middleware';
import { resolveCartOwner } from '../../middleware/cart.middleware';
import { requireCsrfToken } from '../../middleware/csrf.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { addCartItemSchema, updateCartItemSchema } from '../../schemas/cart.schema';
import { asyncHandler } from '../../utils/asyncHandler';

export const cartRouter = Router();

cartRouter.use(optionalAuth(), resolveCartOwner());

cartRouter.get('/', asyncHandler(cartController.getCartHandler));
// requireCsrfToken() only actually enforces anything for guests here — a
// logged-in request already carries a Bearer token, which the check exempts.
cartRouter.post(
  '/items',
  requireCsrfToken(),
  validateBody(addCartItemSchema),
  asyncHandler(cartController.addItemHandler)
);
cartRouter.patch(
  '/items/:itemId',
  requireCsrfToken(),
  validateBody(updateCartItemSchema),
  asyncHandler(cartController.updateItemHandler)
);
cartRouter.delete('/items/:itemId', requireCsrfToken(), asyncHandler(cartController.removeItemHandler));
cartRouter.delete('/', requireCsrfToken(), asyncHandler(cartController.clearCartHandler));
