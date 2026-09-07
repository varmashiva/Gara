import { Schema, model, Document, Types } from 'mongoose';

export interface PaymentEventDocument extends Document {
  paymentId: Types.ObjectId;
  eventId: string;
  eventType: string;
  rawPayload: unknown;
  receivedAt: Date;
  processed: boolean;
}

const paymentEventSchema = new Schema<PaymentEventDocument>({
  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  rawPayload: { type: Schema.Types.Mixed },
  receivedAt: { type: Date, default: Date.now },
  processed: { type: Boolean, default: false },
});

export const PaymentEvent = model<PaymentEventDocument>('PaymentEvent', paymentEventSchema);
