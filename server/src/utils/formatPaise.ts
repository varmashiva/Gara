export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}
