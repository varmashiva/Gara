import { Seller, SellerDocument } from '../models/Seller';
import { AppError } from '../utils/errors';
import { slugify } from '../utils/slugify';

async function generateUniqueSlug(storeName: string): Promise<string> {
  const base = slugify(storeName) || 'store';
  let slug = base;
  let attempt = 0;
  // Small bounded retry loop — collisions are rare, and this only runs the
  // first time a given admin's house seller record is provisioned.
  while (await Seller.exists({ storeSlug: slug })) {
    attempt += 1;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    if (attempt > 5) break;
  }
  return slug;
}

export async function getSellerByUserId(userId: string): Promise<SellerDocument> {
  const seller = await Seller.findOne({ userId });
  if (!seller) {
    throw AppError.notFound('Seller profile not found', 'SELLER_NOT_FOUND');
  }
  return seller;
}

/**
 * Gara has no independent seller accounts — the admin manages the single
 * product catalog directly. Every product/fulfillment/earnings/pickup-location
 * code path below this still keys off a `Seller` document (via sellerId), so
 * rather than rewrite that plumbing, each admin gets one auto-provisioned
 * "house" Seller record the first time they touch an admin catalog route.
 */
export async function getOrCreateHouseSeller(adminUserId: string): Promise<SellerDocument> {
  const existing = await Seller.findOne({ userId: adminUserId });
  if (existing) return existing;

  const storeSlug = await generateUniqueSlug('Gara Kitchen');
  return Seller.create({
    userId: adminUserId,
    storeName: 'Gara Kitchen',
    storeSlug,
    status: 'APPROVED',
    commissionRate: 0,
  });
}
