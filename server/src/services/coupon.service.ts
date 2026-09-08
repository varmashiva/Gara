import mongoose from 'mongoose';
import { Coupon, CouponDocument } from '../models/Coupon';
import { CouponUsage } from '../models/CouponUsage';
import { AppError } from '../utils/errors';

export function computeDiscount(coupon: CouponDocument, subtotal: number): number {
  let discount =
    coupon.discountType === 'PERCENTAGE' ? Math.round((subtotal * coupon.discountValue) / 100) : coupon.discountValue;
  if (coupon.maximumDiscount !== undefined) discount = Math.min(discount, coupon.maximumDiscount);
  return Math.min(discount, subtotal);
}

async function findValidCoupon(code: string, userId: string, subtotal: number, session?: mongoose.ClientSession) {
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isDeleted: false }).session(session ?? null);
  if (!coupon) throw AppError.badRequest('Invalid coupon code', 'INVALID_COUPON');
  if (coupon.status !== 'ACTIVE') throw AppError.badRequest('This coupon is not active', 'COUPON_INACTIVE');

  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    throw AppError.badRequest('This coupon has expired or is not yet active', 'COUPON_NOT_IN_WINDOW');
  }
  if (subtotal < coupon.minimumOrderValue) {
    throw AppError.badRequest(`Minimum order value for this coupon is ${coupon.minimumOrderValue}`, 'BELOW_MINIMUM_ORDER');
  }

  if (coupon.perUserLimit !== undefined) {
    const userUsageCount = await CouponUsage.countDocuments({
      couponId: coupon._id,
      userId,
      reversedAt: { $exists: false },
    }).session(session ?? null);
    if (userUsageCount >= coupon.perUserLimit) {
      throw AppError.conflict('You have already used this coupon the maximum number of times', 'COUPON_USER_LIMIT');
    }
  }

  return coupon;
}

/** Preview only — cart display. Does not consume any usage slot. */
export async function previewDiscount(code: string, userId: string, subtotal: number) {
  const coupon = await findValidCoupon(code, userId, subtotal);
  return { discount: computeDiscount(coupon, subtotal), fundedBy: coupon.fundedBy };
}

/**
 * Consumes one usage slot atomically and records it — called only inside
 * the same transaction as order creation, so a failed order never
 * consumes a coupon use. The global usageLimit check uses an atomic
 * $inc-with-$lt-guard (same pattern as inventory reservation) so concurrent
 * checkouts can't collectively exceed it; perUserLimit relies on a
 * session-scoped count check, a smaller race window than the global limit
 * since it requires the same user to race themselves.
 */
export async function consumeCoupon(
  code: string,
  userId: string,
  orderId: mongoose.Types.ObjectId,
  subtotal: number,
  session: mongoose.ClientSession
): Promise<{ discount: number; fundedBy: string }> {
  const coupon = await findValidCoupon(code, userId, subtotal, session);

  if (coupon.usageLimit !== undefined) {
    const updated = await Coupon.findOneAndUpdate(
      { _id: coupon._id, usedCount: { $lt: coupon.usageLimit } },
      { $inc: { usedCount: 1 } },
      { session, new: true }
    );
    if (!updated) {
      throw AppError.conflict('This coupon has reached its usage limit', 'COUPON_USAGE_LIMIT_REACHED');
    }
  } else {
    await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } }, { session });
  }

  await CouponUsage.create([{ couponId: coupon._id, userId, orderId, usedAt: new Date() }], { session });

  return { discount: computeDiscount(coupon, subtotal), fundedBy: coupon.fundedBy };
}

export async function listCoupons() {
  return Coupon.find({ isDeleted: false }).sort({ createdAt: -1 });
}

export async function createCoupon(input: Partial<CouponDocument>) {
  return Coupon.create(input);
}

export async function updateCoupon(id: string, input: Partial<CouponDocument>) {
  const coupon = await Coupon.findOne({ _id: id, isDeleted: false });
  if (!coupon) throw AppError.notFound('Coupon not found', 'COUPON_NOT_FOUND');
  Object.assign(coupon, input);
  await coupon.save();
  return coupon;
}
