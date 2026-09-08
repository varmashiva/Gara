export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PickupLocationInfo {
  externalPickupLocationId?: string; // Shiprocket's pickup_location name/id, once registered
  label: string;
  contactPerson: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ShipmentLineItem {
  name: string;
  sku: string;
  units: number;
  sellingPrice: number; // rupees, not paise — the gateway's own currency unit
}

export interface CreateShipmentOrderParams {
  orderNumber: string;
  orderDate: Date;
  pickupLocation: PickupLocationInfo;
  deliveryAddress: ShippingAddress;
  items: ShipmentLineItem[];
  subtotal: number; // rupees
  paymentMethod: 'PREPAID' | 'COD';
  weightKg: number;
}

export interface CreateShipmentOrderResult {
  externalOrderId: string;
  externalShipmentId: string;
}

export interface AssignCourierResult {
  awbCode: string;
  courierName: string;
}

export interface RequestPickupResult {
  scheduledAt?: Date;
}

export interface ShipmentEventDTO {
  eventId: string;
  externalShipmentId: string;
  status: string;
  description?: string;
  occurredAt: Date;
}

export interface TrackShipmentResult {
  status: string;
  events: ShipmentEventDTO[];
}

/**
 * Business logic depends on this interface, never on Shiprocket (or any
 * other courier aggregator) directly — see design doc §L/§14.
 */
export interface ShippingProvider {
  createShipmentOrder(params: CreateShipmentOrderParams): Promise<CreateShipmentOrderResult>;
  assignCourier(externalShipmentId: string): Promise<AssignCourierResult>;
  requestPickup(externalShipmentId: string): Promise<RequestPickupResult>;
  trackShipment(awbCode: string): Promise<TrackShipmentResult>;
  cancelShipment(externalOrderId: string): Promise<{ cancelled: boolean }>;
  verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean;
}
