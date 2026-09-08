import { Schema, model, Document, Types } from 'mongoose';

export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';

export interface PayoutDocument extends Document {
  settlementId: Types.ObjectId;
  sellerId: Types.ObjectId;
  amount: number;
  method: string;
  transactionRef?: string;
  status: PayoutStatus;
  initiatedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
}

const payoutSchema = new Schema<PayoutDocument>({
  settlementId: { type: Schema.Types.ObjectId, ref: 'Settlement', required: true, unique: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
  amount: { type: Number, required: true },
  method: { type: String, default: 'BANK_TRANSFER' },
  transactionRef: { type: String },
  status: { type: String, enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED'], default: 'PENDING', index: true },
  initiatedAt: { type: Date },
  completedAt: { type: Date },
  failureReason: { type: String },
});

export const Payout = model<PayoutDocument>('Payout', payoutSchema);
