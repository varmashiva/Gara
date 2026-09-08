import { Schema, model, Document, Types } from 'mongoose';

export type ReviewStatus = 'PUBLISHED' | 'HIDDEN' | 'REPORTED';

export interface ReviewDocument extends Document {
  productId: Types.ObjectId;
  customerId: Types.ObjectId;
  orderId: Types.ObjectId;
  rating: number;
  title?: string;
  comment?: string;
  verifiedPurchase: boolean;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<ReviewDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    comment: { type: String },
    verifiedPurchase: { type: Boolean, default: true },
    status: { type: String, enum: ['PUBLISHED', 'HIDDEN', 'REPORTED'], default: 'PUBLISHED', index: true },
  },
  { timestamps: true }
);

reviewSchema.index({ orderId: 1, productId: 1, customerId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, status: 1 });

export const Review = model<ReviewDocument>('Review', reviewSchema);
