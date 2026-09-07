import { useState } from 'react';
import { useProducts, useCategories } from '@/features/products/hooks';
import { ProductCard } from '@/components/product/ProductCard';
import { Pagination } from '@/components/common/Pagination';
import { ProductQuery } from '@/types/product';

export function ProductListPage() {
  const [query, setQuery] = useState<ProductQuery>({ page: 1, limit: 12, sort: 'newest' });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, isError } = useProducts(query);
  const { data: categories } = useCategories();

  function updateQuery(patch: Partial<ProductQuery>) {
    setQuery((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-brand-700">Browse products</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateQuery({ search: searchInput || undefined });
        }}
        className="mb-6 flex flex-wrap gap-3"
      >
        <input
          type="search"
          placeholder="Search for pickles, sweets, snacks..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="min-w-[220px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          aria-label="Search products"
        />
        <select
          value={query.category ?? ''}
          onChange={(e) => updateQuery({ category: e.target.value || undefined })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c._id} value={c._id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <select
          value={query.isVeg === undefined ? '' : String(query.isVeg)}
          onChange={(e) => updateQuery({ isVeg: e.target.value === '' ? undefined : e.target.value === 'true' })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          aria-label="Filter by veg/non-veg"
        >
          <option value="">Veg &amp; Non-veg</option>
          <option value="true">Veg only</option>
          <option value="false">Non-veg only</option>
        </select>
        <select
          value={query.sort}
          onChange={(e) => updateQuery({ sort: e.target.value as ProductQuery['sort'] })}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          aria-label="Sort products"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white">
          Search
        </button>
      </form>

      {isLoading && <p className="text-gray-500">Loading products...</p>}
      {isError && <p className="text-red-600">Failed to load products.</p>}

      {data && data.items.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
          No products match your filters.
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onChange={(page) => updateQuery({ page })}
          />
        </>
      )}
    </div>
  );
}
