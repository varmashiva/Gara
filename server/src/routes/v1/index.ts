import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from './auth.routes';

export const v1Router = Router();

v1Router.use(healthRouter);
v1Router.use('/auth', authRouter);
