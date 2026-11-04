import { Printer } from 'lucide-react';

interface Props {
  className?: string;
}

export function BrandMark({ className = '' }: Props) {
  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm ${className}`}
    >
      <Printer className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}
