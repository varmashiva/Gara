import mongoose from 'mongoose';
import { Product } from '../models/Product';
import { AppError } from '../utils/errors';

export type InventoryLineItem = {
  productId: string;
  variantId?: string;
  quantity: number;
};

async function withTransaction<T>(fn: (session: mongoose.ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

/**
 * Atomically reserves stock for every line item, or none at all.
 *
 * Each item's check-and-decrement is a single-document atomic update
 * (findOneAndUpdate with a $gte guard), which alone prevents overselling
 * per product/variant under concurrency. The transaction wrapping all
 * items exists for a different reason: a multi-item order must reserve
 * everything or nothing — without it, a failure on item 3 of 3 would
 * leave items 1-2 holding stock for an order that will never be created.
 */
export async function reserveInventory(items: InventoryLineItem[]): Promise<void> {
  await withTransaction(async (session) => {
    for (const item of items) {
      const filter = item.variantId
        ? { _id: item.productId, 'variants._id': item.variantId, 'variants.availableStock': { $gte: item.quantity } }
        : { _id: item.productId, 'inventory.availableStock': { $gte: item.quantity } };

      const update = item.variantId
        ? {
            $inc: {
              'variants.$.availableStock': -item.quantity,
              'variants.$.reservedStock': item.quantity,
            },
          }
        : {
            $inc: {
              'inventory.availableStock': -item.quantity,
              'inventory.reservedStock': item.quantity,
            },
          };

      const updated = await Product.findOneAndUpdate(filter, update, { session, new: true });

      if (!updated) {
        throw AppError.conflict(
          `Insufficient stock for product ${item.productId}${item.variantId ? ` (variant ${item.variantId})` : ''}`,
          'INSUFFICIENT_STOCK'
        );
      }
    }
  });
}

/**
 * Payment succeeded: the stock was already deducted from availableStock at
 * reserve time, so committing only clears the reservedStock hold.
 */
export async function commitInventory(items: InventoryLineItem[]): Promise<void> {
  await withTransaction(async (session) => {
    for (const item of items) {
      const filter = item.variantId
        ? { _id: item.productId, 'variants._id': item.variantId }
        : { _id: item.productId };

      const update = item.variantId
        ? { $inc: { 'variants.$.reservedStock': -item.quantity } }
        : { $inc: { 'inventory.reservedStock': -item.quantity } };

      await Product.updateOne(filter, update, { session });
    }
  });
}

/**
 * Payment failed/expired/cancelled: give the stock back.
 */
export async function releaseInventory(items: InventoryLineItem[]): Promise<void> {
  await withTransaction(async (session) => {
    for (const item of items) {
      const filter = item.variantId
        ? { _id: item.productId, 'variants._id': item.variantId }
        : { _id: item.productId };

      const update = item.variantId
        ? {
            $inc: {
              'variants.$.availableStock': item.quantity,
              'variants.$.reservedStock': -item.quantity,
            },
          }
        : {
            $inc: {
              'inventory.availableStock': item.quantity,
              'inventory.reservedStock': -item.quantity,
            },
          };

      await Product.updateOne(filter, update, { session });
    }
  });
}
