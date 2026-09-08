import mongoose from 'mongoose';
import { SellerEarning } from '../models/SellerEarning';
import { Seller } from '../models/Seller';
import { SellerFulfillmentDocument } from '../models/SellerFulfillment';

/**
 * Called once a fulfillment reaches DELIVERED. Idempotent via the unique
 * index on sellerFulfillmentId — a fulfillment can only ever produce one
 * earning row.
 *
 * Simplification: earnings become AVAILABLE immediately on delivery (no
 * return-window hold) since Returns/Refunds (design §17) isn't built yet.
 * Once it is, availableAt should become deliveredAt + returnWindowDays and
 * status should start PENDING instead of AVAILABLE.
 */
export async function createEarningForFulfillment(fulfillment: SellerFulfillmentDocument) {
  const existing = await SellerEarning.findOne({ sellerFulfillmentId: fulfillment._id });
  if (existing) return existing;

  const seller = await Seller.findById(fulfillment.sellerId);
  if (!seller) return null;

  const grossAmount = fulfillment.items.reduce((sum, item) => sum + item.subtotal, 0);
  const commissionAmount = Math.round((grossAmount * seller.commissionRate) / 10000);
  const netPayable = grossAmount - commissionAmount;

  return SellerEarning.create({
    orderId: fulfillment.orderId,
    sellerFulfillmentId: fulfillment._id,
    sellerId: fulfillment.sellerId,
    grossAmount,
    commissionRate: seller.commissionRate,
    commissionAmount,
    refundDeduction: 0,
    netPayable,
    status: 'AVAILABLE',
    availableAt: new Date(),
  });
}

export async function listMyEarnings(sellerId: string) {
  return SellerEarning.find({ sellerId }).sort({ createdAt: -1 });
}

export async function getEarningsSummary(sellerId: string) {
  const [available, includedInSettlement, paid] = await Promise.all([
    SellerEarning.aggregate([
      { $match: { sellerId: new mongoose.Types.ObjectId(sellerId), status: 'AVAILABLE' } },
      { $group: { _id: null, total: { $sum: '$netPayable' } } },
    ]),
    SellerEarning.aggregate([
      { $match: { sellerId: new mongoose.Types.ObjectId(sellerId), status: 'INCLUDED_IN_SETTLEMENT' } },
      { $group: { _id: null, total: { $sum: '$netPayable' } } },
    ]),
    SellerEarning.aggregate([
      { $match: { sellerId: new mongoose.Types.ObjectId(sellerId), status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$netPayable' } } },
    ]),
  ]);

  return {
    availableBalance: available[0]?.total ?? 0,
    pendingSettlement: includedInSettlement[0]?.total ?? 0,
    totalPaid: paid[0]?.total ?? 0,
  };
}
