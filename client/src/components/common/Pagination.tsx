export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="btn-pill-outline !px-4 !py-2 disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-sm font-medium text-paper-400">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-pill-outline !px-4 !py-2 disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}
