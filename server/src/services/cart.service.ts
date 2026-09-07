import { Cart, CartDocument, CartItem } from '../models/Cart';
import { Product } from '../models/Product';
import { AppError } from '../utils/errors';
import { CartOwner } from '../middleware/cart.middleware';
import { AddCartItemInput, UpdateCartItemInput } from '../schemas/cart.schema';
import { FLAT_DELIVERY_FEE } from '../config/pricing';

function ownerFilter(owner: CartOwner) {
  return 'userId' in owner ? { userId: owner.userId } : { guestToken: owner.guestToken };
}

async function resolveProductAndVariant(productId: string, variantId?: string) {
  const product = await Product.findOne({ _id: productId, status: 'APPROVED', isDeleted: false });
  if (!product) {
    throw AppError.badRequest('Product is not available', 'PRODUCT_UNAVAILABLE');
  }

  if (variantId) {
    const variant = product.variants.find((v) => v._id?.toString() === variantId);
    if (!variant || variant.status !== 'ACTIVE') {
      throw AppError.badRequest('Product variant is not available', 'VARIANT_UNAVAILABLE');
    }
    return { product, variant };
  }

  return { product, variant: null };
}

function effectiveUnitPrice(product: { price: number; discountPercent: number }, variant: { price: number } | null) {
  if (variant) return variant.price;
  return Math.round(product.price * (1 - product.discountPercent / 100));
}

export async function getCart(owner: CartOwner) {
  const cart = await Cart.findOne(ownerFilter(owner));
  return buildCartView(cart);
}

export async function addItem(owner: CartOwner, input: AddCartItemInput) {
  const { product, variant } = await resolveProductAndVariant(input.productId, input.variantId);

  const cart = (await Cart.findOne(ownerFilter(owner))) ?? new Cart({ ...ownerFilter(owner), items: [] });

  const existing = cart.items.find(
    (item) => item.productId.toString() === input.productId && (item.variantId?.toString() ?? null) === (input.variantId ?? null)
  );

  const requestedTotalQty = (existing?.quantity ?? 0) + input.quantity;
  const availableStock = variant ? variant.availableStock : product.inventory.availableStock;
  if (requestedTotalQty > availableStock) {
    throw AppError.badRequest(`Only ${availableStock} in stock`, 'INSUFFICIENT_STOCK');
  }

  const unitPrice = effectiveUnitPrice(product, variant);

  if (existing) {
    existing.quantity = requestedTotalQty;
    existing.priceSnapshot = unitPrice;
  } else {
    cart.items.push({
      productId: product._id as CartItem['productId'],
      variantId: variant?._id as CartItem['variantId'],
      sellerId: product.sellerId as CartItem['sellerId'],
      quantity: input.quantity,
      priceSnapshot: unitPrice,
    });
  }

  await cart.save();
  return buildCartView(cart);
}

async function findOwnedCartAndItem(owner: CartOwner, itemId: string) {
  const cart = await Cart.findOne(ownerFilter(owner));
  const item = cart?.items.find((i) => i._id?.toString() === itemId);
  if (!cart || !item) {
    throw AppError.notFound('Cart item not found', 'CART_ITEM_NOT_FOUND');
  }
  return { cart, item };
}

export async function updateItemQuantity(owner: CartOwner, itemId: string, input: UpdateCartItemInput) {
  const { cart, item } = await findOwnedCartAndItem(owner, itemId);

  const { variant } = await resolveProductAndVariant(item.productId.toString(), item.variantId?.toString());
  const availableStock = variant ? variant.availableStock : (await Product.findById(item.productId))!.inventory.availableStock;
  if (input.quantity > availableStock) {
    throw AppError.badRequest(`Only ${availableStock} in stock`, 'INSUFFICIENT_STOCK');
  }

  item.quantity = input.quantity;
  await cart.save();
  return buildCartView(cart);
}

export async function removeItem(owner: CartOwner, itemId: string) {
  const { cart } = await findOwnedCartAndItem(owner, itemId);
  cart.items.pull({ _id: itemId });
  await cart.save();
  return buildCartView(cart);
}

export async function clearCart(owner: CartOwner) {
  await Cart.updateOne(ownerFilter(owner), { items: [] });
  return buildCartView(null);
}

export async function mergeGuestCartIntoUser(guestToken: string, userId: string) {
  const guestCart = await Cart.findOne({ guestToken });
  if (!guestCart || guestCart.items.length === 0) return;

  const userCart = (await Cart.findOne({ userId })) ?? new Cart({ userId, items: [] });

  for (const guestItem of guestCart.items) {
    const existing = userCart.items.find(
      (item) =>
        item.productId.toString() === guestItem.productId.toString() &&
        (item.variantId?.toString() ?? null) === (guestItem.variantId?.toString() ?? null)
    );
    if (existing) {
      existing.quantity += guestItem.quantity;
    } else {
      userCart.items.push(guestItem);
    }
  }

  await userCart.save();
  await guestCart.deleteOne();
}

async function buildCartView(cart: CartDocument | null) {
  const items = cart?.items ?? [];

  const resolved = await Promise.all(
    items.map(async (item) => {
      const product = await Product.findById(item.productId).lean();
      const variant = item.variantId
        ? product?.variants.find((v) => v._id?.toString() === item.variantId?.toString())
        : null;

      const isAvailable =
        !!product &&
        !product.isDeleted &&
        product.status === 'APPROVED' &&
        (item.variantId
          ? !!variant && variant.status === 'ACTIVE' && variant.availableStock >= item.quantity
          : product.inventory.availableStock >= item.quantity);

      const unitPrice = product ? effectiveUnitPrice(product, variant ?? null) : item.priceSnapshot;

      return {
        itemId: item._id?.toString(),
        productId: item.productId.toString(),
        variantId: item.variantId?.toString(),
        sellerId: item.sellerId.toString(),
        name: product?.name ?? 'Unavailable product',
        image: product?.images?.[0]?.url,
        unitPrice,
        quantity: item.quantity,
        lineTotal: isAvailable ? unitPrice * item.quantity : 0,
        available: isAvailable,
        unavailableReason: isAvailable ? undefined : 'Out of stock or no longer available',
      };
    })
  );

  const subtotal = resolved.reduce((sum, item) => sum + item.lineTotal, 0);
  const deliveryFee = subtotal > 0 ? FLAT_DELIVERY_FEE : 0;

  return {
    items: resolved,
    subtotal,
    deliveryFee,
    grandTotal: subtotal + deliveryFee,
  };
}
