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
      className="group flex flex-col overflow-hidden rounded-xl2 border border-paper-50/10 bg-surface-50 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="aspect-[4/3] overflow-hidden bg-surface-200">
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
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-center gap-2">
          <VegBadge isVeg={product.isVeg} />
          <span className="text-xs text-paper-600">{product.categorySnapshot.name}</span>
        </div>
        <h3 className="font-display font-medium text-paper-50">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-semibold text-brand-300">{formatPaise(product.price)}</span>
          {outOfStock && <span className="text-xs font-medium text-brand-300">Out of stock</span>}
        </div>
      </div>
    </Link>
  );
}
