import { z } from 'zod';

export const addCartItemSchema = z
  .object({
    productId: z.string().min(1),
    variantId: z.string().optional(),
    quantity: z.number().int().positive().max(50),
  })
  .strict();

export const updateCartItemSchema = z
  .object({
    quantity: z.number().int().positive().max(50),
  })
  .strict();

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
