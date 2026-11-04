import { useCallback } from 'react';
import { Loader2, IndianRupee, ListOrdered, Printer, Receipt } from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { useLiveData } from '@/lib/useLiveData';
import { formatINR } from '@/lib/pricing';
import type { Shop } from '@/lib/types';
import { printService } from '@/services/printService';

const isToday = (iso: string | null) => iso !== null && new Date(iso).toDateString() === new Date().toDateString();

export function OverviewPanel({ shop }: { shop: Shop }) {
  const loadOrders = useCallback(() => printService.listQueue(shop.id), [shop.id]);
  const loadPrinters = useCallback(() => printService.listPrinters(shop.id), [shop.id]);
  const orders = useLiveData(loadOrders, 8000);
  const printers = useLiveData(loadPrinters, 8000);

  if (!orders.data || !printers.data) {
    const error = orders.error ?? printers.error;
    return error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : <Loader2 className="h-6 w-6 animate-spin text-emerald-600" aria-label="Loading" />;
  }

  const paidToday = orders.data.filter((order) => order.status !== 'failed' && isToday(order.paidAt));
  const revenue = paidToday.reduce((sum, order) => sum + order.totalAmount, 0);
  const queue = orders.data.filter((order) => order.status === 'paid' || order.status === 'printing').length;
  const online = printers.data.filter((printer) => printer.status === 'online').length;
  const recent = orders.data.slice(0, 5);

  const cards = [
    { label: 'Prints today', value: String(paidToday.length), icon: Printer },
    { label: 'Revenue today', value: formatINR(revenue), icon: IndianRupee },
    { label: 'Active queue', value: String(queue), icon: ListOrdered },
    { label: 'Printers online', value: `${online} / ${printers.data.length}`, icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Icon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <p className="mt-3 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-slate-900">Recent orders</h2>
        {recent.length === 0 && <p className="px-5 py-6 text-sm text-slate-500">No orders yet.</p>}
        <ul className="divide-y divide-slate-100">
          {recent.map((order) => (
            <li key={order.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <span className="font-medium text-slate-900">{order.orderNumber}</span>
              <StatusBadge status={order.status} />
              <span className="tabular-nums text-slate-700">{formatINR(order.totalAmount)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
