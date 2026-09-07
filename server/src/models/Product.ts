import { Schema, model, Document, Types } from 'mongoose';

export type ProductStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'INACTIVE';

export interface ProductImage {
  url: string;
  publicId: string;
  alt?: string;
  order: number;
}

export interface ProductVariant {
  _id?: Types.ObjectId;
  sku: string;
  name: string;
  packSize: string;
  price: number;
  compareAtPrice?: number;
  availableStock: number;
  reservedStock: number;
  lowStockThreshold: number;
  images: ProductImage[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ProductDocument extends Document {
  sellerId: Types.ObjectId;
  categoryId: Types.ObjectId;
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
  inventory: {
    availableStock: number;
    reservedStock: number;
    lowStockThreshold: number;
  };
  variants: ProductVariant[];
  returnOverride?: { returnable: boolean; returnWindowDays: number };
  ratingAvg: number;
  ratingCount: number;
  status: ProductStatus;
  reviewNotes?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const imageSubSchema = new Schema<ProductImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    alt: { type: String },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const variantSubSchema = new Schema<ProductVariant>({
  sku: { type: String, required: true },
  name: { type: String, required: true },
  packSize: { type: String, required: true },
  price: { type: Number, required: true },
  compareAtPrice: { type: Number },
  availableStock: { type: Number, required: true, default: 0 },
  reservedStock: { type: Number, required: true, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  images: { type: [imageSubSchema], default: [] },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
});

const productSchema = new Schema<ProductDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    categorySnapshot: {
      name: { type: String, required: true },
      slug: { type: String, required: true },
    },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    images: { type: [imageSubSchema], default: [] },
    price: { type: Number, required: true, index: true },
    discountPercent: { type: Number, default: 0 },
    ingredients: { type: [String], default: [] },
    allergens: { type: [String], default: [] },
    weightGrams: { type: Number },
    shelfLifeDays: { type: Number },
    storageInstructions: { type: String },
    prepTimeMinutes: { type: Number },
    isVeg: { type: Boolean, required: true, index: true },
    inventory: {
      availableStock: { type: Number, required: true, default: 0 },
      reservedStock: { type: Number, required: true, default: 0 },
      lowStockThreshold: { type: Number, default: 5 },
    },
    variants: { type: [variantSubSchema], default: [] },
    returnOverride: {
      returnable: { type: Boolean },
      returnWindowDays: { type: Number },
    },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'INACTIVE'],
      default: 'DRAFT',
      index: true,
    },
    reviewNotes: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ sellerId: 1, status: 1 });
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ 'variants.sku': 1 }, { sparse: true });

export const Product = model<ProductDocument>('Product', productSchema);
