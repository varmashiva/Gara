import { z } from 'zod';

export const updateHomeHighlightSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            icon: z.string().min(1).max(8),
            label: z.string().min(1).max(60),
          })
          .strict()
      )
      .min(1)
      .max(6),
  })
  .strict();

export type UpdateHomeHighlightInput = z.infer<typeof updateHomeHighlightSchema>;
