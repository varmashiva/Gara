export type ProductImage = {
  url: string;
  publicId: string;
  alt?: string;
  order: number;
};

export type ProductVariant = {
  _id: string;
  name: string;
  packSize: string;
  price: number;
  availableStock: number;
  status: 'ACTIVE' | 'INACTIVE';
};

export type Product = {
  _id: string;
  sellerId: string;
  categoryId: string;
  categorySnapshot: { name: string; slug: string };
  name: string;
  slug: string;
  description: string;
  images: ProductImage[];
  price: number;
  discountPercent: number;
  ingredients: string[];
  allergens: string[];
  weightGrams?: number;
  shelfLifeDays?: number;
  storageInstructions?: string;
  prepTimeMinutes?: number;
  isVeg: boolean;
  inventory: { availableStock: number; reservedStock: number; lowStockThreshold: number };
  variants: ProductVariant[];
  ratingAvg: number;
  ratingCount: number;
  status: string;
};

export type ProductListResponse = {
  items: Product[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type Category = {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
};

export type ProductQuery = {
  search?: string;
  category?: string;
  isVeg?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'rating';
  page?: number;
  limit?: number;
};
