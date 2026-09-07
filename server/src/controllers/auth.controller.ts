import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
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

export async function registerHandler(req: Request, res: Response) {
  const { accessToken, refreshToken, user } = await authService.register(req.body);
  setRefreshCookie(res, refreshToken);
  return sendSuccess(res, { user, accessToken }, 201);
}

export async function loginHandler(req: Request, res: Response) {
  const { accessToken, refreshToken, user } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  return sendSuccess(res, { user, accessToken });
}

export async function refreshHandler(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw AppError.unauthorized('No refresh token provided', 'NO_REFRESH_TOKEN');

  const { accessToken, refreshToken, user } = await authService.refresh(token);
  setRefreshCookie(res, refreshToken);
  return sendSuccess(res, { user, accessToken });
}

export async function logoutHandler(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  return sendSuccess(res, { loggedOut: true });
}

export async function meHandler(req: Request, res: Response) {
  const user = await authService.getMe(req.user!.sub);
  return sendSuccess(res, user);
}
