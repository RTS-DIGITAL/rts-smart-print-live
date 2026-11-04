import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellOff, Download, ExternalLink, RotateCcw } from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { getErrorMessage } from '@/lib/errors';
import { playChime } from '@/lib/chime';
import { formatINR } from '@/lib/pricing';
import { useLiveData } from '@/lib/useLiveData';
import type { AdminOrder, AdminOrderStatus, OrderStatus } from '@/lib/types';
import { printService } from '@/services/printService';

const FILTERS: Array<'all' | OrderStatus> = ['all', 'pending', 'paid', 'printing', 'completed', 'failed'];
const CHIME_STORAGE_KEY = 'orders-chime';
const AGENT_HEARTBEAT_WINDOW_MS = 15 * 1000;

interface Action {
  label: string;
  status: AdminOrderStatus;
  danger?: boolean;
}

function actionsFor(order: AdminOrder): Action[] {
  switch (order.status) {
    case 'paid':
      return [
        { label: 'Start printing', status: 'printing' },
        { label: 'Mark failed', status: 'failed', danger: true },
      ];
    case 'printing':
      return [
        { label: 'Mark completed', status: 'completed' },
        { label: 'Mark failed', status: 'failed', danger: true },
      ];
    case 'completed':
    case 'failed':
      return [{ label: 'Re-queue', status: 'paid' }];
    default:
      return [];
  }
}

export function OrdersPanel({ shopId }: { shopId: string }) {
  const loadOrders = useCallback(() => printService.listQueue(shopId), [shopId]);
  const loadAgentSeen = useCallback(() => printService.getAgentLastSeen(shopId), [shopId]);
  const { data: orders, error, refresh } = useLiveData(loadOrders, 5000);
  const agentSeen = useLiveData(loadAgentSeen, 5000);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(CHIME_STORAGE_KEY) === 'on');
  const seenStatuses = useRef<Map<string, OrderStatus> | null>(null);

  useEffect(() => printService.subscribeOrders(shopId, refresh), [shopId, refresh]);

  useEffect(() => {
    if (!orders) return;
    const previous = seenStatuses.current;
    seenStatuses.current = new Map(orders.map((order) => [order.id, order.status]));
    if (!previous) return;
    const arrived = orders.some((order) => {
      const before = previous.get(order.id);
      return before === undefined || (order.status === 'paid' && before !== 'paid');
    });
    if (arrived && soundOn) playChime();
  }, [orders, soundOn]);

  const agentListening =
    !!agentSeen.data && Date.now() - Date.parse(agentSeen.data) < AGENT_HEARTBEAT_WINDOW_MS;

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem(CHIME_STORAGE_KEY, next ? 'on' : 'off');
    if (next) playChime();
  }

  async function run(work: () => Promise<void>, orderId: string) {
    setBusyId(orderId);
    setActionError(null);
    try {
      await work();
      refresh();
    } catch (caught) {
      setActionError(getErrorMessage(caught));
    } finally {
      setBusyId(null);
    }
  }

  async function viewFile(order: AdminOrder) {
    const path = order.storagePath;
    if (!path) return;
    await run(async () => {
      const url = await printService.getFileUrl(path);
      window.open(url, '_blank', 'noopener');
    }, order.id);
  }

  async function downloadFile(order: AdminOrder) {
    const path = order.storagePath;
    if (!path) return;
    const name = order.fileName ?? 'document';
    await run(async () => {
      const url = await printService.getFileUrl(path, name);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
    }, order.id);
  }

  if (!orders) {
    return error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : <p className="text-sm text-slate-500">Loading orders...</p>;
  }

  const visible = filter === 'all' ? orders : orders.filter((order) => order.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
              agentListening ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${agentListening ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'}`} />
            Windows Print Agent: {agentListening ? 'Connected' : 'Ready, not connected'}
          </span>
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:text-slate-900"
          >
            {soundOn ? <Bell className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <BellOff className="h-3.5 w-3.5" aria-hidden="true" />}
            Order chime {soundOn ? 'on' : 'off'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter orders">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition ${
              filter === value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {actionError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{actionError}</p>}

      {visible.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">No orders match this filter.</p>
      )}

      <ul className="space-y-3">
        {visible.map((order) => (
          <li key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {order.customerPhone ?? 'No phone'} · {new Date(order.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-3 text-sm text-slate-700">
              {order.fileName ?? 'Document'} · {order.totalPages} pages × {order.copies} · {order.paperSize},{' '}
              {order.isColor ? 'Colour' : 'B&W'}, {order.isDoubleSided ? 'Double-sided' : 'Single-sided'}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="font-semibold tabular-nums text-slate-900">{formatINR(order.totalAmount)}</span>
              <div className="flex flex-wrap gap-2">
                {order.storagePath && (
                  <>
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => void viewFile(order)}
                      className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      View file
                    </button>
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => void downloadFile(order)}
                      className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      Download file
                    </button>
                  </>
                )}
                {actionsFor(order).map((action) => (
                  <button
                    key={action.status + action.label}
                    type="button"
                    disabled={busyId === order.id}
                    onClick={() => void run(() => printService.updateOrderStatus(order.id, action.status), order.id)}
                    className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition disabled:opacity-50 ${
                      action.danger
                        ? 'text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600'
                    }`}
                  >
                    {action.label === 'Re-queue' && <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
