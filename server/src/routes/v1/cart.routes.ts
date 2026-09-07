import { Router } from 'express';
import * as cartController from '../../controllers/cart.controller';
import { optionalAuth } from '../../middleware/auth.middleware';
import { resolveCartOwner } from '../../middleware/cart.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { addCartItemSchema, updateCartItemSchema } from '../../schemas/cart.schema';
import { asyncHandler } from '../../utils/asyncHandler';

export const cartRouter = Router();

cartRouter.use(optionalAuth(), resolveCartOwner());

cartRouter.get('/', asyncHandler(cartController.getCartHandler));
cartRouter.post('/items', validateBody(addCartItemSchema), asyncHandler(cartController.addItemHandler));
cartRouter.patch('/items/:itemId', validateBody(updateCartItemSchema), asyncHandler(cartController.updateItemHandler));
cartRouter.delete('/items/:itemId', asyncHandler(cartController.removeItemHandler));
cartRouter.delete('/', asyncHandler(cartController.clearCartHandler));
