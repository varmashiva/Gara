import { Schema, model, Document, Types } from 'mongoose';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type CouponFundedBy = 'PLATFORM' | 'SELLER' | 'SHARED';

export interface CouponDocument extends Document {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderValue: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit?: number;
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'DISABLED';
  fundedBy: CouponFundedBy;
  sellerId?: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<CouponDocument>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['PERCENTAGE', 'FIXED_AMOUNT'], required: true },
    discountValue: { type: Number, required: true },
    minimumOrderValue: { type: Number, default: 0 },
    maximumDiscount: { type: Number },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['ACTIVE', 'DISABLED'], default: 'ACTIVE', index: true },
    fundedBy: { type: String, enum: ['PLATFORM', 'SELLER', 'SHARED'], default: 'PLATFORM' },
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Coupon = model<CouponDocument>('Coupon', couponSchema);
