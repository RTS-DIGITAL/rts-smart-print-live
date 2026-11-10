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
  Unlock,
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
  UserPlus,
  MessageCircle,
  Calendar,
  Hourglass,
  Download,
  Bell,
  Megaphone
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
  selected_plan: string;
  subscription_days: number;
  is_accepting_orders: boolean;
  auto_delete_hours: number;
  pairing_code: string;
  admin_username: string;
  admin_pin: string;
  created_at: string;
  approved_at: string | null;
  download_count?: number;
  download_allowed?: boolean;
  max_downloads?: number;
  download_requested?: boolean;
  admin_message?: string | null;
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
  // Dedicated Form Dropdown Fields
  form_monthly_price?: string;
  form_yearly_price?: string;
  form_trial_days?: string;
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

const AGENT_DOWNLOAD_URL = "https://github.com/RTS-DIGITAL/rts-smart-print-live/releases/download/v1.0.0/RTS-Print-Setup.exe";

const COMMON_PRINTERS = [
  "Microsoft Print to PDF",
  "Canon LBP2900",
  "Brother DCP-T730DW Printer",
  "Brother DCP-T720DW",
  "Brother DCP-T426W",
  "Brother HL-L2321D series",
  "HP LaserJet Professional P1108",
  "HP LaserJet M1005",
  "HP Ink Tank 310 series",
  "HP Smart Tank 580 series",
  "Epson L3110 Series",
  "Epson L3210 Series",
  "Epson L3250 Series",
  "Canon G2010 series",
  "Canon G3010 series",
  "POS-58-Series",
  "POS-80-Printer"
];

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
  const [isCustomPrinterModal, setIsCustomPrinterModal] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [approvingInquiryId, setApprovingInquiryId] = useState<string | null>(null);

  const [broadcastText, setBroadcastText] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Dedicated Form Dropdown Customizer State
  const [formMonthlyPrice, setFormMonthlyPrice] = useState('499');
  const [formYearlyPrice, setFormYearlyPrice] = useState('2,499');
  const [formTrialDays, setFormTrialDays] = useState('7');
  const [formPricingSaving, setFormPricingSaving] = useState(false);

  const calculateDaysRemaining = (approvedAt: string | null, totalDays: number): { days: number; isExpired: boolean } => {
    if (!approvedAt) return { days: totalDays, isExpired: false };
    const approvalDate = new Date(approvedAt).getTime();
    const currentDate = new Date().getTime();
    const elapsedDays = Math.floor((currentDate - approvalDate) / (1000 * 60 * 60 * 24));
    const remaining = totalDays - elapsedDays;
    return {
      days: Math.max(0, remaining),
      isExpired: remaining <= 0
    };
  };

  const sendShopStatusEmail = async (email: string, shopName: string, action: 'approved' | 'suspended' | 'reactivated', details?: { slug: string; pairingCode: string }) => {
    if (!email) return;

    if (action === 'approved') {
      try {
        const generatedSlug = details?.slug || shopName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const generatedCode = details?.pairingCode || 'Check Admin';

        await fetch('https://script.google.com/macros/s/AKfycbytAx6dxUypNjcrwCHWh537MguDjcvVYqdduYfe4k9_d3-x_HW8xPwc3vxt2NxTpNs/exec', {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'approve',
            email: email,
            shopName: shopName,
            slug: generatedSlug,
            pairingCode: generatedCode,
            downloadUrl: AGENT_DOWNLOAD_URL
          })
        });
        alert(`📧 Official activation email sent successfully to ${email}!`);
      } catch (err) {
        console.error('Email dispatch failed:', err);
        alert('Failed to send automated email.');
      }
    } else {
      let subject = action === 'suspended' ? `⚠️ RTS Smart Print Account Suspended: ${shopName}` : `✅ RTS Smart Print Account Reactivated: ${shopName}`;
      let body = `Hi ${shopName},\n\nYour account status has been updated to: ${action}. Please contact RTS Digital Seva (7012833699) for assistance.`;
      window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
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

      const { data: inqData } = await supabase
        .from('shop_inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (inqData) setInquiries(inqData);

      const { data: plansData } = await supabase
        .from('platform_plans')
        .select('*')
        .order('original_price', { ascending: true });
      if (plansData) {
        setPlans(plansData);
        // Load custom form dropdown pricing from the first plan row or persistent storage if present
        const mainPlan = plansData[0];
        if (mainPlan) {
          if (mainPlan.form_monthly_price) setFormMonthlyPrice(mainPlan.form_monthly_price);
          if (mainPlan.form_yearly_price) setFormYearlyPrice(mainPlan.form_yearly_price);
          if (mainPlan.form_trial_days) setFormTrialDays(String(mainPlan.trial_days || mainPlan.form_trial_days));
        }
      }
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

  useEffect(() => {
    if (!isAuthenticated) return;
    const channel = supabase
      .channel('superadmin-shops-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shops' },
        () => fetchAllData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  const openManageModal = (shop: ShopTenant) => {
    const savedPrinter = shop.target_printer_name || 'Microsoft Print to PDF';
    setIsCustomPrinterModal(Boolean(savedPrinter && !COMMON_PRINTERS.includes(savedPrinter)));
    setEditingShop({
      ...shop,
      target_printer_name: savedPrinter,
      download_count: shop.download_count ?? 0,
      max_downloads: shop.max_downloads ?? 3,
      download_allowed: shop.download_allowed ?? true,
      download_requested: shop.download_requested ?? false,
      admin_message: shop.admin_message ?? ''
    });
  };

  const getWhatsAppKitLink = (inq: Inquiry) => {
    const slug = inq.business_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const existingShop = shops.find(s => s.slug === slug || s.name.toLowerCase() === inq.business_name.toLowerCase());
    const pairingCode = existingShop?.pairing_code || 'Check Admin';

    const cleanPhone = inq.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const message = `🎉 *Welcome to RTS Smart Print!*\n\nYour shop *${inq.business_name}* is activated and ready to receive print jobs.\n\n🔗 *Customer Kiosk Link:*\nhttps://rtsprint.online/shop/${slug}\n\n⚙️ *Shop Admin Dashboard:*\nhttps://rtsprint.online/shop/${slug}/admin\n\n📥 *Download PC Print Agent Setup:*\n${AGENT_DOWNLOAD_URL}\n\n🔑 *Windows Agent Pairing Code:*\n*${pairingCode}*\n\n*Setup Instructions:*\n1. Download & install *RTS-Print-Setup.exe* on your counter computer (or download from your Shop Admin panel)\n2. Enter your 6-digit pairing code: *${pairingCode}*\n3. Select your printer in Shop Admin settings and start accepting instant prints!\n\n_Support: RTS Digital Seva (7012833699)_`;

    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
  };

  const handleApproveAndCreateShop = async (inq: Inquiry) => {
    if (!window.confirm(`Approve ${inq.business_name} and generate counter station?`)) return;
    setApprovingInquiryId(inq.id);

    try {
      const slug = inq.business_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `shop-${Math.floor(1000 + Math.random() * 9000)}`;

      const uniquePairingCode = Math.floor(100000 + Math.random() * 900000).toString();
      const shortUsername = slug.split('-')[0] || slug;

      const initialDays = inq.selected_plan === 'trial_14' ? 14 : inq.selected_plan === 'yearly' ? 365 : 7;

      const { data: newShop, error: shopErr } = await supabase
        .from('shops')
        .insert([
          {
            name: inq.business_name,
            slug: slug,
            phone: inq.phone,
            owner_email: inq.email,
            subscription_status: 'trial',
            selected_plan: inq.selected_plan || 'starter_monthly',
            subscription_days: initialDays,
            is_accepting_orders: true,
            require_payment: false,
            target_printer_name: inq.printer_model || 'Microsoft Print to PDF',
            counter_notice: 'Please collect your prints at the counter',
            auto_delete_hours: 24,
            is_pin_protected: false,
            auto_print_enabled: true,
            pairing_code: uniquePairingCode,
            admin_username: shortUsername,
            admin_pin: '123456',
            approved_at: new Date().toISOString(),
            download_count: 0,
            max_downloads: 3,
            download_allowed: true,
            download_requested: false
          }
        ])
        .select()
        .single();

      if (shopErr) throw shopErr;

      await supabase.from('shop_connector_keys').insert([
        {
          shop_id: newShop.id,
          pairing_code: uniquePairingCode,
          is_active: true
        }
      ]);

      await supabase.from('pricing_rules').insert([
        { shop_id: newShop.id, paper_size: 'A4', is_color: false, is_double_sided: false, price_per_page: 2.0 },
        { shop_id: newShop.id, paper_size: 'A4', is_color: true, is_double_sided: false, price_per_page: 10.0 }
      ]);

      await supabase
        .from('shop_inquiries')
        .update({ status: 'approved' })
        .eq('id', inq.id);

      await sendShopStatusEmail(inq.email, inq.business_name, 'approved', { slug, pairingCode: uniquePairingCode });

      alert(`🎉 Shop created successfully!\nSlug: /shop/${slug}\nPairing Code: ${uniquePairingCode}\nLogin ID: ${shortUsername}`);
      setActiveTab('shops');
      fetchAllData();
    } catch (err: any) {
      alert('Failed to approve shop: ' + err.message);
    } finally {
      setApprovingInquiryId(null);
    }
  };

  const handleQuickUnlockDownload = async (shop: ShopTenant) => {
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          download_count: 0,
          download_allowed: true,
          download_requested: false
        })
        .eq('id', shop.id);

      if (error) throw error;
      alert(`✅ Software download unlocked and reset (0/${shop.max_downloads || 3}) for ${shop.name}!`);
      fetchAllData();
    } catch (err: any) {
      alert('Failed to unlock download: ' + err.message);
    }
  };

  const handleSendGlobalBroadcast = async (clear: boolean = false) => {
    const messageToSend = clear ? null : broadcastText.trim();
    if (!clear && !messageToSend) {
      alert('Please enter a message to broadcast to all shops.');
      return;
    }
    if (!window.confirm(clear ? 'Clear broadcast notice from all shops?' : `Send this notice to ALL ${shops.length} shops?`)) return;

    setSendingBroadcast(true);
    try {
      const shopIds = shops.map(s => s.id);
      if (shopIds.length > 0) {
        const { error } = await supabase
          .from('shops')
          .update({ admin_message: messageToSend })
          .in('id', shopIds);
        if (error) throw error;
      }
      if (clear) setBroadcastText('');
      alert(clear ? 'Broadcast notice cleared from all shops!' : '📢 Important notice sent to all shop admin panels!');
      fetchAllData();
    } catch (err: any) {
      alert('Broadcast failed: ' + err.message);
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleDeleteShop = async (shop: ShopTenant) => {
    const confirmation = window.prompt(`⚠️ PERMANENT DELETE\n\nType the shop name "${shop.name}" to delete this store, all files, and inquiries:`);
    if (confirmation !== shop.name) {
      if (confirmation !== null) alert('Shop name did not match. Deletion cancelled.');
      return;
    }

    try {
      const { data: files } = await supabase.storage.from('print-files').list(shop.id);
      if (files && files.length > 0) {
        const filePaths = files.map(f => `${shop.id}/${f.name}`);
        await supabase.storage.from('print-files').remove(filePaths);
      }

      await supabase
        .from('shop_inquiries')
        .delete()
        .or(`business_name.ilike.%${shop.name}%,email.eq.${shop.owner_email || ''}`);

      const { error } = await supabase.from('shops').delete().eq('id', shop.id);
      if (error) throw error;

      alert(`Shop "${shop.name}" and associated inquiries were permanently deleted.`);
      fetchAllData();
    } catch (err: any) {
      alert('Failed to delete shop: ' + err.message);
    }
  };

  const handleDeleteInquiry = async (inq: Inquiry) => {
    if (!window.confirm(`Delete inquiry for "${inq.business_name}"?`)) return;
    try {
      const { error } = await supabase.from('shop_inquiries').delete().eq('id', inq.id);
      if (error) throw error;
      fetchAllData();
    } catch (err: any) {
      alert('Failed to delete inquiry: ' + err.message);
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
        .update({ 
          subscription_status: 'active', 
          is_accepting_orders: true,
          approved_at: new Date().toISOString()
        })
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
      const cleanPairingCode = (editingShop.pairing_code || '').trim();
      const cleanPrinter = (editingShop.target_printer_name || '').trim() || 'Microsoft Print to PDF';

      const { error } = await supabase
        .from('shops')
        .update({
          name: editingShop.name,
          phone: editingShop.phone,
          owner_email: editingShop.owner_email,
          admin_username: editingShop.admin_username,
          admin_pin: editingShop.admin_pin,
          pairing_code: cleanPairingCode,
          upi_id: editingShop.upi_id,
          target_printer_name: cleanPrinter,
          counter_notice: editingShop.counter_notice,
          subscription_status: editingShop.subscription_status,
          selected_plan: editingShop.selected_plan,
          subscription_days: Number(editingShop.subscription_days || 7),
          auto_delete_hours: Number(editingShop.auto_delete_hours || 24),
          is_accepting_orders: editingShop.subscription_status !== 'suspended',
          download_count: Number(editingShop.download_count ?? 0),
          max_downloads: Number(editingShop.max_downloads ?? 3),
          download_allowed: Boolean(editingShop.download_allowed ?? true),
          download_requested: Boolean(editingShop.download_requested ?? false),
          admin_message: editingShop.admin_message?.trim() || null
        })
        .eq('id', editingShop.id);

      if (error) throw error;

      if (cleanPairingCode) {
        await supabase
          .from('shop_connector_keys')
          .update({ pairing_code: cleanPairingCode })
          .eq('shop_id', editingShop.id);
      }

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

  // Save Custom Form Dropdown Pricing Settings across platform plans
  const handleSaveFormPricing = async () => {
    setFormPricingSaving(true);
    try {
      for (const p of plans) {
        await supabase.from('platform_plans').update({
          form_monthly_price: formMonthlyPrice,
          form_yearly_price: formYearlyPrice,
          form_trial_days: formTrialDays,
          trial_days: Number(formTrialDays || 7)
        }).eq('id', p.id);
      }
      alert('✅ Registration form dropdown pricing updated successfully!');
      fetchAllData();
    } catch (err: any) {
      alert('Failed to update form pricing: ' + err.message);
    } finally {
      setFormPricingSaving(false);
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
    s.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.pairing_code && s.pairing_code.includes(searchQuery.trim()))
  );

  const pendingUnlockRequests = shops.filter(s => s.download_requested).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <header className="bg-slate-900/85 backdrop-blur border-b border-slate-800 px-6 py-4 sticky top-0 z-40 flex justify-between items-center">
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
              {pendingUnlockRequests > 0 && (
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse">
                  🔔 {pendingUnlockRequests} Download Unlock Request{pendingUnlockRequests > 1 ? 's' : ''}
                </span>
              )}
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

      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {activeTab === 'shops' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-lg flex flex-col md:flex-row items-center gap-3">
              <div className="flex items-center gap-2.5 text-xs font-extrabold text-amber-400 shrink-0">
                <Megaphone className="w-4 h-4" />
                <span>Broadcast Important Update (All Shops):</span>
              </div>
              <input
                type="text"
                placeholder="Type an announcement, update notice, or maintenance alert for all shop admin panels..."
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={sendingBroadcast}
                  onClick={() => handleSendGlobalBroadcast(false)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to All</span>
                </button>
                <button
                  type="button"
                  disabled={sendingBroadcast}
                  onClick={() => handleSendGlobalBroadcast(true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by shop name, slug, or pairing code..."
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
                      <th className="py-3 px-4">Shop & ID</th>
                      <th className="py-3 px-4">Pairing Code</th>
                      <th className="py-3 px-4">Software Downloads</th>
                      <th className="py-3 px-4">Subscribed Plan</th>
                      <th className="py-3 px-4">Reverse Countdown</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Super Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredShops.map((shop) => {
                      const isSuspended = shop.subscription_status === 'suspended';
                      const { days, isExpired } = calculateDaysRemaining(shop.approved_at, shop.subscription_days || 7);
                      const usedDl = shop.download_count || 0;
                      const maxDl = shop.max_downloads || 3;
                      const dlLocked = !(shop.download_allowed ?? true) || usedDl >= maxDl;

                      return (
                        <tr key={shop.id} className={`hover:bg-slate-800/30 ${shop.download_requested ? 'bg-amber-950/20' : ''}`}>
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-white text-sm block">{shop.name}</span>
                            <span className="text-[11px] font-mono text-emerald-400">/shop/{shop.slug}</span>
                            <span className="text-[10px] text-slate-500 block font-mono">ID: {shop.admin_username || shop.slug}</span>
                            {shop.admin_message && (
                              <span className="inline-block mt-1 text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md truncate max-w-[180px]" title={shop.admin_message}>
                                💬 {shop.admin_message}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 text-xs">
                              {shop.pairing_code || '---'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-mono font-black px-2 py-0.5 rounded-lg text-[11px] border ${
                                dlLocked
                                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              }`}>
                                {usedDl} / {maxDl} Used
                              </span>
                              {dlLocked && (
                                <span className="text-[10px] font-bold text-rose-400 uppercase">Paused</span>
                              )}
                            </div>

                            {shop.download_requested && (
                              <div className="flex items-center gap-1.5 pt-0.5">
                                <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md animate-pulse">
                                  🔔 UNLOCK REQUESTED
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQuickUnlockDownload(shop)}
                                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md text-[10px] transition"
                                >
                                  Unlock
                                </button>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 space-y-0.5">
                            <span className="text-xs font-bold text-white capitalize block">
                              {shop.selected_plan === 'starter_yearly' ? 'Starter Yearly (₹1,499)' : 'Starter Monthly (₹299)'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{shop.phone || 'No phone'}</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border font-mono font-black text-xs">
                              <Hourglass className={`w-3.5 h-3.5 ${isExpired ? 'text-rose-500' : 'text-emerald-400'}`} />
                              <span className={isExpired ? 'text-rose-400' : days <= 2 ? 'text-amber-400' : 'text-emerald-400'}>
                                {isExpired ? 'EXPIRED (0 Days)' : `${days} Days Left`}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Approved: {shop.approved_at ? new Date(shop.approved_at).toLocaleDateString() : 'Pending'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              isSuspended ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              shop.subscription_status === 'trial' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {shop.subscription_status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
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
                                onClick={() => openManageModal(shop)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-[10px] transition flex items-center gap-1"
                              >
                                <Settings className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Manage</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteShop(shop)}
                                className="p-1.5 bg-rose-950/50 hover:bg-rose-900 text-rose-400 rounded-xl border border-rose-900/60 transition"
                                title="Permanently Delete Shop & Inquiry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <a
                                href={`/shop/${shop.slug}/admin`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                                title="Open Shop Admin"
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

        {activeTab === 'inquiries' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-white">Pending Partner Inquiries</h2>
                <p className="text-xs text-slate-400">Review registrations, activate shops, and manage leads.</p>
              </div>
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
                  const appliedDate = new Date(inq.created_at).toLocaleDateString();

                  const matchingShop = shops.find(s => s.name.toLowerCase() === inq.business_name.toLowerCase() || s.owner_email === inq.email);
                  const generatedSlug = matchingShop?.slug || inq.business_name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                  const generatedPairingCode = matchingShop?.pairing_code || '919056';

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
                          <span className="text-[10px] text-slate-500 font-mono">Applied: {appliedDate}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Owner: <span className="text-slate-200 font-bold">{inq.owner_name}</span> • Phone: {inq.phone} • {inq.email} • {inq.city}
                        </p>
                        <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                          Plan: <span className="uppercase font-bold">{inq.selected_plan || 'starter'}</span> {inq.printer_model ? `• Printer: ${inq.printer_model}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center flex-wrap gap-2">
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

                        <a
                          href={getWhatsAppKitLink(inq)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-slate-950" />
                          <span>Send WhatsApp Kit</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => sendShopStatusEmail(inq.email, inq.business_name, 'approved', { slug: generatedSlug, pairingCode: generatedPairingCode })}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition flex items-center gap-1"
                        >
                          <Mail className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Email</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteInquiry(inq)}
                          className="p-1.5 bg-rose-950/50 hover:bg-rose-900 text-rose-400 rounded-xl border border-rose-900/60 transition"
                          title="Delete Inquiry Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                Public Landing Page Pricing & Promotional Offers
              </h2>

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

              {/* DEDICATED CUSTOMIZE BOX FOR REGISTRATION FORM DROPDOWN */}
              <div className="mt-6 bg-slate-950 p-6 rounded-2xl border border-teal-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-teal-400" />
                      Registration Form Dropdown Pricing Customizer
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Change these values to instantly update the pricing labels inside the Business Page registration form dropdown.
                    </p>
                  </div>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 font-extrabold px-3 py-1 rounded-full uppercase border border-teal-500/30">
                    FORM DROPDOWN ONLY
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Monthly Plan Price (₹)
                    </label>
                    <input
                      type="text"
                      value={formMonthlyPrice}
                      onChange={(e) => setFormMonthlyPrice(e.target.value)}
                      placeholder="499"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Yearly Plan Price (₹)
                    </label>
                    <input
                      type="text"
                      value={formYearlyPrice}
                      onChange={(e) => setFormYearlyPrice(e.target.value)}
                      placeholder="2,499"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Free Trial Days
                    </label>
                    <input
                      type="number"
                      value={formTrialDays}
                      onChange={(e) => setFormTrialDays(e.target.value)}
                      placeholder="7"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={formPricingSaving}
                    onClick={handleSaveFormPricing}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{formPricingSaving ? 'Saving Form Prices...' : 'Save Form Dropdown Settings'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {editingShop && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white">Remote Shop Manager: {editingShop.name}</h3>
                <p className="text-[11px] text-slate-400">Configure credentials, downloads, printer, and shop notices</p>
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

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Shop ID (Login ID)</label>
                  <input
                    type="text"
                    value={editingShop.admin_username || editingShop.slug}
                    onChange={(e) => setEditingShop({ ...editingShop, admin_username: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-emerald-400 font-mono text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">6-Digit Admin PIN</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={editingShop.admin_pin || '123456'}
                    onChange={(e) => setEditingShop({ ...editingShop, admin_pin: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-amber-400 font-mono text-center text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-amber-400 font-bold mb-1">Windows Pairing Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={editingShop.pairing_code || ''}
                    onChange={(e) => setEditingShop({ ...editingShop, pairing_code: e.target.value })}
                    className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-2.5 py-1.5 text-white font-mono text-center text-xs font-bold outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-950/20 border border-blue-800/40 rounded-2xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-extrabold text-blue-400 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    PC Agent Download Control (Code: {editingShop.pairing_code})
                  </span>
                  {editingShop.download_requested && (
                    <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full animate-pulse">
                      🔔 Shop Requested Re-Download
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Downloads Used</label>
                    <input
                      type="number"
                      min={0}
                      value={editingShop.download_count ?? 0}
                      onChange={(e) => setEditingShop({ ...editingShop, download_count: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Max Limit Allowed</label>
                    <input
                      type="number"
                      min={1}
                      value={editingShop.max_downloads ?? 3}
                      onChange={(e) => setEditingShop({ ...editingShop, max_downloads: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-emerald-400 font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Download Status</label>
                    <button
                      type="button"
                      onClick={() => setEditingShop({
                        ...editingShop,
                        download_allowed: !(editingShop.download_allowed ?? true),
                        download_requested: false
                      })}
                      className={`w-full py-1.5 px-2 rounded-xl font-black text-[10px] uppercase transition flex items-center justify-center gap-1 ${
                        (editingShop.download_allowed ?? true) && (editingShop.download_count ?? 0) < (editingShop.max_downloads ?? 3)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {(editingShop.download_allowed ?? true) && (editingShop.download_count ?? 0) < (editingShop.max_downloads ?? 3) ? (
                        <>
                          <Unlock className="w-3 h-3" />
                          <span>Allowed</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Paused</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-blue-800/30">
                  <span className="text-[10px] text-slate-400">
                    Resetting sets count to 0 and enables the Shop Admin download button.
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingShop({
                      ...editingShop,
                      download_count: 0,
                      download_allowed: true,
                      download_requested: false
                    })}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[10px] transition shrink-0"
                  >
                    Reset to 0 & Unlock
                  </button>
                </div>
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
                  <label className="block text-slate-400 mb-1">Owner Email</label>
                  <input
                    type="email"
                    value={editingShop.owner_email || ''}
                    onChange={(e) => setEditingShop({ ...editingShop, owner_email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-emerald-400 font-bold mb-1">Shop UPI ID (Direct Payments)</label>
                <input
                  type="text"
                  placeholder="e.g. shop@okaxis"
                  value={editingShop.upi_id || ''}
                  onChange={(e) => setEditingShop({ ...editingShop, upi_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Subscription Status</label>
                    <select
                      value={editingShop.subscription_status}
                      onChange={(e) => setEditingShop({ ...editingShop, subscription_status: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-bold"
                    >
                      <option value="trial">Free Trial</option>
                      <option value="active">Active (Paid)</option>
                      <option value="suspended">Suspended (Paused)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-emerald-400 font-bold mb-1">Subscription Period</label>
                    <select
                      value={editingShop.selected_plan || 'starter_monthly'}
                      onChange={(e) => {
                        const val = e.target.value;
                        const days = val === 'starter_yearly' ? 365 : val === 'trial_14' ? 14 : 30;
                        setEditingShop({ ...editingShop, selected_plan: val, subscription_days: days });
                      }}
                      className="w-full bg-slate-950 border border-emerald-800/60 rounded-xl px-3 py-2 text-white outline-none font-bold"
                    >
                      <option value="starter_monthly">Starter Monthly (₹299/mo - 30 Days)</option>
                      <option value="starter_yearly">Starter Yearly (₹1,499/yr - 365 Days)</option>
                      <option value="trial_7">7-Day Free Trial</option>
                      <option value="trial_14">14-Day Free Trial</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-emerald-800/30">
                  <span className="text-[11px] text-slate-400">Total Valid Duration: <strong>{editingShop.subscription_days || 7} Days</strong></span>
                  <button
                    type="button"
                    onClick={() => setEditingShop({ 
                      ...editingShop, 
                      subscription_days: (editingShop.subscription_days || 7) + 7 
                    })}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] transition"
                  >
                    + Extend 7 Days
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-slate-400 mb-1">Target Printer Name</label>
                  <select
                    value={isCustomPrinterModal ? 'CUSTOM' : (editingShop.target_printer_name || 'Microsoft Print to PDF')}
                    onChange={(e) => {
                      if (e.target.value === 'CUSTOM') {
                        setIsCustomPrinterModal(true);
                        setEditingShop({ ...editingShop, target_printer_name: '' });
                      } else {
                        setIsCustomPrinterModal(false);
                        setEditingShop({ ...editingShop, target_printer_name: e.target.value });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-bold"
                  >
                    {COMMON_PRINTERS.map((pName) => (
                      <option key={pName} value={pName}>
                        {pName}
                      </option>
                    ))}
                    <option value="CUSTOM">➕ Other Printer (Custom)</option>
                  </select>

                  {isCustomPrinterModal && (
                    <input
                      type="text"
                      placeholder="Type exact printer name..."
                      value={editingShop.target_printer_name || ''}
                      onChange={(e) => setEditingShop({ ...editingShop, target_printer_name: e.target.value })}
                      className="w-full bg-slate-950 border border-emerald-500 rounded-xl px-3 py-1.5 text-emerald-400 font-bold outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Auto-Delete Files</label>
                  <select
                    value={editingShop.auto_delete_hours || 24}
                    onChange={(e) => setEditingShop({ ...editingShop, auto_delete_hours: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value={1}>Auto-delete after 1 Hour</option>
                    <option value={4}>Auto-delete after 4 Hours</option>
                    <option value={12}>Auto-delete after 12 Hours</option>
                    <option value={24}>Auto-delete after 24 Hours</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-2xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold text-amber-400 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />
                    Important Update / Notice for Shop Admin Panel
                  </label>
                  {editingShop.admin_message && (
                    <button
                      type="button"
                      onClick={() => setEditingShop({ ...editingShop, admin_message: '' })}
                      className="text-[10px] text-rose-400 hover:underline font-bold"
                    >
                      Clear Notice
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  placeholder="Type a message to display at the top of this shop's admin dashboard (leave empty for none)..."
                  value={editingShop.admin_message || ''}
                  onChange={(e) => setEditingShop({ ...editingShop, admin_message: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 text-xs"
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
