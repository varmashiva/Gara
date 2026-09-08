import { Schema, model, Document, Types } from 'mongoose';

export type ShipmentStatus = 'CREATED' | 'AWB_ASSIGNED' | 'PICKUP_SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';

export interface PickupLocationSnapshot {
  label: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  contactPerson: string;
  phone: string;
}

export interface ShipmentDocument extends Document {
  orderId: Types.ObjectId;
  sellerId: Types.ObjectId;
  fulfillmentId: Types.ObjectId;
  provider: string;
  externalOrderId: string;
  externalShipmentId: string;
  awbCode?: string;
  courierName?: string;
  trackingUrl?: string;
  status: ShipmentStatus;
  pickupLocationSnapshot: PickupLocationSnapshot;
  pickupScheduledAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pickupSnapshotSchema = new Schema<PickupLocationSnapshot>(
  {
    label: { type: String, required: true },
    addressLine1: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false }
);

const shipmentSchema = new Schema<ShipmentDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    fulfillmentId: { type: Schema.Types.ObjectId, ref: 'SellerFulfillment', required: true, unique: true },
    provider: { type: String, required: true },
    externalOrderId: { type: String, required: true },
    externalShipmentId: { type: String, required: true, unique: true },
    awbCode: { type: String },
    courierName: { type: String },
    trackingUrl: { type: String },
    status: {
      type: String,
      enum: ['CREATED', 'AWB_ASSIGNED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'],
      default: 'CREATED',
      index: true,
    },
    pickupLocationSnapshot: { type: pickupSnapshotSchema, required: true },
    pickupScheduledAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

export const Shipment = model<ShipmentDocument>('Shipment', shipmentSchema);
