export type FulfillmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED';

export type FulfillmentItem = {
  productName: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type Shipment = {
  _id: string;
  externalShipmentId: string;
  awbCode?: string;
  courierName?: string;
  status: 'CREATED' | 'AWB_ASSIGNED' | 'PICKUP_SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
};

export type Fulfillment = {
  _id: string;
  orderId: string;
  sellerId: string;
  items: FulfillmentItem[];
  status: FulfillmentStatus;
  statusHistory: { status: FulfillmentStatus; at: string }[];
  shipmentId?: Shipment | null;
  createdAt: string;
};

// Seller-clickable transitions only. READY_TO_SHIP and SHIPPED have no
// manual next step — reaching READY_TO_SHIP creates the shipment, and from
// there the courier webhook (simulated in mock mode) drives SHIPPED/DELIVERED.
export const NEXT_STATUS: Partial<Record<FulfillmentStatus, FulfillmentStatus[]>> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY_TO_SHIP', 'FAILED'],
};
