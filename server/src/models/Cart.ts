import { Schema, model, Document, Types } from 'mongoose';

export interface CartItem {
  _id?: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  sellerId: Types.ObjectId;
  quantity: number;
  priceSnapshot: number;
}

export interface CartDocument extends Document {
  userId?: Types.ObjectId;
  guestToken?: string;
  items: Types.DocumentArray<CartItem>;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<CartItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: Schema.Types.ObjectId },
  sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
  quantity: { type: Number, required: true, min: 1 },
  priceSnapshot: { type: Number, required: true },
});

const cartSchema = new Schema<CartDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
    guestToken: { type: String, unique: true, sparse: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

export const Cart = model<CartDocument>('Cart', cartSchema);
