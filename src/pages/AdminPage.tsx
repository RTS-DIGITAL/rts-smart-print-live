import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SHOP_SLUG } from '@/lib/pricing';
import { 
  Store, 
  Printer, 
  Settings, 
  RefreshCw, 
  Power, 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ShieldAlert,
  Save
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

  // Editable form state
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [targetPrinter, setTargetPrinter] = useState('');
  const [counterNotice, setCounterNotice] = useState('');
  const [isAccepting, setIsAccepting] = useState(true);

  const loadShopData = async () => {
    setLoading(true);
    try {
      // 1. Fetch shop profile
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

      // 2. Fetch pairing code
      const { data: keyRes } = await supabase
        .from('shop_connector_keys')
        .select('pairing_code')
        .eq('shop_id', shopRes.id)
        .single();

      if (keyRes) setPairingCode(keyRes.pairing_code);

      // 3. Fetch recent shop orders
      const { data: ordersRes } = await supabase
        .from('print_orders')
        .select('*')
        .eq('shop_id', shopRes.id)
        .order('created_at', { ascending: false })
        .limit(15);

      if (ordersRes) setOrders(ordersRes);

      // 4. Fetch pricing rules
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
          is_accepting_orders: isAccepting
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

  const handleUpdatePrice = async (ruleId: string, newPrice: number) => {
    await supabase.from('pricing_rules').update({ price_per_page: newPrice }).eq('id', ruleId);
    loadShopData();
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
            No registered store found with slug: <code className="font-mono text-emerald-700">{activeSlug}</code>
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
        {/* Left Column: Settings & Printer */}
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

            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
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

              <div className="flex items-center justify-between pt-2">
                <span className="font-semibold text-slate-700">Accepting Orders</span>
                <button
                  type="button"
                  onClick={() => setIsAccepting(!isAccepting)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition ${
                    isAccepting ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isAccepting ? 'Online' : 'Paused'}
                </button>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 mt-2"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Queue & Pricing */}
        <div className="md:col-span-2 space-y-6">
          {/* Live Orders Table */}
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
                      <th className="py-2.5 px-4">Paid</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.order_number}</td>
                        <td className="py-3 px-4 truncate max-w-[160px]">{o.file_name}</td>
                        <td className="py-3 px-4">{o.copies}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">₹{o.total_amount?.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            o.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            o.status === 'printing' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
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
