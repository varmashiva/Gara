import { UtensilsCrossed } from 'lucide-react';

export function ImagePlaceholder({ className = 'h-full w-full' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-surface-200 text-brand-300 ${className}`}>
      <UtensilsCrossed size={28} aria-hidden="true" />
    </div>
  );
}
