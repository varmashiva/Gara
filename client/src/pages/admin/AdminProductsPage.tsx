import { useAdminProducts, useDecideProduct } from '@/features/admin/hooks';
import { formatPaise } from '@/utils/currency';

export function AdminProductsPage() {
  const { data, isLoading } = useAdminProducts('PENDING_REVIEW');
  const decide = useDecideProduct();

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!data || data.length === 0) return <p className="text-gray-600">No products pending review.</p>;

  return (
    <ul className="space-y-3">
      {data.map((product) => (
        <li key={product._id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-4">
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-gray-600">{formatPaise(product.price)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => decide.mutate({ id: product._id, decision: 'APPROVED' })}
              disabled={decide.isPending}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => decide.mutate({ id: product._id, decision: 'REJECTED' })}
              disabled={decide.isPending}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
