import React, { useState, useEffect, useRef } from 'react';
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
  Mail,
  Download,
  Bell,
  Send,
  MessageCircle,
  HelpCircle,
  X,
  Languages
} from 'lucide-react';

interface ShopData {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  owner_email: string | null;
  upi_id: string | null;
  upi_name?: string | null;
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
  download_count?: number;
  download_allowed?: boolean;
  max_downloads?: number;
  download_requested?: boolean;
  admin_message?: string | null;
  targeted_message?: string | null;
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

interface SupportChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'admin';
  text: string;
  time?: string;
}

const AGENT_DOWNLOAD_URL = "https://github.com/RTS-DIGITAL/rts-smart-print-live/releases/download/v1.0.0/RTS-Print-Setup.exe";
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

const SHOP_ADMIN_FAQS = [
  {
    id: 'q1',
    qEn: '1. What is RTS Smart Print?',
    aEn: 'RTS Smart Print is an automated printing system for your shop. Customers scan your counter QR code, upload their file, choose copies and colour, and pay by UPI or cash. Your shop computer receives the order and prints it.',
    qMl: '1. എന്താണ് RTS Smart Print?',
    aMl: 'നിങ്ങളുടെ കടയ്ക്കായുള്ള ഒരു ഓട്ടോമേറ്റഡ് പ്രിന്റിംഗ് സംവിധാനമാണ് RTS Smart Print. ഉപഭോക്താക്കൾ കൗണ്ടറിലെ QR കോഡ് സ്കാൻ ചെയ്ത് ഫയൽ അപ്‌ലോഡ് ചെയ്യുകയും UPI വഴിയോ ക്യാഷ് ആയോ പണമടയ്ക്കുകയും ചെയ്യുന്നു. ഓർഡർ നിങ്ങളുടെ കമ്പ്യൂട്ടറിൽ എത്തുകയും പ്രിന്റ് ആകുകയും ചെയ്യുന്നു.'
  },
  {
    id: 'q2',
    qEn: '2. How much does it cost?',
    aEn: 'The Starter Station plan is ₹199 per month. It includes a 7-day free trial. You can see the plan details on the pricing section of the website, or ask RTS Support for the current offer.',
    qMl: '2. ഇതിന് എത്രയാണ് നിരക്ക്?',
    aMl: 'Starter Station പ്ലാനിന് പ്രതിമാസം ₹199 ആണ്. ഇതിൽ 7 ദിവസത്തെ സൗജന്യ ട്രയൽ ഉൾപ്പെടുന്നു. നിലവിലെ ഓഫറുകൾ അറിയാൻ RTS Support-ൽ ചോദിക്കാവുന്നതാണ്.'
  },
  {
    id: 'q3',
    qEn: '3. Is there a free trial?',
    aEn: 'Yes, the Starter Station plan includes a 7-day free trial with no card or upfront payment required to start. When the trial ends, you can renew your subscription to continue receiving orders.',
    qMl: '3. സൗജന്യ ട്രയൽ ലഭ്യമാണോ?',
    aMl: 'അതെ, കാർഡോ മുൻകൂർ പേയ്‌മെന്റോ ഇല്ലാതെ തന്നെ 7 ദിവസത്തെ സൗജന്യ ട്രയൽ ലഭിക്കും. ട്രയൽ അവസാനിക്കുമ്പോൾ സബ്‌സ്‌ക്രിപ്ഷൻ പുതുക്കി സേവനം തുടരാവുന്നതാണ്.'
  },
  {
    id: 'q4',
    qEn: '4. Does RTS Smart Print take a commission on my payments?',
    aEn: 'No. Customer UPI payments go directly to your own UPI ID, and cash payments are collected directly at your counter — both with 0% commission.',
    qMl: '4. എന്റെ പേയ്‌മെന്റുകളിൽ നിന്ന് കമ്മീഷൻ ഈടാക്കുമോ?',
    aMl: 'ഇല്ല. കസ്റ്റമർ നൽകുന്ന UPI പേയ്‌മെന്റുകൾ നേരിട്ട് നിങ്ങളുടെ സ്വന്തം UPI ID-യിലേക്കും ക്യാഷ് പേയ്‌മെന്റുകൾ നേരിട്ട് കൗണ്ടറിലേക്കും ലഭിക്കുന്നു (0% കമ്മീഷൻ).'
  },
  {
    id: 'q5',
    qEn: "5. How do I change my shop's printing prices?",
    aEn: "In your Shop Admin Dashboard, scroll to the 'Dynamic Page Rate' section. Change the rate for A4, Legal, Letter, colour, black and white, single-sided or double-sided printing. The new prices appear on the customer's screen as soon as they are saved, so there is no need to restart anything.",
    qMl: '5. പ്രിന്റിംഗ് നിരക്കുകൾ എങ്ങനെ മാറ്റാം?',
    aMl: "ഈ ഡാഷ്‌ബോർഡിലെ 'Dynamic Page Rate' കാർഡിൽ A4, Legal, Letter, B&W, Color നിരക്കുകൾ മാറ്റിയാൽ ഉടൻ തന്നെ അത് സേവ് ആകുകയും കസ്റ്റമറുടെ സ്ക്രീനിൽ തത്സമയം മാറുകയും ചെയ്യും."
  },
  {
    id: 'q6',
    qEn: '6. How do I connect my shop computer to RTS Smart Print?',
    aEn: '1. Log in to the Shop Admin Dashboard and copy your permanent 6-digit pairing code.\n2. Download the PC Print Agent (RTS-Print-Setup.exe) from the dashboard.\n3. Install it on the shop computer and run it.\n4. Enter the 6-digit pairing code when asked.\nThe pairing code does not change when you refresh the page. You can download the agent up to 3 times per account. If you need more, request re-download approval from RTS Support.',
    qMl: '6. കടയിലെ കമ്പ്യൂട്ടർ എങ്ങനെ കണക്റ്റ് ചെയ്യാം?',
    aMl: '1. ഡാഷ്‌ബോർഡിലെ 6-അക്ക Pairing Code കോപ്പി ചെയ്യുക.\n2. RTS-Print-Setup.exe ഡൗൺലോഡ് ചെയ്ത് കമ്പ്യൂട്ടറിൽ ഇൻസ്റ്റാൾ ചെയ്ത് റൺ ചെയ്യുക.\n3. അതിൽ 6-അക്ക Pairing Code നൽകുക.\nഈ കോഡ് പേജ് റീഫ്രഷ് ചെയ്താലും മാറില്ല. 3 തവണ വരെ സോഫ്റ്റ്‌വെയർ ഡൗൺലോഡ് ചെയ്യാം.'
  },
  {
    id: 'q7',
    qEn: '7. Do I need to install anything on my phone?',
    aEn: 'No app is needed for customers. They scan the QR code with their phone camera and use the web page. You only need the PC Print Agent on your shop computer.',
    qMl: '7. ഫോണിൽ ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യേണ്ടതുണ്ടോ?',
    aMl: 'ഇല്ല. ഉപഭോക്താക്കൾക്ക് ആപ്പിന്റെ ആവശ്യമില്ല. അവർ ഫോൺ ക്യാമറ വഴി QR കോഡ് സ്കാൻ ചെയ്ത് വെബ് പേജ് ഉപയോഗിക്കുന്നു. കടയിലെ കമ്പ്യൂട്ടറിൽ മാത്രം PC Print Agent ഉണ്ടായാൽ മതി.'
  },
  {
    id: 'q8',
    qEn: '8. What do I need before I start?',
    aEn: 'You need a Windows computer, an internet connection, a printer connected to that computer, your UPI ID (or cash payment), and a phone to test with.',
    qMl: '8. തുടങ്ങുന്നതിന് മുൻപ് എന്തെല്ലാം ആവശ്യമാണ്?',
    aMl: 'ഒരു വിൻഡോസ് കമ്പ്യൂട്ടർ, ഇന്റർനെറ്റ് കണക്ഷൻ, കമ്പ്യൂട്ടറുമായി ഘടിപ്പിച്ച പ്രിന്റർ, നിങ്ങളുടെ UPI ID (അല്ലെങ്കിൽ ക്യാഷ് പേയ്‌മെന്റ്), ടെസ്റ്റ് ചെയ്യാൻ ഒരു ഫോൺ എന്നിവ മാത്രം മതി.'
  },
  {
    id: 'q9',
    qEn: '9. How do I print the QR code for my counter?',
    aEn: 'Open the Shop Admin Dashboard and click Print Counter Standee. Print the QR code and place it on your counter. Customers can scan it with any phone camera.',
    qMl: '9. കൗണ്ടറിൽ വെക്കാനുള്ള QR കോഡ് എങ്ങനെ പ്രിന്റ് ചെയ്യാം?',
    aMl: 'Shop Admin Dashboard-ലെ "Print Counter Standee" ക്ലിക്ക് ചെയ്ത് QR കോഡ് പ്രിന്റ് എടുത്ത് കൗണ്ടറിൽ വെക്കുക. ഏത് ഫോൺ ക്യാമറ ഉപയോഗിച്ചും ഇത് സ്കാൻ ചെയ്യാം.'
  },
  {
    id: 'q10',
    qEn: '10. What happens when a customer places an order?',
    aEn: "The order appears in your Live Print Queue, showing the order number, file name, copies, amount and status. In Auto-Pilot mode, printing starts automatically after payment is confirmed. In Manual mode, press Print Now after you check the order. You can press Reject / Discard to remove an order you don't want to print.",
    qMl: '10. കസ്റ്റമർ ഓർഡർ നൽകുമ്പോൾ എന്ത് സംഭവിക്കും?',
    aMl: 'ഓർഡർ നിങ്ങളുടെ Live Print Queue-ൽ കാണാം. Auto-Pilot മോഡിൽ പേയ്‌മെന്റ് കഴിഞ്ഞാൽ തനിയെ പ്രിന്റ് ആകും. Manual മോഡിൽ ഓർഡർ പരിശോധിച്ച ശേഷം "Print Now" ക്ലിക്ക് ചെയ്യാം, അല്ലെങ്കിൽ ഒഴിവാക്കാൻ Reject ബട്ടൺ അമർത്താം.'
  },
  {
    id: 'q11',
    qEn: '11. How long are customer files kept?',
    aEn: "You choose how long customer files are kept: 1 hour, 4 hours, 12 hours or 24 hours. When that time ends, the files are removed automatically from the Shop Admin Dashboard and our database. You don't need to clear any storage yourself.",
    qMl: '11. ഉപഭോക്താക്കളുടെ ഫയലുകൾ എത്ര സമയം സൂക്ഷിക്കും?',
    aMl: '1 മണിക്കൂർ, 4 മണിക്കൂർ, 12 മണിക്കൂർ, അല്ലെങ്കിൽ 24 മണിക്കൂർ എന്നിങ്ങനെ നിങ്ങൾ തിരഞ്ഞെടുക്കുന്ന സമയത്തിന് ശേഷം ഫയലുകൾ ഡാഷ്‌ബോർഡിൽ നിന്നും ഡാറ്റാബേസിൽ നിന്നും തനിയെ നീക്കം ചെയ്യപ്പെടും.'
  },
  {
    id: 'q12',
    qEn: '12. Who do I contact if I have a problem?',
    aEn: 'First check that the printer is on, has paper, is connected to the computer, and is selected in the dashboard, and that the internet is working. If the problem continues, switch to the "Live Chat (Super Admin)" tab above to contact RTS Support directly.',
    qMl: '12. എന്തെങ്കിലും പ്രശ്നമുണ്ടായാൽ ആരെ ബന്ധപ്പെടണം?',
    aMl: 'ആദ്യം പ്രിന്റർ ഓൺ ആണെന്നും പേപ്പർ ഉണ്ടെന്നും ഇന്റർനെറ്റ് പ്രവർത്തിക്കുന്നുണ്ടെന്നും ഉറപ്പാക്കുക. പ്രശ്നം തുടരുകയാണെങ്കിൽ മുകളിലുള്ള "Live Chat (Super Admin)" ടാബിൽ ക്ലിക്ക് ചെയ്ത് RTS Support-മായി നേരിട്ട് ചാറ്റ് ചെയ്യുക.'
  }
];

export default function AdminPage() {
  const { shopSlug } = useParams<{ shopSlug: string }>();
  const activeSlug = shopSlug || DEFAULT_SHOP_SLUG;

  const [shop, setShop] = useState<ShopData | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [pricing, setPricing] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [requestingUnlock, setRequestingUnlock] = useState(false);

  // Authentication & Automated Forgot Password State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');

  const [showForgotBox, setShowForgotBox] = useState(false);
  const [forgotUserId, setForgotUserId] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const [forgotStatusMsg, setForgotStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [targetPrinter, setTargetPrinter] = useState('');
  const [isCustomPrinter, setIsCustomPrinter] = useState(false);
  const [counterNotice, setCounterNotice] = useState('');
  const [isAccepting, setIsAccepting] = useState(true);
  const [requirePayment, setRequirePayment] = useState(false);
  const [isPinProtected, setIsPinProtected] = useState(false);
  const [counterPin, setCounterPin] = useState('1234');
  const [adminPin, setAdminPin] = useState('123456');
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const [autoDeleteHours, setAutoDeleteHours] = useState(24);

  // Shop Admin Floating Help & Live Support Chat States
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportTab, setSupportTab] = useState<'faq' | 'livechat'>('faq');
  const [faqLang, setFaqLang] = useState<'en' | 'ml'>('en');
  const [selectedFaqId, setSelectedFaqId] = useState<string>('q1');

  const [chatTimeoutMinutes, setChatTimeoutMinutes] = useState<number>(10);
  const [shopChatSessionId, setShopChatSessionId] = useState<string | null>(null);
  const [shopChatStartedAt, setShopChatStartedAt] = useState<number | null>(null);
  const [startingShopChat, setStartingShopChat] = useState(false);
  const [shopChatInput, setShopChatInput] = useState('');
  const [sendingShopChat, setSendingShopChat] = useState(false);
  const [shopChatMessages, setShopChatMessages] = useState<SupportChatMessage[]>([]);
  const lastShopMsgCountRef = useRef<number>(0);
  const shopChatEndRef = useRef<HTMLDivElement>(null);

  const playReplyChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Ignore audio block
    }
  };

  useEffect(() => {
    const sessionKey = `rts_auth_${activeSlug}`;
    if (localStorage.getItem(sessionKey) === 'true') {
      setIsLoggedIn(true);
    }

    const savedChatId = sessionStorage.getItem(`rts_shop_chat_id_${activeSlug}`);
    const savedChatStart = sessionStorage.getItem(`rts_shop_chat_start_${activeSlug}`);
    if (savedChatId) setShopChatSessionId(savedChatId);
    if (savedChatStart) setShopChatStartedAt(Number(savedChatStart));
  }, [activeSlug]);

  const resetShopChatToFresh = () => {
    sessionStorage.removeItem(`rts_shop_chat_id_${activeSlug}`);
    sessionStorage.removeItem(`rts_shop_chat_start_${activeSlug}`);
    setShopChatSessionId(null);
    setShopChatStartedAt(null);
    setShopChatInput('');
    setShopChatMessages([]);
    lastShopMsgCountRef.current = 0;
  };

  const loadShopData = async () => {
    try {
      const { data: shopRes, error: shopErr } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', activeSlug)
        .single();

      if (shopErr || !shopRes) throw new Error('Shop not found');

      // Automatic Storage & Queue Purge
      const retentionHours = shopRes.auto_delete_hours || 1;
      const expirationThreshold = new Date(Date.now() - retentionHours * 60 * 60 * 1000).toISOString();

      const { data: expiredOrders } = await supabase
        .from('print_orders')
        .select('id, file_url')
        .eq('shop_id', shopRes.id)
        .lt('created_at', expirationThreshold);

      if (expiredOrders && expiredOrders.length > 0) {
        const filePathsToRemove = expiredOrders
          .map((o) => o.file_url)
          .filter((url): url is string => Boolean(url));

        if (filePathsToRemove.length > 0) {
          await supabase.storage.from('print-files').remove(filePathsToRemove);
        }

        const idsToDelete = expiredOrders.map((o) => o.id);
        await supabase.from('print_orders').delete().in('id', idsToDelete);
      }

      setShop(shopRes);
      setShopName(shopRes.name || '');
      setPhone(shopRes.phone || '');
      setOwnerEmail(shopRes.owner_email || '');
      setUpiId(shopRes.upi_id || '');
      setUpiName(shopRes.upi_name || '');
      
      const savedPrinter = shopRes.target_printer_name || 'Microsoft Print to PDF';
      setTargetPrinter(savedPrinter);
      setIsCustomPrinter(Boolean(savedPrinter && !COMMON_PRINTERS.includes(savedPrinter)));

      setCounterNotice(shopRes.counter_notice || '');
      setIsAccepting(shopRes.is_accepting_orders ?? true);
      setRequirePayment(shopRes.require_payment ?? false);
      setIsPinProtected(shopRes.is_pin_protected ?? false);
      setCounterPin(shopRes.counter_pin || '1234');
      setAdminPin(shopRes.admin_pin || '123456');
      setAutoPrintEnabled(shopRes.auto_print_enabled ?? true);
      setAutoDeleteHours(shopRes.auto_delete_hours || 24);

      const { data: ordersRes } = await supabase
        .from('print_orders')
        .select('*')
        .eq('shop_id', shopRes.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (ordersRes) setOrders(ordersRes);

      const { data: pricingRes } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('shop_id', shopRes.id);

      if (pricingRes) setPricing(pricingRes);

      const { data: announceData } = await supabase
        .from('site_announcements')
        .select('chat_timeout_minutes')
        .eq('id', 1)
        .maybeSingle();

      if (announceData?.chat_timeout_minutes) {
        setChatTimeoutMinutes(Number(announceData.chat_timeout_minutes));
      }
    } catch (err) {
      console.error('Failed to load shop admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShopData();
  }, [activeSlug]);

  useEffect(() => {
    if (!shop?.id) return;
    const channel = supabase
      .channel(`admin-queue-${shop.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'print_orders', filter: `shop_id=eq.${shop.id}` },
        () => loadShopData()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'shops', filter: `id=eq.${shop.id}` },
        () => loadShopData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shop?.id]);

  // Auto-Expire Shop Admin Live Chat Session after customizable timeout (5, 10, 15, 20 min)
  useEffect(() => {
    if (!shopChatSessionId || !shopChatStartedAt) return;
    const timeoutMs = (chatTimeoutMinutes || 10) * 60 * 1000;

    const checkExpiry = () => {
      if (Date.now() - shopChatStartedAt >= timeoutMs) {
        resetShopChatToFresh();
      }
    };

    checkExpiry();
    const timer = setInterval(checkExpiry, 5000);
    return () => clearInterval(timer);
  }, [shopChatSessionId, shopChatStartedAt, chatTimeoutMinutes]);

  // Sync Shop Admin Live Chat with Super Admin Replies
  useEffect(() => {
    if (!shopChatSessionId) return;

    async function fetchShopChat() {
      const { data, error } = await supabase
        .from('support_chats')
        .select('*')
        .eq('id', shopChatSessionId)
        .maybeSingle();

      if (error || !data) {
        resetShopChatToFresh();
        return;
      }

      if (Array.isArray(data.messages)) {
        if (data.messages.length > lastShopMsgCountRef.current) {
          const newest = data.messages[data.messages.length - 1];
          if (newest?.sender === 'admin') {
            playReplyChime();
          }
        }
        lastShopMsgCountRef.current = data.messages.length;
        setShopChatMessages(data.messages);
      }
    }

    fetchShopChat();
    const poll = setInterval(fetchShopChat, 3000);

    const chatSub = supabase
      .channel(`shop-admin-support-${shopChatSessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'support_chats', filter: `id=eq.${shopChatSessionId}` },
        () => fetchShopChat()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'support_chats', filter: `id=eq.${shopChatSessionId}` },
        () => resetShopChatToFresh()
      )
      .subscribe();

    return () => {
      clearInterval(poll);
      supabase.removeChannel(chatSub);
    };
  }, [shopChatSessionId]);

  useEffect(() => {
    shopChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [shopChatMessages, supportOpen, supportTab]);

  // Start Live Chat Session from Shop Admin to Super Admin (First Submit sends 1 email alert)
  const handleStartShopLiveChat = async () => {
    if (!shop) return;
    setStartingShopChat(true);

    try {
      const startTimestamp = Date.now();
      const displayShopLabel = `[SHOP: ${shop.pairing_code || shop.slug}] ${shop.name}`;
      const shopPhone = shop.phone || 'No Phone';
      const shopEmail = shop.owner_email || 'info@rtsdigitalseva.online';

      const initialMsgs: SupportChatMessage[] = [
        {
          id: `sys-${startTimestamp}`,
          sender: 'bot',
          text: faqLang === 'en'
            ? `✅ Connected to RTS Super Admin! Hello ${shop.name} (Code: ${shop.pairing_code}), type your question below and Super Admin will reply here live.`
            : `✅ RTS Super Admin-മായി കണക്റ്റ് ചെയ്തു! നമസ്കാരം ${shop.name} (Code: ${shop.pairing_code}), നിങ്ങളുടെ സന്ദേശം താഴെ ടൈപ്പ് ചെയ്യുക.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];

      const { data: newChat, error } = await supabase
        .from('support_chats')
        .insert([
          {
            customer_name: displayShopLabel,
            customer_phone: shopPhone,
            customer_email: shopEmail,
            messages: initialMsgs,
            status: 'active',
            unread_admin: true
          }
        ])
        .select()
        .single();

      if (error) throw error;

      sessionStorage.setItem(`rts_shop_chat_id_${activeSlug}`, newChat.id);
      sessionStorage.setItem(`rts_shop_chat_start_${activeSlug}`, String(startTimestamp));

      setShopChatSessionId(newChat.id);
      setShopChatStartedAt(startTimestamp);
      setShopChatMessages(initialMsgs);
      lastShopMsgCountRef.current = initialMsgs.length;

      // Send ONE-TIME email alert to Super Admin on First Submit ONLY
      fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'live_chat_alert',
          customerName: displayShopLabel,
          customerPhone: shopPhone,
          customerEmail: shopEmail,
          message: `Shop Admin (${shop.name} - Pairing Code: ${shop.pairing_code}) just connected to Live Support Chat!`
        })
      });
    } catch (err: any) {
      alert('Could not start live chat: ' + (err.message || 'Check connection'));
    } finally {
      setStartingShopChat(false);
    }
  };

  // Send message from Shop Admin to Super Admin Inbox
  const handleSendShopLiveMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = shopChatInput.trim();
    if (!trimmed || !shopChatSessionId) return;

    if (shopChatStartedAt && Date.now() - shopChatStartedAt >= (chatTimeoutMinutes || 10) * 60 * 1000) {
      resetShopChatToFresh();
      return;
    }

    setSendingShopChat(true);
    setShopChatInput('');

    try {
      const { data: currentRow } = await supabase
        .from('support_chats')
        .select('messages')
        .eq('id', shopChatSessionId)
        .maybeSingle();

      const baseMsgs = Array.isArray(currentRow?.messages) ? currentRow.messages : shopChatMessages;

      const newMsg: SupportChatMessage = {
        id: `u-${Date.now()}`,
        sender: 'user',
        text: trimmed,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const updated = [...baseMsgs, newMsg];
      setShopChatMessages(updated);
      lastShopMsgCountRef.current = updated.length;

      await supabase
        .from('support_chats')
        .update({
          messages: updated,
          unread_admin: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', shopChatSessionId);
    } catch (err) {
      console.error('Failed to send shop chat message:', err);
    } finally {
      setSendingShopChat(false);
    }
  };

  // Login Handler (Always checks latest PIN from DB so newly reset PIN works immediately)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    const { data: freshShop } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shop.id)
      .single();

    const currentShop = freshShop || shop;
    const validId = (currentShop.admin_username || currentShop.slug || '').toLowerCase().trim();
    const validSlug = (currentShop.slug || '').toLowerCase().trim();
    const validPhone = (currentShop.phone || '').trim();
    const enteredId = loginId.toLowerCase().trim();
    const validPin = (currentShop.admin_pin || '123456').trim();

    if (
      (enteredId === validId || enteredId === validSlug || enteredId === validPhone) &&
      loginPin.trim() === validPin
    ) {
      setShop(currentShop);
      setAdminPin(validPin);
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

  // =========================================================================
  // AUTOMATED FORGOT PASSWORD HANDLER (Generates New 6-Digit PIN, Saves to DB & Emails Shopkeeper)
  // =========================================================================
  const handleSendResetPinEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    const enteredUser = forgotUserId.toLowerCase().trim();
    const validUsername = (shop.admin_username || '').toLowerCase().trim();
    const validSlug = (shop.slug || '').toLowerCase().trim();
    const validName = (shop.name || '').toLowerCase().trim();
    const validPhone = (shop.phone || '').trim();

    if (!enteredUser) {
      setForgotStatusMsg({ type: 'error', text: 'Please enter your Shop ID / User ID (e.g. ramu).' });
      return;
    }

    if (
      enteredUser !== validUsername &&
      enteredUser !== validSlug &&
      enteredUser !== validName &&
      enteredUser !== validPhone
    ) {
      setForgotStatusMsg({
        type: 'error',
        text: `User ID "${forgotUserId}" does not match this shop. Try "${shop.admin_username || shop.slug}".`
      });
      return;
    }

    if (!shop.owner_email) {
      setForgotStatusMsg({
        type: 'error',
        text: 'No owner email is registered for this shop. Please contact RTS Support (info@rtsdigitalseva.online).'
      });
      return;
    }

    setSendingReset(true);
    setForgotStatusMsg(null);

    try {
      // 1. Generate a brand new random 6-digit Admin PIN
      const newSixDigitPin = Math.floor(100000 + Math.random() * 900000).toString();

      // 2. Update the new 6-digit PIN in Supabase `shops` table immediately
      const { error: updateErr } = await supabase
        .from('shops')
        .update({ admin_pin: newSixDigitPin })
        .eq('id', shop.id);

      if (updateErr) throw updateErr;

      // 3. Update local state so Counter Admin PIN (6 Numbers) reflects the new PIN automatically
      setAdminPin(newSixDigitPin);
      setShop({ ...shop, admin_pin: newSixDigitPin });

      // 4. Trigger automated email from RTS side via Google Apps Script webhook
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_pin',
          email: shop.owner_email,
          shopName: shop.name,
          userId: shop.admin_username || shop.slug,
          newPin: newSixDigitPin,
          slug: shop.slug
        })
      });

      const maskedEmail = shop.owner_email.replace(/(.{2})(.*)(?=@)/, '$1***');
      setForgotStatusMsg({
        type: 'success',
        text: `✅ A new 6-digit Admin PIN has been sent to your registered email (${maskedEmail}). Enter it above to sign in!`
      });
      setLoginId(shop.admin_username || shop.slug);
    } catch (err: any) {
      setForgotStatusMsg({
        type: 'error',
        text: 'Failed to reset PIN: ' + (err.message || 'Please try again.')
      });
    } finally {
      setSendingReset(false);
    }
  };

  // =========================================================================
  // SOFTWARE DOWNLOAD & UNLOCK REQUEST HANDLERS
  // =========================================================================
  const handleDownloadSetup = async () => {
    if (!shop) return;
    const used = shop.download_count || 0;
    const max = shop.max_downloads || 3;
    const allowed = shop.download_allowed ?? true;

    if (!allowed || used >= max) {
      alert(`Download limit reached (${used}/${max}) or paused by Super Admin. Please click "Request Re-Download Approval" below.`);
      return;
    }

    setDownloading(true);
    try {
      const newCount = used + 1;
      const stillAllowed = newCount < max;

      const { error } = await supabase
        .from('shops')
        .update({
          download_count: newCount,
          download_allowed: stillAllowed,
          download_requested: false
        })
        .eq('id', shop.id);

      if (error) throw error;

      window.open(AGENT_DOWNLOAD_URL, '_blank');
      await loadShopData();
    } catch (err: any) {
      alert('Failed to process download: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleRequestDownloadUnlock = async () => {
    if (!shop) return;
    setRequestingUnlock(true);
    try {
      const { error } = await supabase
        .from('shops')
        .update({
          download_requested: true
        })
        .eq('id', shop.id);

      if (error) throw error;
      alert(`Re-download request for Shop Code (${shop.pairing_code}) sent to Super Admin!`);
      await loadShopData();
    } catch (err: any) {
      alert('Failed to send unlock request: ' + err.message);
    } finally {
      setRequestingUnlock(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    setSaving(true);
    try {
      const cleanAdminPin = adminPin.trim() || '123456';
      const { error } = await supabase
        .from('shops')
        .update({
          name: shopName,
          phone: phone,
          owner_email: ownerEmail,
          upi_id: upiId.trim(),
          upi_name: upiName.trim(),
          target_printer_name: targetPrinter.trim() || 'Microsoft Print to PDF',
          counter_notice: counterNotice,
          is_accepting_orders: isAccepting,
          require_payment: requirePayment,
          is_pin_protected: isPinProtected,
          counter_pin: counterPin,
          admin_pin: cleanAdminPin,
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
            <div class="footer">Powered by RTS Smart Print</div>
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
  // SHOP ADMIN LOGIN GATE (With Automated Email 6-Digit PIN Reset)
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

          {/* Forgot 6-Digit PIN Automated Email Reset Section */}
          <div className="pt-3 border-t border-slate-900 space-y-3">
            <button
              type="button"
              onClick={() => {
                setShowForgotBox(!showForgotBox);
                setForgotStatusMsg(null);
              }}
              className="text-[11px] text-slate-400 hover:text-emerald-400 font-semibold transition"
            >
              {showForgotBox ? 'Cancel PIN Reset' : 'Forgot 6-Digit PIN?'}
            </button>

            {showForgotBox && (
              <form onSubmit={handleSendResetPinEmail} className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl space-y-2.5 text-left">
                <label className="block text-[11px] font-bold text-slate-300">
                  Enter User ID / Shop ID to receive a new 6-digit PIN via email:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`e.g. ${shop.admin_username || shop.slug}`}
                    value={forgotUserId}
                    onChange={(e) => setForgotUserId(e.target.value)}
                    required
                    className="flex-1 py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={sendingReset}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3 h-3" />
                    <span>{sendingReset ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>

                {forgotStatusMsg && (
                  <p className={`text-[11px] font-semibold leading-relaxed ${
                    forgotStatusMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {forgotStatusMsg.text}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  const downloadsUsed = shop.download_count || 0;
  const maxDownloads = shop.max_downloads || 3;
  const isDownloadLocked = !(shop.download_allowed ?? true) || downloadsUsed >= maxDownloads;
  const currentSelectedFaq = SHOP_ADMIN_FAQS.find((f) => f.id === selectedFaqId) || SHOP_ADMIN_FAQS[0];

  // =========================================================================
  // LOGGED-IN SHOP ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      <header className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-slate-900 text-lg">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="font-black text-white text-base">{shop.name}</h1>
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

      {/* SUPER ADMIN IMPORTANT UPDATE / MESSAGE BANNER */}
      {shop.admin_message && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                Important Notice from RTS Super Admin
              </span>
              <p className="text-xs font-bold text-slate-900 mt-0.5 leading-relaxed">
                {shop.admin_message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TARGETED PARTICULAR SHOP HIDDEN TICKER BOX */}
      {shop.targeted_message && (
        <div className="max-w-6xl mx-auto px-4 pt-3">
          <div className="bg-teal-50 border-2 border-teal-400 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-teal-600 text-white rounded-xl shrink-0 mt-0.5">
                <MessageCircle className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 block">
                  🎯 Special Update / Instruction for {shop.name} (Code: {shop.pairing_code})
                </span>
                <p className="text-xs font-bold text-slate-900 mt-0.5 leading-relaxed">
                  {shop.targeted_message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadShopData}
              className="p-1.5 bg-teal-100 hover:bg-teal-200 text-teal-800 rounded-lg transition shrink-0"
              title="Refresh Notice"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

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
              Enter this permanent 6-digit code in <code>RTS-Print-Setup.exe</code>. Never changes on refresh!
            </p>
          </div>

          {/* WINDOWS PRINT AGENT DOWNLOAD CARD */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                PC Print Agent Software
              </span>
              <span className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full ${
                isDownloadLocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {downloadsUsed} / {maxDownloads} Downloads
              </span>
            </div>

            <button
              type="button"
              onClick={handleDownloadSetup}
              disabled={isDownloadLocked || downloading}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm ${
                isDownloadLocked
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
              }`}
            >
              {isDownloadLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Download Paused ({downloadsUsed}/{maxDownloads} Used)</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloading ? 'Preparing...' : 'Download RTS-Print-Setup.exe'}</span>
                </>
              )}
            </button>

            {isDownloadLocked && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {shop.download_requested ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <p className="text-[11px] font-bold text-amber-900">
                      ⏳ Unlock Request Sent (Shop Code: {shop.pairing_code})
                    </p>
                    <p className="text-[10px] text-amber-700 mt-0.5">
                      Waiting for Super Admin approval to re-enable download.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestDownloadUnlock}
                    disabled={requestingUnlock}
                    className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-[11px] transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3 h-3" />
                    <span>
                      {requestingUnlock
                        ? 'Sending Request...'
                        : `Request Re-Download (Code: ${shop.pairing_code})`}
                    </span>
                  </button>
                )}
              </div>
            )}

            <p className="text-[10px] text-slate-400 leading-tight">
              Maximum {maxDownloads} downloads allowed per shop for security. Request admin unlock if reinstalling on a new PC.
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

              {/* 6-DIGIT ADMIN PIN FIELD (Automatically reflects reset PIN & editable anytime) */}
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
                  Password to log in to this shop admin panel. You can change this anytime and click Save Settings.
                </p>
              </div>

              {/* ALWAYS VISIBLE UPI ID + REGISTERED BANKING NAME */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2.5">
                <div>
                  <label className="block font-bold text-emerald-950 flex items-center gap-1.5 mb-1">
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
                </div>

                <div>
                  <label className="block font-bold text-emerald-950 mb-1">
                    UPI Registered Banking Name (Account Holder Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RAJANEESH T / RTS DIGITAL SEVA"
                    value={upiName}
                    onChange={(e) => setUpiName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-emerald-950 bg-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <p className="text-[10px] text-emerald-700 leading-tight">
                  Customer payments go 100% directly into this UPI ID. Entering your exact bank account holder name prevents UPI name-mismatch warnings.
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

              {/* TARGET COUNTER PRINTER DROPDOWN + CUSTOM INPUT */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-700 mb-1">Target Counter Printer</label>
                <select
                  value={isCustomPrinter ? 'CUSTOM' : targetPrinter}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM') {
                      setIsCustomPrinter(true);
                      setTargetPrinter('');
                    } else {
                      setIsCustomPrinter(false);
                      setTargetPrinter(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none font-bold bg-white"
                >
                  {COMMON_PRINTERS.map((printerName) => (
                    <option key={printerName} value={printerName}>
                      {printerName}
                    </option>
                  ))}
                  <option value="CUSTOM">➕ Other Printer (Type Custom Name)</option>
                </select>

                {isCustomPrinter && (
                  <input
                    type="text"
                    placeholder="Type exact Windows printer name (e.g. Canon LBP2900)"
                    value={targetPrinter}
                    onChange={(e) => setTargetPrinter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-400 bg-emerald-50/30 outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                )}
                <p className="text-[10px] text-slate-400">
                  Select from list or choose "Other Printer" to type your exact Windows printer name.
                </p>
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
                  Live Print Queue
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
              Dynamic Page Rate
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

      {/* ========================================================================= */}
      {/* FLOATING SHOP ADMIN HELP & LIVE SUPPORT WIDGET (12 FAQs + Live Chat Tab)  */}
      {/* ========================================================================= */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
        {supportOpen && (
          <div className="w-[360px] sm:w-[400px] max-w-[calc(100vw-24px)] bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden mb-3 flex flex-col">
            {/* Widget Top Header */}
            <div className="bg-[#0b3b42] text-white px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-black text-emerald-300 text-base">
                  ⚡
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-white leading-tight">
                    RTS Shop Admin Support
                  </h4>
                  <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {shop.name} (Code: {shop.pairing_code})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFaqLang(faqLang === 'en' ? 'ml' : 'en')}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-emerald-200 flex items-center gap-1 border border-white/15"
                >
                  <Languages className="w-3 h-3" />
                  <span>{faqLang === 'en' ? 'മലയാളം' : 'EN'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSupportOpen(false)}
                  className="p-1 text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2 Separate Mode Tabs: [📚 12 Help FAQs] | [💬 Live Chat (Super Admin)] */}
            <div className="grid grid-cols-2 bg-slate-100 p-1 border-b border-slate-200 text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setSupportTab('faq')}
                className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  supportTab === 'faq'
                    ? 'bg-white text-[#0b3b42] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>12 Help FAQs</span>
              </button>
              <button
                type="button"
                onClick={() => setSupportTab('livechat')}
                className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  supportTab === 'livechat'
                    ? 'bg-[#0b5c58] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Live Chat (Super Admin)</span>
              </button>
            </div>

            {/* TAB 1: 12 SHOPKEEPER FAQS */}
            {supportTab === 'faq' ? (
              <div className="p-3.5 max-h-[380px] overflow-y-auto space-y-3 bg-slate-50 text-xs">
                {/* Selected Question & Answer Card */}
                <div className="bg-white border-2 border-emerald-500/40 rounded-2xl p-3.5 shadow-sm space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-emerald-700 block">
                    {faqLang === 'en' ? currentSelectedFaq.qEn : currentSelectedFaq.qMl}
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {faqLang === 'en' ? currentSelectedFaq.aEn : currentSelectedFaq.aMl}
                  </p>
                </div>

                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 pt-1">
                  {faqLang === 'en' ? 'Tap any question below:' : 'ചുവടെയുള്ള ഏത് ചോദ്യവും തിരഞ്ഞെടുക്കാം:'}
                </p>

                {/* All 12 Questions List */}
                <div className="space-y-1.5">
                  {SHOP_ADMIN_FAQS.map((item) => {
                    const isSelected = item.id === selectedFaqId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedFaqId(item.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl font-bold text-[11px] transition border ${
                          isSelected
                            ? 'bg-[#0b5c58] text-white border-[#0b5c58]'
                            : 'bg-white hover:bg-emerald-50 text-slate-800 border-slate-200'
                        }`}
                      >
                        {faqLang === 'en' ? item.qEn : item.qMl}
                      </button>
                    );
                  })}
                </div>

                {/* Direct CTA to switch to Live Chat */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Need direct assistance?</span>
                  <button
                    type="button"
                    onClick={() => setSupportTab('livechat')}
                    className="text-[11px] font-extrabold text-teal-700 hover:underline flex items-center gap-1"
                  >
                    <span>Chat Live with Super Admin →</span>
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 2: LIVE CHAT WITH SUPER ADMIN */
              <div className="flex flex-col">
                <div className="p-3.5 max-h-64 overflow-y-auto space-y-2.5 bg-slate-50 text-xs">
                  {!shopChatSessionId ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                      <p className="font-bold text-slate-800">
                        👋 {faqLang === 'en' ? 'Direct Super Admin Support' : 'സൂപ്പർ അഡ്മിൻ ലൈവ് ചാറ്റ്'}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {faqLang === 'en'
                          ? `Click below to start a live chat for ${shop.name} (Code: ${shop.pairing_code}). Super Admin will be notified immediately.`
                          : `${shop.name} (Code: ${shop.pairing_code}) കടയുടെ പേരിൽ സൂപ്പർ അഡ്മിനുമായി തത്സമയം ചാറ്റ് ചെയ്യാൻ താഴെ ക്ലിക്ക് ചെയ്യുക.`}
                      </p>
                    </div>
                  ) : (
                    shopChatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 max-w-[86%] leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-[#0b5c58] text-white font-semibold'
                              : msg.sender === 'admin'
                              ? 'bg-emerald-50 border-2 border-emerald-400 text-slate-900 font-semibold shadow-sm'
                              : 'bg-white border border-slate-200 text-slate-700 shadow-sm'
                          }`}
                        >
                          {msg.sender === 'admin' && (
                            <span className="text-[9px] font-black uppercase text-emerald-700 block mb-0.5">
                              👨‍💻 RTS Super Admin Reply
                            </span>
                          )}
                          <p className="whitespace-pre-line">{msg.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={shopChatEndRef} />
                </div>

                {!shopChatSessionId ? (
                  <div className="p-3.5 bg-white border-t border-slate-200 space-y-2">
                    <div className="text-[11px] bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-600 space-y-0.5">
                      <div><strong>Shop:</strong> {shop.name} (Code: <code>{shop.pairing_code}</code>)</div>
                      <div><strong>Phone:</strong> {shop.phone || 'N/A'} • <strong>Email:</strong> {shop.owner_email || 'N/A'}</div>
                    </div>
                    <button
                      type="button"
                      disabled={startingShopChat}
                      onClick={handleStartShopLiveChat}
                      className="w-full py-2.5 bg-[#0b4b54] hover:bg-[#093b42] text-white font-extrabold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>
                        {startingShopChat
                          ? 'Connecting to Super Admin...'
                          : 'Start Live Chat with Super Admin →'}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border-t border-slate-200">
                    <form
                      onSubmit={handleSendShopLiveMessage}
                      className="p-2.5 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Type message to Super Admin..."
                        value={shopChatInput}
                        onChange={(e) => setShopChatInput(e.target.value)}
                        className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-full outline-none focus:border-teal-700 text-slate-800"
                      />
                      <button
                        type="submit"
                        disabled={sendingShopChat}
                        className="px-4 py-2 bg-[#0b5c58] hover:bg-teal-700 text-white font-bold text-xs rounded-full transition shrink-0"
                      >
                        Send →
                      </button>
                    </form>
                    <div className="px-3.5 pb-2 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Auto-refreshes after {chatTimeoutMinutes} min</span>
                      <button
                        type="button"
                        onClick={resetShopChatToFresh}
                        className="text-teal-700 hover:underline font-bold"
                      >
                        Reset Chat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Floating Toggle Button at Bottom-Right of Shop Admin */}
        <button
          type="button"
          onClick={() => setSupportOpen(!supportOpen)}
          className="px-4 py-3 rounded-full bg-[#0b5c58] hover:bg-teal-700 text-white font-extrabold text-xs shadow-xl flex items-center gap-2 border border-teal-400/40"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Shop Help & Super Admin Chat</span>
        </button>
      </div>
    </div>
  );
}
