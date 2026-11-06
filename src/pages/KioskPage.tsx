import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SHOP_SLUG } from '@/lib/pricing';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  Plus, 
  Minus, 
  Printer, 
  Banknote, 
  Smartphone, 
  AlertCircle,
  Copy,
  Check,
  Lock,
  KeyRound,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ShopConfig {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  upi_id: string | null;
  require_payment: boolean;
  is_accepting_orders: boolean;
  counter_notice: string | null;
  subscription_status: string;
  is_pin_protected: boolean;
  counter_pin: string;
  auto_print_enabled: boolean;
}

interface UploadedItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pages: number;
  copies: number;
  isColor: boolean;
  isDoubleSided: boolean;
  paperSize: string;
}

interface PricingRule {
  paper_size: string;
  is_color: boolean;
  is_double_sided: boolean;
  price_per_page: number;
}

export default function KioskPage() {
  const { shopSlug } = useParams<{ shopSlug: string }>();
  const activeSlug = shopSlug || DEFAULT_SHOP_SLUG;
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shop, setShop] = useState<ShopConfig | null>(null);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loadingShop, setLoadingShop] = useState(true);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const [items, setItems] = useState<UploadedItem[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const [showCheckout, setShowCheckout] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    async function init() {
      setLoadingShop(true);
      try {
        const { data: shopData } = await supabase
          .from('shops')
          .select('*')
          .eq('slug', activeSlug)
          .single();

        if (shopData) {
          setShop(shopData);
          if (!shopData.is_pin_protected) {
            setIsUnlocked(true);
          }

          const { data: pricingData } = await supabase
            .from('pricing_rules')
            .select('*')
            .eq('shop_id', shopData.id);

          if (pricingData) setPricingRules(pricingData);
        }
      } catch (err) {
        console.error('Failed to load shop kiosk:', err);
      } finally {
        setLoadingShop(false);
      }
    }
    init();
  }, [activeSlug]);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    if (enteredPin.trim() === (shop.counter_pin || '1234').trim()) {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setEnteredPin('');
    }
  };

  const getPageCount = async (file: File): Promise<number> => {
    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        return pdf.numPages || 1;
      } catch {
        return 1;
      }
    }
    return 1;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsProcessingFiles(true);
    const newItems: UploadedItem[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const pages = await getPageCount(file);
      newItems.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        name: file.name,
        size: file.size,
        pages,
        copies: 1,
        isColor: false,
        isDoubleSided: false,
        paperSize: 'A4'
      });
    }

    setItems((prev) => [...prev, ...newItems]);
    setIsProcessingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<UploadedItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const calculateItemPrice = (item: UploadedItem): number => {
    const rule = pricingRules.find(
      (r) =>
        r.paper_size === item.paperSize &&
        r.is_color === item.isColor &&
        r.is_double_sided === item.isDoubleSided
    );
    const rate = rule ? rule.price_per_page : item.isColor ? 10.0 : 2.0;
    return item.pages * item.copies * rate;
  };

  const totalAmount = items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
  const totalPages = items.reduce((sum, item) => sum + item.pages * item.copies, 0);

  // Direct UPI Deep Link for Mobile Users
  const upiDeepLink = shop?.upi_id
    ? `upi://pay?pa=${shop.upi_id}&pn=${encodeURIComponent(shop.name)}&am=${totalAmount.toFixed(2)}&cu=INR`
    : '';

  const handleProceedOrder = async () => {
    if (!shop || items.length === 0) return;
    setSubmittingOrder(true);

    try {
      const orderNumber = `RTS-${Math.floor(100000 + Math.random() * 900000)}`;
      const isCashMode = !shop.require_payment;

      let targetStatus = 'pending';
      if (isCashMode) {
        targetStatus = shop.auto_print_enabled ? 'paid' : 'waiting_counter_approval';
      }

      for (const item of items) {
        const fileExt = item.name.split('.').pop() || 'pdf';
        const storagePath = `${shop.id}/${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('print-files')
          .upload(storagePath, item.file, {
            contentType: item.file.type,
            upsert: false
          });

        if (uploadError) throw uploadError;

        const itemTotal = calculateItemPrice(item);

        const { error: orderError } = await supabase.from('print_orders').insert([
          {
            shop_id: shop.id,
            order_number: orderNumber,
            file_name: item.name,
            file_url: storagePath,
            page_count: item.pages,
            copies: item.copies,
            is_color: item.isColor,
            is_double_sided: item.isDoubleSided,
            paper_size: item.paperSize,
            total_amount: itemTotal,
            status: targetStatus,
            payment_ref: isCashMode ? 'CASH_AT_COUNTER' : utrNumber || 'UPI_SUBMITTED'
          }
        ]);

        if (orderError) throw orderError;
      }

      navigate(`/shop/${shop.slug}/order/${orderNumber}`);
    } catch (err: any) {
      alert('Error creating print job: ' + (err.message || 'Please check with counter staff'));
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (loadingShop) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-xs font-bold text-slate-400 animate-pulse">Connecting to Print Counter...</p>
      </div>
    );
  }

  if (!shop || !shop.is_accepting_orders) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-sm space-y-3 shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-black text-slate-900">{shop?.name || 'Counter Offline'}</h2>
          <p className="text-xs text-slate-500">
            This print counter is currently paused or offline. Please contact the shop operator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-40 shadow-sm flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="font-black text-slate-900 text-base">{shop.name}</h1>
          </div>
          <p className="text-[11px] text-slate-400">Self-Service Document Print Kiosk</p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Payment Mode</span>
          <span className={`text-xs font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
            shop.require_payment ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {shop.require_payment ? <Smartphone className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
            {shop.require_payment ? 'Online UPI' : 'Cash at Counter'}
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-6 space-y-5">
        {shop.counter_notice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{shop.counter_notice}</span>
          </div>
        )}

        {!isUnlocked && shop.is_pin_protected ? (
          <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-base font-black text-slate-900">Counter PIN Required</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Please enter the 4-digit PIN displayed on the counter standee to unlock printing.
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="max-w-xs mx-auto space-y-3">
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter PIN"
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  className="w-full py-3 px-4 border border-slate-200 rounded-2xl text-center font-mono font-black text-lg tracking-widest text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>

              {pinError && (
                <p className="text-xs font-bold text-rose-600">Incorrect PIN. Please check the counter standee.</p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs shadow transition flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                Unlock Print Station
              </button>
            </form>
          </div>
        ) : (
          <>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-500/60 bg-emerald-50/40 hover:bg-emerald-50/70 p-8 rounded-3xl text-center cursor-pointer transition space-y-2"
            >
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
              />
              <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {isProcessingFiles ? 'Reading Documents...' : 'Tap to Select Files (Multiple Allowed)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Supports PDF, JPG, PNG • You can select several documents at once
              </p>
            </div>

            {items.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-bold text-slate-700">
                    Uploaded Files ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add More
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item) => {
                    const itemTotal = calculateItemPrice(item);
                    const isPdf = item.name.toLowerCase().endsWith('.pdf');

                    return (
                      <div
                        key={item.id}
                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                              {isPdf ? <FileText className="w-4 h-4 text-rose-500" /> : <ImageIcon className="w-4 h-4 text-blue-500" />}
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-xs text-slate-900 truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-400">
                                {item.pages} {item.pages === 1 ? 'Page' : 'Pages'} • {(item.size / 1024).toFixed(0)} KB
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500">Copies:</span>
                            <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, { copies: Math.max(1, item.copies - 1) })}
                                className="p-1 hover:bg-white rounded-lg transition"
                              >
                                <Minus className="w-3 h-3 text-slate-600" />
                              </button>
                              <span className="px-2 font-black text-xs text-slate-800">{item.copies}</span>
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, { copies: item.copies + 1 })}
                                className="p-1 hover:bg-white rounded-lg transition"
                              >
                                <Plus className="w-3 h-3 text-slate-600" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateItem(item.id, { isColor: false })}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${
                                !item.isColor ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              B&W
                            </button>
                            <button
                              type="button"
                              onClick={() => updateItem(item.id, { isColor: true })}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${
                                item.isColor ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              Color
                            </button>
                          </div>

                          <div className="font-extrabold text-slate-900 text-xs">
                            ₹{itemTotal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl space-y-3">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Total Output Pages:</span>
                    <span className="font-bold text-white">{totalPages} pages</span>
                  </div>
                  <div className="flex justify-between items-baseline border-t border-slate-800 pt-2">
                    <span className="text-sm font-bold">Total Bill:</span>
                    <span className="text-2xl font-black text-emerald-400">₹{totalAmount.toFixed(2)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!shop.require_payment) {
                        handleProceedOrder();
                      } else {
                        setShowCheckout(true);
                      }
                    }}
                    disabled={submittingOrder}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-xs"
                  >
                    <Printer className="w-4 h-4" />
                    {submittingOrder
                      ? 'Sending to Printer...'
                      : shop.require_payment
                      ? 'Proceed to Pay & Print'
                      : shop.auto_print_enabled
                      ? 'Send to Print (Pay Cash at Counter)'
                      : 'Submit to Counter (Staff Will Release)'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <footer className="mt-14 pb-8 text-center border-t border-slate-200/70 pt-6">
          <p className="text-xs text-slate-400">
            Own a printing or digital service shop?{' '}
            <a
              href="/for-business"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-1"
            >
              Get RTS Smart Print for your shop →
            </a>
          </p>
        </footer>
      </main>

      {/* Online UPI Payment Modal (with Mobile 1-Tap Payment Link) */}
      {showCheckout && shop.require_payment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-slate-900 text-base">Payment for {shop.name}</h3>

            {/* DIRECT MOBILE 1-TAP PAYMENT BUTTON */}
            {upiDeepLink && (
              <a
                href={upiDeepLink}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Pay ₹{totalAmount.toFixed(2)} via UPI App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-2 text-[10px] font-bold text-slate-400 uppercase absolute">
                Or scan QR on another phone
              </span>
            </div>

            {shop.upi_id && (
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 inline-block mx-auto">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiDeepLink)}`}
                  alt="UPI QR Code"
                  className="w-40 h-40 mx-auto"
                />
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-slate-700">
              <span>{shop.upi_id}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(shop.upi_id || '');
                  setCopiedUpi(true);
                  setTimeout(() => setCopiedUpi(false), 2000);
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 text-left">
                Enter Last 4 Digits of UPI Ref / UTR (Optional):
              </label>
              <input
                type="text"
                maxLength={12}
                placeholder="e.g. 8492"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-center font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-600"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleProceedOrder}
                disabled={submittingOrder}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition"
              >
                {submittingOrder ? 'Verifying...' : 'I Have Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
