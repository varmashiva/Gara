import { Schema, model, Document, Types } from 'mongoose';

export type SellerEarningStatus = 'PENDING' | 'AVAILABLE' | 'INCLUDED_IN_SETTLEMENT' | 'PAID' | 'ON_HOLD';

export interface SellerEarningDocument extends Document {
  orderId: Types.ObjectId;
  sellerFulfillmentId: Types.ObjectId;
  sellerId: Types.ObjectId;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  refundDeduction: number;
  netPayable: number;
  status: SellerEarningStatus;
  availableAt: Date;
  settlementId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const sellerEarningSchema = new Schema<SellerEarningDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    sellerFulfillmentId: { type: Schema.Types.ObjectId, ref: 'SellerFulfillment', required: true, unique: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    grossAmount: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    refundDeduction: { type: Number, default: 0 },
    netPayable: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'AVAILABLE', 'INCLUDED_IN_SETTLEMENT', 'PAID', 'ON_HOLD'],
      default: 'AVAILABLE',
      index: true,
    },
    availableAt: { type: Date, required: true },
    settlementId: { type: Schema.Types.ObjectId, ref: 'Settlement' },
  },
  { timestamps: true }
);

sellerEarningSchema.index({ sellerId: 1, status: 1 });

export const SellerEarning = model<SellerEarningDocument>('SellerEarning', sellerEarningSchema);
