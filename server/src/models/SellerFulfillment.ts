import { Schema, model, Document, Types } from 'mongoose';

export type SellerFulfillmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED';

export interface SellerFulfillmentItem {
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  productName: string;
  variantName?: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface SellerFulfillmentDocument extends Document {
  orderId: Types.ObjectId;
  sellerId: Types.ObjectId;
  items: SellerFulfillmentItem[];
  status: SellerFulfillmentStatus;
  statusHistory: { status: SellerFulfillmentStatus; at: Date }[];
  pickupLocationId?: Types.ObjectId;
  shipmentId?: Types.ObjectId;
  earningId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const fulfillmentItemSchema = new Schema<SellerFulfillmentItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId },
    productName: { type: String, required: true },
    variantName: { type: String },
    sku: { type: String },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const sellerFulfillmentSchema = new Schema<SellerFulfillmentDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    items: { type: [fulfillmentItemSchema], required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    statusHistory: {
      type: [{ status: String, at: { type: Date, default: Date.now } }],
      default: [],
    },
    pickupLocationId: { type: Schema.Types.ObjectId, ref: 'SellerPickupLocation' },
    shipmentId: { type: Schema.Types.ObjectId, ref: 'Shipment' },
    earningId: { type: Schema.Types.ObjectId, ref: 'SellerEarning' },
  },
  { timestamps: true }
);

sellerFulfillmentSchema.index({ orderId: 1, sellerId: 1 }, { unique: true });
sellerFulfillmentSchema.index({ sellerId: 1, status: 1 });

export const SellerFulfillment = model<SellerFulfillmentDocument>('SellerFulfillment', sellerFulfillmentSchema);
