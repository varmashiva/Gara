import { z } from 'zod';

export const addressSchema = z
  .object({
    fullName: z.string().min(1),
    phone: z.string().min(6).max(20),
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
    isDefault: z.boolean().optional().default(false),
  })
  .strict();

export const addressUpdateSchema = addressSchema.partial();

export type AddressInput = z.infer<typeof addressSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;
