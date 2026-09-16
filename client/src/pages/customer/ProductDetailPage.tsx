import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useProduct } from '@/features/products/hooks';
import { useAddToCart } from '@/features/cart/hooks';
import { useAuth } from '@/features/auth/AuthContext';
import { formatPaise } from '@/utils/currency';
import { VegBadge } from '@/components/common/VegBadge';
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(id);
  const addToCart = useAddToCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [product?._id]);

  if (isLoading) return <p className="text-paper-600">Loading...</p>;
  if (isError || !product) return <p className="text-brand-300">Product not found.</p>;

  const outOfStock = product.inventory.availableStock <= 0;
  const images = product.images;
  const selectedImage = images[activeImage] ?? images[0];

  async function handleAddToCart() {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setAddedMessage(null);
    try {
      await addToCart.mutateAsync({ productId: product!._id, quantity });
      setAddedMessage('Added to cart.');
    } catch (err: any) {
      setAddedMessage(err?.response?.data?.message ?? 'Could not add to cart.');
    }
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div>
        <div className="aspect-[4/3] overflow-hidden rounded-xl2 bg-surface-200">
          {selectedImage ? (
            <img
              src={selectedImage.url}
              alt={selectedImage.alt ?? product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlaceholder />
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {images.map((img, i) => (
              <button
                key={img.publicId}
                onClick={() => setActiveImage(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === activeImage}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === activeImage ? 'border-brand-500' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img.url} alt={img.alt ?? product.name} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <VegBadge isVeg={product.isVeg} />
          <span className="text-sm text-paper-600">{product.categorySnapshot.name}</span>
        </div>
        <h1 className="font-display text-3xl font-semibold text-paper-50">{product.name}</h1>
        <p className="mt-2 text-2xl font-semibold text-brand-300">{formatPaise(product.price)}</p>
        <p className="mt-4 text-paper-400">{product.description}</p>

        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
          {product.ingredients.length > 0 && (
            <div className="col-span-2">
              <dt className="font-medium text-paper-50">Ingredients</dt>
              <dd className="text-paper-400">{product.ingredients.join(', ')}</dd>
            </div>
          )}
          {product.allergens.length > 0 && (
            <div className="col-span-2">
              <dt className="font-medium text-paper-50">Allergens</dt>
              <dd className="text-paper-400">{product.allergens.join(', ')}</dd>
            </div>
          )}
          {product.shelfLifeDays && (
            <div>
              <dt className="font-medium text-paper-50">Shelf life</dt>
              <dd className="text-paper-400">{product.shelfLifeDays} days</dd>
            </div>
          )}
          {product.storageInstructions && (
            <div>
              <dt className="font-medium text-paper-50">Storage</dt>
              <dd className="text-paper-400">{product.storageInstructions}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex items-center gap-3">
          <label htmlFor="qty" className="text-sm font-medium text-paper-200">
            Qty
          </label>
          <input
            id="qty"
            type="number"
            min={1}
            max={Math.max(product.inventory.availableStock, 1)}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="input w-20"
            disabled={outOfStock}
          />
          <span className="text-sm text-paper-600">{product.inventory.availableStock} in stock</span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={outOfStock || addToCart.isPending}
          className="btn-pill-primary mt-6 disabled:opacity-50"
        >
          {outOfStock ? 'Out of stock' : addToCart.isPending ? 'Adding...' : 'Add to cart'}
        </button>
        {addedMessage && <p className="mt-2 text-sm text-paper-400">{addedMessage}</p>}
      </div>
    </div>
  );
}
