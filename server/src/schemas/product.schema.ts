import { z } from 'zod';

const variantSchema = z
  .object({
    sku: z.string().min(1),
    name: z.string().min(1),
    packSize: z.string().min(1),
    price: z.number().int().positive(),
    compareAtPrice: z.number().int().positive().optional(),
    availableStock: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0).optional().default(5),
  })
  .strict();

export const createProductSchema = z
  .object({
    categoryId: z.string().min(1),
    name: z.string().min(2).max(120),
    description: z.string().min(1).max(3000),
    price: z.number().int().positive(),
    discountPercent: z.number().min(0).max(100).optional().default(0),
    ingredients: z.array(z.string()).optional().default([]),
    allergens: z.array(z.string()).optional().default([]),
    weightGrams: z.number().int().positive().optional(),
    shelfLifeDays: z.number().int().positive().optional(),
    storageInstructions: z.string().max(500).optional(),
    prepTimeMinutes: z.number().int().positive().optional(),
    isVeg: z.boolean(),
    availableStock: z.number().int().min(0).optional().default(0),
    lowStockThreshold: z.number().int().min(0).optional().default(5),
    variants: z.array(variantSchema).optional().default([]),
  })
  .strict();

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z
  .object({
    search: z.string().optional(),
    category: z.string().optional(),
    seller: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    isVeg: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === 'true')),
    sort: z.enum(['price_asc', 'price_desc', 'newest', 'rating']).optional().default('newest'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  })
  .strict();

export const productStatusDecisionSchema = z
  .object({
    decision: z.enum(['APPROVED', 'REJECTED']),
    reviewNotes: z.string().max(1000).optional(),
  })
  .strict();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
