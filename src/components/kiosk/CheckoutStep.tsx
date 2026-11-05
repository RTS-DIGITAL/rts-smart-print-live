import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
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

  // Check if Razorpay should be used
  const isRazorpayActive = Boolean(razorpayKeyId && razorpayKeyId.trim().length > 0);

  // Direct UPI Configuration
  const targetUpi = upiId || '7012833699@okbizaxis';
  const encodedShopName = encodeURIComponent(shopName || 'RTS Digital Seva');
  const amountFormatted = total.toFixed(2);
  const tempOrderRef = `RTS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const encodedNote = encodeURIComponent(`Order ${tempOrderRef}`);

  // NPCI standard UPI URLs & App Deep Links
  const genericUpiUri = `upi://pay?pa=${targetUpi}&pn=${encodedShopName}&am=${amountFormatted}&cu=INR&tn=${encodedNote}`;
  const gpayUri = `tez://upi/pay?pa=${targetUpi}&pn=${encodedShopName}&am=${amountFormatted}&cu=INR&tn=${encodedNote}`;
  const phonepeUri = `phonepe://pay?pa=${targetUpi}&pn=${encodedShopName}&am=${amountFormatted}&cu=INR&tn=${encodedNote}`;
  const paytmUri = `paytmmp://pay?pa=${targetUpi}&pn=${encodedShopName}&am=${amountFormatted}&cu=INR&tn=${encodedNote}`;

  // Zero-dependency dynamic QR image URL
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=svg&data=${encodeURIComponent(genericUpiUri)}`;

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
      {/* Back Button */}
      <button
        onClick={onBack}
        disabled={loading}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Change print settings
      </button>

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Payment Summary</span>
            <h2 className="text-xl font-bold">{shopName}</h2>
          </div>
          <div className="text-right">
            <span className="text-xs text-emerald-200 block uppercase font-medium">To Pay</span>
            <span className="text-3xl font-extrabold">{formatINR(total)}</span>
          </div>
        </div>

        {/* Order Details List */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>File</span>
              <span className="font-semibold text-slate-900 truncate max-w-[200px]">{file.name}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Pages &amp; Copies</span>
              <span className="font-medium text-slate-900">{pageCount} page(s) × {selection.copies} copy</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Mode</span>
              <span className="font-medium text-slate-900">
                {selection.paperSize} • {selection.isColor ? 'Colour' : 'B&W'} • {selection.isDoubleSided ? 'Double-sided' : 'Single-sided'}
              </span>
            </div>
          </div>

          {/* Optional Phone Number input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mobile Number (Optional - for order SMS updates)
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

          {/* CONDITION: If Razorpay is Active vs Direct Native UPI */}
          {isRazorpayActive ? (
            <div className="pt-2">
              <button
                onClick={handleRazorpayFlow}
                disabled={loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay & Spool to Printer'}
              </button>
            </div>
          ) : (
            /* DIRECT UPI + GPAY / PHONEPE / PAYTM INTENTS */
            <div className="pt-2 flex flex-col items-center space-y-4">
              {/* Dynamic QR Container without external package dependencies */}
              <div className="relative p-3 bg-white rounded-2xl border-2 border-dashed border-emerald-500 shadow-sm inline-block">
                <img
                  src={qrImageUrl}
                  alt={`UPI QR for ${formatINR(total)}`}
                  className="w-44 h-44 rounded-lg block"
                  loading="eager"
                />
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-[10px] font-bold text-white px-3 py-0.5 rounded-full uppercase tracking-wider shadow whitespace-nowrap">
                  Scan to Pay {formatINR(total)}
                </div>
              </div>

              <p className="text-xs text-slate-500 text-center font-medium">
                Tap your preferred app below to pay directly:
              </p>

              {/* One-Tap Mobile App Switch Buttons */}
              <div className="grid grid-cols-3 gap-2 w-full">
                <a
                  href={gpayUri}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-95 transition"
                >
                  <span className="text-xs font-bold text-slate-800">Google Pay</span>
                </a>

                <a
                  href={phonepeUri}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 active:scale-95 transition"
                >
                  <span className="text-xs font-bold text-purple-700">PhonePe</span>
                </a>

                <a
                  href={paytmUri}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 active:scale-95 transition"
                >
                  <span className="text-xs font-bold text-sky-700">Paytm</span>
                </a>
              </div>

              {/* Any Other UPI App */}
              <a
                href={genericUpiUri}
                className="w-full py-2.5 text-center text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Pay with Other UPI App (BHIM / Cred / WhatsApp)
              </a>

              {/* Final Confirm Print Button */}
              <button
                onClick={processOrderWithDirectUpi}
                disabled={loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Spooling Document to Counter...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>✓ I Have Paid — Print Now</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
