import { Request, Response } from 'express';
import * as wishlistService from '../services/wishlist.service';
import { sendSuccess } from '../utils/response';

export async function getHandler(req: Request, res: Response) {
  const wishlist = await wishlistService.getWishlist(req.user!.sub);
  return sendSuccess(res, wishlist);
}

export async function addHandler(req: Request, res: Response) {
  const wishlist = await wishlistService.addToWishlist(req.user!.sub, req.body.productId);
  return sendSuccess(res, wishlist, 201);
}

export async function removeHandler(req: Request, res: Response) {
  const wishlist = await wishlistService.removeFromWishlist(req.user!.sub, req.params.productId);
  return sendSuccess(res, wishlist);
}

export async function moveToCartHandler(req: Request, res: Response) {
  const cart = await wishlistService.moveToCart(req.user!.sub, req.params.productId, req.body);
  return sendSuccess(res, cart);
}
