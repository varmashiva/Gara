import { z } from 'zod';

export const createSettlementSchema = z
  .object({
    sellerId: z.string().min(1),
  })
  .strict();

export const markPayoutStatusSchema = z
  .object({
    status: z.enum(['PAID', 'FAILED']),
    failureReason: z.string().max(500).optional(),
  })
  .strict();
