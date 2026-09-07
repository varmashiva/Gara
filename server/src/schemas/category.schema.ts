import { z } from 'zod';

export const createCategorySchema = z
  .object({
    name: z.string().min(1).max(60),
    parentId: z.string().optional(),
    icon: z.string().optional(),
    returnPolicy: z
      .object({
        returnable: z.boolean(),
        returnWindowDays: z.number().int().min(0),
      })
      .strict()
      .optional(),
  })
  .strict();

export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
