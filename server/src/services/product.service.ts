import { FilterQuery } from 'mongoose';
import { Product, ProductDocument } from '../models/Product';
import { Category } from '../models/Category';
import { AppError } from '../utils/errors';
import { slugify } from '../utils/slugify';
import { getSellerByUserId, getOrCreateHouseSeller } from './seller.service';
import { storageProvider } from '../integrations/storage/storageProviderFactory';
import { recordAudit } from './audit.service';
import { CreateProductInput, UpdateProductInput, ProductQueryInput } from '../schemas/product.schema';

const MAX_IMAGES_PER_PRODUCT = 8;

async function generateUniqueProductSlug(name: string): Promise<string> {
  const base = slugify(name) || 'product';
  let slug = base;
  let attempt = 0;
  while (await Product.exists({ slug })) {
    attempt += 1;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    if (attempt > 5) break;
  }
  return slug;
}

async function requireApprovedSeller(userId: string) {
  const seller = await getSellerByUserId(userId);
  if (seller.status !== 'APPROVED') {
    throw AppError.forbidden('Only an approved seller can manage products', 'SELLER_NOT_APPROVED');
  }
  return seller;
}

async function requireActiveCategory(categoryId: string) {
  const category = await Category.findOne({ _id: categoryId, isDeleted: false, isActive: true });
  if (!category) {
    throw AppError.badRequest('Invalid category', 'INVALID_CATEGORY');
  }
  return category;
}

function toVariantSubdocs(variants: CreateProductInput['variants']) {
  return (variants ?? []).map((v) => ({
    sku: v.sku,
    name: v.name,
    packSize: v.packSize,
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    availableStock: v.availableStock,
    reservedStock: 0,
    lowStockThreshold: v.lowStockThreshold ?? 5,
    images: [],
    status: 'ACTIVE' as const,
  }));
}

export async function createProduct(userId: string, input: CreateProductInput) {
  const seller = await requireApprovedSeller(userId);
  const category = await requireActiveCategory(input.categoryId);
  const slug = await generateUniqueProductSlug(input.name);

  return Product.create({
    sellerId: seller._id,
    categoryId: category._id,
    categorySnapshot: { name: category.name, slug: category.slug },
    name: input.name,
    slug,
    description: input.description,
    price: input.price,
    discountPercent: input.discountPercent,
    ingredients: input.ingredients,
    allergens: input.allergens,
    weightGrams: input.weightGrams,
    shelfLifeDays: input.shelfLifeDays,
    storageInstructions: input.storageInstructions,
    prepTimeMinutes: input.prepTimeMinutes,
    isVeg: input.isVeg,
    inventory: {
      availableStock: input.availableStock,
      reservedStock: 0,
      lowStockThreshold: input.lowStockThreshold,
    },
    variants: toVariantSubdocs(input.variants),
    status: 'DRAFT',
  });
}

export async function adminCreateProduct(adminUserId: string, input: CreateProductInput) {
  const seller = await getOrCreateHouseSeller(adminUserId);
  const category = await requireActiveCategory(input.categoryId);
  const slug = await generateUniqueProductSlug(input.name);

  const product = await Product.create({
    sellerId: seller._id,
    categoryId: category._id,
    categorySnapshot: { name: category.name, slug: category.slug },
    name: input.name,
    slug,
    description: input.description,
    price: input.price,
    discountPercent: input.discountPercent,
    ingredients: input.ingredients,
    allergens: input.allergens,
    weightGrams: input.weightGrams,
    shelfLifeDays: input.shelfLifeDays,
    storageInstructions: input.storageInstructions,
    prepTimeMinutes: input.prepTimeMinutes,
    isVeg: input.isVeg,
    inventory: {
      availableStock: input.availableStock,
      reservedStock: 0,
      lowStockThreshold: input.lowStockThreshold,
    },
    variants: toVariantSubdocs(input.variants),
    // Admin manages the catalog directly — no seller-submission review loop.
    status: 'APPROVED',
  });

  recordAudit({
    actorId: adminUserId,
    actorRole: 'ADMIN',
    action: 'PRODUCT_CREATED_BY_ADMIN',
    entityType: 'Product',
    entityId: product.id,
  });

  return product;
}

async function findOwnedProduct(userId: string, productId: string): Promise<ProductDocument> {
  const seller = await getSellerByUserId(userId);
  const product = await Product.findOne({ _id: productId, sellerId: seller._id, isDeleted: false });
  if (!product) {
    throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  }
  return product;
}

async function applyProductUpdate(product: ProductDocument, input: UpdateProductInput) {
  if (input.categoryId && input.categoryId !== String(product.categoryId)) {
    const category = await requireActiveCategory(input.categoryId);
    product.categoryId = category._id as typeof product.categoryId;
    product.categorySnapshot = { name: category.name, slug: category.slug };
  }

  const { categoryId: _categoryId, availableStock, lowStockThreshold, variants, ...rest } = input;
  Object.assign(product, rest);

  if (availableStock !== undefined) product.inventory.availableStock = availableStock;
  if (lowStockThreshold !== undefined) product.inventory.lowStockThreshold = lowStockThreshold;
  if (variants) product.variants = toVariantSubdocs(variants) as typeof product.variants;

  await product.save();
}

async function findAnyProduct(productId: string): Promise<ProductDocument> {
  const product = await Product.findOne({ _id: productId, isDeleted: false });
  if (!product) {
    throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  }
  return product;
}

export async function updateProduct(userId: string, productId: string, input: UpdateProductInput) {
  const product = await findOwnedProduct(userId, productId);
  await applyProductUpdate(product, input);
  return product;
}

export async function adminUpdateProduct(adminUserId: string, productId: string, input: UpdateProductInput) {
  const product = await findAnyProduct(productId);
  await applyProductUpdate(product, input);

  recordAudit({
    actorId: adminUserId,
    actorRole: 'ADMIN',
    action: 'PRODUCT_UPDATED_BY_ADMIN',
    entityType: 'Product',
    entityId: product.id,
  });

  return product;
}

export async function submitForReview(userId: string, productId: string) {
  const product = await findOwnedProduct(userId, productId);
  if (product.status !== 'DRAFT' && product.status !== 'REJECTED') {
    throw AppError.conflict('Only a draft or rejected product can be submitted for review', 'INVALID_PRODUCT_STATE');
  }
  product.status = 'PENDING_REVIEW';
  await product.save();
  return product;
}

export async function deactivateProduct(userId: string, productId: string) {
  const product = await findOwnedProduct(userId, productId);
  if (product.status !== 'APPROVED') {
    throw AppError.conflict('Only an approved product can be deactivated', 'INVALID_PRODUCT_STATE');
  }
  product.status = 'INACTIVE';
  await product.save();
  return product;
}

export async function reactivateProduct(userId: string, productId: string) {
  const product = await findOwnedProduct(userId, productId);
  if (product.status !== 'INACTIVE') {
    throw AppError.conflict('Only an inactive product can be reactivated', 'INVALID_PRODUCT_STATE');
  }
  product.status = 'APPROVED';
  await product.save();
  return product;
}

async function softDeleteProduct(product: ProductDocument, deletedByUserId: string) {
  product.isDeleted = true;
  product.deletedAt = new Date();
  product.deletedBy = deletedByUserId as unknown as typeof product.deletedBy;
  await product.save();
}

export async function deleteProduct(userId: string, productId: string) {
  const product = await findOwnedProduct(userId, productId);
  await softDeleteProduct(product, userId);
}

export async function adminDeleteProduct(adminUserId: string, productId: string) {
  const product = await findAnyProduct(productId);
  await softDeleteProduct(product, adminUserId);

  recordAudit({
    actorId: adminUserId,
    actorRole: 'ADMIN',
    action: 'PRODUCT_DELETED_BY_ADMIN',
    entityType: 'Product',
    entityId: product.id,
  });
}

export async function listMyProducts(userId: string) {
  const seller = await getSellerByUserId(userId);
  return Product.find({ sellerId: seller._id, isDeleted: false }).sort({ createdAt: -1 });
}

export async function listPublicProducts(query: ProductQueryInput) {
  const filter: FilterQuery<ProductDocument> = { status: 'APPROVED', isDeleted: false };

  if (query.search) filter.$text = { $search: query.search };
  if (query.category) filter.categoryId = query.category;
  if (query.seller) filter.sellerId = query.seller;
  if (query.isVeg !== undefined) filter.isVeg = query.isVeg;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
    if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
  }

  const sortMap: Record<ProductQueryInput['sort'], Record<string, 1 | -1>> = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    newest: { createdAt: -1 },
    rating: { ratingAvg: -1 },
  };

  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    Product.find(filter).sort(sortMap[query.sort]).skip(skip).limit(query.limit).lean(),
    Product.countDocuments(filter),
  ]);

  return {
    items,
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
  };
}

export async function getPublicProductById(id: string) {
  const product = await Product.findOne({ _id: id, status: 'APPROVED', isDeleted: false }).lean();
  if (!product) {
    throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  }
  return product;
}

export async function listForModeration(status?: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED') {
  const filter: FilterQuery<ProductDocument> = { isDeleted: false };
  if (status) filter.status = status;
  return Product.find(filter).sort({ createdAt: -1 }).lean();
}

export async function decideProductStatus(
  adminUserId: string,
  productId: string,
  input: { decision: 'APPROVED' | 'REJECTED'; reviewNotes?: string }
) {
  const product = await Product.findOne({ _id: productId, isDeleted: false });
  if (!product) {
    throw AppError.notFound('Product not found', 'PRODUCT_NOT_FOUND');
  }
  if (product.status !== 'PENDING_REVIEW') {
    throw AppError.conflict('Only a product pending review can be decided', 'INVALID_PRODUCT_STATE');
  }
  product.status = input.decision;
  product.reviewNotes = input.reviewNotes;
  await product.save();

  recordAudit({
    actorId: adminUserId,
    actorRole: 'ADMIN',
    action: input.decision === 'APPROVED' ? 'PRODUCT_APPROVED' : 'PRODUCT_REJECTED',
    entityType: 'Product',
    entityId: product.id,
  });

  return product;
}

export async function addProductImage(userId: string, productId: string, file: Express.Multer.File) {
  const product = await findOwnedProduct(userId, productId);
  if (product.images.length >= MAX_IMAGES_PER_PRODUCT) {
    throw AppError.badRequest(`A product can have at most ${MAX_IMAGES_PER_PRODUCT} images`, 'TOO_MANY_IMAGES');
  }

  const { url, publicId } = await storageProvider.upload({
    buffer: file.buffer,
    mimeType: file.mimetype,
    folder: `products/${product.id}`,
  });

  product.images.push({ url, publicId, order: product.images.length });
  await product.save();
  return product;
}

export async function removeProductImage(userId: string, productId: string, publicId: string) {
  const product = await findOwnedProduct(userId, productId);
  const index = product.images.findIndex((img) => img.publicId === publicId);
  if (index === -1) {
    throw AppError.notFound('Image not found on this product', 'IMAGE_NOT_FOUND');
  }

  await storageProvider.delete(publicId);
  product.images.splice(index, 1);
  await product.save();
  return product;
}
