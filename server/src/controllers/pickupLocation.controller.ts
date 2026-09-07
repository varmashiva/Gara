import { Request, Response } from 'express';
import * as pickupLocationService from '../services/sellerPickupLocation.service';
import { sendSuccess } from '../utils/response';

export async function listHandler(req: Request, res: Response) {
  const locations = await pickupLocationService.listPickupLocations(req.user!.sub);
  return sendSuccess(res, locations);
}

export async function createHandler(req: Request, res: Response) {
  const location = await pickupLocationService.createPickupLocation(req.user!.sub, req.body);
  return sendSuccess(res, location, 201);
}

export async function updateHandler(req: Request, res: Response) {
  const location = await pickupLocationService.updatePickupLocation(req.user!.sub, req.params.id, req.body);
  return sendSuccess(res, location);
}

export async function deleteHandler(req: Request, res: Response) {
  await pickupLocationService.deletePickupLocation(req.user!.sub, req.params.id);
  return sendSuccess(res, { deleted: true });
}
