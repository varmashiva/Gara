import { Schema, model, Document, Types } from 'mongoose';

export type PaymentDocStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export interface PaymentDocument extends Document {
  orderId: Types.ObjectId;
  provider: string;
  providerOrderId: string;
  providerPaymentId?: string;
  amount: number;
  status: PaymentDocStatus;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    provider: { type: String, required: true },
    providerOrderId: { type: String, required: true, unique: true },
    providerPaymentId: { type: String },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'PENDING',
      index: true,
    },
  },
  { timestamps: true }
);

export const Payment = model<PaymentDocument>('Payment', paymentSchema);
