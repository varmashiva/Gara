import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../../controllers/auth.controller';
import { validateBody } from '../../middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../schemas/auth.schema';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireCsrfToken } from '../../middleware/csrf.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

export const authRouter = Router();

// Only credential-guessing-sensitive endpoints get the tight limiter.
// /me and /refresh are called on every page load/401 and must not share it.
const credentialLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });
// Password reset is a smaller, higher-value brute-force/enumeration target
// than login — a tighter budget than even the general credential limiter.
const passwordResetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5 });

authRouter.post(
  '/register',
  credentialLimiter,
  validateBody(registerSchema),
  asyncHandler(authController.registerHandler)
);
authRouter.post('/login', credentialLimiter, validateBody(loginSchema), asyncHandler(authController.loginHandler));
authRouter.post(
  '/google',
  credentialLimiter,
  validateBody(googleLoginSchema),
  asyncHandler(authController.googleLoginHandler)
);
authRouter.post(
  '/forgot-password',
  passwordResetLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(authController.forgotPasswordHandler)
);
authRouter.post(
  '/reset-password',
  passwordResetLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(authController.resetPasswordHandler)
);
// Cookie-only-authenticated (no Bearer token involved) — these are exactly
// the CSRF-exposed surface requireCsrfToken() exists for.
authRouter.post('/refresh', requireCsrfToken(), asyncHandler(authController.refreshHandler));
authRouter.post('/logout', requireCsrfToken(), asyncHandler(authController.logoutHandler));
authRouter.get('/me', requireAuth(), asyncHandler(authController.meHandler));
