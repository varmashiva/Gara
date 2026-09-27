import { Schema, model, Document, Types } from 'mongoose';

export type PickupLocationStatus = 'PENDING' | 'ACTIVE' | 'DISABLED';

export interface SellerPickupLocationDocument extends Document {
  sellerId: Types.ObjectId;
  label: string;
  contactPerson: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shiprocketPickupLocationId?: string;
  status: PickupLocationStatus;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sellerPickupLocationSchema = new Schema<SellerPickupLocationDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    label: { type: String, required: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    // The unique nickname this address was registered under in Shiprocket
    // (`pickup_location`) — what order creation refers to it by.
    shiprocketPickupLocationId: { type: String },
    status: { type: String, enum: ['PENDING', 'ACTIVE', 'DISABLED'], default: 'PENDING' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SellerPickupLocation = model<SellerPickupLocationDocument>(
  'SellerPickupLocation',
  sellerPickupLocationSchema
);
