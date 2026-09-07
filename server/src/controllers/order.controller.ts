import { Request, Response } from 'express';
import * as orderService from '../services/order.service';
import { sendSuccess } from '../utils/response';

export async function createHandler(req: Request, res: Response) {
  const order = await orderService.createOrder(req.user!.sub, req.body.addressId);
  return sendSuccess(res, order, 201);
}

export async function listHandler(req: Request, res: Response) {
  const orders = await orderService.listMyOrders(req.user!.sub);
  return sendSuccess(res, orders);
}

export async function getHandler(req: Request, res: Response) {
  const order = await orderService.getMyOrder(req.user!.sub, req.params.id);
  return sendSuccess(res, order);
}

export async function cancelHandler(req: Request, res: Response) {
  const order = await orderService.cancelUnpaidOrder(req.user!.sub, req.params.id);
  return sendSuccess(res, order);
}

export async function trackingHandler(req: Request, res: Response) {
  const tracking = await orderService.getOrderTracking(req.user!.sub, req.params.id);
  return sendSuccess(res, tracking);
}
