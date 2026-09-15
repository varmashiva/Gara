import { z } from 'zod';

export const updateHeroBannerSchema = z
  .object({
    eyebrow: z.string().min(1).max(60).optional(),
    headline: z.string().min(1).max(150).optional(),
    subtext: z.string().min(1).max(300).optional(),
    ctaText: z.string().min(1).max(40).optional(),
    ctaLink: z.string().min(1).max(200).optional(),
  })
  .strict();

export type UpdateHeroBannerInput = z.infer<typeof updateHeroBannerSchema>;
