import { Request, Response } from 'express';
import * as cartService from '../services/cart.service';
import { sendSuccess } from '../utils/response';

export async function getCartHandler(req: Request, res: Response) {
  const cart = await cartService.getCart(req.cartOwner!);
  return sendSuccess(res, cart);
}

export async function addItemHandler(req: Request, res: Response) {
  const cart = await cartService.addItem(req.cartOwner!, req.body);
  return sendSuccess(res, cart, 201);
}

export async function updateItemHandler(req: Request, res: Response) {
  const cart = await cartService.updateItemQuantity(req.cartOwner!, req.params.itemId, req.body);
  return sendSuccess(res, cart);
}

export async function removeItemHandler(req: Request, res: Response) {
  const cart = await cartService.removeItem(req.cartOwner!, req.params.itemId);
  return sendSuccess(res, cart);
}

export async function clearCartHandler(req: Request, res: Response) {
  const cart = await cartService.clearCart(req.cartOwner!);
  return sendSuccess(res, cart);
}
