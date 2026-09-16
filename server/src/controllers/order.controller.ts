import { Request, Response } from 'express';
import * as orderService from '../services/order.service';
import { sendSuccess } from '../utils/response';

export async function createHandler(req: Request, res: Response) {
  const order = await orderService.createOrder(req.user!.sub, req.body.addressId, req.body.couponCode);
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

export async function adminListHandler(req: Request, res: Response) {
  const orders = await orderService.listAllOrdersForAdmin(req.query.status as string | undefined);
  return sendSuccess(res, orders);
}

export async function adminSummaryHandler(_req: Request, res: Response) {
  const summary = await orderService.getOrderSummaryForAdmin();
  return sendSuccess(res, summary);
}

export async function adminGetHandler(req: Request, res: Response) {
  const result = await orderService.getOrderForAdmin(req.params.id);
  return sendSuccess(res, result);
}
