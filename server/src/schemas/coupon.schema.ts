import { z } from 'zod';

export const createCouponSchema = z
  .object({
    code: z.string().min(3).max(30),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    discountValue: z.number().positive(),
    minimumOrderValue: z.number().min(0).optional().default(0),
    maximumDiscount: z.number().positive().optional(),
    usageLimit: z.number().int().positive().optional(),
    perUserLimit: z.number().int().positive().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    fundedBy: z.enum(['PLATFORM', 'SELLER', 'SHARED']).optional().default('PLATFORM'),
  })
  .strict();

export const updateCouponSchema = createCouponSchema.partial().extend({
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
});

export const previewCouponSchema = z
  .object({
    code: z.string().min(1),
  })
  .strict();
