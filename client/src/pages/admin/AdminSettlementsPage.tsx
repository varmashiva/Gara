import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/features/admin/settlementApi';
import { formatPaise } from '@/utils/currency';

export function AdminSettlementsPage() {
  const queryClient = useQueryClient();
  const { data: sellers } = useQuery({ queryKey: ['admin', 'sellers'], queryFn: api.fetchApprovedSellers });
  const { data: settlements } = useQuery({ queryKey: ['admin', 'settlements'], queryFn: api.fetchSettlements });
  const { data: payouts } = useQuery({ queryKey: ['admin', 'payouts'], queryFn: api.fetchPayouts });
  const [selectedSeller, setSelectedSeller] = useState('');
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'settlements'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
  };

  const createMutation = useMutation({
    mutationFn: api.createSettlement,
    onSuccess: invalidate,
    onError: (err: any) => setError(err?.response?.data?.message ?? 'Could not create settlement'),
  });
  const finalizeMutation = useMutation({ mutationFn: api.finalizeSettlement, onSuccess: invalidate });
  const payoutMutation = useMutation({ mutationFn: api.createPayout, onSuccess: invalidate });
  const markPaidMutation = useMutation({ mutationFn: api.markPayoutPaid, onSuccess: invalidate });

  const payoutBySettlement = new Map(payouts?.map((p) => [p.settlementId, p]));

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <select
          value={selectedSeller}
          onChange={(e) => setSelectedSeller(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Select seller...</option>
          {sellers?.map((s) => (
            <option key={s._id} value={s._id}>
              {s.storeName}
            </option>
          ))}
        </select>
        <button
          onClick={() => selectedSeller && createMutation.mutate(selectedSeller)}
          disabled={!selectedSeller || createMutation.isPending}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Batch available earnings into settlement
        </button>
      </div>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <ul className="space-y-3">
        {settlements?.map((s) => {
          const payout = payoutBySettlement.get(s._id);
          return (
            <li key={s._id} className="rounded-lg border border-gray-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{formatPaise(s.totalAmount)}</p>
                  <p className="text-sm text-gray-500">
                    {s.earningsCount} earnings · {s.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  {s.status === 'DRAFT' && (
                    <button
                      onClick={() => finalizeMutation.mutate(s._id)}
                      className="rounded-md border border-brand-600 px-3 py-1.5 text-xs font-medium text-brand-700"
                    >
                      Finalize
                    </button>
                  )}
                  {s.status === 'FINALIZED' && !payout && (
                    <button
                      onClick={() => payoutMutation.mutate(s._id)}
                      className="rounded-md border border-brand-600 px-3 py-1.5 text-xs font-medium text-brand-700"
                    >
                      Create payout
                    </button>
                  )}
                  {payout && payout.status !== 'PAID' && (
                    <button
                      onClick={() => markPaidMutation.mutate(payout._id)}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Mark payout paid
                    </button>
                  )}
                  {payout?.status === 'PAID' && <span className="text-xs text-green-700">Paid out</span>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
