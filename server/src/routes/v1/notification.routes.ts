import { Router } from 'express';
import * as notificationController from '../../controllers/notification.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

export const notificationRouter = Router();

notificationRouter.use(requireAuth());
notificationRouter.get('/', asyncHandler(notificationController.listHandler));
notificationRouter.patch('/:id/read', asyncHandler(notificationController.markReadHandler));
notificationRouter.post('/read-all', asyncHandler(notificationController.markAllReadHandler));
