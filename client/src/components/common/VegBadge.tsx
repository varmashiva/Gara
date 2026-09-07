export function VegBadge({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center border ${
        isVeg ? 'border-green-600' : 'border-red-600'
      }`}
      title={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <span className={`h-2 w-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
    </span>
  );
}
