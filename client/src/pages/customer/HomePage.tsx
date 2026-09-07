import { Link } from 'react-router-dom';
import { useProducts } from '@/features/products/hooks';
import { ProductCard } from '@/components/product/ProductCard';

export function HomePage() {
  const { data } = useProducts({ page: 1, limit: 4, sort: 'newest' });

  return (
    <div>
      <div className="rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 p-10 text-white">
        <h1 className="text-3xl font-bold">Fresh, homemade food from local kitchens</h1>
        <p className="mt-2 max-w-xl text-brand-50">
          Discover pickles, sweets, and snacks made by home-based sellers near you.
        </p>
        <Link
          to="/products"
          className="mt-5 inline-block rounded-md bg-white px-5 py-2.5 font-medium text-brand-700 hover:bg-orange-50"
        >
          Browse products
        </Link>
      </div>

      {data && data.items.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">New arrivals</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {data.items.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
