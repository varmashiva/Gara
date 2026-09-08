import { Schema, model, Document, Types } from 'mongoose';

export type RefundReason = 'CANCELLATION' | 'RETURN' | 'ADMIN_ADJUSTMENT';
export type RefundStatus = 'INITIATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface RefundDocument extends Document {
  orderId: Types.ObjectId;
  paymentId: Types.ObjectId;
  returnRequestId?: Types.ObjectId;
  amount: number;
  reason: RefundReason;
  status: RefundStatus;
  providerRefundId?: string;
  initiatedAt: Date;
  completedAt?: Date;
}

const refundSchema = new Schema<RefundDocument>({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
  returnRequestId: { type: Schema.Types.ObjectId, ref: 'ReturnRequest' },
  amount: { type: Number, required: true },
  reason: { type: String, enum: ['CANCELLATION', 'RETURN', 'ADMIN_ADJUSTMENT'], required: true },
  status: { type: String, enum: ['INITIATED', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'INITIATED', index: true },
  providerRefundId: { type: String },
  initiatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
});

export const Refund = model<RefundDocument>('Refund', refundSchema);
