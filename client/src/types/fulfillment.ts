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

export type Fulfillment = {
  _id: string;
  orderId: string;
  sellerId: string;
  items: FulfillmentItem[];
  status: FulfillmentStatus;
  statusHistory: { status: FulfillmentStatus; at: string }[];
  createdAt: string;
};

export const NEXT_STATUS: Partial<Record<FulfillmentStatus, FulfillmentStatus[]>> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY_TO_SHIP', 'FAILED'],
  READY_TO_SHIP: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
};
