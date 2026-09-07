import { z } from 'zod';

export const updateFulfillmentStatusSchema = z
  .object({
    status: z.enum(['CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED']),
  })
  .strict();

export type UpdateFulfillmentStatusInput = z.infer<typeof updateFulfillmentStatusSchema>;
