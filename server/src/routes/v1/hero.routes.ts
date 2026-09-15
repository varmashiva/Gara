import { Router } from 'express';
import * as heroBannerController from '../../controllers/heroBanner.controller';
import { asyncHandler } from '../../utils/asyncHandler';

export const heroRouter = Router();

heroRouter.get('/', asyncHandler(heroBannerController.getHandler));
