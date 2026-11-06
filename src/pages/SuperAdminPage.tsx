import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, 
  Store, 
  Settings, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  KeyRound, 
  ExternalLink,
  Search,
  Lock,
  Mail,
  Send,
  Phone,
  Tag,
  DollarSign,
  Plus,
  Save,
  Check,
  Ban,
  CheckCircle2,
  UserPlus
} from 'lucide-react';

interface ShopTenant {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  owner_email: string | null;
  upi_id: string | null;
  target_printer_name: string | null;
  counter_notice: string | null;
  subscription_status: string;
  is_accepting_orders: boolean;
  auto_delete_hours: number;
  created_at: string;
}

interface PlatformPlan {
  id: string;
  plan_slug: string;
  name: string;
  original_price: number;
  offer_price: number;
  billing_period: string;
  trial_days: number;
  badge_text: string;
  is_active: boolean;
}

interface Inquiry {
  id: string;
  business_name: string;
  owner_name: string;
  phone: string;
  email: string;
  city: string;
  selected_plan: string;
  printer_model: string;
  status: string;
  created_at: string;
}

export const SuperAdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState<'shops' | 'inquiries' | 'pricing'>('shops');

  const [shops, setShops] = useState<ShopTenant[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [editingShop, setEditingShop] = useState<ShopTenant | null>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [approvingInquiryId, setApprovingInquiryId] = useState<string | null>(null);

  const sendShopStatusEmail = async (email: string, shopName: string, action: 'approved' | 'suspended' | 'reactivated', details?: { slug: string; pairingCode: string }) => {
    if (!email) return;

    let subject = '';
    let body = '';

    if (action === 'approved') {
      subject = `🎉 Welcome to RTS Smart Print - ${shopName} is Activated!`;
      body = `Hi ${shopName},\n\nYour print station account has been approved and activated!\n\nShop Links:\n- Customer Kiosk: https://rts-smart-print-live.vercel.app/shop/${details?.slug}\n- Admin Dashboard: https://rts-smart-print-live.vercel.app/shop/${details?.slug}/admin\n\nYour 6-Digit Windows Agent Pairing Code: ${details?.pairingCode}\n\nEnter this code into RTS-Smart-Print-Agent.exe on your counter PC to link your printer.\n\nSupport: RTS Digital Seva (7012833699)`;
    } else if (action === 'suspended') {
      subject = `⚠️ RTS Smart Print Account Suspended: ${shopName}`;
      body = `Hi ${shopName},\n\nYour shop subscription has been suspended due to an expired trial or pending payment. Customer uploads to your kiosk have been paused.\n\nPlease contact RTS Smart Print Super Admin to reactivate your station.`;
    } else if (action === 'reactivated') {
      subject = `✅ RTS Smart Print Account Reactivated: ${shopName}`;
      body = `Hi ${shopName},\n\nPayment received! Your print station has been re-approved and reactivated. Your kiosk is now accepting customer print jobs again.\n\nThank you for partnering with RTS Smart Print!`;
    }

    try {
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: 'c6424f38-4a5e-4f4c-b874-460081e81c74',
          to_email: email,
          subject: subject,
          message: body,
          from_name: 'RTS Smart Print Super Admin'
        })
      });
    } catch {
      window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '7012') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const { data: shopsData } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });
      if (shopsData) setShops(shopsData);

      // Fetch from shop_inquiries (matching BusinessLandingPage)
      const { data: inqData } = await supabase
        .from('shop_inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (inqData) setInquiries(inqData);

      const { data: plansData } = await supabase
        .from('platform_plans')
        .select('*')
        .order('original_price', { ascending: true });
      if (plansData) setPlans(plansData);
    } catch (err) {
      console.error('SuperAdmin load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  // 1-Click Approve Inquiry & Provision Shop
  const handleApproveAndCreateShop = async (inq: Inquiry) => {
    if (!window.confirm(`Approve ${inq.business_name} and generate counter station?`)) return;
    setApprovingInquiryId(inq.id);

    try {
      const slug = inq.business_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `shop-${Math.floor(1000 + Math.random() * 9000)}`;

      const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();

      // 1. Create shop in shops table
      const { data: newShop, error: shopErr } = await supabase
        .from('shops')
        .insert([
          {
            name: inq.business_name,
            slug: slug,
            phone: inq.phone,
            owner_email: inq.email,
            subscription_status: 'active',
            is_accepting_orders: true,
            require_payment: false,
            target_printer_name: inq.printer_model || 'Microsoft Print to PDF',
            counter_notice: 'Please collect your prints at the counter',
            auto_delete_hours: 24,
            is_pin_protected: false,
            auto_print_enabled: true
          }
        ])
        .select()
        .single();

      if (shopErr) throw shopErr;

      // 2. Generate shop connector pairing key
      await supabase.from('shop_connector_keys').insert([
        {
          shop_id: newShop.id,
          pairing_code: pairingCode,
          is_active: true
        }
      ]);

      // 3. Add default pricing rules
      await supabase.from('pricing_rules').insert([
        { shop_id: newShop.id, paper_size: 'A4', is_color: false, is_double_sided: false, price_per_page: 2.0 },
        { shop_id: newShop.id, paper_size: 'A4', is_color: true, is_double_sided: false, price_per_page: 10.0 }
      ]);

      // 4. Mark inquiry approved
      await supabase
        .from('shop_inquiries')
        .update({ status: 'approved' })
        .eq('id', inq.id);

      // 5. Send automated onboarding email
      await sendShopStatusEmail(inq.email, inq.business_name, 'approved', { slug, pairingCode });

      alert(`🎉 Shop created!\nSlug: /shop/${slug}\nPairing Code: ${pairingCode}`);
      setActiveTab('shops');
      fetchAllData();
    } catch (err: any) {
      alert('Failed to approve shop: ' + err.message);
    } finally {
      setApprovingInquiryId(null);
    }
  };

  const handleSuspendShop = async (shop: ShopTenant) => {
    if (!window.confirm(`Suspend ${shop.name}? Customer kiosk will be paused.`)) return;
    try {
      await supabase
        .from('shops')
        .update({ subscription_status: 'suspended', is_accepting_orders: false })
        .eq('id', shop.id);

      if (shop.owner_email) {
        sendShopStatusEmail(shop.owner_email, shop.name, 'suspended');
      }

      alert(`${shop.name} has been suspended.`);
      fetchAllData();
    } catch (err: any) {
      alert('Error suspending shop: ' + err.message);
    }
  };

  const handleReactivateShop = async (shop: ShopTenant) => {
    if (!window.confirm(`Re-approve and activate ${shop.name}?`)) return;
    try {
      await supabase
        .from('shops')
        .update({ subscription_status: 'active', is_accepting_orders: true })
        .eq('id', shop.id);

      if (shop.owner_email) {
        sendShopStatusEmail(shop.owner_email, shop.name, 'reactivated');
      }

      alert(`${shop.name} has been reactivated successfully!`);
      fetchAllData();
    } catch (err: any) {
      alert('Error reactivating shop: ' + err.message);
    }
  };

  const handleSaveShopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop) return;
    setModalSaving(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          name: editingShop.name,
          phone: editingShop.phone,
          owner_email: editingShop.owner_email,
          upi_id: editingShop.upi_id,
          target_printer_name: editingShop.target_printer_name,
          counter_notice: editingShop.counter_notice,
          subscription_status: editingShop.subscription_status,
          auto_delete_hours: Number(editingShop.auto_delete_hours || 24),
          is_accepting_orders: editingShop.subscription_status !== 'suspended'
        })
        .eq('id', editingShop.id);

      if (error) throw error;
      setEditingShop(null);
      fetchAllData();
    } catch (err: any) {
      alert('Failed to update shop: ' + err.message);
    } finally {
      setModalSaving(false);
    }
  };

  const handleUpdatePlan = async (planId: string, updates: Partial<PlatformPlan>) => {
    try {
      await supabase.from('platform_plans').update(updates).eq('id', planId);
      fetchAllData();
    } catch (err: any) {
      alert('Failed to update plan: ' + err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Super Admin Access</h1>
            <p className="text-xs text-slate-400 mt-1">Enter Master Security PIN to manage tenants</p>
          </div>
          <form onSubmit={handlePinSubmit} className="space-y-3">
            <input
              type="password"
              maxLength={4}
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full py-3 bg-slate-950 border border-slate-800 rounded-2xl text-center text-2xl font-mono tracking-widest text-emerald-400 outline-none focus:border-emerald-500"
            />
            {pinError && <p className="text-xs text-rose-500 font-bold">Incorrect Master PIN</p>}
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition"
            >
              Verify PIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredShops = shops.filter((s) => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 sticky top-0 z-40 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-emerald-500/30">
            ⚡
          </div>
          <div>
            <h1 className="font-black text-base text-white flex items-center gap-2">
              RTS Super Admin
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PROD
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">Central Multi-Tenant Controller</p>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('shops')}
            className={`px-4 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'shops' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Shops ({shops.length})
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-4 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'inquiries' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Inquiries ({inquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-1.5 rounded-xl font-bold transition ${
              activeTab === 'pricing' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pricing & Offers ({plans.length})
          </button>
        </div>

        <button
          onClick={fetchAllData}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* SHOPS TAB */}
        {activeTab === 'shops' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search shops by name or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Shop</th>
                      <th className="py-3 px-4">Contact & Email</th>
                      <th className="py-3 px-4">Auto-Delete</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Super Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredShops.map((shop) => {
                      const isSuspended = shop.subscription_status === 'suspended';

                      return (
                        <tr key={shop.id} className="hover:bg-slate-800/30">
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-white text-sm block">{shop.name}</span>
                            <span className="text-[11px] font-mono text-emerald-400">/shop/{shop.slug}</span>
                          </td>

                          <td className="py-3.5 px-4 space-y-0.5">
                            <p className="font-semibold text-slate-300">{shop.phone || 'No phone'}</p>
                            <p className="text-[11px] text-slate-500">{shop.owner_email || 'No email saved'}</p>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 font-bold text-[10px]">
                              {shop.auto_delete_hours || 24} Hours
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              shop.subscription_status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              shop.subscription_status === 'suspended' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {shop.subscription_status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isSuspended ? (
                                <button
                                  type="button"
                                  onClick={() => handleReactivateShop(shop)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[10px] transition flex items-center gap-1 shadow"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Re-Approve</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSuspendShop(shop)}
                                  className="px-2.5 py-1.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-300 rounded-xl font-bold text-[10px] transition flex items-center gap-1"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Suspend</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setEditingShop(shop)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-[10px] transition flex items-center gap-1"
                              >
                                <Settings className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Manage</span>
                              </button>

                              <a
                                href={`/shop/${shop.slug}/admin`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                                title="Open Counter Admin"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* INQUIRIES TAB WITH 1-CLICK APPROVAL */}
        {activeTab === 'inquiries' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-black text-white">Pending Partner Inquiries</h2>
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-bold">
                {inquiries.length} submitted
              </span>
            </div>

            {inquiries.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No inquiries submitted yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {inquiries.map((inq) => {
                  const isAlreadyApproved = inq.status === 'approved';

                  return (
                    <div key={inq.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-white">{inq.business_name}</h3>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            isAlreadyApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {inq.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Owner: <span className="text-slate-200 font-bold">{inq.owner_name}</span> • Phone: {inq.phone} • {inq.email} • {inq.city}
                        </p>
                        {inq.printer_model && (
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Printer: {inq.printer_model} • Plan: {inq.selected_plan}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isAlreadyApproved && (
                          <button
                            type="button"
                            disabled={approvingInquiryId === inq.id}
                            onClick={() => handleApproveAndCreateShop(inq)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>{approvingInquiryId === inq.id ? 'Provisioning...' : 'Approve & Create Shop'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => sendShopStatusEmail(inq.email, inq.business_name, 'approved')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition flex items-center gap-1"
                        >
                          <Mail className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Resend Email</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PRICING TAB */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  Public Landing Page Pricing & Promotional Offers
                </h2>
                <p className="text-xs text-slate-400">
                  Adjust launch offers, strike-through rates, and trial periods displayed on <code>/for-business</code>.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-2">
                {plans.map((plan) => (
                  <div key={plan.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-white text-base">{plan.name}</span>
                      <input
                        type="text"
                        defaultValue={plan.badge_text}
                        onBlur={(e) => handleUpdatePlan(plan.id, { badge_text: e.target.value })}
                        className="bg-slate-900 border border-slate-800 text-[10px] font-black text-emerald-400 px-2 py-1 rounded-lg uppercase outline-none focus:border-emerald-500"
                        title="Promotional Badge"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-500 mb-1">Original Price (₹)</label>
                        <input
                          type="number"
                          defaultValue={plan.original_price}
                          onBlur={(e) => handleUpdatePlan(plan.id, { original_price: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-emerald-400 font-bold mb-1">Offer Price (₹)</label>
                        <input
                          type="number"
                          defaultValue={plan.offer_price}
                          onBlur={(e) => handleUpdatePlan(plan.id, { offer_price: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-emerald-400 font-mono font-bold outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <label className="block text-slate-500 mb-1">Billing Period</label>
                        <select
                          defaultValue={plan.billing_period}
                          onChange={(e) => handleUpdatePlan(plan.id, { billing_period: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-1.5 text-white outline-none"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1">Free Trial Days</label>
                        <input
                          type="number"
                          defaultValue={plan.trial_days}
                          onBlur={(e) => handleUpdatePlan(plan.id, { trial_days: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-850">
                      <span className="text-[11px] text-slate-400">Offer Visibility:</span>
                      <button
                        type="button"
                        onClick={() => handleUpdatePlan(plan.id, { is_active: !plan.is_active })}
                        className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${
                          plan.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {plan.is_active ? 'Active on /for-business' : 'Hidden'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* REMOTE SHOP MANAGER MODAL */}
      {editingShop && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white">Remote Shop Manager: {editingShop.name}</h3>
                <p className="text-[11px] text-slate-400">Super Admin remote override</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingShop(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveShopSettings} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Display Shop Name</label>
                <input
                  type="text"
                  value={editingShop.name}
                  onChange={(e) => setEditingShop({ ...editingShop, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Owner Contact Phone</label>
                  <input
                    type="text"
                    value={editingShop.phone || ''}
                    onChange={(e) => setEditingShop({ ...editingShop, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Owner Email (For Alerts)</label>
                  <input
                    type="email"
                    placeholder="shop@gmail.com"
                    value={editingShop.owner_email || ''}
                    onChange={(e) => setEditingShop({ ...editingShop, owner_email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl space-y-1.5">
                <label className="block font-bold text-emerald-400">
                  Auto-Delete Printed Files (Save Supabase Space)
                </label>
                <select
                  value={editingShop.auto_delete_hours || 24}
                  onChange={(e) => setEditingShop({ ...editingShop, auto_delete_hours: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-emerald-800/60 rounded-xl px-3 py-2 text-white outline-none font-bold"
                >
                  <option value={1}>Auto-delete after 1 Hour</option>
                  <option value={4}>Auto-delete after 4 Hours</option>
                  <option value={12}>Auto-delete after 12 Hours</option>
                  <option value={24}>Auto-delete after 24 Hours (Max Limit)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Subscription Status</label>
                  <select
                    value={editingShop.subscription_status}
                    onChange={(e) => setEditingShop({ ...editingShop, subscription_status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="trial">7-Day Free Trial</option>
                    <option value="active">Active (Paid)</option>
                    <option value="suspended">Suspended (Trial Ended / Payment Due)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Target Printer Name</label>
                  <input
                    type="text"
                    value={editingShop.target_printer_name || ''}
                    onChange={(e) => setEditingShop({ ...editingShop, target_printer_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Shop UPI ID</label>
                <input
                  type="text"
                  value={editingShop.upi_id || ''}
                  onChange={(e) => setEditingShop({ ...editingShop, upi_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingShop(null)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow transition"
                >
                  {modalSaving ? 'Saving...' : 'Save Shop Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPage;
