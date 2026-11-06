import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, 
  Store, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Plus, 
  Phone, 
  Mail, 
  Search,
  ExternalLink
} from 'lucide-react';

interface ShopRow {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  subscription_status: string;
  subscription_plan: string;
  subscription_expires_at: string;
  created_at: string;
}

interface InquiryRow {
  id: string;
  business_name: string;
  owner_name: string;
  phone: string;
  email: string;
  city: string;
  selected_plan: string;
  printer_model: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

export const SuperAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shops' | 'inquiries'>('inquiries');
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // New Shop Provisioning Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShop, setNewShop] = useState({
    name: '',
    slug: '',
    phone: '',
    plan: 'starter',
    expiryMonths: 12,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [shopsRes, inqRes] = await Promise.all([
        supabase.from('shops').select('*').order('created_at', { ascending: false }),
        supabase.from('shop_inquiries').select('*').order('created_at', { ascending: false })
      ]);

      if (shopsRes.data) setShops(shopsRes.data as ShopRow[]);
      if (inqRes.data) setInquiries(inqRes.data as InquiryRow[]);
    } catch (err) {
      console.error('Failed to load Super-Admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateInquiryStatus = async (id: string, status: string) => {
    await supabase.from('shop_inquiries').update({ status }).eq('id', id);
    loadData();
  };

  const handleExtendSubscription = async (shopId: string, additionalMonths: number) => {
    const shop = shops.find(s => s.id === shopId);
    if (!shop) return;

    const currentExpiry = new Date(shop.subscription_expires_at);
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    baseDate.setMonth(baseDate.getMonth() + additionalMonths);

    await supabase.from('shops').update({
      subscription_expires_at: baseDate.toISOString(),
      subscription_status: 'active'
    }).eq('id', shopId);

    loadData();
  };

  const handleToggleShopStatus = async (shopId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await supabase.from('shops').update({ subscription_status: nextStatus }).eq('id', shopId);
    loadData();
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + Number(newShop.expiryMonths));

    const { error } = await supabase.from('shops').insert([
      {
        name: newShop.name,
        slug: newShop.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-'),
        phone: newShop.phone,
        subscription_plan: newShop.plan,
        subscription_status: 'active',
        subscription_expires_at: expiryDate.toISOString(),
        is_accepting_orders: true,
        require_payment: true
      }
    ]);

    if (!error) {
      setShowAddModal(false);
      setNewShop({ name: '', slug: '', phone: '', plan: 'starter', expiryMonths: 12 });
      loadData();
    } else {
      alert('Error creating shop: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Banner */}
      <header className="bg-slate-900 text-white px-8 py-5 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-xl text-slate-900">
            Ω
          </div>
          <div>
            <h1 className="font-extrabold text-lg flex items-center gap-2">
              RTS Smart Print <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">Super Admin</span>
            </h1>
            <p className="text-xs text-slate-400">Master Client Provisioning & Subscription Oversight</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30"
          >
            <Plus className="w-4 h-4" />
            Provision New Shop
          </button>
        </div>
      </header>

      {/* Control Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex gap-4 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`text-sm font-bold pb-2 relative transition ${
              activeTab === 'inquiries' ? 'text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Inquiries & Registrations ({inquiries.filter(i => i.status === 'new').length} New)
          </button>
          <button
            onClick={() => setActiveTab('shops')}
            className={`text-sm font-bold pb-2 relative transition ${
              activeTab === 'shops' ? 'text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Active Tenant Shops ({shops.length})
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* INQUIRIES TAB */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            {inquiries.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
                No registrations received yet. Inquiries from <code>/for-business</code> will appear here instantly.
              </div>
            ) : (
              <div className="grid gap-4">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-base">{inq.business_name}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {inq.selected_plan}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          inq.status === 'new' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {inq.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Owner: <strong className="text-slate-700">{inq.owner_name}</strong> • City: {inq.city}
                      </p>
                      <div className="flex items-center gap-4 pt-1 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-emerald-600" /> {inq.phone}</span>
                        <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-emerald-600" /> {inq.email}</span>
                        {inq.printer_model && <span>Printer: {inq.printer_model}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/91${inq.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(inq.owner_name)},%20this%20is%20RTS%20Smart%20Print.%20We%20received%20your%20registration%20for%20${encodeURIComponent(inq.business_name)}.`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition"
                      >
                        WhatsApp
                      </a>
                      <button
                        onClick={() => handleUpdateInquiryStatus(inq.id, 'contacted')}
                        className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs"
                      >
                        Mark Contacted
                      </button>
                      <button
                        onClick={() => handleUpdateInquiryStatus(inq.id, 'approved')}
                        className="px-3 py-2 bg-slate-900 hover:bg-black text-white font-semibold rounded-xl text-xs"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SHOPS TAB */}
        {activeTab === 'shops' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="relative w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter shops..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-xs text-slate-400 font-medium">{shops.length} total registered kiosks</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Shop</th>
                  <th className="py-3 px-4">Slug (URL)</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Subscription Status</th>
                  <th className="py-3 px-4">AMC Expiry Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {shops
                  .filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.slug?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((shop) => {
                    const expiry = new Date(shop.subscription_expires_at);
                    const isExpired = expiry < new Date();

                    return (
                      <tr key={shop.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{shop.name}</td>
                        <td className="py-3 px-4">
                          <a
                            href={`/shop/${shop.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 hover:underline flex items-center gap-1 font-mono"
                          >
                            /{shop.slug}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="py-3 px-4 uppercase font-bold text-[10px] text-slate-500">
                          {shop.subscription_plan || 'starter'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            shop.subscription_status === 'active' && !isExpired
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isExpired ? 'Expired' : shop.subscription_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleExtendSubscription(shop.id, 12)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-[11px]"
                            title="Add 1 Year AMC"
                          >
                            +1 Year AMC
                          </button>
                          <button
                            onClick={() => handleToggleShopStatus(shop.id, shop.subscription_status)}
                            className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-[11px]"
                          >
                            {shop.subscription_status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ADD SHOP MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-lg mb-1">Provision New Tenant Shop</h3>
            <p className="text-xs text-slate-400 mb-4">Instantly creates their custom kiosk URL and sets their subscription date.</p>

            <form onSubmit={handleCreateShop} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business / Shop Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Xerox"
                  value={newShop.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                    setNewShop({ ...newShop, name, slug: autoSlug });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kiosk URL Slug</label>
                <input
                  type="text"
                  required
                  value={newShop.slug}
                  onChange={(e) => setNewShop({ ...newShop, slug: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Will be: <code>/shop/{newShop.slug || 'slug'}</code></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Contact Phone</label>
                <input
                  type="tel"
                  placeholder="Mobile number"
                  value={newShop.phone}
                  onChange={(e) => setNewShop({ ...newShop, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plan</label>
                  <select
                    value={newShop.plan}
                    onChange={(e) => setNewShop({ ...newShop, plan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Validity</label>
                  <select
                    value={newShop.expiryMonths}
                    onChange={(e) => setNewShop({ ...newShop, expiryMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                  >
                    <option value={12}>1 Year (12 Mo)</option>
                    <option value={24}>2 Years (24 Mo)</option>
                    <option value={1}>1 Month Trial</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl text-xs text-white shadow-md"
                >
                  Create & Activate
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
