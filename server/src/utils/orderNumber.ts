export function generateOrderNumber(): string {
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${timestampPart}-${randomPart}`;
}
