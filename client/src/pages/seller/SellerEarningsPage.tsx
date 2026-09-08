import { useQuery } from '@tanstack/react-query';
import { fetchMyEarnings, fetchEarningsSummary } from '@/features/sellers/earningsApi';
import { formatPaise } from '@/utils/currency';

export function SellerEarningsPage() {
  const { data: summary } = useQuery({ queryKey: ['seller', 'earnings', 'summary'], queryFn: fetchEarningsSummary });
  const { data: earnings, isLoading } = useQuery({ queryKey: ['seller', 'earnings'], queryFn: fetchMyEarnings });

  return (
    <div>
      {summary && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-100 bg-white p-4">
            <p className="text-sm text-gray-500">Available balance</p>
            <p className="text-xl font-semibold text-brand-700">{formatPaise(summary.availableBalance)}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-4">
            <p className="text-sm text-gray-500">Pending settlement</p>
            <p className="text-xl font-semibold">{formatPaise(summary.pendingSettlement)}</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-4">
            <p className="text-sm text-gray-500">Total paid out</p>
            <p className="text-xl font-semibold">{formatPaise(summary.totalPaid)}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white">
          {earnings?.map((e) => (
            <li key={e._id} className="flex items-center justify-between p-4 text-sm">
              <span>{new Date(e.createdAt).toLocaleDateString()}</span>
              <span className="text-gray-500">Gross {formatPaise(e.grossAmount)}</span>
              <span className="text-gray-500">Commission {formatPaise(e.commissionAmount)}</span>
              {e.refundDeduction > 0 && (
                <span className="text-red-600">Refunded {formatPaise(e.refundDeduction)}</span>
              )}
              <span className="font-medium">{formatPaise(e.netPayable)}</span>
              <span className="text-xs text-gray-400">{e.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
