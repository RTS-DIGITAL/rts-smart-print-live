import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Lock, 
  KeyRound, 
  Store, 
  CheckCircle2, 
  RefreshCw, 
  Plus, 
  Phone, 
  Mail, 
  Search, 
  ExternalLink, 
  Edit, 
  X,
  Settings
} from 'lucide-react';

interface ShopRow {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  upi_id: string | null;
  target_printer_name: string | null;
  counter_notice: string | null;
  subscription_status: string;
  subscription_plan: string;
  subscription_expires_at: string;
  created_at: string;
  pairing_code?: string;
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

// Master Admin Security PIN (You can change this PIN anytime)
const MASTER_ADMIN_PIN = "7012";

export const SuperAdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState<'inquiries' | 'shops'>('inquiries');
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Shop Edit Modal State
  const [editingShop, setEditingShop] = useState<ShopRow | null>(null);

  // New Provisioning State
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeInquiryId, setActiveInquiryId] = useState<string | null>(null);
  const [newShop, setNewShop] = useState({
    name: '',
    slug: '',
    phone: '',
    plan: 'starter',
    expiryMonths: 12,
  });

  const [provisionResult, setProvisionResult] = useState<{
    slug: string;
    pairingCode: string;
  } | null>(null);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === MASTER_ADMIN_PIN) {
      setIsAuthenticated(true);
      setPinError(false);
      loadData();
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [shopsRes, keysRes, inqRes] = await Promise.all([
        supabase.from('shops').select('*').order('created_at', { ascending: false }),
        supabase.from('shop_connector_keys').select('shop_id, pairing_code'),
        supabase.from('shop_inquiries').select('*').order('created_at', { ascending: false })
      ]);

      const keyMap = new Map((keysRes.data || []).map(k => [k.shop_id, k.pairing_code]));

      if (shopsRes.data) {
        const enrichedShops = (shopsRes.data as ShopRow[]).map(s => ({
          ...s,
          pairing_code: keyMap.get(s.id) || '---'
        }));
        setShops(enrichedShops);
      }
      if (inqRes.data) setInquiries(inqRes.data as InquiryRow[]);
    } catch (err) {
      console.error('Failed to load Super-Admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInquiryStatus = async (id: string, status: string) => {
    await supabase.from('shop_inquiries').update({ status }).eq('id', id);
    loadData();
  };

  const handleStartApprove = (inq: InquiryRow) => {
    const slug = inq.business_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    setActiveInquiryId(inq.id);
    setNewShop({
      name: inq.business_name,
      slug: slug || 'shop-kiosk',
      phone: inq.phone,
      plan: inq.selected_plan === 'trial' ? 'starter' : inq.selected_plan || 'starter',
      expiryMonths: inq.selected_plan === 'trial' ? 0 : 12
    });
    setProvisionResult(null);
    setShowAddModal(true);
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanSlug = newShop.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
      
      const { data, error } = await supabase.rpc('provision_new_tenant', {
        p_name: newShop.name,
        p_slug: cleanSlug,
        p_phone: newShop.phone,
        p_plan: newShop.plan,
        p_expiry_months: Number(newShop.expiryMonths)
      });

      if (error) throw error;

      if (activeInquiryId) {
        await supabase.from('shop_inquiries').update({ status: 'approved' }).eq('id', activeInquiryId);
      }

      setProvisionResult({
        slug: cleanSlug,
        pairingCode: data.pairing_code
      });

      loadData();
    } catch (err: any) {
      alert('Error creating shop: ' + err.message);
    }
  };

  const handleSaveShopEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop) return;

    try {
      const { error } = await supabase.from('shops').update({
        name: editingShop.name,
        phone: editingShop.phone,
        upi_id: editingShop.upi_id,
        target_printer_name: editingShop.target_printer_name,
        counter_notice: editingShop.counter_notice,
        subscription_status: editingShop.subscription_status,
      }).eq('id', editingShop.id);

      if (error) throw error;
      setEditingShop(null);
      loadData();
    } catch (err: any) {
      alert('Failed to update shop: ' + err.message);
    }
  };

  // Password Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">RTS Master Control</h2>
            <p className="text-xs text-slate-400 mt-1">Enter Master Security PIN to access all shops</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={6}
              placeholder="Enter PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center tracking-[0.5em] text-2xl font-black py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              autoFocus
            />

            {pinError && (
              <p className="text-xs font-bold text-rose-600">Incorrect Security PIN</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-slate-900 text-white px-8 py-5 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-xl text-slate-900">
            Ω
          </div>
          <div>
            <h1 className="font-extrabold text-lg flex items-center gap-2">
              RTS Smart Print <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">Master Panel</span>
            </h1>
            <p className="text-xs text-slate-400">Total System Control & Tenant Oversight</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              setActiveInquiryId(null);
              setProvisionResult(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30"
          >
            <Plus className="w-4 h-4" />
            Provision New Shop
          </button>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="p-2.5 bg-slate-800 hover:bg-rose-950 text-rose-400 rounded-xl transition text-xs"
            title="Lock Panel"
          >
            Lock
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex gap-4 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`text-sm font-bold pb-2 transition ${
              activeTab === 'inquiries' ? 'text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Inquiries ({inquiries.filter(i => i.status === 'new').length} New)
          </button>
          <button
            onClick={() => setActiveTab('shops')}
            className={`text-sm font-bold pb-2 transition ${
              activeTab === 'shops' ? 'text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Tenant Shops ({shops.length})
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* INQUIRIES TAB */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            {inquiries.map((inq) => (
              <div key={inq.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-base">{inq.business_name}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {inq.selected_plan}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      inq.status === 'new' ? 'bg-amber-100 text-amber-800' :
                      inq.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
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
                    href={`https://wa.me/91${inq.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(inq.owner_name)},%20this%20is%20Rajaneesh%20from%20RTS%20Smart%20Print.`}
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
                    onClick={() => handleStartApprove(inq)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white font-semibold rounded-xl text-xs"
                  >
                    Approve & Provision
                  </button>
                </div>
              </div>
            ))}
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
                  <th className="py-3 px-4">Shop Name</th>
                  <th className="py-3 px-4">Public Kiosk</th>
                  <th className="py-3 px-4">Shop Admin</th>
                  <th className="py-3 px-4">Pairing Code</th>
                  <th className="py-3 px-4">Printer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Master Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {shops
                  .filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.slug?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((shop) => (
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
                      <td className="py-3 px-4">
                        <a
                          href={`/shop/${shop.slug}/admin`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1 font-mono"
                        >
                          /admin
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {shop.pairing_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-[140px]">
                        {shop.target_printer_name || 'System Default'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          shop.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          shop.subscription_status === 'trial' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {shop.subscription_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => setEditingShop(shop)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white font-semibold rounded-lg text-[11px] inline-flex items-center gap-1"
                        >
                          <Settings className="w-3 h-3" />
                          Remote Settings
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* REMOTE SHOP SETTINGS OVERRIDE MODAL */}
      {editingShop && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Remote Shop Manager: {editingShop.name}</h3>
                <p className="text-[11px] text-slate-400 font-mono">Editing directly from Super Admin</p>
              </div>
              <button onClick={() => setEditingShop(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSaveShopEdits} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Shop Name</label>
                <input
                  type="text"
                  value={editingShop.name}
                  onChange={(e) => setEditingShop({ ...editingShop, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Owner Contact Phone</label>
                  <input
                    type="tel"
                    value={editingShop.phone || ''}
                    onChange={(e) => setEditingShop({ ...editingShop, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Printer Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Canon LBP2900 or Microsoft Print to PDF"
                    value={editingShop.target_printer_name || ''}
                    onChange={(e) => setEditingShop({ ...editingShop, target_printer_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shop UPI ID (for customer direct payouts)</label>
                <input
                  type="text"
                  placeholder="e.g. shopowner@upi"
                  value={editingShop.upi_id || ''}
                  onChange={(e) => setEditingShop({ ...editingShop, upi_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Counter Collection Notice</label>
                <input
                  type="text"
                  placeholder="e.g. Please collect prints at Counter 1"
                  value={editingShop.counter_notice || ''}
                  onChange={(e) => setEditingShop({ ...editingShop, counter_notice: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subscription Status</label>
                <select
                  value={editingShop.subscription_status}
                  onChange={(e) => setEditingShop({ ...editingShop, subscription_status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none bg-white"
                >
                  <option value="active">Active (Paid)</option>
                  <option value="trial">7-Day Free Trial</option>
                  <option value="suspended">Suspended / Inactive</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingShop(null)}
                  className="w-1/2 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow"
                >
                  Save Shop Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROVISION NEW SHOP MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            {provisionResult ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-xl">Shop Activated Successfully!</h3>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Customer Kiosk Link:</span>
                    <a
                      href={`/shop/${provisionResult.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 font-bold hover:underline break-all"
                    >
                      {window.location.origin}/shop/{provisionResult.slug}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">6-Digit Agent Pairing Code:</span>
                    <span className="text-2xl font-mono font-black text-slate-900 tracking-wider">
                      {provisionResult.pairingCode}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setProvisionResult(null);
                  }}
                  className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-black transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateShop} className="space-y-3.5">
                <h3 className="font-extrabold text-slate-900 text-lg mb-1">Provision New Tenant Shop</h3>
                <p className="text-xs text-slate-400 mb-3">Creates their kiosk URL and generates their agent pairing code.</p>

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
                      <option value={0}>7-Day Free Trial (₹0)</option>
                      <option value={12}>1 Year (12 Mo)</option>
                      <option value={24}>2 Years (24 Mo)</option>
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPage;
