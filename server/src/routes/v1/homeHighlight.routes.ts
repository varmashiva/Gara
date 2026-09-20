import { Router } from 'express';
import * as homeHighlightController from '../../controllers/homeHighlight.controller';
import { asyncHandler } from '../../utils/asyncHandler';

export const homeHighlightRouter = Router();

homeHighlightRouter.get('/', asyncHandler(homeHighlightController.getHandler));
