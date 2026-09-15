import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/features/admin/settlementApi';
import { formatPaise } from '@/utils/currency';

export function AdminSettlementsPage() {
  const queryClient = useQueryClient();
  const { data: settlements } = useQuery({ queryKey: ['admin', 'settlements'], queryFn: api.fetchSettlements });
  const { data: payouts } = useQuery({ queryKey: ['admin', 'payouts'], queryFn: api.fetchPayouts });
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
      <div className="mb-6">
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
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
            <li key={s._id} className="rounded-lg border border-paper-50/10 bg-surface-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{formatPaise(s.totalAmount)}</p>
                  <p className="text-sm text-paper-400">
                    {s.earningsCount} earnings · {s.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  {s.status === 'DRAFT' && (
                    <button
                      onClick={() => finalizeMutation.mutate(s._id)}
                      className="rounded-md border border-brand-400 px-3 py-1.5 text-xs font-medium text-brand-300"
                    >
                      Finalize
                    </button>
                  )}
                  {s.status === 'FINALIZED' && !payout && (
                    <button
                      onClick={() => payoutMutation.mutate(s._id)}
                      className="rounded-md border border-brand-400 px-3 py-1.5 text-xs font-medium text-brand-300"
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
                  {payout?.status === 'PAID' && <span className="text-xs text-green-300">Paid out</span>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
