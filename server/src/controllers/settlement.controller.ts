import { Request, Response } from 'express';
import * as settlementService from '../services/settlement.service';
import * as payoutService from '../services/payout.service';
import { getOrCreateHouseSeller } from '../services/seller.service';
import { sendSuccess } from '../utils/response';

export async function listHandler(req: Request, res: Response) {
  const sellerId = req.query.sellerId as string | undefined;
  const settlements = await settlementService.listSettlements(sellerId);
  return sendSuccess(res, settlements);
}

export async function createHandler(req: Request, res: Response) {
  const seller = await getOrCreateHouseSeller(req.user!.sub);
  const settlement = await settlementService.createSettlementForSeller(seller.id);
  return sendSuccess(res, settlement, 201);
}

export async function finalizeHandler(req: Request, res: Response) {
  const settlement = await settlementService.finalizeSettlement(req.params.id);
  return sendSuccess(res, settlement);
}

export async function createPayoutHandler(req: Request, res: Response) {
  const payout = await payoutService.createPayout(req.params.id);
  return sendSuccess(res, payout, 201);
}

export async function listPayoutsHandler(req: Request, res: Response) {
  const sellerId = req.query.sellerId as string | undefined;
  const payouts = await payoutService.listPayouts(sellerId);
  return sendSuccess(res, payouts);
}

export async function markPayoutStatusHandler(req: Request, res: Response) {
  const payout = await payoutService.markPayoutStatus(
    req.user!.sub,
    req.params.id,
    req.body.status,
    req.body.failureReason
  );
  return sendSuccess(res, payout);
}
