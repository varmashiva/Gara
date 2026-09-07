import { Request, Response } from 'express';
import * as addressService from '../services/address.service';
import { sendSuccess } from '../utils/response';

export async function listHandler(req: Request, res: Response) {
  const addresses = await addressService.listAddresses(req.user!.sub);
  return sendSuccess(res, addresses);
}

export async function createHandler(req: Request, res: Response) {
  const address = await addressService.createAddress(req.user!.sub, req.body);
  return sendSuccess(res, address, 201);
}

export async function updateHandler(req: Request, res: Response) {
  const address = await addressService.updateAddress(req.user!.sub, req.params.id, req.body);
  return sendSuccess(res, address);
}

export async function deleteHandler(req: Request, res: Response) {
  await addressService.deleteAddress(req.user!.sub, req.params.id);
  return sendSuccess(res, { deleted: true });
}

export async function setDefaultHandler(req: Request, res: Response) {
  const address = await addressService.setDefaultAddress(req.user!.sub, req.params.id);
  return sendSuccess(res, address);
}
