import { z } from 'zod';

export const markPayoutStatusSchema = z
  .object({
    status: z.enum(['PAID', 'FAILED']),
    failureReason: z.string().max(500).optional(),
  })
  .strict();
