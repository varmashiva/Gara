import { z } from 'zod';

const addressSchema = z
  .object({
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(1),
  })
  .strict();

export const sellerApplicationSchema = z
  .object({
    storeName: z.string().min(2).max(80),
    ownerName: z.string().min(1),
    phone: z.string().min(6).max(20),
    email: z.string().email(),
    address: addressSchema,
    description: z.string().max(1000).optional(),
    foodCategories: z.array(z.string()).default([]),
    businessDetails: z.string().max(2000).optional(),
  })
  .strict();

export const applicationDecisionSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    reviewNotes: z.string().max(1000).optional(),
  })
  .strict();

export const pickupLocationSchema = z
  .object({
    label: z.string().min(1).max(80),
    contactPerson: z.string().min(1),
    // Shiprocket's pickup API requires a 10-digit Indian mobile, a 6-digit
    // pincode and an address line of at least 10 characters.
    phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit mobile number'),
    addressLine1: z.string().trim().min(10, 'Address must be at least 10 characters (include house/flat no.)'),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().trim().regex(/^\d{6}$/, 'Enter a 6-digit pincode'),
    country: z.string().min(1),
    isDefault: z.boolean().optional().default(false),
  })
  .strict();

export const pickupLocationUpdateSchema = pickupLocationSchema.partial();

export type SellerApplicationInput = z.infer<typeof sellerApplicationSchema>;
export type ApplicationDecisionInput = z.infer<typeof applicationDecisionSchema>;
export type PickupLocationInput = z.infer<typeof pickupLocationSchema>;
export type PickupLocationUpdateInput = z.infer<typeof pickupLocationUpdateSchema>;
