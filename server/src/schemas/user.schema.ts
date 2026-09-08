import { z } from 'zod';

export const setUserStatusSchema = z
  .object({
    status: z.enum(['ACTIVE', 'SUSPENDED']),
  })
  .strict();
