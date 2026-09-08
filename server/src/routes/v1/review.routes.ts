import { Router } from 'express';
import * as reviewController from '../../controllers/review.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validation.middleware';
import { createReviewSchema } from '../../schemas/review.schema';
import { asyncHandler } from '../../utils/asyncHandler';

export const reviewRouter = Router();

reviewRouter.post('/', requireAuth(), validateBody(createReviewSchema), asyncHandler(reviewController.createHandler));
