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
  FileText, 
  CheckCircle2, 
  Clock, 
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
  Check
} from 'lucide-react';

interface ShopData {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  upi_id: string | null;
  target_printer_name: string | null;
  counter_notice: string | null;
  is_accepting_orders: boolean;
  require_payment: boolean;
  subscription_status: string;
  is_pin_protected: boolean;
  counter_pin: string;
  auto_print_enabled: boolean;
}

interface OrderRow {
  id: string;
  order_number: string;
  file_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  copies: number;
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
  const [pairingCode, setPairingCode] = useState<string>('---');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [targetPrinter, setTargetPrinter] = useState('');
  const [counterNotice, setCounterNotice] = useState('');
  const [isAccepting, setIsAccepting] = useState(true);
  const [requirePayment, setRequirePayment] = useState(true);
  const [isPinProtected, setIsPinProtected] = useState(false);
  const [counterPin, setCounterPin] = useState('1234');
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);

  const loadShopData = async () => {
    setLoading(true);
    try {
      const { data: shopRes, error: shopErr } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', activeSlug)
        .single();

      if (shopErr || !shopRes) throw new Error('Shop not found');

      setShop(shopRes);
      setShopName(shopRes.name || '');
      setPhone(shopRes.phone || '');
      setUpiId(shopRes.upi_id || '');
      setTargetPrinter(shopRes.target_printer_name || '');
      setCounterNotice(shopRes.counter_notice || '');
      setIsAccepting(shopRes.is_accepting_orders ?? true);
      setRequirePayment(shopRes.require_payment ?? true);
      setIsPinProtected(shopRes.is_pin_protected ?? false);
      setCounterPin(shopRes.counter_pin || '1234');
      setAutoPrintEnabled(shopRes.auto_print_enabled ?? true);

      const { data: keyRes } = await supabase
        .from('shop_connector_keys')
        .select('pairing_code')
        .eq('shop_id', shopRes.id)
        .single();

      if (keyRes) setPairingCode(keyRes.pairing_code);

      const { data: ordersRes } = await supabase
        .from('print_orders')
        .select('*')
        .eq('shop_id', shopRes.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (ordersRes) setOrders(ordersRes);

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
          upi_id: upiId,
          target_printer_name: targetPrinter,
          counter_notice: counterNotice,
          is_accepting_orders: isAccepting,
          require_payment: requirePayment,
          is_pin_protected: isPinProtected,
          counter_pin: counterPin,
          auto_print_enabled: autoPrintEnabled
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

  // Queue Approval / Reject Actions
  const handleApproveOrder = async (orderId: string) => {
    try {
      await supabase
        .from('print_orders')
        .update({ status: 'paid' })
        .eq('id', orderId);
      loadShopData();
    } catch (err: any) {
      alert('Error approving order: ' + err.message);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to discard this print job?')) return;
    try {
      await supabase
        .from('print_orders')
        .update({ status: 'rejected' })
        .eq('id', orderId);
      loadShopData();
    } catch (err: any) {
      alert('Error rejecting order: ' + err.message);
    }
  };

  const handleUpdatePrice = async (ruleId: string, newPrice: number) => {
    await supabase.from('pricing_rules').update({ price_per_page: newPrice }).eq('id', ruleId);
    loadShopData();
  };

  // Dynamic Standee Generator with Counter PIN
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
              margin: 0; 
              padding: 40px 20px; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh;
              background-color: #f8fafc;
              -webkit-print-color-adjust: exact;
            }
            .card { 
              width: 480px; 
              background: white; 
              border: 3px solid #059669; 
              border-radius: 28px; 
              padding: 40px 32px; 
              text-align: center;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            }
            .header-tag {
              display: inline-block;
              background: #ecfdf5;
              color: #059669;
              font-weight: 800;
              font-size: 13px;
              padding: 6px 16px;
              border-radius: 9999px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 12px;
            }
            h1 { 
              font-size: 28px; 
              color: #0f172a; 
              margin: 0 0 6px 0; 
              font-weight: 900;
            }
            p.sub { 
              color: #64748b; 
              font-size: 14px; 
              margin: 0 0 20px 0; 
            }
            .qr-box { 
              background: white; 
              padding: 16px; 
              border: 2px dashed #cbd5e1; 
              border-radius: 24px; 
              display: inline-block;
              margin-bottom: 18px;
            }
            .qr-box img { 
              width: 240px; 
              height: 240px; 
              display: block; 
            }
            .pin-badge {
              background: #fef3c7;
              border: 2px solid #f59e0b;
              color: #92400e;
              padding: 8px 16px;
              border-radius: 14px;
              font-size: 14px;
              font-weight: 900;
              margin-bottom: 20px;
              display: ${isPinProtected ? 'inline-block' : 'none'};
            }
            .steps { 
              background: #f8fafc; 
              border-radius: 16px; 
              padding: 16px; 
              text-align: left; 
              font-size: 13px; 
              color: #334155; 
              line-height: 1.8;
              margin-bottom: 20px;
            }
            .steps strong { color: #059669; }
            .footer { 
              font-size: 11px; 
              color: #94a3b8; 
              font-weight: 600; 
            }
            @media print {
              body { background: transparent; padding: 0; }
              .card { box-shadow: none; border-width: 2px; }
            }
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

            <div class="pin-badge">
              🔑 Counter Access PIN: ${counterPin}
            </div>

            <div class="steps">
              <div><strong>1. Scan QR</strong> using any smartphone camera or Google Lens</div>
              ${isPinProtected ? `<div><strong>2. Enter PIN (${counterPin})</strong> to unlock document upload</div>` : ''}
              <div><strong>${isPinProtected ? '3' : '2'}. Select & Upload</strong> your PDF, JPEG, or PNG files</div>
              <div><strong>${isPinProtected ? '4' : '3'}. Collect Prints</strong> immediately from this counter</div>
            </div>

            <div class="footer">Powered by RTS Smart Print Automation</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
          Loading shop dashboard...
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-sm space-y-3">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-slate-900">Shop Not Found</h2>
          <p className="text-xs text-slate-500">
            No store found with slug: <code className="font-mono text-emerald-700">{activeSlug}</code>
          </p>
          <Link to="/" className="inline-block mt-2 text-xs font-bold text-emerald-600 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-slate-900 text-lg">
            S
          </div>
          <div>
            <h1 className="font-black text-base flex items-center gap-2">
              {shop.name}
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                Shop Admin
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">/shop/{shop.slug}</p>
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
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto px-4 pt-6 grid md:grid-cols-3 gap-6">
        {/* Left Column: Settings */}
        <div className="md:col-span-1 space-y-6">
          {/* Agent Pairing Code Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
              Windows Agent Pairing Code
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono font-black text-slate-900 tracking-widest bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                {pairingCode}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                shop.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {shop.subscription_status}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              Enter this 6-digit code inside <code>RTS-Smart-Print-Agent.exe</code> on your counter computer to link printing.
            </p>
          </div>

          {/* Shop Settings Form */}
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

              {/* ANTI-SPAM 4-DIGIT PIN GATE TOGGLE */}
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
                    <p className="text-[10px] text-amber-700 mt-1 leading-tight">
                      Customers must type this PIN before they can upload files. Stops remote spam completely.
                    </p>
                  </div>
                )}
              </div>

              {/* PRINT EXECUTION MODE (AUTO-PILOT VS MANUAL) */}
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
                <p className="text-[10px] text-slate-500 leading-tight">
                  {autoPrintEnabled 
                    ? 'Orders spool to printer automatically as soon as submitted.'
                    : 'Jobs are held in queue until you click "Approve & Print" on this screen.'}
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

              {requirePayment && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shop Direct UPI ID</label>
                  <input
                    type="text"
                    placeholder="e.g. shop@okhdfcbank"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-mono"
                  />
                </div>
              )}

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
                <label className="block font-semibold text-slate-700 mb-1">Counter Collection Notice</label>
                <input
                  type="text"
                  placeholder="e.g. Please collect prints at Counter 1"
                  value={counterNotice}
                  onChange={(e) => setCounterNotice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold text-slate-700">Counter Queue Status</span>
                <button
                  type="button"
                  onClick={() => setIsAccepting(!isAccepting)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${
                    isAccepting ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isAccepting ? 'Accepting Orders' : 'Paused'}
                </button>
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

        {/* Right Column: Live Queue & Pricing */}
        <div className="md:col-span-2 space-y-6">
          {/* Live Orders Table with Manual Release Buttons */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-600" />
                  Recent Print Queue
                </h2>
                <p className="text-[11px] text-slate-400">Incoming customer jobs for this shop</p>
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                {orders.length} orders
              </span>
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
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {orders.map((o) => {
                      const isPending = o.status === 'pending' || o.status === 'waiting_counter_approval';

                      return (
                        <tr key={o.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.order_number}</td>
                          <td className="py-3 px-4 truncate max-w-[140px]">{o.file_name}</td>
                          <td className="py-3 px-4">{o.copies}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">₹{o.total_amount?.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              o.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                              o.status === 'printing' ? 'bg-blue-100 text-blue-800' : 
                              o.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApproveOrder(o.id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] transition flex items-center gap-1 shadow-sm"
                                  title="Approve & Send to Printer"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Print</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectOrder(o.id)}
                                  className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition"
                                  title="Reject & Discard"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">Synced</span>
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

          {/* Pricing Rules Configuration */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Page Printing Rates
              </h2>
              <p className="text-[11px] text-slate-400">Set per-page pricing charged to kiosk customers</p>
            </div>

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
