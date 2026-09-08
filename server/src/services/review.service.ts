import mongoose from 'mongoose';
import { Review } from '../models/Review';
import { Order } from '../models/Order';
import { SellerFulfillment } from '../models/SellerFulfillment';
import { Product } from '../models/Product';
import { Seller } from '../models/Seller';
import { AppError } from '../utils/errors';

async function recomputeRatings(productId: mongoose.Types.ObjectId) {
  const [agg] = await Review.aggregate([
    { $match: { productId, status: 'PUBLISHED' } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const ratingAvg = agg?.avg ?? 0;
  const ratingCount = agg?.count ?? 0;

  const product = await Product.findByIdAndUpdate(productId, { ratingAvg, ratingCount }, { new: true });
  if (!product) return;

  const [sellerAgg] = await Review.aggregate([
    { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $match: { 'product.sellerId': product.sellerId, status: 'PUBLISHED' } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Seller.findByIdAndUpdate(product.sellerId, {
    ratingAvg: sellerAgg?.avg ?? 0,
    ratingCount: sellerAgg?.count ?? 0,
  });
}

export async function createReview(
  userId: string,
  input: { orderId: string; productId: string; rating: number; title?: string; comment?: string }
) {
  const order = await Order.findOne({ _id: input.orderId, customerId: userId });
  if (!order) {
    throw AppError.notFound('Order not found', 'ORDER_NOT_FOUND');
  }

  const deliveredFulfillment = await SellerFulfillment.findOne({
    orderId: order._id,
    'items.productId': input.productId,
    status: 'DELIVERED',
  });
  if (!deliveredFulfillment) {
    throw AppError.forbidden(
      'You can only review a product after it has been delivered',
      'PRODUCT_NOT_DELIVERED'
    );
  }

  let review;
  try {
    review = await Review.create({
      productId: input.productId,
      customerId: userId,
      orderId: order._id,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      verifiedPurchase: true,
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
      throw AppError.conflict('You have already reviewed this product for this order', 'REVIEW_ALREADY_EXISTS');
    }
    throw err;
  }

  await recomputeRatings(review.productId as mongoose.Types.ObjectId);
  return review;
}

export async function listProductReviews(productId: string) {
  return Review.find({ productId, status: 'PUBLISHED' }).sort({ createdAt: -1 }).lean();
}

export async function moderateReview(reviewId: string, status: 'PUBLISHED' | 'HIDDEN') {
  const review = await Review.findById(reviewId);
  if (!review) throw AppError.notFound('Review not found', 'REVIEW_NOT_FOUND');
  review.status = status;
  await review.save();
  await recomputeRatings(review.productId as mongoose.Types.ObjectId);
  return review;
}

export async function listAllReviewsForAdmin() {
  return Review.find().sort({ createdAt: -1 }).lean();
}
