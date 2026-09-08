import mongoose from 'mongoose';
import { SellerEarning } from '../models/SellerEarning';
import { Settlement } from '../models/Settlement';
import { AppError } from '../utils/errors';

/**
 * Batches every AVAILABLE earning for a seller into one Settlement, all in
 * a transaction — the earnings and the settlement header must move
 * together, or an earning could end up unbilled or double-counted.
 */
export async function createSettlementForSeller(sellerId: string) {
  const session = await mongoose.startSession();
  try {
    let settlement;
    await session.withTransaction(async () => {
      const earnings = await SellerEarning.find({ sellerId, status: 'AVAILABLE' }).session(session);
      if (earnings.length === 0) {
        throw AppError.badRequest('No available earnings to settle for this seller', 'NO_AVAILABLE_EARNINGS');
      }

      const totalAmount = earnings.reduce((sum, e) => sum + e.netPayable, 0);
      const periodStart = earnings.reduce((min, e) => (e.createdAt < min ? e.createdAt : min), earnings[0].createdAt);
      const periodEnd = new Date();

      const [created] = await Settlement.create(
        [{ sellerId, periodStart, periodEnd, totalAmount, earningsCount: earnings.length, status: 'DRAFT' }],
        { session }
      );
      settlement = created;

      await SellerEarning.updateMany(
        { _id: { $in: earnings.map((e) => e._id) } },
        { status: 'INCLUDED_IN_SETTLEMENT', settlementId: created._id },
        { session }
      );
    });
    return settlement;
  } finally {
    await session.endSession();
  }
}

export async function finalizeSettlement(settlementId: string) {
  const settlement = await Settlement.findById(settlementId);
  if (!settlement) throw AppError.notFound('Settlement not found', 'SETTLEMENT_NOT_FOUND');
  if (settlement.status !== 'DRAFT') {
    throw AppError.conflict('Only a draft settlement can be finalized', 'INVALID_SETTLEMENT_STATE');
  }
  settlement.status = 'FINALIZED';
  settlement.finalizedAt = new Date();
  await settlement.save();
  return settlement;
}

export async function listSettlements(sellerId?: string) {
  const filter = sellerId ? { sellerId } : {};
  return Settlement.find(filter).sort({ createdAt: -1 });
}

export async function listMySettlements(sellerId: string) {
  return Settlement.find({ sellerId }).sort({ createdAt: -1 });
}
