import { Schema, model, Document, Types } from 'mongoose';

export type SellerApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SellerApplicationDocument extends Document {
  userId: Types.ObjectId;
  storeName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  description?: string;
  foodCategories: string[];
  businessDetails?: string;
  status: SellerApplicationStatus;
  reviewedBy?: Types.ObjectId;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const addressSubSchema = new Schema(
  {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const sellerApplicationSchema = new Schema<SellerApplicationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    storeName: { type: String, required: true },
    ownerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: addressSubSchema, required: true },
    description: { type: String },
    foodCategories: { type: [String], default: [] },
    businessDetails: { type: String },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING', index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: { type: String },
  },
  { timestamps: true }
);

export const SellerApplication = model<SellerApplicationDocument>('SellerApplication', sellerApplicationSchema);
