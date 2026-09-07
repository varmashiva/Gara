import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProduct } from '@/features/products/hooks';
import { useAddToCart } from '@/features/cart/hooks';
import { formatPaise } from '@/utils/currency';
import { VegBadge } from '@/components/common/VegBadge';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(id);
  const addToCart = useAddToCart();
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (isError || !product) return <p className="text-red-600">Product not found.</p>;

  const outOfStock = product.inventory.availableStock <= 0;

  async function handleAddToCart() {
    setAddedMessage(null);
    try {
      await addToCart.mutateAsync({ productId: product!._id, quantity });
      setAddedMessage('Added to cart.');
    } catch (err: any) {
      setAddedMessage(err?.response?.data?.message ?? 'Could not add to cart.');
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-orange-50">
        {product.images[0] ? (
          <img src={product.images[0].url} alt={product.images[0].alt ?? product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">🍽️</div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <VegBadge isVeg={product.isVeg} />
          <span className="text-sm text-gray-500">{product.categorySnapshot.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
        <p className="mt-2 text-2xl font-semibold text-brand-700">{formatPaise(product.price)}</p>
        <p className="mt-4 text-gray-700">{product.description}</p>

        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
          {product.ingredients.length > 0 && (
            <div className="col-span-2">
              <dt className="font-medium text-gray-900">Ingredients</dt>
              <dd className="text-gray-600">{product.ingredients.join(', ')}</dd>
            </div>
          )}
          {product.allergens.length > 0 && (
            <div className="col-span-2">
              <dt className="font-medium text-gray-900">Allergens</dt>
              <dd className="text-gray-600">{product.allergens.join(', ')}</dd>
            </div>
          )}
          {product.shelfLifeDays && (
            <div>
              <dt className="font-medium text-gray-900">Shelf life</dt>
              <dd className="text-gray-600">{product.shelfLifeDays} days</dd>
            </div>
          )}
          {product.storageInstructions && (
            <div>
              <dt className="font-medium text-gray-900">Storage</dt>
              <dd className="text-gray-600">{product.storageInstructions}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex items-center gap-3">
          <label htmlFor="qty" className="text-sm font-medium">
            Qty
          </label>
          <input
            id="qty"
            type="number"
            min={1}
            max={Math.max(product.inventory.availableStock, 1)}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            disabled={outOfStock}
          />
          <span className="text-sm text-gray-500">{product.inventory.availableStock} in stock</span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={outOfStock || addToCart.isPending}
          className="mt-4 w-full rounded-md bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50 sm:w-auto"
        >
          {outOfStock ? 'Out of stock' : addToCart.isPending ? 'Adding...' : 'Add to cart'}
        </button>
        {addedMessage && <p className="mt-2 text-sm text-gray-600">{addedMessage}</p>}
      </div>
    </div>
  );
}
