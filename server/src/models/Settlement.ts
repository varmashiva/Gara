import { Schema, model, Document, Types } from 'mongoose';

export type SettlementStatus = 'DRAFT' | 'FINALIZED' | 'PAID';

export interface SettlementDocument extends Document {
  sellerId: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  totalAmount: number;
  earningsCount: number;
  status: SettlementStatus;
  createdAt: Date;
  finalizedAt?: Date;
}

const settlementSchema = new Schema<SettlementDocument>({
  sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  totalAmount: { type: Number, required: true },
  earningsCount: { type: Number, required: true },
  status: { type: String, enum: ['DRAFT', 'FINALIZED', 'PAID'], default: 'DRAFT', index: true },
  createdAt: { type: Date, default: Date.now },
  finalizedAt: { type: Date },
});

export const Settlement = model<SettlementDocument>('Settlement', settlementSchema);
