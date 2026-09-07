import { Schema, model, Document, Types } from 'mongoose';

export type SellerStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface SellerDocument extends Document {
  userId: Types.ObjectId;
  storeName: string;
  storeSlug: string;
  description?: string;
  logo?: string;
  banner?: string;
  foodCategories: string[];
  status: SellerStatus;
  ratingAvg: number;
  ratingCount: number;
  commissionRate: number;
  applicationId: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const sellerSchema = new Schema<SellerDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    storeName: { type: String, required: true },
    storeSlug: { type: String, required: true, unique: true },
    description: { type: String },
    logo: { type: String },
    banner: { type: String },
    foodCategories: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING',
      index: true,
    },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    commissionRate: { type: Number, required: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'SellerApplication', required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Seller = model<SellerDocument>('Seller', sellerSchema);
