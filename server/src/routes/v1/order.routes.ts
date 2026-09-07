import { Router } from 'express';
import * as orderController from '../../controllers/order.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { createOrderSchema } from '../../schemas/order.schema';
import { asyncHandler } from '../../utils/asyncHandler';

export const orderRouter = Router();

orderRouter.use(requireAuth());

orderRouter.post('/', validateBody(createOrderSchema), asyncHandler(orderController.createHandler));
orderRouter.get('/', asyncHandler(orderController.listHandler));
orderRouter.get('/:id', asyncHandler(orderController.getHandler));
orderRouter.post('/:id/cancel', asyncHandler(orderController.cancelHandler));
