import { Seller, SellerDocument } from '../models/Seller';
import { SellerApplication } from '../models/SellerApplication';
import { User } from '../models/User';
import { AppError } from '../utils/errors';
import { slugify } from '../utils/slugify';
import { env } from '../config/env';
import { SellerApplicationInput, ApplicationDecisionInput } from '../schemas/seller.schema';
import { notify } from './notification.service';

async function generateUniqueSlug(storeName: string): Promise<string> {
  const base = slugify(storeName) || 'store';
  let slug = base;
  let attempt = 0;
  // Small bounded retry loop — collisions are rare, and this only runs at
  // application time, not on every request.
  while (await Seller.exists({ storeSlug: slug })) {
    attempt += 1;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    if (attempt > 5) break;
  }
  return slug;
}

export async function applyToBecomeSeller(userId: string, input: SellerApplicationInput) {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) {
    throw AppError.notFound('User not found', 'USER_NOT_FOUND');
  }
  if (user.role === 'SELLER') {
    throw AppError.conflict('This account is already an approved seller', 'ALREADY_SELLER');
  }

  const existingPending = await SellerApplication.findOne({ userId, status: 'PENDING' });
  if (existingPending) {
    throw AppError.conflict('You already have a pending seller application', 'APPLICATION_PENDING');
  }

  const application = await SellerApplication.create({
    userId,
    storeName: input.storeName,
    ownerName: input.ownerName,
    phone: input.phone,
    email: input.email,
    address: input.address,
    description: input.description,
    foodCategories: input.foodCategories,
    businessDetails: input.businessDetails,
    status: 'PENDING',
  });

  let seller = await Seller.findOne({ userId });
  if (seller) {
    // Re-application after a prior rejection — reuse the same Seller
    // document (unique per user) rather than creating a duplicate.
    seller.storeName = input.storeName;
    seller.foodCategories = input.foodCategories;
    seller.description = input.description;
    seller.status = 'PENDING';
    seller.applicationId = application._id as typeof seller.applicationId;
    await seller.save();
  } else {
    const storeSlug = await generateUniqueSlug(input.storeName);
    seller = await Seller.create({
      userId,
      storeName: input.storeName,
      storeSlug,
      description: input.description,
      foodCategories: input.foodCategories,
      status: 'PENDING',
      commissionRate: env.DEFAULT_COMMISSION_RATE_BPS,
      applicationId: application._id,
    });
  }

  return { application, seller };
}

export async function getMySellerStatus(userId: string) {
  const seller = await Seller.findOne({ userId });
  if (!seller) {
    return { hasApplied: false, seller: null };
  }
  return { hasApplied: true, seller };
}

export async function listApplications(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
  const filter = status ? { status } : {};
  return SellerApplication.find(filter).sort({ createdAt: -1 }).lean();
}

export async function decideApplication(
  applicationId: string,
  adminUserId: string,
  input: ApplicationDecisionInput
) {
  const application = await SellerApplication.findById(applicationId);
  if (!application) {
    throw AppError.notFound('Application not found', 'APPLICATION_NOT_FOUND');
  }
  if (application.status !== 'PENDING') {
    throw AppError.conflict('This application has already been decided', 'APPLICATION_ALREADY_DECIDED');
  }

  const seller = await Seller.findOne({ userId: application.userId });
  if (!seller) {
    throw AppError.notFound('Seller record not found for this application', 'SELLER_NOT_FOUND');
  }

  application.status = input.decision;
  application.reviewedBy = adminUserId as unknown as typeof application.reviewedBy;
  application.reviewNotes = input.reviewNotes;
  await application.save();

  seller.status = input.decision;
  await seller.save();

  if (input.decision === 'APPROVED') {
    await User.updateOne({ _id: application.userId }, { role: 'SELLER' });
  }

  await notify(
    application.userId.toString(),
    input.decision === 'APPROVED' ? 'SELLER_APPROVED' : 'SELLER_REJECTED',
    input.decision === 'APPROVED' ? 'Your seller application was approved' : 'Your seller application was rejected',
    input.decision === 'APPROVED'
      ? 'Congratulations — you can now list products on the marketplace.'
      : `Your application was not approved.${input.reviewNotes ? ` Notes: ${input.reviewNotes}` : ''}`
  );

  return { application, seller };
}

export async function suspendSeller(sellerId: string): Promise<SellerDocument> {
  const seller = await Seller.findById(sellerId);
  if (!seller) {
    throw AppError.notFound('Seller not found', 'SELLER_NOT_FOUND');
  }
  if (seller.status !== 'APPROVED') {
    throw AppError.conflict('Only an approved seller can be suspended', 'INVALID_SELLER_STATE');
  }
  seller.status = 'SUSPENDED';
  await seller.save();
  return seller;
}

export async function getSellerByUserId(userId: string): Promise<SellerDocument> {
  const seller = await Seller.findOne({ userId });
  if (!seller) {
    throw AppError.notFound('Seller profile not found', 'SELLER_NOT_FOUND');
  }
  return seller;
}

export async function listApprovedSellers() {
  return Seller.find({ status: 'APPROVED', isDeleted: false }).select('storeName storeSlug commissionRate');
}
