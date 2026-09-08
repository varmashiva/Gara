import { UtensilsCrossed } from 'lucide-react';

export function ImagePlaceholder({ className = 'h-full w-full' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-orange-50 text-orange-300 ${className}`}>
      <UtensilsCrossed size={28} aria-hidden="true" />
    </div>
  );
}
