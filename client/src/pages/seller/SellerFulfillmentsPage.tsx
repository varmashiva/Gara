import { useMyFulfillments, useUpdateFulfillmentStatus } from '@/features/sellers/fulfillmentHooks';
import { formatPaise } from '@/utils/currency';
import { NEXT_STATUS } from '@/types/fulfillment';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-yellow-100 text-yellow-700',
  READY_TO_SHIP: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  FAILED: 'bg-red-100 text-red-700',
};

export function SellerFulfillmentsPage() {
  const { data: fulfillments, isLoading } = useMyFulfillments();
  const updateStatus = useUpdateFulfillmentStatus();

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!fulfillments || fulfillments.length === 0) {
    return <p className="text-gray-600">No orders yet.</p>;
  }

  return (
    <div className="space-y-4">
      {fulfillments.map((f) => {
        const total = f.items.reduce((sum, item) => sum + item.subtotal, 0);
        const nextOptions = NEXT_STATUS[f.status] ?? [];
        return (
          <div key={f._id} className="rounded-lg border border-gray-100 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[f.status]}`}>
                {f.status.replace(/_/g, ' ')}
              </span>
              <span className="text-sm text-gray-500">{new Date(f.createdAt).toLocaleString()}</span>
            </div>
            <ul className="mb-3 space-y-1 text-sm text-gray-700">
              {f.items.map((item, i) => (
                <li key={i} className="flex justify-between">
                  <span>
                    {item.productName}
                    {item.variantName ? ` (${item.variantName})` : ''} × {item.quantity}
                  </span>
                  <span>{formatPaise(item.subtotal)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between">
              <span className="font-medium">{formatPaise(total)}</span>
              <div className="flex gap-2">
                {nextOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatus.mutate({ id: f._id, status })}
                    disabled={updateStatus.isPending}
                    className="rounded-md border border-brand-600 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
                  >
                    Mark {status.replace(/_/g, ' ').toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
