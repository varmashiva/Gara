import { z } from 'zod';

export const createOrderSchema = z
  .object({
    addressId: z.string().min(1),
    couponCode: z.string().optional(),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
