import { Schema, model, Document, Types } from 'mongoose';

export type ReturnRequestStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface ReturnRequestDocument extends Document {
  orderId: Types.ObjectId;
  sellerFulfillmentId: Types.ObjectId;
  productId: Types.ObjectId;
  customerId: Types.ObjectId;
  reason: string;
  status: ReturnRequestStatus;
  requestedAt: Date;
  decidedAt?: Date;
  decidedBy?: Types.ObjectId;
  decisionNotes?: string;
}

const returnRequestSchema = new Schema<ReturnRequestDocument>({
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  sellerFulfillmentId: { type: Schema.Types.ObjectId, ref: 'SellerFulfillment', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED'], default: 'REQUESTED', index: true },
  requestedAt: { type: Date, default: Date.now },
  decidedAt: { type: Date },
  decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  decisionNotes: { type: String },
});

export const ReturnRequest = model<ReturnRequestDocument>('ReturnRequest', returnRequestSchema);
