import { Schema, model, Document, Types } from 'mongoose';

export interface CouponUsageDocument extends Document {
  couponId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  usedAt: Date;
  reversedAt?: Date;
}

const couponUsageSchema = new Schema<CouponUsageDocument>({
  couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  usedAt: { type: Date, default: Date.now },
  reversedAt: { type: Date },
});

couponUsageSchema.index({ couponId: 1, userId: 1 });

export const CouponUsage = model<CouponUsageDocument>('CouponUsage', couponUsageSchema);
