import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts, useCategories } from '@/features/products/hooks';
import { ProductCard } from '@/components/product/ProductCard';
import { Pagination } from '@/components/common/Pagination';
import { ProductQuery } from '@/types/product';

export function ProductListPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState<ProductQuery>({
    page: 1,
    limit: 12,
    sort: 'newest',
    category: searchParams.get('category') ?? undefined,
  });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, isError } = useProducts(query);
  const { data: categories } = useCategories();

  function updateQuery(patch: Partial<ProductQuery>) {
    setQuery((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-300">Full menu</p>
      <h1 className="mb-6 mt-1 font-display text-3xl font-semibold text-paper-50">Browse products</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateQuery({ search: searchInput || undefined });
        }}
        className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <input
          type="search"
          placeholder="Search for pickles, sweets, snacks..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="input sm:min-w-[220px] sm:flex-1"
          aria-label="Search products"
        />
        <div className="grid grid-cols-2 gap-3 sm:contents">
          <select
            value={query.category ?? ''}
            onChange={(e) => updateQuery({ category: e.target.value || undefined })}
            className="input sm:w-auto"
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
            className="input sm:w-auto"
            aria-label="Filter by veg/non-veg"
          >
            <option value="">Veg &amp; Non-veg</option>
            <option value="true">Veg only</option>
            <option value="false">Non-veg only</option>
          </select>
        </div>
        <select
          value={query.sort}
          onChange={(e) => updateQuery({ sort: e.target.value as ProductQuery['sort'] })}
          className="input sm:w-auto"
          aria-label="Sort products"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
        <button type="submit" className="btn-pill-primary justify-center sm:!px-5 sm:!py-2">
          Search
        </button>
      </form>

      {isLoading && <p className="text-paper-600">Loading products...</p>}
      {isError && <p className="text-brand-300">Failed to load products.</p>}

      {data && data.items.length === 0 && (
        <div className="rounded-xl2 border border-dashed border-paper-50/20 p-10 text-center text-paper-400">
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
