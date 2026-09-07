import { Schema, model, Document, Types } from 'mongoose';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export type OrderStatus =
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'IN_PROGRESS'
  | 'PARTIALLY_SHIPPED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_EXPIRED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURN_REJECTED'
  | 'REFUNDED';

export interface OrderItem {
  _id?: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  sellerId: Types.ObjectId;
  productName: string;
  variantName?: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface AddressSnapshot {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderDocument extends Document {
  orderNumber: string;
  customerId: Types.ObjectId;
  items: Types.DocumentArray<OrderItem>;
  shippingAddressSnapshot: AddressSnapshot;
  subtotal: number;
  discountTotal: number;
  deliveryFee: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  sellerFulfillmentIds: Types.ObjectId[];
  paymentExpiresAt?: Date;
  expiresAt?: Date;
  paidAt?: Date;
  cancelledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<OrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: Schema.Types.ObjectId },
  sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
  productName: { type: String, required: true },
  variantName: { type: String },
  sku: { type: String },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  subtotal: { type: Number, required: true },
});

const addressSnapshotSchema = new Schema<AddressSnapshot>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<OrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddressSnapshot: { type: addressSnapshotSchema, required: true },
    subtotal: { type: Number, required: true },
    discountTotal: { type: Number, required: true, default: 0 },
    deliveryFee: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: [
        'PAYMENT_PENDING',
        'PAID',
        'IN_PROGRESS',
        'PARTIALLY_SHIPPED',
        'SHIPPED',
        'DELIVERED',
        'COMPLETED',
        'PAYMENT_FAILED',
        'PAYMENT_EXPIRED',
        'CANCELLED',
        'RETURN_REQUESTED',
        'RETURN_APPROVED',
        'RETURN_REJECTED',
        'REFUNDED',
      ],
      default: 'PAYMENT_PENDING',
      index: true,
    },
    sellerFulfillmentIds: { type: [Schema.Types.ObjectId], ref: 'SellerFulfillment', default: [] },
    paymentExpiresAt: { type: Date },
    expiresAt: { type: Date },
    paidAt: { type: Date },
    cancelledAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ 'items.sellerId': 1 });
orderSchema.index({ orderStatus: 1, paymentExpiresAt: 1 });

export const Order = model<OrderDocument>('Order', orderSchema);
