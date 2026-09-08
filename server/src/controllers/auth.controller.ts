import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { mergeGuestCartIntoUser } from '../services/cart.service';
import { GUEST_CART_COOKIE } from '../middleware/cart.middleware';
import { setCsrfCookie } from '../middleware/csrf.middleware';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/errors';

const REFRESH_COOKIE = 'refreshToken';
const isProd = process.env.NODE_ENV === 'production';

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}

async function mergeGuestCartIfPresent(req: Request, userId: string) {
  const guestToken = req.cookies?.[GUEST_CART_COOKIE];
  if (guestToken) {
    await mergeGuestCartIntoUser(guestToken, userId);
  }
}

export async function registerHandler(req: Request, res: Response) {
  const { accessToken, refreshToken, user } = await authService.register(req.body);
  await mergeGuestCartIfPresent(req, user.id);
  setRefreshCookie(res, refreshToken);
  setCsrfCookie(res);
  res.clearCookie(GUEST_CART_COOKIE);
  return sendSuccess(res, { user, accessToken }, 201);
}

export async function loginHandler(req: Request, res: Response) {
  const { accessToken, refreshToken, user } = await authService.login(req.body, req.ip);
  await mergeGuestCartIfPresent(req, user.id);
  setRefreshCookie(res, refreshToken);
  setCsrfCookie(res);
  res.clearCookie(GUEST_CART_COOKIE);
  return sendSuccess(res, { user, accessToken });
}

export async function googleLoginHandler(req: Request, res: Response) {
  const { accessToken, refreshToken, user } = await authService.loginWithGoogle(req.body.idToken);
  await mergeGuestCartIfPresent(req, user.id);
  setRefreshCookie(res, refreshToken);
  setCsrfCookie(res);
  res.clearCookie(GUEST_CART_COOKIE);
  return sendSuccess(res, { user, accessToken });
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  await authService.requestPasswordReset(req.body.email);
  // Always the same response whether or not the email exists — see
  // requestPasswordReset's own comment for why.
  return sendSuccess(res, { message: 'If that email exists, a reset link has been sent.' });
}

export async function resetPasswordHandler(req: Request, res: Response) {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  return sendSuccess(res, { reset: true });
}

export async function refreshHandler(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw AppError.unauthorized('No refresh token provided', 'NO_REFRESH_TOKEN');

  const { accessToken, refreshToken, user } = await authService.refresh(token);
  setRefreshCookie(res, refreshToken);
  setCsrfCookie(res);
  return sendSuccess(res, { user, accessToken });
}

export async function logoutHandler(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  res.clearCookie('csrfToken', { path: '/' });
  return sendSuccess(res, { loggedOut: true });
}

export async function meHandler(req: Request, res: Response) {
  const user = await authService.getMe(req.user!.sub);
  return sendSuccess(res, user);
}
