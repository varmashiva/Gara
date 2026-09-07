import { Wishlist } from '../models/Wishlist';
import { Product } from '../models/Product';
import { AppError } from '../utils/errors';
import { addItem as addCartItem } from './cart.service';
import { MoveToCartInput } from '../schemas/wishlist.schema';

export async function getWishlist(userId: string) {
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist || wishlist.productIds.length === 0) {
    return { items: [] };
  }

  const products = await Product.find({ _id: { $in: wishlist.productIds } }).lean();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const items = wishlist.productIds.map((id) => {
    const product = byId.get(id.toString());
    const isAvailable = !!product && !product.isDeleted && product.status === 'APPROVED';
    return {
      productId: id.toString(),
      name: product?.name ?? 'No longer available',
      image: product?.images?.[0]?.url,
      price: product?.price,
      available: isAvailable,
    };
  });

  return { items };
}

export async function addToWishlist(userId: string, productId: string) {
  const product = await Product.findOne({ _id: productId, status: 'APPROVED', isDeleted: false });
  if (!product) {
    throw AppError.badRequest('Product is not available', 'PRODUCT_UNAVAILABLE');
  }

  await Wishlist.updateOne({ userId }, { $addToSet: { productIds: productId } }, { upsert: true });
  return getWishlist(userId);
}

export async function removeFromWishlist(userId: string, productId: string) {
  await Wishlist.updateOne({ userId }, { $pull: { productIds: productId } });
  return getWishlist(userId);
}

export async function moveToCart(userId: string, productId: string, input: MoveToCartInput) {
  // addItem validates availability itself and throws if the product/variant
  // can't actually be added — we only remove from the wishlist after that
  // succeeds, so an unavailable item is never silently dropped.
  const cart = await addCartItem(
    { userId },
    { productId, variantId: input.variantId, quantity: input.quantity }
  );
  await Wishlist.updateOne({ userId }, { $pull: { productIds: productId } });
  return cart;
}
