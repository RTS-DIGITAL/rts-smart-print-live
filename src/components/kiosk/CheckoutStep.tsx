import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import { formatINR } from '@/lib/pricing';
import { openRazorpayCheckout } from '@/lib/razorpay';
import type { PrintSelection } from '@/lib/types';
import { printService } from '@/services/printService';

interface Props {
  shopName: string;
  shopSlug: string;
  razorpayKeyId: string | null;
  file: File;
  pageCount: number;
  selection: PrintSelection;
  total: number;
  onBack: () => void;
}

const MOCK_PAYMENT_DELAY_MS = 1200;
const SUCCESS_REDIRECT_DELAY_MS = 1800;

function normalizePhone(raw: string): string | null | undefined {
  const compact = raw.replace(/[\s-]/g, '');
  if (!compact) return null;
  return /^\+?\d{10,15}$/.test(compact) ? compact : undefined;
}

export function CheckoutStep({ shopName, shopSlug, razorpayKeyId, file, pageCount, selection, total, onBack }: Props) {
  const navigate = useNavigate();
  const [phoneInput, setPhoneInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  const fail = (caught: unknown) => {
    setError(getErrorMessage(caught));
    setBusy(false);
  };

  async function handlePay() {
    const phone = normalizePhone(phoneInput);
    if (phone === undefined) {
      setError('Enter a valid phone number, or leave it blank.');
      return;
    }
    setBusy(true);
    setError(null);

    try {
      const order = await printService.createOrder({
        shopSlug,
        selection,
        totalPages: pageCount,
        customerPhone: phone,
        file,
      });
      await printService.uploadOrderFile(order.storagePath, file);

      const complete = async (reference: string) => {
        await printService.confirmPayment(order.orderId, order.totalAmount, reference);
        setPaid(true);
        window.setTimeout(() => navigate(`/order/${order.orderId}`), SUCCESS_REDIRECT_DELAY_MS);
      };

      if (razorpayKeyId) {
        await openRazorpayCheckout({
          keyId: razorpayKeyId,
          shopName,
          amountRupees: order.totalAmount,
          description: `Print job ${order.orderNumber}`,
          contact: phone ?? undefined,
          onSuccess: (paymentId) => {
            complete(paymentId).catch(fail);
          },
          onDismiss: () => setBusy(false),
        });
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, MOCK_PAYMENT_DELAY_MS));
        await complete(`mock_${Date.now()}`);
      }
    } catch (caught) {
      fail(caught);
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Review and pay</h2>
        <p className="mt-1 text-sm text-slate-500">We will text you a receipt if you add a number.</p>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 p-5">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">File</span>
          <span className="max-w-[60%] truncate font-medium text-slate-900">{file.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Pages</span>
          <span className="font-medium text-slate-900">{pageCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Setup</span>
          <span className="font-medium text-slate-900">
            {selection.paperSize}, {selection.isColor ? 'Colour' : 'B&W'}, {selection.isDoubleSided ? 'Double-sided' : 'Single-sided'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Copies</span>
          <span className="font-medium text-slate-900">{selection.copies}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <span className="font-semibold text-slate-900">Total</span>
          <span className="text-2xl font-semibold tabular-nums text-slate-900">{formatINR(total)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="customer-phone" className="text-sm font-medium text-slate-700">
          Phone number <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <input
          id="customer-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phoneInput}
          onChange={(event) => setPhoneInput(event.target.value)}
          disabled={busy}
          placeholder="+91 98765 43210"
          className="h-12 w-full rounded-xl border border-slate-300 px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 disabled:bg-slate-50"
        />
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="h-14 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={busy}
          className="col-span-2 flex h-14 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-70"
        >
          {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {busy ? 'Processing...' : `Pay ${formatINR(total)} & Print Now`}
        </button>
      </div>

      {paid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-6 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center shadow-2xl animate-pop-in">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-12 w-12" aria-hidden="true" />
            </span>
            <p className="text-xl font-semibold text-slate-900">Payment successful</p>
            <p className="text-sm text-slate-500">Sending your job to the printer...</p>
          </div>
        </div>
      )}
    </div>
  );
}
