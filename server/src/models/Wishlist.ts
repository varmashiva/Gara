import { Schema, model, Document, Types } from 'mongoose';

export interface WishlistDocument extends Document {
  userId: Types.ObjectId;
  productIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<WishlistDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    productIds: { type: [Schema.Types.ObjectId], ref: 'Product', default: [] },
  },
  { timestamps: true }
);

export const Wishlist = model<WishlistDocument>('Wishlist', wishlistSchema);
