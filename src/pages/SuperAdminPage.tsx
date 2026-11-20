import React, { useState, useEffect, useRef } from 'react';
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
  Megaphone,
  Sparkles,
  X,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  Building2,
  CreditCard,
  Printer,
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  Eye,
  EyeOff,
  UserSquare,
  Camera,
  UploadCloud
} from 'lucide-react';

interface ShopTenant {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  owner_email: string | null;
  upi_id: string | null;
  upi_name?: string | null;
  target_printer_name: string | null;
  photo_printer_name?: string | null;
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
  targeted_message?: string | null;
  gateway_enabled?: boolean;
  gateway_provider?: string | null;
  gateway_key_id?: string | null;
  gateway_key_secret?: string | null;
  split_payment_enabled?: boolean;
  bank_account_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  daily_statement_enabled?: boolean;
  // Plan-Based Feature Controls
  plan_id_card_allowed?: boolean;
  plan_passport_allowed?: boolean;
  plan_scan_pdf_allowed?: boolean;
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
  form_monthly_price?: string;
  form_yearly_price?: string;
  form_trial_days?: string;
  landing_message?: string | null;
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

interface SupportChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'admin';
  text: string;
  time?: string;
}

interface SupportChatSession {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  messages: SupportChatMessage[];
  status: string;
  unread_admin: boolean;
  updated_at: string;
  created_at: string;
}

interface ShopTransactionRow {
  id: string;
  shop_id: string;
  order_number: string;
  amount: number;
  payment_mode: string;
  collection_type: string;
  payment_ref?: string;
  status: string;
  created_at: string;
}

interface ReviewRow {
  id: string;
  author_name: string;
  rating: number;
  comment_text: string;
  is_approved: boolean;
  created_at: string;
}

const SITE_BASE_URL = "https://www.rtsprint.online";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbytAx6dxUypNjcrwCHWh537MguDjcvVYqdduYfe4k9_d3-x_HW8xPwc3vxt2NxTpNs/exec";

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

  const [activeTab, setActiveTab] = useState<'shops' | 'inquiries' | 'pricing' | 'statements' | 'reviews'>('shops');

  const [showLiveChatInbox, setShowLiveChatInbox] = useState(true);
  const [supportChats, setSupportChats] = useState<SupportChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [sendingAdminReply, setSendingAdminReply] = useState(false);

  const [chatTimeoutMinutes, setChatTimeoutMinutes] = useState<number>(10);
  const [savingTimeout, setSavingTimeout] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const soundEnabledRef = useRef<boolean>(true);

  const [shops, setShops] = useState<ShopTenant[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [allTransactions, setAllTransactions] = useState<ShopTransactionRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [ledgerShopFilter, setLedgerShopFilter] = useState<string>('ALL');
  const [ledgerPeriodFilter, setLedgerPeriodFilter] = useState<'today' | '7days' | '30days'>('30days');
  const [masterSplitPaused, setMasterSplitPaused] = useState<boolean>(true);
  const [masterGatewayProvider, setMasterGatewayProvider] = useState<string>('cashfree');
  const [masterGatewayAppId, setMasterGatewayAppId] = useState<string>('');
  const [dispatchingAllStatements, setDispatchingAllStatements] = useState<boolean>(false);

  // Super Admin Reviews & Likes State
  const [reviewsList, setReviewsList] = useState<ReviewRow[]>([]);
  const [likesData, setLikesData] = useState({ likes: 150, dislikes: 2 });
  const [showReviewsPublicly, setShowReviewsPublicly] = useState<boolean>(true);
  const [savingLikes, setSavingLikes] = useState(false);

  const [editingShop, setEditingShop] = useState<ShopTenant | null>(null);
  const [isCustomPrinterModal, setIsCustomPrinterModal] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [approvingInquiryId, setApprovingInquiryId] = useState<string | null>(null);

  const [broadcastText, setBroadcastText] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [landingOfferText, setLandingOfferText] = useState('');
  const [savingLandingOffer, setSavingLandingOffer] = useState(false);
  const [targetShopCode, setTargetShopCode] = useState('');
  const [targetShopMessage, setTargetShopMessage] = useState('');
  const [sendingTargeted, setSendingTargeted] = useState(false);

  const [formMonthlyPrice, setFormMonthlyPrice] = useState('199');
  const [formYearlyPrice, setFormYearlyPrice] = useState('2,499');
  const [formTrialDays, setFormTrialDays] = useState('7');
  const [formPricingSaving, setFormPricingSaving] = useState(false);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const playChatAlertSound = () => {
    if (!soundEnabledRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      gain1.gain.setValueAtTime(0.25, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.25);
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.16);
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.16);
      osc2.stop(ctx.currentTime + 0.55);
    } catch (err) {
      console.error('Audio play blocked by browser:', err);
    }
  };

  const handleUpdateChatTimeout = async (minutes: number) => {
    setChatTimeoutMinutes(minutes);
    setSavingTimeout(true);
    try {
      await supabase.from('site_announcements').upsert({ id: 1, chat_timeout_minutes: minutes, updated_at: new Date().toISOString() });
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTimeout(false);
    }
  };

  const calculateDaysRemaining = (approvedAt: string | null, totalDays: number): { days: number; isExpired: boolean } => {
    if (!approvedAt) return { days: totalDays, isExpired: false };
    const approvalDate = new Date(approvedAt).getTime();
    const currentDate = new Date().getTime();
    const elapsedDays = Math.floor((currentDate - approvalDate) / (1000 * 60 * 60 * 24));
    const remaining = totalDays - elapsedDays;
    return { days: Math.max(0, remaining), isExpired: remaining <= 0 };
  };

  const buildApprovalDetailsSummary = (shopName: string, slug: string, pairingCode: string) => {
    const adminUrl = `${SITE_BASE_URL}/shop/${slug}/admin`;
    const kioskUrl = `${SITE_BASE_URL}/shop/${slug}`;
    const aboutUs =
      'RTS Smart Print (by Reliable Technology & Services) is a QR & self-service document printing platform for print shops and digital seva centers.';
    const howToUse = [
      `1. Open your Shop Admin Link (${adminUrl}) to manage counter settings and print jobs.`,
      '2. First-time install note: If Windows shows "Windows protected your PC", click More info -> Run anyway to continue installation.',
      `3. Enter your 6-digit Pairing Code (${pairingCode}) when setting up your counter agent, and share your Customer Kiosk Link (${kioskUrl}) with customers.`
    ].join('\n');

    return { adminUrl, kioskUrl, aboutUs, howToUse };
  };

  const sendShopStatusEmail = async (
    email: string,
    shopName: string,
    action: 'approved' | 'suspended' | 'reactivated',
    details?: { slug: string; pairingCode: string }
  ) => {
    if (!email) return;
    if (action === 'approved') {
      try {
        const generatedSlug = details?.slug || shopName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const generatedCode = details?.pairingCode || 'Check Admin';
        const info = buildApprovalDetailsSummary(shopName, generatedSlug, generatedCode);

        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'approve',
            email,
            shopName,
            slug: generatedSlug,
            pairingCode: generatedCode,
            adminUrl: info.adminUrl,
            kioskUrl: info.kioskUrl,
            aboutUs: info.aboutUs,
            howToUse: info.howToUse
          })
        });
        alert(`📧 Official activation email sent successfully to ${email}!`);
      } catch (err) {
        alert('Failed to send automated email.');
      }
    } else {
      const subject =
        action === 'suspended'
          ? `⚠️ RTS Smart Print Account Suspended: ${shopName}`
          : `✅ RTS Smart Print Account Reactivated: ${shopName}`;
      const body = `Hi ${shopName},\n\nYour account status has been updated to: ${action}. Please contact RTS Support (info@rtsdigitalseva.online) for assistance.`;
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
      const { data: shopsData } = await supabase.from('shops').select('*').order('created_at', { ascending: false });
      if (shopsData) setShops(shopsData);

      const { data: inqData } = await supabase.from('shop_inquiries').select('*').order('created_at', { ascending: false });
      if (inqData) setInquiries(inqData);

      const { data: plansData } = await supabase.from('platform_plans').select('*').order('original_price', { ascending: true });
      if (plansData) {
        setPlans(plansData);
        const mainPlan = plansData[0];
        if (mainPlan) {
          if (mainPlan.form_monthly_price) setFormMonthlyPrice(mainPlan.form_monthly_price);
          if (mainPlan.form_yearly_price) setFormYearlyPrice(mainPlan.form_yearly_price);
          if (mainPlan.form_trial_days) setFormTrialDays(String(mainPlan.trial_days || mainPlan.form_trial_days));
          if (mainPlan.landing_message) setLandingOfferText(mainPlan.landing_message);
        }
      }

      const { data: announceData } = await supabase.from('site_announcements').select('*').eq('id', 1).maybeSingle();
      if (announceData) {
        if (typeof announceData.message === 'string') setLandingOfferText(announceData.message);
        if (announceData.chat_timeout_minutes) setChatTimeoutMinutes(Number(announceData.chat_timeout_minutes));
        if (announceData.show_reviews_section !== undefined) setShowReviewsPublicly(announceData.show_reviews_section);
      }

      const { data: chatData } = await supabase.from('support_chats').select('*').order('updated_at', { ascending: false });
      if (chatData) setSupportChats(chatData as SupportChatSession[]);

      const { data: txData } = await supabase.from('shop_transactions').select('*').order('created_at', { ascending: false }).limit(1000);
      if (txData) setAllTransactions(txData as ShopTransactionRow[]);

      const { data: likesRes } = await supabase.from('site_likes').select('*').eq('id', 1).maybeSingle();
      if (likesRes) setLikesData({ likes: likesRes.likes_count || 150, dislikes: likesRes.dislikes_count || 2 });

      const { data: revRes } = await supabase.from('site_reviews').select('*').order('created_at', { ascending: false });
      if (revRes) setReviewsList(revRes as ReviewRow[]);

    } catch (err) {
      console.error('SuperAdmin load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchAllData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const channel = supabase
      .channel('superadmin-shops-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shops' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_transactions' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_reviews' }, () => fetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_chats' }, (payload) => {
          const newRecord = payload.new as any;
          if (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && newRecord?.unread_admin === true)) {
            playChatAlertSound();
          }
          fetchAllData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated]);

  const handleSelectCustomerChat = async (chat: SupportChatSession) => {
    setSelectedChatId(chat.id);
    if (chat.unread_admin) {
      await supabase.from('support_chats').update({ unread_admin: false }).eq('id', chat.id);
      fetchAllData();
    }
  };

  const handleSendAdminChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeChat = supportChats.find(c => c.id === selectedChatId);
    if (!activeChat || !adminReplyText.trim()) return;

    setSendingAdminReply(true);
    const replyText = adminReplyText.trim();
    const newReplyMsg: SupportChatMessage = {
      id: `adm-${Date.now()}`,
      sender: 'admin',
      text: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...(activeChat.messages || []), newReplyMsg];
    setAdminReplyText('');

    try {
      const { error } = await supabase
        .from('support_chats')
        .update({ messages: updatedMessages, unread_admin: false, updated_at: new Date().toISOString() })
        .eq('id', activeChat.id);

      if (error) throw error;

      if (activeChat.customer_email) {
        fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'admin_chat_reply', customerName: activeChat.customer_name, customerEmail: activeChat.customer_email, replyMessage: replyText })
        });
      }
      fetchAllData();
    } catch (err: any) {
      alert('Failed to send reply: ' + err.message);
    } finally {
      setSendingAdminReply(false);
    }
  };

  const handleDeleteCustomerChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this customer chat conversation?')) return;
    await supabase.from('support_chats').delete().eq('id', chatId);
    if (selectedChatId === chatId) setSelectedChatId(null);
    fetchAllData();
  };

  const handleDispatchAllDailyStatements = async () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const eligibleShops = shops.filter(s => s.owner_email && (s.daily_statement_enabled ?? true));
    if (eligibleShops.length === 0) {
      alert('No shops have an owner email configured for daily statements.');
      return;
    }

    if (!window.confirm(`Send today's consolidated 8:00 PM statement email to ${eligibleShops.length} shop(s)?`)) return;

    setDispatchingAllStatements(true);
    try {
      for (const s of eligibleShops) {
        const shopTxs = allTransactions.filter(
          tx => tx.shop_id === s.id && tx.status !== 'rejected' && new Date(tx.created_at).getTime() >= startOfToday.getTime()
        );
        const totalAmt = shopTxs.reduce((sum, r) => sum + Number(r.amount || 0), 0);
        const directAmt = shopTxs.filter(r => r.collection_type !== 'SPLIT_SETTLEMENT').reduce((sum, r) => sum + Number(r.amount || 0), 0);
        const splitAmt = shopTxs.filter(r => r.collection_type === 'SPLIT_SETTLEMENT').reduce((sum, r) => sum + Number(r.amount || 0), 0);

        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'daily_statement', email: s.owner_email, shopName: s.name, pairingCode: s.pairing_code,
            periodLabel: 'TODAY (8:00 PM DAILY DIGEST)', totalOrders: shopTxs.length, totalAmount: totalAmt.toFixed(2),
            directShopAmount: directAmt.toFixed(2), splitSettlementAmount: splitAmt.toFixed(2)
          })
        });
      }
      alert(`✅ Daily 8:00 PM consolidated statements dispatched to ${eligibleShops.length} shop(s)!`);
    } catch (err: any) {
      alert('Error dispatching statements: ' + err.message);
    } finally {
      setDispatchingAllStatements(false);
    }
  };

  const openManageModal = (shop: ShopTenant) => {
    const savedPrinter = shop.target_printer_name || 'Microsoft Print to PDF';
    setIsCustomPrinterModal(Boolean(savedPrinter && !COMMON_PRINTERS.includes(savedPrinter)));
    setEditingShop({
      ...shop,
      upi_name: shop.upi_name ?? '',
      target_printer_name: savedPrinter,
      photo_printer_name: shop.photo_printer_name ?? '',
      download_count: shop.download_count ?? 0,
      max_downloads: shop.max_downloads ?? 3,
      download_allowed: shop.download_allowed ?? true,
      download_requested: shop.download_requested ?? false,
      admin_message: shop.admin_message ?? '',
      targeted_message: shop.targeted_message ?? '',
      gateway_enabled: shop.gateway_enabled ?? false,
      gateway_provider: shop.gateway_provider ?? 'razorpay',
      gateway_key_id: shop.gateway_key_id ?? '',
      gateway_key_secret: shop.gateway_key_secret ?? '',
      split_payment_enabled: shop.split_payment_enabled ?? false,
      bank_account_name: shop.bank_account_name ?? '',
      bank_account_number: shop.bank_account_number ?? '',
      bank_ifsc: shop.bank_ifsc ?? '',
      daily_statement_enabled: shop.daily_statement_enabled ?? true,
      plan_id_card_allowed: shop.plan_id_card_allowed ?? true,
      plan_passport_allowed: shop.plan_passport_allowed ?? true,
      plan_scan_pdf_allowed: shop.plan_scan_pdf_allowed ?? true
    });
  };

  const getWhatsAppKitLink = (inq: Inquiry) => {
    const slug = inq.business_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const existingShop = shops.find(s => s.slug === slug || s.name.toLowerCase() === inq.business_name.toLowerCase());
    const pairingCode = existingShop?.pairing_code || 'Check Admin';
    const info = buildApprovalDetailsSummary(inq.business_name, slug, pairingCode);
    const cleanPhone = inq.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const message = [
      `🎉 *Welcome to RTS Smart Print — ${inq.business_name}!*`,
      ``,
      `*About Us:*`,
      `${info.aboutUs}`,
      ``,
      `*Your Shop Details:*`,
      `🔑 *6-Digit Pairing Code:* *${pairingCode}*`,
      `⚙️ *Shop Admin Link:* ${info.adminUrl}`,
      `🔗 *Shop Kiosk Link:* ${info.kioskUrl}`,
      ``,
      `*How to Use:*`,
      `1. Open your *Shop Admin Link* above on your counter computer to configure settings and manage print orders.`,
      `2. *First-Time Install Note:* When running the setup on Windows, if you see *"Windows protected your PC"*, click *More info* → *Run anyway*.`,
      `3. Enter your 6-digit Pairing Code (*${pairingCode}*) when pairing your counter station, and share your *Shop Kiosk Link* with customers.`,
      ``,
      `_Support: RTS Reliable Technology Services (info@rtsdigitalseva.online)_`
    ].join('\n');

    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
  };

  const handleApproveAndCreateShop = async (inq: Inquiry) => {
    if (!window.confirm(`Approve ${inq.business_name} and generate counter station?`)) return;
    setApprovingInquiryId(inq.id);
    try {
      const slug = inq.business_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `shop-${Math.floor(1000 + Math.random() * 9000)}`;
      const uniquePairingCode = Math.floor(100000 + Math.random() * 900000).toString();
      const shortUsername = slug.split('-')[0] || slug;
      const initialDays = inq.selected_plan === 'trial_14' ? 14 : inq.selected_plan === 'yearly' ? 365 : 7;

      const { data: newShop, error: shopErr } = await supabase
        .from('shops')
        .insert([{
          name: inq.business_name, slug: slug, phone: inq.phone, owner_email: inq.email,
          subscription_status: 'trial', selected_plan: inq.selected_plan || 'starter_monthly',
          subscription_days: initialDays, is_accepting_orders: true, require_payment: false,
          target_printer_name: inq.printer_model || 'Microsoft Print to PDF',
          counter_notice: 'Please collect your prints at the counter', auto_delete_hours: 24,
          is_pin_protected: false, auto_print_enabled: true, pairing_code: uniquePairingCode,
          admin_username: shortUsername, admin_pin: '123456', approved_at: new Date().toISOString(),
          download_count: 0, max_downloads: 3, download_allowed: true, download_requested: false
        }])
        .select().single();

      if (shopErr) throw shopErr;

      await supabase.from('shop_connector_keys').insert([{ shop_id: newShop.id, pairing_code: uniquePairingCode, is_active: true }]);
      await supabase.from('pricing_rules').insert([
        { shop_id: newShop.id, paper_size: 'A4', is_color: false, is_double_sided: false, price_per_page: 2.0 },
        { shop_id: newShop.id, paper_size: 'A4', is_color: false, is_double_sided: true, price_per_page: 3.5 },
        { shop_id: newShop.id, paper_size: 'A4', is_color: true, is_double_sided: false, price_per_page: 10.0 },
        { shop_id: newShop.id, paper_size: 'A4', is_color: true, is_double_sided: true, price_per_page: 18.0 },
        { shop_id: newShop.id, paper_size: 'Letter', is_color: false, is_double_sided: false, price_per_page: 2.0 },
        { shop_id: newShop.id, paper_size: 'Legal', is_color: false, is_double_sided: false, price_per_page: 3.0 }
      ]);
      await supabase.from('shop_inquiries').update({ status: 'approved' }).eq('id', inq.id);
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
      await supabase.from('shops').update({ download_count: 0, download_allowed: true, download_requested: false }).eq('id', shop.id);
      alert(`✅ Software download unlocked and reset (0/${shop.max_downloads || 3}) for ${shop.name}!`);
      fetchAllData();
    } catch (err: any) {
      alert('Failed to unlock download: ' + err.message);
    }
  };

  const handleSaveLandingAnnouncement = async (clear: boolean = false) => {
    const msgToSave = clear ? '' : landingOfferText.trim();
    if (!clear && !msgToSave) { alert('Please type an offer or update message for the Business Landing Page.'); return; }
    setSavingLandingOffer(true);
    try {
      await supabase.from('site_announcements').upsert({ id: 1, message: msgToSave || null, updated_at: new Date().toISOString() });
      if (plans.length > 0) {
        await supabase.from('platform_plans').update({ landing_message: msgToSave || null }).in('id', plans.map(p => p.id));
      }
      if (clear) setLandingOfferText('');
      alert(clear ? '🗑️ Offer/Update message removed from the Public Business Landing Page!' : '🚀 Offer/Update message published live on the Business Landing Page!');
      fetchAllData();
    } catch (err: any) {
      alert('Failed to update Business Page offer message: ' + err.message);
    } finally {
      setSavingLandingOffer(false);
    }
  };

  const handleSendGlobalBroadcast = async (clear: boolean = false) => {
    const messageToSend = clear ? null : broadcastText.trim();
    if (!clear && !messageToSend) { alert('Please enter a message to broadcast to all shops.'); return; }
    if (!window.confirm(clear ? 'Clear broadcast notice from all shops?' : `Send this notice to ALL ${shops.length} shops?`)) return;
    setSendingBroadcast(true);
    try {
      if (shops.length > 0) {
        await supabase.from('shops').update({ admin_message: messageToSend }).in('id', shops.map(s => s.id));
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

  const handleSendTargetedNotice = async (clear: boolean = false) => {
    const messageToSend = clear ? null : targetShopMessage.trim();
    if (!targetShopCode) { alert('Please select or enter a shop pairing code or ID.'); return; }
    if (!clear && !messageToSend) { alert('Please enter a message to send to this shop.'); return; }
    setSendingTargeted(true);
    try {
      const targetShop = shops.find(s => s.pairing_code === targetShopCode || s.slug === targetShopCode || s.id === targetShopCode || s.admin_username === targetShopCode);
      if (!targetShop) { alert('Shop not found with code: ' + targetShopCode); setSendingTargeted(false); return; }
      await supabase.from('shops').update({ targeted_message: messageToSend }).eq('id', targetShop.id);
      if (clear) setTargetShopMessage('');
      alert(clear ? `🗑️ Targeted notice deleted/cleared for ${targetShop.name} (${targetShop.pairing_code})!` : `🎯 Targeted notice sent to ${targetShop.name} (${targetShop.pairing_code})!`);
      fetchAllData();
    } catch (err: any) {
      alert('Failed to send targeted notice: ' + err.message);
    } finally {
      setSendingTargeted(false);
    }
  };

  const handleDeleteShop = async (shop: ShopTenant) => {
    const confirmation = window.prompt(`⚠️ PERMANENT DELETE\n\nType the shop name "${shop.name}" to delete this store, all files, and inquiries:`);
    if (confirmation !== shop.name) return;
    try {
      const { data: files } = await supabase.storage.from('print-files').list(shop.id);
      if (files && files.length > 0) await supabase.storage.from('print-files').remove(files.map(f => `${shop.id}/${f.name}`));
      await supabase.from('shop_inquiries').delete().or(`business_name.ilike.%${shop.name}%,email.eq.${shop.owner_email || ''}`);
      await supabase.from('shops').delete().eq('id', shop.id);
      alert(`Shop "${shop.name}" and associated inquiries were permanently deleted.`);
      fetchAllData();
    } catch (err: any) {
      alert('Failed to delete shop: ' + err.message);
    }
  };

  const handleDeleteInquiry = async (inq: Inquiry) => {
    if (!window.confirm(`Delete inquiry for "${inq.business_name}"?`)) return;
    try {
      await supabase.from('shop_inquiries').delete().eq('id', inq.id);
      fetchAllData();
    } catch (err: any) {
      alert('Failed to delete inquiry: ' + err.message);
    }
  };

  const handleSuspendShop = async (shop: ShopTenant) => {
    if (!window.confirm(`Suspend ${shop.name}? Customer kiosk will be paused.`)) return;
    try {
      await supabase.from('shops').update({ subscription_status: 'suspended', is_accepting_orders: false }).eq('id', shop.id);
      if (shop.owner_email) sendShopStatusEmail(shop.owner_email, shop.name, 'suspended');
      alert(`${shop.name} has been suspended.`);
      fetchAllData();
    } catch (err: any) {
      alert('Error suspending shop: ' + err.message);
    }
  };

  const handleReactivateShop = async (shop: ShopTenant) => {
    if (!window.confirm(`Re-approve and activate ${shop.name}?`)) return;
    try {
      await supabase.from('shops').update({ subscription_status: 'active', is_accepting_orders: true, approved_at: new Date().toISOString() }).eq('id', shop.id);
      if (shop.owner_email) sendShopStatusEmail(shop.owner_email, shop.name, 'reactivated');
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
      const isNowActive = editingShop.subscription_status !== 'suspended';

      await supabase.from('shops').update({
        name: editingShop.name, phone: editingShop.phone, owner_email: editingShop.owner_email,
        admin_username: editingShop.admin_username, admin_pin: (editingShop.admin_pin || '123456').trim(),
        pairing_code: cleanPairingCode, upi_id: editingShop.upi_id?.trim() || null, upi_name: editingShop.upi_name?.trim() || null,
        target_printer_name: (editingShop.target_printer_name || '').trim() || 'Microsoft Print to PDF',
        counter_notice: editingShop.counter_notice, subscription_status: editingShop.subscription_status,
        selected_plan: editingShop.selected_plan, subscription_days: Number(editingShop.subscription_days || 7),
        approved_at: isNowActive ? new Date().toISOString() : editingShop.approved_at,
        auto_delete_hours: Number(editingShop.auto_delete_hours || 24), is_accepting_orders: isNowActive,
        download_count: Number(editingShop.download_count ?? 0), max_downloads: Number(editingShop.max_downloads ?? 3),
        download_allowed: Boolean(editingShop.download_allowed ?? true), download_requested: Boolean(editingShop.download_requested ?? false),
        admin_message: editingShop.admin_message?.trim() || null, targeted_message: editingShop.targeted_message?.trim() || null,
        gateway_enabled: Boolean(editingShop.gateway_enabled ?? false), gateway_provider: editingShop.gateway_provider || 'razorpay',
        gateway_key_id: editingShop.gateway_key_id?.trim() || null, gateway_key_secret: editingShop.gateway_key_secret?.trim() || null,
        split_payment_enabled: Boolean(editingShop.split_payment_enabled ?? false), bank_account_name: editingShop.bank_account_name?.trim() || null,
        bank_account_number: editingShop.bank_account_number?.trim() || null, bank_ifsc: editingShop.bank_ifsc?.toUpperCase().trim() || null,
        daily_statement_enabled: Boolean(editingShop.daily_statement_enabled ?? true)
      }).eq('id', editingShop.id);

      // Optional plan feature columns & photo printer saved safely
      try {
        await supabase.from('shops').update({
          plan_id_card_allowed: Boolean(editingShop.plan_id_card_allowed ?? true),
          plan_passport_allowed: Boolean(editingShop.plan_passport_allowed ?? true),
          plan_scan_pdf_allowed: Boolean(editingShop.plan_scan_pdf_allowed ?? true),
          photo_printer_name: editingShop.photo_printer_name?.trim() || null
        }).eq('id', editingShop.id);
      } catch {
        // Ignore if optional columns not added via SQL yet
      }

      if (cleanPairingCode) {
        await supabase.from('shop_connector_keys').update({ pairing_code: cleanPairingCode }).eq('shop_id', editingShop.id);
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
    try { await supabase.from('platform_plans').update(updates).eq('id', planId); fetchAllData(); } catch (err: any) { alert('Failed to update plan: ' + err.message); }
  };

  const handleSaveFormPricing = async () => {
    setFormPricingSaving(true);
    try {
      for (const p of plans) {
        await supabase.from('platform_plans').update({ form_monthly_price: formMonthlyPrice, form_yearly_price: formYearlyPrice, form_trial_days: formTrialDays, trial_days: Number(formTrialDays || 7) }).eq('id', p.id);
      }
      alert('✅ Registration form dropdown pricing updated successfully!');
      fetchAllData();
    } catch (err: any) {
      alert('Failed to update form pricing: ' + err.message);
    } finally {
      setFormPricingSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // CUSTOMER REVIEW & LIKES MODERATION HANDLERS
  // -------------------------------------------------------------------------
  const handleToggleReviewsVisibility = async () => {
    const newState = !showReviewsPublicly;
    setShowReviewsPublicly(newState);
    try {
      await supabase.from('site_announcements').upsert({ id: 1, show_reviews_section: newState });
    } catch (err) { console.error(err); }
  };

  const handleUpdateLikes = async (field: 'likes' | 'dislikes', val: number) => {
    setSavingLikes(true);
    const newLikesData = { ...likesData, [field]: val };
    setLikesData(newLikesData);
    try {
      await supabase.from('site_likes').upsert({ id: 1, likes_count: newLikesData.likes, dislikes_count: newLikesData.dislikes });
    } catch (err) { console.error(err); } finally { setSavingLikes(false); }
  };

  const handleApproveReview = async (id: string) => {
    try {
      await supabase.from('site_reviews').update({ is_approved: true }).eq('id', id);
      fetchAllData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm("Delete this review completely?")) return;
    try {
      await supabase.from('site_reviews').delete().eq('id', id);
      fetchAllData();
    } catch (err) { console.error(err); }
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
  const unreadChatCount = supportChats.filter(c => c.unread_admin).length;
  const activeSupportChat = supportChats.find(c => c.id === selectedChatId) || null;

  const filteredAdminTransactions = allTransactions.filter((tx) => {
    if (tx.status === 'rejected') return false;
    if (ledgerShopFilter !== 'ALL' && tx.shop_id !== ledgerShopFilter) return false;
    const txTime = new Date(tx.created_at).getTime();
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (ledgerPeriodFilter === 'today') return txTime >= startOfToday.getTime();
    if (ledgerPeriodFilter === '7days') return txTime >= now - 7 * 24 * 60 * 60 * 1000;
    return txTime >= now - 30 * 24 * 60 * 60 * 1000;
  });

  const adminTotalGross = filteredAdminTransactions.reduce((s, r) => s + Number(r.amount || 0), 0);
  const adminDirectShopTotal = filteredAdminTransactions.filter(r => r.collection_type !== 'SPLIT_SETTLEMENT').reduce((s, r) => s + Number(r.amount || 0), 0);
  const adminSplitSettlementTotal = filteredAdminTransactions.filter(r => r.collection_type === 'SPLIT_SETTLEMENT').reduce((s, r) => s + Number(r.amount || 0), 0);

  const pendingReviews = reviewsList.filter(r => !r.is_approved);
  const approvedReviews = reviewsList.filter(r => r.is_approved);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <header className="bg-slate-900/85 backdrop-blur border-b border-slate-800 px-6 py-4 sticky top-0 z-40 flex flex-wrap justify-between items-center gap-3">
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

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowLiveChatInbox(!showLiveChatInbox)}
            className={`px-4 py-2 rounded-full font-extrabold transition flex items-center gap-1.5 shadow-md ${
              showLiveChatInbox
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-slate-900 border border-indigo-500/40 text-indigo-300 hover:bg-slate-800'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Live Customer Chat</span>
            {unreadChatCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-black animate-bounce">
                {unreadChatCount}
              </span>
            )}
          </button>

          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
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
              Pricing ({plans.length})
            </button>
            <button
              onClick={() => setActiveTab('statements')}
              className={`px-4 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                activeTab === 'statements' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Statements & Split</span>
            </button>
            
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                activeTab === 'reviews' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Reviews & Likes</span>
              {pendingReviews.length > 0 && (
                <span className="ml-1 bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full text-[9px] font-black">
                  {pendingReviews.length}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={fetchAllData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {showLiveChatInbox && (
          <div className="bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1a1c4b] via-[#0f3443] to-[#0b3b42] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-black text-white">Live Customer Support Chat Inbox</h2>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Real-Time Sync + First Submit Email Alert
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Select a customer on the left to view their Name, Phone, Email & messages. Customer chat box auto-resets after the timer set on the right!
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !soundEnabled;
                    setSoundEnabled(nextState);
                    soundEnabledRef.current = nextState;
                    if (nextState) playChatAlertSound();
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border ${
                    soundEnabled
                      ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30'
                      : 'bg-white/10 border-white/15 text-slate-300 hover:bg-white/20'
                  }`}
                  title="Toggle Incoming Chat Alert Sound"
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
                </button>

                <div className="flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-xl px-2.5 py-1">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-[11px] font-bold text-slate-200">Auto-Reset:</span>
                  <select
                    value={chatTimeoutMinutes}
                    disabled={savingTimeout}
                    onChange={(e) => handleUpdateChatTimeout(Number(e.target.value))}
                    className="bg-slate-900 text-amber-300 font-extrabold text-xs rounded-lg px-2 py-0.5 outline-none border border-slate-700 cursor-pointer"
                  >
                    <option value={5}>5 Min</option>
                    <option value={10}>10 Min</option>
                    <option value={15}>15 Min</option>
                    <option value={20}>20 Min</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={fetchAllData}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 border border-white/15"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Chats</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLiveChatInbox(false)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/15"
                  title="Minimize Chat Inbox"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
              <div className="md:col-span-4 border-r border-slate-200 bg-slate-50/70 overflow-y-auto max-h-[420px] divide-y divide-slate-200">
                {supportChats.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No customer chats yet. When a visitor submits their Name, Phone & Email in the Business Page chat box, they will appear here live.
                  </div>
                ) : (
                  supportChats.map((chat) => {
                    const lastMsgObj = chat.messages && chat.messages.length > 0
                      ? chat.messages[chat.messages.length - 1]
                      : null;
                    const formattedDate = new Date(chat.updated_at || chat.created_at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const isSelected = chat.id === selectedChatId;

                    return (
                      <div
                        key={chat.id}
                        onClick={() => handleSelectCustomerChat(chat)}
                        className={`p-4 cursor-pointer transition relative group ${
                          isSelected ? 'bg-teal-50/90 border-l-4 border-teal-600' : 'hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900">{chat.customer_name}</span>
                            {chat.unread_admin && (
                              <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full">
                                NEW
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">{formattedDate}</span>
                        </div>

                        <p className="text-[11px] font-bold text-slate-700 mt-1 flex flex-wrap items-center gap-1">
                          <span>📞 {chat.customer_phone}</span>
                          <span>•</span>
                          <span className="text-slate-600">✉️ {chat.customer_email}</span>
                        </p>

                        <div className="flex items-center justify-between gap-2 mt-1.5">
                          <p className="text-xs text-slate-500 truncate">
                            {lastMsgObj ? lastMsgObj.text : 'Connected to live chat'}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomerChat(chat.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Delete Conversation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="md:col-span-8 flex flex-col justify-between bg-white">
                <div className="px-6 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {activeSupportChat ? (
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{activeSupportChat.customer_name}</h3>
                      <p className="text-xs text-slate-500">
                        📞 {activeSupportChat.customer_phone} • ✉️ {activeSupportChat.customer_email}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">Select a customer from the left list</h3>
                      <p className="text-xs text-slate-400">Customer Name, Phone Number, and Email will appear here.</p>
                    </div>
                  )}

                  {activeSupportChat && (
                    <a
                      href={`https://wa.me/91${activeSupportChat.customer_phone.replace(/[^0-9]/g, '').slice(-10)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Customer</span>
                    </a>
                  )}
                </div>

                <div className="p-6 flex-1 overflow-y-auto max-h-[280px] space-y-3 bg-slate-50/40 text-xs">
                  {!activeSupportChat ? (
                    <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
                      👈 Click on a customer conversation on the left to read and reply.
                    </div>
                  ) : (
                    (activeSupportChat.messages || []).map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-2.5 max-w-[78%] leading-relaxed shadow-sm ${
                            msg.sender === 'admin'
                              ? 'bg-[#0b5c58] text-white font-semibold'
                              : msg.sender === 'user'
                              ? 'bg-white border-2 border-teal-500/40 text-slate-900 font-semibold'
                              : 'bg-slate-100 border border-slate-200 text-slate-600'
                          }`}
                        >
                          <span className="text-[9px] font-black uppercase opacity-75 block mb-0.5">
                            {msg.sender === 'admin'
                              ? '👨‍💻 Admin Reply'
                              : msg.sender === 'user'
                              ? `👤 ${activeSupportChat.customer_name}`
                              : '🤖 Welcome Bot'}
                            {msg.time ? ` • ${msg.time}` : ''}
                          </span>
                          <p className="whitespace-pre-line">{msg.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={handleSendAdminChatReply}
                  className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-3"
                >
                  <input
                    type="text"
                    disabled={!activeSupportChat || sendingAdminReply}
                    placeholder="Type your reply to the customer (e.g. Yes, this offer is available for a limited time!)..."
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-teal-600 text-slate-800 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!activeSupportChat || sendingAdminReply || !adminReplyText.trim()}
                    className="px-5 py-2.5 bg-slate-500 hover:bg-[#0b5c58] disabled:bg-slate-300 text-white font-extrabold rounded-xl text-xs transition shrink-0 shadow"
                  >
                    {sendingAdminReply ? 'Sending...' : 'Send Reply →'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-2 border-amber-500/40 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  Public Landing Page Reviews & Moderation
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Control what customers see on the Business Page. You can manually adjust likes/dislikes, approve positive reviews, delete bad ones, and completely hide the section if needed.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleReviewsVisibility}
                className={`px-4 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 border ${
                  showReviewsPublicly
                    ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'
                    : 'bg-rose-950/60 text-rose-400 border-rose-800 hover:bg-rose-900'
                }`}
              >
                {showReviewsPublicly ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{showReviewsPublicly ? 'Section is VISIBLE to Public' : 'Section is HIDDEN from Public'}</span>
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-emerald-400" />
                  Manual Likes & Dislikes Override
                </h3>
                <p className="text-xs text-slate-400">
                  Override the counts displayed on the landing page manually to combat spam dislikes.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" /> Total Likes
                    </label>
                    <input
                      type="number"
                      value={likesData.likes}
                      onChange={(e) => handleUpdateLikes('likes', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <ThumbsDown className="w-3.5 h-3.5 text-rose-400" /> Total Dislikes
                    </label>
                    <input
                      type="number"
                      value={likesData.dislikes}
                      onChange={(e) => handleUpdateLikes('dislikes', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-rose-400 font-mono font-bold outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  Pending Approval Inbox ({pendingReviews.length})
                </h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {pendingReviews.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">No pending reviews.</div>
                  ) : (
                    pendingReviews.map((rev) => (
                      <div key={rev.id} className="bg-amber-950/20 border border-amber-500/30 p-3.5 rounded-2xl">
                        <div className="flex justify-between items-start">
                          <span className="font-extrabold text-white text-xs">{rev.author_name}</span>
                          <span className="text-amber-400 text-[10px] font-black">{'⭐'.repeat(rev.rating)}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 italic">"{rev.comment_text}"</p>
                        <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-amber-500/20">
                          <button
                            type="button"
                            onClick={() => handleApproveReview(rev.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Approve & Publish
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id)}
                            className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-400 rounded-lg text-[10px] font-bold transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Live / Approved Reviews on Landing Page ({approvedReviews.length})
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {approvedReviews.map((rev) => (
                  <div key={rev.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-white text-xs">{rev.author_name}</span>
                      <span className="text-amber-400 text-[9px] font-black">{'⭐'.repeat(rev.rating)}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 italic">"{rev.comment_text}"</p>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800">
                      <span className="text-[9px] text-slate-500 font-mono">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1 text-rose-400 hover:text-rose-300 transition"
                        title="Delete Published Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shops' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 border-2 border-emerald-500/40 rounded-3xl p-4 shadow-lg flex flex-col md:flex-row items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400 shrink-0">
                <Sparkles className="w-4 h-4" />
                <span>Business Landing Page Offer Box:</span>
              </div>
              <input
                type="text"
                placeholder="Type an offer, festival discount, or update to display at the top of BusinessLandingPage..."
                value={landingOfferText}
                onChange={(e) => setLandingOfferText(e.target.value)}
                className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={savingLandingOffer}
                  onClick={() => handleSaveLandingAnnouncement(false)}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{savingLandingOffer ? 'Publishing...' : 'Publish on Landing Page'}</span>
                </button>
                <button
                  type="button"
                  disabled={savingLandingOffer}
                  onClick={() => handleSaveLandingAnnouncement(true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Hide / Clear
                </button>
              </div>
            </div>

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

            <div className="bg-slate-900 border border-teal-500/30 rounded-3xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-teal-400">
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Targeted Notice / Instruction / Offer to Particular Shop:</span>
                </div>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2.5 py-0.5 rounded-full border border-teal-500/30">
                  PARTICULAR SHOP TICKER
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                <div className="md:col-span-3">
                  <select
                    value={targetShopCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setTargetShopCode(code);
                      const found = shops.find(s => s.pairing_code === code || s.slug === code);
                      if (found) setTargetShopMessage(found.targeted_message || '');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-teal-500 font-mono"
                  >
                    <option value="">-- Select Active Shop --</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.pairing_code || s.slug}>
                        [{s.pairing_code || '---'}] {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="Or type Shop Code..."
                    value={targetShopCode}
                    onChange={(e) => setTargetShopCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-teal-400 font-mono font-bold outline-none focus:border-teal-500"
                  />
                </div>

                <div className="md:col-span-4">
                  <input
                    type="text"
                    placeholder="Type update, offer, or warning for this shop..."
                    value={targetShopMessage}
                    onChange={(e) => setTargetShopMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div className="md:col-span-3 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    disabled={sendingTargeted}
                    onClick={() => handleSendTargetedNotice(false)}
                    className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-xl text-xs transition flex items-center gap-1 shadow"
                    title="Send to Shop"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetShopMessage('')}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                    title="Clear Input Text"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    disabled={sendingTargeted}
                    onClick={() => handleSendTargetedNotice(true)}
                    className="p-2 bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/60 rounded-xl transition"
                    title="Delete Notice from Shop Dashboard"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={fetchAllData}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                    title="Refresh Shops"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
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
                            {shop.gateway_enabled && (
                              <span className="inline-block mt-1 mr-1 text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                                ⚡ Own PG: {(shop.gateway_provider || 'razorpay').toUpperCase()}
                              </span>
                            )}
                            {shop.split_payment_enabled && (
                              <span className="inline-block mt-1 mr-1 text-[9px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-md">
                                🏦 Split Opted-In
                              </span>
                            )}
                            {shop.admin_message && (
                              <span className="inline-block mt-1 mr-1 text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md truncate max-w-[180px]" title={shop.admin_message}>
                                💬 {shop.admin_message}
                              </span>
                            )}
                            {shop.targeted_message && (
                              <span className="inline-block mt-1 text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-md truncate max-w-[180px]" title={shop.targeted_message}>
                                🎯 {shop.targeted_message}
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
                              {shop.selected_plan === 'starter_yearly' ? 'Starter Yearly' : 'Starter Station (₹199)'}
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
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Public Business Landing Page — Live Offer & Update Message Box
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Whatever you type here appears immediately at the top of the Business Landing Page (`rtsprint.online`).
                  </p>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-3 py-1 rounded-full uppercase border border-emerald-500/30">
                  LIVE LANDING BANNER
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <input
                  type="text"
                  placeholder="e.g. 🎉 Special Launch Offer: Activate Starter Station at ₹199/month + 7-Day Free Trial!"
                  value={landingOfferText}
                  onChange={(e) => setLandingOfferText(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={savingLandingOffer}
                    onClick={() => handleSaveLandingAnnouncement(false)}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center gap-1.5 shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{savingLandingOffer ? 'Saving...' : 'Publish to Landing Page'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={savingLandingOffer}
                    onClick={() => handleSaveLandingAnnouncement(true)}
                    className="px-3.5 py-2.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-bold rounded-xl text-xs transition"
                  >
                    Remove Banner
                  </button>
                </div>
              </div>
            </div>

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
                      placeholder="199"
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

        {activeTab === 'statements' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-teal-950/80 via-slate-900 to-indigo-950/80 border-2 border-teal-500/40 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-400" />
                    <h2 className="text-base font-black text-white">
                      RTS Central Split Payment Gateway Controller (Cashfree Easy Split / Razorpay Route)
                    </h2>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      masterSplitPaused
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-500 text-slate-950'
                    }`}>
                      {masterSplitPaused ? 'PAUSED • COMING SOON' : 'LIVE & ACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Keep this paused in "Coming Soon" mode until your Current Account & Cashfree/Razorpay Split API keys are ready. Meanwhile, shops can use their own QR Scanner or their own Self Gateway keys.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMasterSplitPaused(!masterSplitPaused)}
                  className={`px-4 py-2 rounded-xl font-black text-xs transition shadow ${
                    masterSplitPaused
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {masterSplitPaused ? '⏸️ Status: Coming Soon (Paused)' : '▶️ Status: Active'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Master Split Gateway Provider</label>
                  <select
                    value={masterGatewayProvider}
                    onChange={(e) => setMasterGatewayProvider(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold outline-none"
                  >
                    <option value="cashfree">Cashfree Payments (Easy Split)</option>
                    <option value="razorpay">Razorpay (Route Split)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">
                    RTS Master Split API Key / App ID (Enter when account is ready)
                  </label>
                  <input
                    type="text"
                    placeholder="Coming Soon — Paste your Cashfree/Razorpay Master App ID here when ready..."
                    value={masterGatewayAppId}
                    onChange={(e) => setMasterGatewayAppId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-teal-300 font-mono outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    All-Shop 30-Day Transaction & Settlement Audit Ledger
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Separates Direct Shop Collections (Shop's own UPI/Cash/Gateway) from RTS Central Split Collections for 100% accounting safety.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={dispatchingAllStatements}
                  onClick={handleDispatchAllDailyStatements}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <Mail className="w-4 h-4" />
                  <span>
                    {dispatchingAllStatements
                      ? 'Sending 8 PM Statements...'
                      : 'Send Today 8:00 PM Statement Email to All Shops'}
                  </span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <select
                    value={ledgerShopFilter}
                    onChange={(e) => setLedgerShopFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-bold outline-none focus:border-emerald-500"
                  >
                    <option value="ALL">All Registered Shops ({shops.length})</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.pairing_code}] {s.name}
                      </option>
                    ))}
                  </select>

                  {[
                    { id: 'today', label: 'Today' },
                    { id: '7days', label: 'Last 7 Days' },
                    { id: '30days', label: 'Last 30 Days (1 Month)' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setLedgerPeriodFilter(p.id as any)}
                      className={`px-3.5 py-2 rounded-xl font-bold text-xs transition ${
                        ledgerPeriodFilter === p.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">
                    Total Gross Print Volume
                  </span>
                  <span className="text-2xl font-black font-mono text-white mt-1 block">
                    ₹{adminTotalGross.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-bold">
                    {filteredAdminTransactions.length} Completed Orders
                  </span>
                </div>

                <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-emerald-400 block">
                    Direct Shop Collection (Shop UPI / Cash / Own PG)
                  </span>
                  <span className="text-2xl font-black font-mono text-emerald-300 mt-1 block">
                    ₹{adminDirectShopTotal.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Settled 100% directly to Shopkeeper (No Super Admin liability)
                  </span>
                </div>

                <div className="bg-teal-950/30 border border-teal-500/30 p-4 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-teal-400 block">
                    RTS Central Split Collection (Coming Soon)
                  </span>
                  <span className="text-2xl font-black font-mono text-teal-300 mt-1 block">
                    ₹{adminSplitSettlementTotal.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Tracked separately for automatic bank split payout
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96 border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Shop Name & Code</th>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Payment Mode</th>
                      <th className="py-3 px-4">Collection Channel</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredAdminTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No transactions recorded for the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAdminTransactions.map((tx) => {
                        const txShop = shops.find(s => s.id === tx.shop_id);
                        return (
                          <tr key={tx.id} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-4 text-[11px] text-slate-400">
                              {new Date(tx.created_at).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-white">
                              {txShop ? `${txShop.name} (${txShop.pairing_code})` : tx.shop_id}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-emerald-400 font-bold">{tx.order_number}</td>
                            <td className="py-2.5 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 font-bold text-[10px]">
                                {tx.payment_mode}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${
                                tx.collection_type === 'SPLIT_SETTLEMENT'
                                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {tx.collection_type === 'SPLIT_SETTLEMENT' ? 'RTS Split' : 'Direct Shop'}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-black text-white">
                              ₹{Number(tx.amount || 0).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
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
                <p className="text-[11px] text-slate-400">Configure credentials, plan features, downloads, gateway keys & notices</p>
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

              {/* PLAN-BASED KIOSK FEATURE CONTROLS */}
              <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-2xl space-y-2">
                <span className="text-[11px] font-extrabold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Plan-Based Kiosk Feature Access (Super Admin Control)
                </span>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setEditingShop({ ...editingShop, plan_id_card_allowed: !(editingShop.plan_id_card_allowed ?? true) })}
                    className={`p-2 rounded-xl border font-bold flex flex-col items-center gap-1 transition ${
                      (editingShop.plan_id_card_allowed ?? true)
                        ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    <UserSquare className="w-3.5 h-3.5" />
                    <span>ID Card 2-in-1</span>
                    <span className="uppercase">{(editingShop.plan_id_card_allowed ?? true) ? 'ALLOWED' : 'LOCKED'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingShop({ ...editingShop, plan_passport_allowed: !(editingShop.plan_passport_allowed ?? true) })}
                    className={`p-2 rounded-xl border font-bold flex flex-col items-center gap-1 transition ${
                      (editingShop.plan_passport_allowed ?? true)
                        ? 'bg-pink-600/30 border-pink-400 text-pink-200'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Passport 8 Pics</span>
                    <span className="uppercase">{(editingShop.plan_passport_allowed ?? true) ? 'ALLOWED' : 'LOCKED'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingShop({ ...editingShop, plan_scan_pdf_allowed: !(editingShop.plan_scan_pdf_allowed ?? true) })}
                    className={`p-2 rounded-xl border font-bold flex flex-col items-center gap-1 transition ${
                      (editingShop.plan_scan_pdf_allowed ?? true)
                        ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Scan & PDF</span>
                    <span className="uppercase">{(editingShop.plan_scan_pdf_allowed ?? true) ? 'ALLOWED' : 'LOCKED'}</span>
                  </button>
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

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-emerald-400 font-bold mb-1">UPI Registered Bank Name</label>
                  <input
                    type="text"
                    placeholder="Account Holder Name"
                    value={editingShop.upi_name || ''}
                    onChange={(e) => setEditingShop({ ...editingShop, upi_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-950/20 border border-indigo-800/40 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-indigo-300 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    Shop's Self Payment Gateway & Split Bank Info
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingShop({ ...editingShop, gateway_enabled: !editingShop.gateway_enabled })}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      editingShop.gateway_enabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {editingShop.gateway_enabled ? 'Self PG: ON' : 'Self PG: OFF'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Gateway Provider</label>
                    <select
                      value={editingShop.gateway_provider || 'razorpay'}
                      onChange={(e) => setEditingShop({ ...editingShop, gateway_provider: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white outline-none"
                    >
                      <option value="razorpay">Razorpay</option>
                      <option value="cashfree">Cashfree</option>
                      <option value="phonepe">PhonePe PG</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Gateway Key ID / App ID</label>
                    <input
                      type="text"
                      placeholder="rzp_live_..."
                      value={editingShop.gateway_key_id || ''}
                      onChange={(e) => setEditingShop({ ...editingShop, gateway_key_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-indigo-800/30">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Bank Holder Name</label>
                    <input
                      type="text"
                      value={editingShop.bank_account_name || ''}
                      onChange={(e) => setEditingShop({ ...editingShop, bank_account_name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Bank A/c No</label>
                    <input
                      type="text"
                      value={editingShop.bank_account_number || ''}
                      onChange={(e) => setEditingShop({ ...editingShop, bank_account_number: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={editingShop.bank_ifsc || ''}
                      onChange={(e) => setEditingShop({ ...editingShop, bank_ifsc: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-white font-mono uppercase outline-none"
                    />
                  </div>
                </div>
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
                      <option value="starter_monthly">Starter Station (₹199/mo - 30 Days)</option>
                      <option value="starter_yearly">Starter Yearly (365 Days)</option>
                      <option value="trial_7">7-Day Free Trial</option>
                      <option value="trial_14">14-Day Free Trial</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-emerald-800/30">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Valid Days:</span>
                    <input
                      type="number"
                      min={0}
                      max={3650}
                      value={editingShop.subscription_days ?? 7}
                      onChange={(e) => setEditingShop({
                        ...editingShop,
                        subscription_days: Math.max(0, Number(e.target.value))
                      })}
                      className="w-16 bg-slate-950 border border-emerald-700 rounded-lg px-2 py-1 text-emerald-400 font-mono font-bold text-center text-xs outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingShop({ 
                        ...editingShop, 
                        subscription_days: Math.max(0, (editingShop.subscription_days || 7) - 7) 
                      })}
                      className="px-2.5 py-1 bg-rose-900/70 hover:bg-rose-800 text-rose-200 border border-rose-700/60 rounded-lg font-bold text-[10px] transition"
                    >
                      - Reduce 7 Days
                    </button>

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

              <div>
                <label className="block text-slate-400 mb-1">Separate Photo Printer (Optional)</label>
                <input
                  type="text"
                  placeholder="Optional photo printer name..."
                  value={editingShop.photo_printer_name || ''}
                  onChange={(e) => setEditingShop({ ...editingShop, photo_printer_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none text-xs"
                />
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-2xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold text-amber-400 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />
                    Global Broadcast Notice for Shop Admin Panel
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
                  placeholder="Global broadcast message shown on this shop's admin dashboard..."
                  value={editingShop.admin_message || ''}
                  onChange={(e) => setEditingShop({ ...editingShop, admin_message: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="p-3 bg-teal-950/20 border border-teal-800/40 rounded-2xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold text-teal-400 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Targeted / Particular Shop Notice (Hidden unless set)
                  </label>
                  {editingShop.targeted_message && (
                    <button
                      type="button"
                      onClick={() => setEditingShop({ ...editingShop, targeted_message: '' })}
                      className="text-[10px] text-rose-400 hover:underline font-bold"
                    >
                      Clear Targeted Notice
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  placeholder="Type a private update, instruction, or offer for this particular shop..."
                  value={editingShop.targeted_message || ''}
                  onChange={(e) => setEditingShop({ ...editingShop, targeted_message: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500 text-xs"
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
