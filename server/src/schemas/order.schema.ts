import { z } from 'zod';

export const createOrderSchema = z
  .object({
    addressId: z.string().min(1),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
