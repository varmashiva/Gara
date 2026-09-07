import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../../controllers/auth.controller';
import { validateBody } from '../../middleware/validation.middleware';
import { registerSchema, loginSchema } from '../../schemas/auth.schema';
import { requireAuth } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

export const authRouter = Router();

// Only credential-guessing-sensitive endpoints get the tight limiter.
// /me and /refresh are called on every page load/401 and must not share it.
const credentialLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });

authRouter.post(
  '/register',
  credentialLimiter,
  validateBody(registerSchema),
  asyncHandler(authController.registerHandler)
);
authRouter.post('/login', credentialLimiter, validateBody(loginSchema), asyncHandler(authController.loginHandler));
authRouter.post('/refresh', asyncHandler(authController.refreshHandler));
authRouter.post('/logout', asyncHandler(authController.logoutHandler));
authRouter.get('/me', requireAuth(), asyncHandler(authController.meHandler));
