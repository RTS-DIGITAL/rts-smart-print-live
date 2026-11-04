import type { OrderStatus } from '@/lib/types';

const META: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Awaiting payment', className: 'bg-slate-100 text-slate-700' },
  paid: { label: 'Queued', className: 'bg-amber-100 text-amber-800' },
  printing: { label: 'Printing', className: 'bg-sky-100 text-sky-800' },
  completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800' },
  failed: { label: 'Failed', className: 'bg-rose-100 text-rose-800' },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = META[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}
