import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SHOP_SLUG } from '@/lib/pricing';
import { 
  Store, 
  Printer, 
  Settings, 
  RefreshCw, 
  CreditCard, 
  ExternalLink, 
  ShieldAlert, 
  Save, 
  QrCode, 
  Banknote, 
  Smartphone, 
  Lock, 
  Unlock, 
  Play, 
  Pause, 
  Trash2, 
  Check, 
  KeyRound, 
  LogOut, 
  Mail 
} from 'lucide-react';

interface ShopData {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  owner_email: string | null;
  upi_id: string | null;
  target_printer_name: string | null;
  counter_notice: string | null;
  is_accepting_orders: boolean;
  require_payment: boolean;
  subscription_status: string;
  is_pin_protected: boolean;
  counter_pin: string;
  auto_print_enabled: boolean;
  auto_delete_hours: number;
  pairing_code: string;
  admin_pin: string;
  admin_username: string;
  created_at?: string;
  approved_at?: string | null;
  subscription_days?: number | null;
}

interface OrderRow {
  id: string;
  order_number: string;
  file_name: string;
  file_url?: string;
  total_amount: number;
  status: string;
  created_at: string;
  copies: number;
  page_count: number;
}

interface PricingRule {
  id: string;
  paper_size: string;
  is_color: boolean;
  is_double_sided: boolean;
  price_per_page: number;
}

export default function AdminPage() {
  const { shopSlug } = useParams<{ shopSlug: string }>();
  const activeSlug = shopSlug || DEFAULT_SHOP_SLUG;

  const [shop, setShop] = useState<ShopData | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [pricing, setPricing] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Form State
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [upiId, setUpiId] = useState('');
  const [targetPrinter, setTargetPrinter] = useState('');
  const [counterNotice, setCounterNotice] = useState('');
  const [isAccepting, setIsAccepting] = useState(true);
  const [requirePayment, setRequirePayment] = useState(false);
  const [isPinProtected, setIsPinProtected] = useState(false);
  const [counterPin, setCounterPin] = useState('1234');
  const [adminPin, setAdminPin] = useState('123456');
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const [autoDeleteHours, setAutoDeleteHours] = useState(24);

  // Check Local Session
  useEffect(() => {
    const sessionKey = `rts_auth_${activeSlug}`;
    if (localStorage.getItem(sessionKey) === 'true') {
      setIsLoggedIn(true);
    }
  }, [activeSlug]);

  const loadShopData = async () => {
    try {
      const { data: shopRes, error: shopErr } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', activeSlug)
        .single();

      if (shopErr || !shopRes) throw new Error('Shop not found');

      // -------------------------------------------------------------
      // AUTOMATIC STORAGE & QUEUE PURGE (Reclaims Supabase Disk Space)
      // -------------------------------------------------------------
      const retentionHours = shopRes.auto_delete_hours || 1;
      const expirationThreshold = new Date(Date.now() - retentionHours * 60 * 60 * 1000).toISOString();

      // 1. Find all expired orders
      const { data: expiredOrders } = await supabase
        .from('print_orders')
        .select('id, file_url')
        .eq('shop_id', shopRes.id)
        .lt('created_at', expirationThreshold);

      if (expiredOrders && expiredOrders.length > 0) {
        const filePathsToRemove = expiredOrders
          .map((o) => o.file_url)
          .filter((url): url is string => Boolean(url));

        // 2. Remove files from Supabase Storage bucket (reclaims space)
        if (filePathsToRemove.length > 0) {
          await supabase.storage.from('print-files').remove(filePathsToRemove);
        }

        // 3. Delete matching database records
        const idsToDelete = expiredOrders.map((o) => o.id);
        await supabase.from('print_orders').delete().in('id', idsToDelete);
      }
      // -------------------------------------------------------------

      setShop(shopRes);
      setShopName(shopRes.name || '');
      setPhone(shopRes.phone || '');
      setOwnerEmail(shopRes.owner_email || '');
      setUpiId(shopRes.upi_id || '');
      setTargetPrinter(shopRes.target_printer_name || '');
      setCounterNotice(shopRes.counter_notice || '');
      setIsAccepting(shopRes.is_accepting_orders ?? true);
      setRequirePayment(shopRes.require_payment ?? false);
      setIsPinProtected(shopRes.is_pin_protected ?? false);
      setCounterPin(shopRes.counter_pin || '1234');
      setAdminPin(shopRes.admin_pin || '123456');
      setAutoPrintEnabled(shopRes.auto_print_enabled ?? true);
      setAutoDeleteHours(shopRes.auto_delete_hours || 24);

      // Load Orders (Limited to 30)
      const { data: ordersRes } = await supabase
        .from('print_orders')
        .select('*')
        .eq('shop_id', shopRes.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (ordersRes) setOrders(ordersRes);

      // Load Pricing
      const { data: pricingRes } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('shop_id', shopRes.id);

      if (pricingRes) setPricing(pricingRes);
    } catch (err) {
      console.error('Failed to load shop admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShopData();
  }, [activeSlug]);

  // Realtime Live Subscription
  useEffect(() => {
    if (!shop?.id) return;
    const channel = supabase
      .channel(`admin-queue-${shop.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'print_orders', filter: `shop_id=eq.${shop.id}` },
        () => loadShopData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shop?.id]);

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    const validId = (shop.admin_username || shop.slug || '').toLowerCase().trim();
    const validPhone = (shop.phone || '').trim();
    const enteredId = loginId.toLowerCase().trim();
    const validPin = (shop.admin_pin || '123456').trim();

    if ((enteredId === validId || enteredId === validPhone) && loginPin.trim() === validPin) {
      setIsLoggedIn(true);
      localStorage.setItem(`rts_auth_${activeSlug}`, 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid User ID or 6-digit PIN');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`rts_auth_${activeSlug}`);
    setIsLoggedIn(false);
  };

  const handleForgotPassword = () => {
    if (!shop?.owner_email) {
      alert(`No owner email configured. Please call RTS Super Admin (7012833699) to reset your PIN.`);
      return;
    }
    window.open(
      `mailto:${shop.owner_email}?subject=Your RTS Shop Admin Login Details&body=Your Shop ID: ${shop.admin_username || shop.slug}%0D%0AYour 6-Digit Admin PIN: ${shop.admin_pin || '123456'}`
    );
    setForgotSent(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          name: shopName,
          phone: phone,
          owner_email: ownerEmail,
          upi_id: upiId,
          target_printer_name: targetPrinter,
          counter_notice: counterNotice,
          is_accepting_orders: isAccepting,
          require_payment: requirePayment,
          is_pin_protected: isPinProtected,
          counter_pin: counterPin,
          admin_pin: adminPin,
          auto_print_enabled: autoPrintEnabled,
          auto_delete_hours: autoDeleteHours
        })
        .eq('id', shop.id);

      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadShopData();
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApproveOrder = async (orderNumber: string) => {
    try {
      await supabase.from('print_orders').update({ status: 'paid' }).eq('order_number', orderNumber);
      loadShopData();
    } catch (err: any) {
      alert('Error approving order: ' + err.message);
    }
  };

  const handleRejectOrder = async (orderNumber: string) => {
    if (!window.confirm(`Discard order ${orderNumber}?`)) return;
    try {
      // Find file to remove from storage immediately
      const target = orders.find((o) => o.order_number === orderNumber);
      if (target?.file_url) {
        await supabase.storage.from('print-files').remove([target.file_url]);
      }
      await supabase.from('print_orders').update({ status: 'rejected' }).eq('order_number', orderNumber);
      loadShopData();
    } catch (err: any) {
      alert('Error rejecting order: ' + err.message);
    }
  };

  const handleUpdatePrice = async (ruleId: string, newPrice: number) => {
    await supabase.from('pricing_rules').update({ price_per_page: newPrice }).eq('id', ruleId);
    loadShopData();
  };

  const handlePrintStandee = () => {
    if (!shop) return;
    const kioskUrl = `${window.location.origin}/shop/${shop.slug}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(kioskUrl)}`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${shop.name} - Counter QR Standee</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { 
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0; padding: 40px 20px; 
              display: flex; justify-content: center; align-items: center; 
              min-height: 100vh; background-color: #f8fafc;
            }
            .card { 
              width: 480px; background: white; border: 3px solid #059669; 
              border-radius: 28px; padding: 40px 32px; text-align: center;
            }
            .header-tag {
              display: inline-block; background: #ecfdf5; color: #059669;
              font-weight: 800; font-size: 13px; padding: 6px 16px;
              border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px;
            }
            h1 { font-size: 28px; color: #0f172a; margin: 0 0 6px 0; font-weight: 900; }
            p.sub { color: #64748b; font-size: 14px; margin: 0 0 20px 0; }
            .qr-box { 
              background: white; padding: 16px; border: 2px dashed #cbd5e1; 
              border-radius: 24px; display: inline-block; margin-bottom: 18px;
            }
            .qr-box img { width: 240px; height: 240px; display: block; }
            .pin-badge {
              background: #fef3c7; border: 2px solid #f59e0b; color: #92400e;
              padding: 8px 16px; border-radius: 14px; font-size: 14px;
              font-weight: 900; margin-bottom: 20px;
              display: ${isPinProtected ? 'inline-block' : 'none'};
            }
            .steps { 
              background: #f8fafc; border-radius: 16px; padding: 16px; 
              text-align: left; font-size: 13px; color: #334155; line-height: 1.8; margin-bottom: 20px;
            }
            .steps strong { color: #059669; }
            .footer { font-size: 11px; color: #94a3b8; font-weight: 600; }
            @media print { body { background: transparent; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header-tag">Self-Service Print Station</div>
            <h1>${shop.name}</h1>
            <p class="sub">Scan below to upload and print documents instantly</p>
            <div class="qr-box">
              <img src="${qrImageUrl}" alt="Scan to Print" />
            </div>
            <div class="pin-badge">🔑 Counter Access PIN: ${counterPin}</div>
            <div class="steps">
              <div><strong>1. Scan QR</strong> using phone camera or Google Lens</div>
              ${isPinProtected ? `<div><strong>2. Enter PIN (${counterPin})</strong> to unlock document upload</div>` : ''}
              <div><strong>${isPinProtected ? '3' : '2'}. Select & Upload</strong> documents</div>
              <div><strong>${isPinProtected ? '4' : '3'}. Collect Prints</strong> at this counter</div>
            </div>
            <div class="footer">Powered by RTS Smart Print Automation</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-sm space-y-3">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-slate-900">Shop Not Found</h2>
          <Link to="/" className="inline-block mt-2 text-xs font-bold text-emerald-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SHOP ADMIN LOGIN GATE (User ID & 6-Digit Password)
  // =========================================================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-950 border border-slate-800 p-8 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-lg font-black text-white">{shop.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">Counter Admin Login</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 text-left">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">User ID / Shop ID</label>
              <input
                type="text"
                placeholder={shop.admin_username || shop.slug}
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">6-Digit Admin PIN</label>
              <input
                type="password"
                maxLength={6}
                placeholder="••••••"
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                required
                className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-center text-lg font-mono tracking-widest text-emerald-400 outline-none focus:border-emerald-500"
              />
            </div>

            {loginError && <p className="text-xs text-rose-500 font-bold text-center">{loginError}</p>}

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-600/30"
            >
              Sign In to Counter
            </button>
          </form>

          <div className="pt-2 border-t border-slate-900">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[11px] text-slate-400 hover:text-emerald-400 transition"
            >
              Forgot 6-Digit PIN?
            </button>
            {forgotSent && (
              <p className="text-[10px] text-emerald-400 mt-1">Reset request prepared via email!</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // LOGGED-IN SHOP ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      <header className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-slate-900 text-lg">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="font-black text-white text-base">{shop.name}</h1>
              {/* Live Reverse Countdown Pill */}
              {(() => {
                const approvalDate = shop.approved_at 
                  ? new Date(shop.approved_at).getTime() 
                  : new Date(shop.created_at || Date.now()).getTime();
                const elapsedDays = Math.floor((new Date().getTime() - approvalDate) / (1000 * 60 * 60 * 24));
                const remainingDays = Math.max(0, (shop.subscription_days || 7) - elapsedDays);
                const isExpired = remainingDays <= 0;

                return (
                  <span className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase border ${
                    isExpired ? 'bg-rose-100 text-rose-800 border-rose-300' :
                    remainingDays <= 2 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                    'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    ⏳ {isExpired ? 'Expired' : `${remainingDays} Days Left`}
                  </span>
                );
              })()}
            </div>
            <p className="text-[11px] text-slate-400">Self-Service Document Print Kiosk</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrintStandee}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Print Counter Standee</span>
          </button>
          <a
            href={`/shop/${shop.slug}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
          >
            <span>Open Kiosk</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          </a>
          <button
            onClick={loadShopData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-xl transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          {/* PERMANENT AGENT PAIRING CODE CARD */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
              Permanent Windows Pairing Code
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-black text-slate-900 tracking-widest bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                {shop.pairing_code || '---'}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                shop.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {shop.subscription_status}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              Enter this permanent 6-digit code in <code>RTS-Smart-Print-Agent.exe</code>. Never changes on refresh!
            </p>
          </div>

          {/* Configuration Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-600" />
              Counter Configuration
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shop Display Name</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Owner Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              {/* 6-DIGIT ADMIN PIN FIELD */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <label className="block font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  Counter Admin PIN (6 Numbers)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-center font-bold tracking-widest text-slate-900 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-500">
                  Password to log in to this shop admin panel.
                </p>
              </div>

              {/* ALWAYS VISIBLE UPI ID */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1.5">
                <label className="block font-bold text-emerald-950 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  Shop Direct UPI ID (GPay / PhonePe / Paytm)
                </label>
                <input
                  type="text"
                  placeholder="e.g. yourname@okaxis, shop@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 font-mono text-emerald-950 bg-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-emerald-700 leading-tight">
                  Customer payments go 100% directly into this UPI ID.
                </p>
              </div>

              {/* PAYMENT MODE TOGGLE */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">Customer Payment Mode</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRequirePayment(true)}
                    className={`py-2 px-2 rounded-xl font-bold text-[11px] flex flex-col items-center gap-1 border transition ${
                      requirePayment 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    Direct UPI QR
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequirePayment(false)}
                    className={`py-2 px-2 rounded-xl font-bold text-[11px] flex flex-col items-center gap-1 border transition ${
                      !requirePayment 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    Pay Cash at Counter
                  </button>
                </div>
              </div>

              {/* ANTI-SPAM PIN GATE */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Counter PIN Protection</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPinProtected(!isPinProtected)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition ${
                      isPinProtected ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isPinProtected ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>

                {isPinProtected && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                      Set 4-Digit Access PIN:
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={counterPin}
                      onChange={(e) => setCounterPin(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-amber-300 font-mono font-bold text-amber-950 text-center tracking-widest text-sm bg-white outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* PRINT EXECUTION MODE */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="font-bold text-slate-800 block text-xs">Print Execution Mode</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAutoPrintEnabled(true)}
                    className={`py-2 px-2 rounded-xl font-bold text-[11px] flex flex-col items-center gap-1 border transition ${
                      autoPrintEnabled 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    Auto-Pilot
                  </button>

                  <button
                    type="button"
                    onClick={() => setAutoPrintEnabled(false)}
                    className={`py-2 px-2 rounded-xl font-bold text-[11px] flex flex-col items-center gap-1 border transition ${
                      !autoPrintEnabled 
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Manual Approval
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Counter Printer</label>
                <input
                  type="text"
                  placeholder="e.g. Canon LBP2900"
                  value={targetPrinter}
                  onChange={(e) => setTargetPrinter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Auto-Delete Files</label>
                <select
                  value={autoDeleteHours}
                  onChange={(e) => setAutoDeleteHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-bold"
                >
                  <option value={1}>Auto-delete after 1 Hour</option>
                  <option value={4}>Auto-delete after 4 Hours</option>
                  <option value={12}>Auto-delete after 12 Hours</option>
                  <option value={24}>Auto-delete after 24 Hours</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Counter Collection Notice</label>
                <input
                  type="text"
                  placeholder="e.g. Collect prints at Counter 1"
                  value={counterNotice}
                  onChange={(e) => setCounterNotice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 mt-2 shadow"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Queue */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-600" />
                  Recent Print Queue
                </h2>
                <p className="text-[11px] text-slate-400">Live incoming counter print jobs</p>
              </div>
              <button
                onClick={loadShopData}
                className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full transition flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh ({orders.length})</span>
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No orders placed yet today.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-4">Order #</th>
                      <th className="py-2.5 px-4">Document</th>
                      <th className="py-2.5 px-4">Copies</th>
                      <th className="py-2.5 px-4">Amount</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Counter Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {orders.map((o) => {
                      const needsApproval = 
                        o.status === 'waiting_counter_approval' || 
                        o.status === 'pending' || 
                        o.status === 'held';

                      return (
                        <tr 
                          key={o.id} 
                          className={needsApproval ? 'bg-amber-50/60 font-semibold' : 'hover:bg-slate-50/50'}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.order_number}</td>
                          <td className="py-3 px-4 truncate max-w-[140px]">{o.file_name}</td>
                          <td className="py-3 px-4">{o.copies}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">₹{o.total_amount?.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-block ${
                              o.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                              o.status === 'printing' ? 'bg-blue-100 text-blue-800 animate-pulse' : 
                              o.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 
                              o.status === 'waiting_counter_approval' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {o.status === 'waiting_counter_approval' ? 'HOLD: NEEDS APPROVAL' : o.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {needsApproval ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApproveOrder(o.order_number)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[11px] transition flex items-center gap-1 shadow-md shadow-emerald-600/30"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Print Now</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectOrder(o.order_number)}
                                  className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : o.status === 'completed' ? (
                              <span className="text-[10px] font-bold text-emerald-600">Printed</span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">Spooling...</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pricing Rules */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Page Printing Rates
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {pricing.map((rule) => (
                <div key={rule.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    {rule.paper_size} {rule.is_color ? 'Color' : 'B&W'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {rule.is_double_sided ? 'Double-sided' : 'Single-sided'}
                  </span>
                  <div className="flex items-center gap-1 pt-1">
                    <span className="text-xs font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      step="0.5"
                      defaultValue={rule.price_per_page}
                      onBlur={(e) => handleUpdatePrice(rule.id, parseFloat(e.target.value))}
                      className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
