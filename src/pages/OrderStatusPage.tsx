import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Check, Loader2, Printer, PackageCheck } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { getErrorMessage } from '@/lib/errors';
import { formatINR, DEFAULT_SHOP_SLUG } from '@/lib/pricing';
import type { OrderReceipt, OrderStatus } from '@/lib/types';
import { printService } from '@/services/printService';

const POLL_INTERVAL_MS = 4000;
const TERMINAL_STATUSES: OrderStatus[] = ['completed', 'failed'];

const STAGES = [
  { status: 'paid', label: 'Queued', detail: 'Your payment is in and your job is waiting its turn.', icon: Check },
  { status: 'printing', label: 'Printing', detail: 'Your pages are printing right now.', icon: Printer },
  { status: 'completed', label: 'Ready for pickup', detail: 'Collect your prints from the counter.', icon: PackageCheck },
] as const;

function stageIndex(status: OrderStatus): number {
  return STAGES.findIndex((stage) => stage.status === status);
}

export default function OrderStatusPage() {
  const { orderId = '' } = useParams();
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [pollError, setPollError] = useState<string | null>(null);

  const fetchReceipt = useCallback(async () => {
    try {
      const next = await printService.getReceipt(orderId);
      setPollError(null);
      if (!next) {
        setLoadState('missing');
        return null;
      }
      setReceipt(next);
      setLoadState('ready');
      return next;
    } catch (caught) {
      setPollError(getErrorMessage(caught));
      setLoadState((current) => (current === 'loading' ? 'error' : current));
      return null;
    }
  }, [orderId]);

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;

    const tick = async () => {
      const next = await fetchReceipt();
      if (cancelled) return;
      if (!next || !TERMINAL_STATUSES.includes(next.status)) {
        timer = window.setTimeout(tick, POLL_INTERVAL_MS);
      }
    };
    void tick();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [fetchReceipt]);

  if (loadState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-label="Loading order" />
      </div>
    );
  }

  if (loadState === 'missing' || loadState === 'error' || !receipt) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500" aria-hidden="true" />
        <p className="font-semibold text-slate-900">
          {loadState === 'missing' ? 'We could not find this order' : 'Order status is unavailable'}
        </p>
        {pollError && <p className="text-sm text-slate-500">{pollError}</p>}
        <Link to={`/shop/${DEFAULT_SHOP_SLUG}`} className="text-sm font-semibold text-emerald-700 hover:underline">
          Back to the kiosk
        </Link>
      </div>
    );
  }

  const current = stageIndex(receipt.status);
  const failed = receipt.status === 'failed';
  const awaitingPayment = receipt.status === 'pending';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-xl shadow-slate-900/5">
        <header className="flex items-center gap-3 bg-slate-900 px-5 py-5 text-white">
          <BrandMark />
          <div>
            <p className="text-base font-semibold leading-tight">{receipt.shopName}</p>
            <p className="text-xs text-slate-300">Order {receipt.orderNumber}</p>
          </div>
        </header>

        <main className="flex-1 space-y-6 px-5 py-6 animate-fade-up">
          <div className="rounded-2xl border border-slate-200 p-5 text-center">
            <p className="text-sm text-slate-500">Status</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {failed ? 'Print failed' : awaitingPayment ? 'Awaiting payment' : STAGES[current]?.label ?? ''}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {failed
                ? 'Please speak to the counter. Our team will re-queue your job.'
                : awaitingPayment
                  ? 'Payment has not been received yet for this order.'
                  : STAGES[current]?.detail}
            </p>
          </div>

          {!failed && !awaitingPayment && (
            <div role="status" className="space-y-3 rounded-2xl bg-emerald-50 p-5 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                Payment Captured • Spooling to Printer
              </span>
              <p className="text-base text-emerald-900">
                Please collect your <span className="font-semibold">{receipt.totalPages * receipt.copies} printed pages</span> at the counter tray.
              </p>
              {receipt.shopPhone && (
                <p className="text-sm text-emerald-900">
                  Shop Counter Contact: <a href={`tel:${receipt.shopPhone}`} className="font-semibold underline">{receipt.shopPhone}</a>
                </p>
              )}
              {receipt.counterNotice && <p className="text-sm font-semibold text-emerald-900">{receipt.counterNotice}</p>}
            </div>
          )}

          {!failed && !awaitingPayment && (
            <ol className="space-y-5">
              {STAGES.map((stage, index) => {
                const done = index < current || (index === current && receipt.status === 'completed');
                const active = index === current && !done;
                const Icon = stage.icon;
                return (
                  <li key={stage.status} className="flex items-center gap-4">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors duration-500 ${
                        done || active ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                      } ${active ? 'animate-pulse' : ''}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span
                      className={`text-base font-medium ${done || active ? 'text-slate-900' : 'text-slate-400'}`}
                    >
                      {stage.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          <dl className="space-y-3 rounded-2xl bg-slate-50 p-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Order number</dt>
              <dd className="font-medium text-slate-900">{receipt.orderNumber}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">File</dt>
              <dd className="max-w-[60%] truncate font-medium text-slate-900">{receipt.fileName ?? 'Document'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Setup</dt>
              <dd className="font-medium text-slate-900">
                {receipt.paperSize}, {receipt.isColor ? 'Colour' : 'B&W'}, {receipt.isDoubleSided ? 'Double-sided' : 'Single-sided'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Pages × copies</dt>
              <dd className="font-medium text-slate-900">
                {receipt.totalPages} × {receipt.copies}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-200 pt-3">
              <dt className="font-semibold text-slate-900">Total paid</dt>
              <dd className="font-semibold tabular-nums text-slate-900">{formatINR(receipt.totalAmount)}</dd>
            </div>
          </dl>

          {pollError && <p className="text-center text-xs text-slate-400">Live updates paused. Retrying...</p>}
        </main>

        <footer className="px-5 pb-6">
          <Link
            to={`/shop/${receipt.shopSlug}`}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Print Another Document
          </Link>
        </footer>
      </div>
    </div>
  );
}
