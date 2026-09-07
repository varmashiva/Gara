import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

const GUEST_CART_COOKIE = 'guestCartToken';
const isProd = process.env.NODE_ENV === 'production';

export type CartOwner = { userId: string } | { guestToken: string };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      cartOwner?: CartOwner;
    }
  }
}

/**
 * Resolves who a cart belongs to. Requires optionalAuth() to have run first
 * so req.user is populated for logged-in requests. Guests get an opaque
 * random token in an HttpOnly cookie — no PII, just enough to find their
 * cart again on the next request.
 */
export function resolveCartOwner() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
      req.cartOwner = { userId: req.user.sub };
      return next();
    }

    let guestToken = req.cookies?.[GUEST_CART_COOKIE];
    if (!guestToken) {
      guestToken = randomUUID();
      res.cookie(GUEST_CART_COOKIE, guestToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }
    req.cartOwner = { guestToken };
    next();
  };
}

export { GUEST_CART_COOKIE };
