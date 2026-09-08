import { Link } from 'react-router-dom';
import { Product } from '@/types/product';
import { formatPaise } from '@/utils/currency';
import { VegBadge } from '@/components/common/VegBadge';
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder';

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.inventory.availableStock <= 0;

  return (
    <Link
      to={`/products/${product._id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-orange-100 bg-white transition hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-orange-50">
        {product.images[0] ? (
          <img
            src={product.images[0].url}
            alt={product.images[0].alt ?? product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <ImagePlaceholder />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-center gap-2">
          <VegBadge isVeg={product.isVeg} />
          <span className="text-xs text-gray-500">{product.categorySnapshot.name}</span>
        </div>
        <h3 className="font-medium text-gray-900">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold text-brand-700">{formatPaise(product.price)}</span>
          {outOfStock && <span className="text-xs font-medium text-red-600">Out of stock</span>}
        </div>
      </div>
    </Link>
  );
}
