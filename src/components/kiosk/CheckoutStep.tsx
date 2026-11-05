import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft, ExternalLink } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import { formatINR } from '@/lib/pricing';
import { openRazorpayCheckout } from '@/lib/razorpay';
import type { PrintSelection } from '@/lib/types';
import { printService } from '@/services/printService';

interface Props {
  shopName: string;
  shopSlug: string;
  razorpayKeyId: string | null;
  upiId?: string | null;
  file: File;
  pageCount: number;
  selection: PrintSelection;
  total: number;
  onBack: () => void;
}

export const CheckoutStep: React.FC<Props> = ({
  shopName,
  shopSlug,
  razorpayKeyId,
  upiId,
  file,
  pageCount,
  selection,
  total,
  onBack,
}) => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitiatedPayment, setHasInitiatedPayment] = useState(false);

  const isRazorpayActive = Boolean(razorpayKeyId && razorpayKeyId.trim().length > 0);

  // Exact Verified UPI VPA
  const activeUpi = (upiId && upiId.trim().length > 0) ? upiId.trim() : 'rajaneesht99-1@okhdfcbank';
  const payeeName = 'Rajaneesh T';
  const amountFormatted = total.toFixed(2);
  const orderRef = `RTS${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // Clean NPCI UPI format compatible with GPay, PhonePe, Paytm, and BHIM
  const cleanUpiUri = `upi://pay?pa=${activeUpi}&pn=${encodeURIComponent(payeeName)}&am=${amountFormatted}&cu=INR&tn=${encodeURIComponent(orderRef)}`;

  // Dynamic QR generator
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&format=svg&data=${encodeURIComponent(cleanUpiUri)}`;

  const processOrderWithDirectUpi = async () => {
    setLoading(true);
    setError(null);
    try {
      const created = await printService.createOrder({
        shopSlug,
        customerPhone: phone.trim() || undefined,
        file,
        totalPages: pageCount,
        selection,
      });

      await printService.uploadOrderFile(created.storagePath, file);
      await printService.confirmPayment(created.orderId, total, `UPI-${Date.now()}`);

      navigate(`/order/${created.orderId}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const handleRazorpayFlow = async () => {
    setLoading(true);
    setError(null);

    try {
      const created = await printService.createOrder({
        shopSlug,
        customerPhone: phone.trim() || undefined,
        file,
        totalPages: pageCount,
        selection,
      });

      await printService.uploadOrderFile(created.storagePath, file);

      openRazorpayCheckout({
        keyId: razorpayKeyId!,
        amount: total,
        shopName,
        description: `${pageCount} page(s) × ${selection.copies} copy`,
        prefillContact: phone.trim() || undefined,
        onSuccess: async (payment) => {
          try {
            await printService.confirmPayment(created.orderId, total, payment.razorpay_payment_id);
            navigate(`/order/${created.orderId}`);
          } catch (err) {
            setError(getErrorMessage(err));
            setLoading(false);
          }
        },
        onDismiss: () => {
          setLoading(false);
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        disabled={loading}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Change print settings
      </button>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Amount Due</span>
            <h2 className="text-xl font-bold">{shopName}</h2>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-200 block uppercase font-medium">Total</span>
            <span className="text-3xl font-extrabold">{formatINR(total)}</span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Document</span>
              <span className="font-semibold text-slate-900 truncate max-w-[200px]">{file.name}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Format</span>
              <span className="font-medium text-slate-900">
                {pageCount} page(s) × {selection.copies} copy • {selection.isColor ? 'Colour' : 'B&W'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mobile Number (Optional)
            </label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isRazorpayActive ? (
            <div className="pt-2">
              <button
                onClick={handleRazorpayFlow}
                disabled={loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay & Print'}
              </button>
            </div>
          ) : (
            <div className="pt-2 flex flex-col items-center space-y-4">
              <div className="relative p-3 bg-white rounded-2xl border-2 border-dashed border-emerald-500 shadow-sm inline-block">
                <img
                  src={qrImageUrl}
                  alt={`UPI QR for ${formatINR(total)}`}
                  className="w-48 h-48 rounded-lg block"
                  loading="eager"
                />
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-[10px] font-bold text-white px-3 py-0.5 rounded-full uppercase tracking-wider shadow whitespace-nowrap">
                  Pay {formatINR(total)}
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-500 font-medium">UPI ID: <span className="text-slate-900 font-bold">{activeUpi}</span></p>
                <p className="text-[11px] text-slate-400 mt-0.5">Payee: {payeeName}</p>
              </div>

              {/* Direct App Link for Mobile Phones */}
              <a
                href={cleanUpiUri}
                onClick={() => setHasInitiatedPayment(true)}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-center text-sm shadow flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <span>Tap to Pay with Any UPI App</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* Confirm & Print Button: Appears only after customer taps pay or indicates they have scanned */}
              {hasInitiatedPayment ? (
                <div className="w-full pt-2">
                  <button
                    onClick={processOrderWithDirectUpi}
                    disabled={loading}
                    className="w-full py-4 bg-slate-900 hover:bg-black active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Sending to Printer...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>✓ I Have Paid — Print Now</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setHasInitiatedPayment(true)}
                  className="text-xs font-semibold text-emerald-700 hover:underline pt-1"
                >
                  Scanned with another phone? Click here to confirm
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
