import { Router } from 'express';
import { healthHandler, readyHandler } from '../../controllers/health.controller';

export const healthRouter = Router();

healthRouter.get('/health', healthHandler);
healthRouter.get('/ready', readyHandler);
