import { Schema, model, Document, Types } from 'mongoose';

export interface ShipmentEventDocument extends Document {
  shipmentId: Types.ObjectId;
  eventId: string;
  status: string;
  description?: string;
  rawPayload: unknown;
  receivedAt: Date;
  processed: boolean;
}

const shipmentEventSchema = new Schema<ShipmentEventDocument>({
  shipmentId: { type: Schema.Types.ObjectId, ref: 'Shipment', required: true, index: true },
  eventId: { type: String, required: true, unique: true },
  status: { type: String, required: true },
  description: { type: String },
  rawPayload: { type: Schema.Types.Mixed },
  receivedAt: { type: Date, default: Date.now },
  processed: { type: Boolean, default: false },
});

export const ShipmentEvent = model<ShipmentEventDocument>('ShipmentEvent', shipmentEventSchema);
