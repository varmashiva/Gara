export type Address = {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

export type OrderItem = {
  productId: string;
  sellerId: string;
  productName: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type Order = {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddressSnapshot: Address;
  subtotal: number;
  discountTotal: number;
  deliveryFee: number;
  grandTotal: number;
  paymentStatus: string;
  orderStatus: string;
  paymentExpiresAt?: string;
  paidAt?: string;
  createdAt: string;
};
