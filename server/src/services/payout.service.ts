import { Settlement } from '../models/Settlement';
import { Payout } from '../models/Payout';
import { SellerEarning } from '../models/SellerEarning';
import { AppError } from '../utils/errors';

export async function createPayout(settlementId: string) {
  const settlement = await Settlement.findById(settlementId);
  if (!settlement) throw AppError.notFound('Settlement not found', 'SETTLEMENT_NOT_FOUND');
  if (settlement.status !== 'FINALIZED') {
    throw AppError.conflict('Only a finalized settlement can be paid out', 'INVALID_SETTLEMENT_STATE');
  }

  const existing = await Payout.findOne({ settlementId });
  if (existing) return existing;

  return Payout.create({
    settlementId,
    sellerId: settlement.sellerId,
    amount: settlement.totalAmount,
    status: 'PENDING',
    initiatedAt: new Date(),
  });
}

/**
 * v1 payout execution is admin-confirmed manual bank transfer, not
 * automated disbursement (design doc §16) — this just records that it
 * happened (or failed) once ops actually moves the money.
 */
export async function markPayoutStatus(payoutId: string, status: 'PAID' | 'FAILED', failureReason?: string) {
  const payout = await Payout.findById(payoutId);
  if (!payout) throw AppError.notFound('Payout not found', 'PAYOUT_NOT_FOUND');
  if (payout.status === 'PAID') {
    throw AppError.conflict('Payout already marked paid', 'INVALID_PAYOUT_STATE');
  }

  payout.status = status;
  payout.completedAt = new Date();
  if (status === 'FAILED') payout.failureReason = failureReason;
  await payout.save();

  if (status === 'PAID') {
    await SellerEarning.updateMany({ settlementId: payout.settlementId }, { status: 'PAID' });
    await Settlement.updateOne({ _id: payout.settlementId }, { status: 'PAID' });
  } else {
    // Failed payout: earnings go back to AVAILABLE so they can be re-batched.
    await SellerEarning.updateMany(
      { settlementId: payout.settlementId },
      { status: 'AVAILABLE', settlementId: null }
    );
  }

  return payout;
}

export async function listPayouts(sellerId?: string) {
  const filter = sellerId ? { sellerId } : {};
  return Payout.find(filter).sort({ initiatedAt: -1 });
}
