import { Router } from 'express';
import * as addressController from '../../controllers/address.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { addressSchema, addressUpdateSchema } from '../../schemas/address.schema';
import { asyncHandler } from '../../utils/asyncHandler';

export const addressRouter = Router();

addressRouter.use(requireAuth());

addressRouter.get('/', asyncHandler(addressController.listHandler));
addressRouter.post('/', validateBody(addressSchema), asyncHandler(addressController.createHandler));
addressRouter.patch('/:id', validateBody(addressUpdateSchema), asyncHandler(addressController.updateHandler));
addressRouter.delete('/:id', asyncHandler(addressController.deleteHandler));
addressRouter.patch('/:id/default', asyncHandler(addressController.setDefaultHandler));
