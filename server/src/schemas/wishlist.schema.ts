import { z } from 'zod';

export const addWishlistItemSchema = z
  .object({
    productId: z.string().min(1),
  })
  .strict();

export const moveToCartSchema = z
  .object({
    variantId: z.string().optional(),
    quantity: z.number().int().positive().max(50).optional().default(1),
  })
  .strict();

export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>;
export type MoveToCartInput = z.infer<typeof moveToCartSchema>;
