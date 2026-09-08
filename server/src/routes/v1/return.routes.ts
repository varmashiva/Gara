import { Router } from 'express';
import * as returnController from '../../controllers/returnRequest.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { createReturnRequestSchema } from '../../schemas/returnRequest.schema';
import { asyncHandler } from '../../utils/asyncHandler';

export const returnRouter = Router();

returnRouter.use(requireAuth());
returnRouter.post('/', validateBody(createReturnRequestSchema), asyncHandler(returnController.createHandler));
returnRouter.get('/', asyncHandler(returnController.listMineHandler));
