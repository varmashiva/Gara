import { z } from 'zod';

export const createReturnRequestSchema = z
  .object({
    orderId: z.string().min(1),
    productId: z.string().min(1),
    reason: z.string().min(1).max(500),
  })
  .strict();

export const decideReturnSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    notes: z.string().max(1000).optional(),
  })
  .strict();
