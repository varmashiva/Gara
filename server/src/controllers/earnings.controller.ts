import { Request, Response } from 'express';
import * as earningsService from '../services/earnings.service';
import * as settlementService from '../services/settlement.service';
import { getSellerByUserId } from '../services/seller.service';
import { sendSuccess } from '../utils/response';

export async function listMineHandler(req: Request, res: Response) {
  const seller = await getSellerByUserId(req.user!.sub);
  const earnings = await earningsService.listMyEarnings(seller.id);
  return sendSuccess(res, earnings);
}

export async function summaryHandler(req: Request, res: Response) {
  const seller = await getSellerByUserId(req.user!.sub);
  const summary = await earningsService.getEarningsSummary(seller.id);
  return sendSuccess(res, summary);
}

export async function listMySettlementsHandler(req: Request, res: Response) {
  const seller = await getSellerByUserId(req.user!.sub);
  const settlements = await settlementService.listMySettlements(seller.id);
  return sendSuccess(res, settlements);
}
