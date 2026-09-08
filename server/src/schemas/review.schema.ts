import { z } from 'zod';

export const createReviewSchema = z
  .object({
    orderId: z.string().min(1),
    productId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    title: z.string().max(120).optional(),
    comment: z.string().max(2000).optional(),
  })
  .strict();

export const moderateReviewSchema = z
  .object({
    status: z.enum(['PUBLISHED', 'HIDDEN']),
  })
  .strict();
