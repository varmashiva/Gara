import { Request, Response } from 'express';
import * as couponService from '../services/coupon.service';
import { getCart } from '../services/cart.service';
import { sendSuccess } from '../utils/response';

export async function previewHandler(req: Request, res: Response) {
  const cart = await getCart({ userId: req.user!.sub });
  const result = await couponService.previewDiscount(req.body.code, req.user!.sub, cart.subtotal);
  return sendSuccess(res, result);
}

export async function listHandler(_req: Request, res: Response) {
  const coupons = await couponService.listCoupons();
  return sendSuccess(res, coupons);
}

export async function createHandler(req: Request, res: Response) {
  const coupon = await couponService.createCoupon(req.body);
  return sendSuccess(res, coupon, 201);
}

export async function updateHandler(req: Request, res: Response) {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  return sendSuccess(res, coupon);
}
