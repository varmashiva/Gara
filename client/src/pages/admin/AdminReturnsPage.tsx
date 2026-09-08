import { useAdminReturns, useDecideReturn } from '@/features/admin/hooks';

export function AdminReturnsPage() {
  const { data, isLoading } = useAdminReturns();
  const decide = useDecideReturn();
  const pending = data?.filter((r) => r.status === 'REQUESTED') ?? [];

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (pending.length === 0) return <p className="text-gray-600">No pending return requests.</p>;

  return (
    <ul className="space-y-3">
      {pending.map((r) => (
        <li key={r._id} className="rounded-lg border border-gray-100 bg-white p-4">
          <p className="font-medium">Order {r.orderId}</p>
          <p className="text-sm text-gray-600">Reason: {r.reason}</p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => decide.mutate({ id: r._id, decision: 'APPROVED' })}
              disabled={decide.isPending}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              Approve (refunds customer)
            </button>
            <button
              onClick={() => decide.mutate({ id: r._id, decision: 'REJECTED' })}
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
