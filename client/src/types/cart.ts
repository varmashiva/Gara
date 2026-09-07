export type CartItem = {
  itemId: string;
  productId: string;
  variantId?: string;
  sellerId: string;
  name: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  available: boolean;
  unavailableReason?: string;
};

export type Cart = {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
};
