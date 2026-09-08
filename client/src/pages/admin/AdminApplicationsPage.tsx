import { useApplications, useDecideApplication } from '@/features/admin/hooks';

export function AdminApplicationsPage() {
  const { data, isLoading } = useApplications('PENDING');
  const decide = useDecideApplication();

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!data || data.length === 0) return <p className="text-gray-600">No pending applications.</p>;

  return (
    <ul className="space-y-3">
      {data.map((app) => (
        <li key={app._id} className="rounded-lg border border-gray-100 bg-white p-4">
          <p className="font-medium">{app.storeName}</p>
          <p className="text-sm text-gray-600">
            {app.ownerName} · {app.email} · {app.phone}
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => decide.mutate({ id: app._id, decision: 'APPROVED' })}
              disabled={decide.isPending}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => decide.mutate({ id: app._id, decision: 'REJECTED' })}
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
