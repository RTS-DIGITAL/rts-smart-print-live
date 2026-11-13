import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Mail, 
  Lock, 
  Languages, 
  Tag, 
  Clock, 
  Store, 
  Cpu, 
  Printer, 
  CreditCard, 
  ArrowRight,
  HardDrive,
  Trash2,
  Sliders,
  Check,
  QrCode,
  Sparkles,
  ServerOff,
  PlayCircle,
  MessageCircle,
  X,
  Send,
  Bell,
  Info,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PlatformPlan {
  id: string;
  plan_slug: string;
  name: string;
  original_price: number;
  offer_price: number;
  billing_period: string;
  trial_days: number;
  badge_text: string;
  features: string[];
  is_active: boolean;
  form_monthly_price?: string;
  form_yearly_price?: string;
  form_trial_days?: string;
  landing_announcement?: string;
}

type TrustModalType = 'privacy' | 'terms' | 'refund' | 'about' | 'contact' | null;

const TEXTS = {
  en: {
    heroBadge: "Automated Cloud Kiosk & Zero-Touch Print Management",
    heroTrustLine: "Customer privacy first. Files are automatically removed on your chosen schedule (1h, 4h, 12h, or 24h).",
    heroTitle: "Transform Your Counter Into an Automated Printing Station",
    heroDesc: "Eliminate WhatsApp file transfers, USB pen drive viruses, and crowded counter queues. Customers scan your counter QR code, upload documents, and pay directly into your UPI with 0% platform commission. Orders print automatically in Auto-Pilot Mode or after shop approval in Manual Mode.",
    applyNowBtn: "Activate Free Trial",
    viewPlansBtn: "View Subscription Plans",
    privacyTitle: "Customer Privacy First",
    privacyDesc: "Encrypted cloud transmission with scheduled auto-purge. Files are deleted automatically from the dashboard and database after 1h, 4h, 12h, or 24h.",
    upiTitle: "Direct Bank UPI Settlement",
    upiDesc: "Customer payments go 100% directly to your Google Pay, PhonePe, or Paytm UPI ID with 0% commission for both UPI and cash modes.",
    safeTitle: "Safe for Shop Workstations",
    safeDesc: "Works with tested printers such as HP, Canon, Epson, and Brother without registry modifications.",
    storageHeadline: "Customer Privacy First. Scheduled File Deletion Control.",
    storageSub: "Designed for photocopy, DTP, and citizen service counters with automatic cloud queue cleanup.",
    storageP1Title: "Streamlined Cloud Queue",
    storageP1Desc: "Uploaded documents are processed securely and removed from the dashboard and database according to your shop's retention schedule.",
    storageP2Title: "You Control the Timer",
    storageP2Desc: "Shop Admins can customize the file retention schedule. Choose exactly when files are removed: 1 hour, 4 hours, 12 hours, or 24 hours.",
    storageP3Title: "Automatic Purge Engine",
    storageP3Desc: "Once the timer ends, documents are removed from both the dashboard and database automatically.",
    videoBadge: "Live Video Demo",
    videoTitle: "Watch How RTS Smart Print Works in Action",
    videoSub: "See how easily customers can scan the counter QR code, upload files, and print.",
    plansTitle: "Transparent & Fair Pricing",
    plansSubtitle: "Simple subscription plans for your print counter",
    trialBadge: "Free Trial Available",
    priceNote: "Prices are shown in Indian Rupees (₹).",
    formTitle: "Get RTS Smart Print for Your Shop",
    formSubtitle: "Fill out this short form to register your shop counter.",
    businessNameLabel: "Shop / Business Name *",
    ownerNameLabel: "Owner Name *",
    whatsappLabel: "WhatsApp Number *",
    emailLabel: "Email Address *",
    cityLabel: "City / Taluk (Kerala) *",
    planLabel: "Selected Subscription Plan",
    printerLabel: "Counter Printer Model",
    btnSubmit: "Request Counter Activation",
    btnSubmitting: "Submitting Details...",
    successTitle: "Registration Received Successfully!",
    successDesc: "Thank you! Our support team at RTS Reliable Technology Services will contact you with your pairing code and setup details.",
    formPrivacyNote: "Your details are used only to contact you about RTS Smart Print.",
    supportSectionTitle: "RTS Smart Print Support",
    supportSectionDesc: "Developed and operated by RTS Reliable Technology Services, Kerala, India.",
    contactSupportBtn: "Contact RTS Support"
  },
  ml: {
    heroBadge: "ഓട്ടോമേറ്റഡ് ക്ലൗഡ് കിയോസ്ക് & പ്രിന്റ് മാനേജ്‌മെന്റ് സിസ്റ്റം",
    heroTrustLine: "ഉപഭോക്തൃ സ്വകാര്യതയ്ക്ക് മുൻഗണന. നിങ്ങൾ തിരഞ്ഞെടുക്കുന്ന സമയക്രമത്തിൽ (1h, 4h, 12h, 24h) ഫയലുകൾ തനിയെ നീക്കം ചെയ്യപ്പെടും.",
    heroTitle: "നിങ്ങളുടെ കൗണ്ടർ ഇനി ഒരു ഓട്ടോമേറ്റഡ് സ്മാർട്ട് പ്രിന്റിംഗ് സ്റ്റേഷനാക്കാം!",
    heroDesc: "കടകളിലെ നീണ്ട ക്യൂ, പെൻഡ്രൈവ് കുത്തൽ, വാട്സാപ്പിൽ ഫയലുകൾ ചോദിച്ചു വാങ്ങൽ എന്നിവ ഒഴിവാക്കൂ. കസ്റ്റമർ കൗണ്ടറിലെ ക്യുആർ കോഡ് സ്കാൻ ചെയ്ത് ഫയലുകൾ അപ്‌ലോഡ് ചെയ്യുമ്പോൾ 0% കമ്മീഷനിൽ പണം നേരിട്ട് നിങ്ങളുടെ UPI-ലേക്ക് എത്തുന്നു. Auto-Pilot Mode-ൽ പേയ്‌മെന്റ് കൺഫേം ആയാൽ ഉടൻ പ്രിന്റ് ആകുന്നു, അല്ലെങ്കിൽ Manual Mode-ൽ കടയുടമ അപ്രൂവ് ചെയ്ത ശേഷം പ്രിന്റ് ആകുന്നു.",
    applyNowBtn: "സൗജന്യ ട്രയൽ ആരംഭിക്കൂ",
    viewPlansBtn: "പ്ലാനുകൾ കാണുക",
    privacyTitle: "ഉപഭോക്തൃ സ്വകാര്യതയ്ക്ക് മുൻഗണന (Customer Privacy First)",
    privacyDesc: "പ്രിന്റിംഗിന് ശേഷം കടയുടമ തിരഞ്ഞെടുക്കുന്ന സമയത്തിനുള്ളിൽ (1h, 4h, 12h, 24h) ഫയലുകൾ dashboard-ൽ നിന്നും database-ൽ നിന്നും നീക്കം ചെയ്യപ്പെടും.",
    upiTitle: "നേരിട്ടുള്ള UPI പേയ്‌മെന്റ് (0% കമ്മീഷൻ)",
    upiDesc: "പണം ഇടനിലക്കാരില്ലാതെ നിങ്ങളുടെ Google Pay, PhonePe, Paytm എന്നിവയിലേക്ക് നേരിട്ടെത്തുന്നു. യാതൊരു കമ്മീഷനും ഇല്ല.",
    safeTitle: "പരീക്ഷിച്ചുറപ്പിച്ച പ്രിന്ററുകളിൽ പ്രവർത്തിക്കുന്നു",
    safeDesc: "പരീക്ഷിച്ചുറപ്പിച്ച HP, Canon, Epson, Brother തുടങ്ങിയ പ്രിന്ററുകളിൽ സുഗമമായി പ്രവർത്തിക്കുന്നു (Works with tested printers).",
    storageHeadline: "ഉപഭോക്തൃ സ്വകാര്യതയ്ക്ക് മുൻഗണന. ഓട്ടോമാറ്റിക് ഫയൽ ഡിലീറ്റ് സംവിധാനം.",
    storageSub: "ഫോട്ടോകോപ്പി, DTP, ഡിജിറ്റൽ സർവീസ് കൗണ്ടറുകൾക്കായി രൂപകൽപ്പന ചെയ്ത സുരക്ഷിത ക്ലൗഡ് പ്രിന്റിംഗ് സംവിധാനം.",
    storageP1Title: "സുരക്ഷിതമായ ഫയൽ പ്രോസസ്സിംഗ്",
    storageP1Desc: "അപ്‌ലോഡ് ചെയ്യുന്ന ഓരോ ഡോക്യുമെന്റും പ്രിന്റിംഗിന് ശേഷം നിശ്ചിത സമയത്ത് dashboard-ൽ നിന്നും database-ൽ നിന്നും നീക്കം ചെയ്യപ്പെടുന്നു.",
    storageP2Title: "സമയം നിങ്ങളുടെ നിയന്ത്രണത്തിൽ",
    storageP2Desc: "ഉപഭോക്താവിന്റെ ഫയലുകൾ എത്ര നേരം സൂക്ഷിക്കണമെന്ന് നിങ്ങൾക്ക് തിരഞ്ഞെടുക്കാം: 1 മണിക്കൂർ, 4 മണിക്കൂർ, 12 മണിക്കൂർ, അല്ലെങ്കിൽ 24 മണിക്കൂർ.",
    storageP3Title: "ഓട്ടോമാറ്റിക് ഡിലീറ്റ് സംവിധാനം",
    storageP3Desc: "നിശ്ചയിച്ച സമയം കഴിഞ്ഞാൽ dashboard-ൽ നിന്നും database-ൽ നിന്നും ഫയലുകൾ തനിയെ നീക്കം ചെയ്യപ്പെടും.",
    videoBadge: "തത്സമയ വീഡിയോ ഡെമോ",
    videoTitle: "നിങ്ങളുടെ പ്രിന്റിംഗ് കട ഇനി SMART ആക്കാം! 🚀",
    videoSub: "QR കോഡ് സ്കാൻ ചെയ്ത് എളുപ്പത്തിൽ പ്രിന്റ് എടുക്കുന്നതെങ്ങനെയെന്ന് കാണാം.",
    plansTitle: "ലളിതമായ സബ്‌സ്‌ക്രിപ്ഷൻ പ്ലാനുകൾ",
    plansSubtitle: "കൗണ്ടറുകൾക്കായുള്ള സുതാര്യമായ നിരക്കുകൾ",
    trialBadge: "സൗജന്യ ട്രയൽ ലഭ്യമാണ്",
    priceNote: "നിരക്കുകൾ ഇന്ത്യൻ രൂപയിലാണ് (₹) നൽകിയിരിക്കുന്നത്.",
    formTitle: "നിങ്ങളുടെ കടയിൽ RTS Smart Print തുടങ്ങാം",
    formSubtitle: "നിങ്ങളുടെ സ്ഥാപനത്തിന്റെ വിവരങ്ങൾ താഴെ നൽകുക.",
    businessNameLabel: "സ്ഥാപനത്തിന്റെ പേര് *",
    ownerNameLabel: "ഉടമയുടെ പേര് *",
    whatsappLabel: "വാട്സാപ്പ് നമ്പർ *",
    emailLabel: "ഇമെയിൽ വിലാസം *",
    cityLabel: "സ്ഥലം / താലൂക്ക് *",
    planLabel: "പ്ലാൻ തിരഞ്ഞെടുക്കുക",
    printerLabel: "പ്രിന്റർ മോഡൽ",
    btnSubmit: "ഷോപ്പ് രജിസ്റ്റർ ചെയ്യുക",
    btnSubmitting: "വിവരങ്ങൾ സമർപ്പിക്കുന്നു...",
    successTitle: "രജിസ്ട്രേഷൻ വിജയകരമായി ലഭിച്ചു!",
    successDesc: "നന്ദി! RTS Reliable Technology Services സപ്പോർട്ട് വിഭാഗം നിങ്ങളെ ബന്ധപ്പെട്ട് ഇൻസ്റ്റാളേഷൻ വിവരങ്ങൾ നൽകുന്നതാണ്.",
    formPrivacyNote: "നിങ്ങളുടെ വിവരങ്ങൾ RTS Smart Print സേവനവുമായി ബന്ധപ്പെടാൻ മാത്രമാണ് ഉപയോഗിക്കുന്നത്.",
    supportSectionTitle: "RTS Smart Print സപ്പോർട്ട്",
    supportSectionDesc: "RTS Reliable Technology Services (കേരള, ഇന്ത്യ) വികസിപ്പിച്ച് പ്രവർത്തിപ്പിക്കുന്ന സംവിധാനം.",
    contactSupportBtn: "Contact RTS Support"
  }
};

interface ChatMsg {
  sender: 'bot' | 'user';
  text: string;
  showSupportBtn?: boolean;
}

const CHAT_FAQS = [
  {
    id: 'what',
    label: '🖨️ What RTS Smart Print does',
    question: 'What does RTS Smart Print do?',
    answer: 'RTS Smart Print, a product of RTS Reliable Technology Services, is a QR-based print kiosk system for shops. Customers scan your counter QR code, upload documents, and pay via UPI or cash with 0% commission. Orders print automatically in Auto-Pilot Mode or after your approval in Manual Mode.'
  },
  {
    id: 'order',
    label: '📱 How a customer orders',
    question: 'How does a customer place a print order?',
    answer: '1. Scan the shop counter QR code.\n2. Upload PDF/image files & choose B&W or Color and copies.\n3. Pay directly via UPI or select Cash at Counter.\n4. Order appears on the shop PC and prints via Auto-Pilot Mode or Manual Mode.'
  },
  {
    id: 'pricing',
    label: '💰 How pricing works',
    question: 'How does pricing work?',
    answer: 'The confirmed Starter Station plan is ₹199/month. All prices are in Indian Rupees (₹), and shops receive 100% of customer payments with 0% platform commission.'
  },
  {
    id: 'files',
    label: '⏱️ How long files are kept (1, 4, 12, 24h)',
    question: 'How long are customer files kept?',
    answer: 'Customer privacy first: files are deleted automatically from the dashboard and database after the time the shop chooses — 1 hour, 4 hours, 12 hours, or 24 hours.'
  },
  {
    id: 'trial',
    label: '🚀 How to start a trial or sign up',
    question: 'How do I start a trial or sign up?',
    answer: 'Simply fill out the short registration form on this page with your shop name, contact details, and printer model to register your counter.'
  },
  {
    id: 'support',
    label: '✉️ How to contact RTS Support',
    question: 'How can I contact RTS Support?',
    answer: 'You can reach RTS Reliable Technology Services (Kerala, India) by emailing info@rtsdigitalseva.online or clicking the "Contact RTS Support" button below.',
    showSupportBtn: true
  }
];

export const BusinessLandingPage: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'ml'>('ml');
  const t = TEXTS[lang];

  const [dbPlans, setDbPlans] = useState<PlatformPlan[]>([]);
  const [announcement, setAnnouncement] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<TrustModalType>(null);

  // Chat Widget State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      sender: 'bot',
      text: '👋 Welcome to RTS Smart Print! നമസ്കാരം! Tap a question below or type a message:'
    }
  ]);

  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    city: '',
    selectedPlan: 'starter_monthly',
    printerModel: '',
    message: ''
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    async function loadPlansAndAnnouncement() {
      try {
        // 1. Load Plans
        const { data, error } = await supabase
          .from('platform_plans')
          .select('*')
          .eq('is_active', true)
          .order('offer_price', { ascending: true });

        if (!error && data && data.length > 0) {
          setDbPlans(data as PlatformPlan[]);
          const firstWithMsg = data.find((p: any) => p.landing_announcement && p.landing_announcement.trim() !== '');
          if (firstWithMsg?.landing_announcement) {
            setAnnouncement(firstWithMsg.landing_announcement);
          }
        }

        // 2. Also check optional site_settings table if present (non-breaking fallback)
        const { data: settingsData } = await supabase
          .from('site_settings')
          .select('landing_announcement')
          .eq('id', 1)
          .maybeSingle();

        if (settingsData?.landing_announcement) {
          setAnnouncement(settingsData.landing_announcement);
        }
      } catch (err) {
        console.error('Failed to load dynamic plans or announcement:', err);
      }
    }
    loadPlansAndAnnouncement();

    // Realtime subscription for Super Admin landing page message box
    const channel = supabase
      .channel('public-landing-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_plans' }, () => {
        loadPlansAndAnnouncement();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
        loadPlansAndAnnouncement();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await supabase.from('shop_inquiries').insert([
        {
          business_name: formData.businessName,
          owner_name: formData.ownerName,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          selected_plan: formData.selectedPlan,
          printer_model: formData.printerModel,
          message: formData.message,
        }
      ]);

      await fetch('https://script.google.com/macros/s/AKfycbytAx6dxUypNjcrwCHWh537MguDjcvVYqdduYfe4k9_d3-x_HW8xPwc3vxt2NxTpNs/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          ownerName: formData.ownerName,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          selectedPlan: formData.selectedPlan,
          printerModel: formData.printerModel
        })
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      alert('Error submitting inquiry. Please contact RTS Support at info@rtsdigitalseva.online.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById('inquiry-form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPricing = () => {
    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToSupport = () => {
    document.getElementById('support-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFaqClick = (faq: typeof CHAT_FAQS[0]) => {
    setChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: faq.question },
      { sender: 'bot', text: faq.answer, showSupportBtn: faq.showSupportBtn }
    ]);
  };

  const handleChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    let matchedFaq = CHAT_FAQS.find(
      (f) =>
        (lower.includes('price') || lower.includes('cost') || lower.includes('199') || lower.includes('plan')) && f.id === 'pricing' ||
        (lower.includes('delete') || lower.includes('file') || lower.includes('storage') || lower.includes('hour') || lower.includes('privacy')) && f.id === 'files' ||
        (lower.includes('order') || lower.includes('how to print') || lower.includes('customer')) && f.id === 'order' ||
        (lower.includes('trial') || lower.includes('sign up') || lower.includes('register') || lower.includes('join')) && f.id === 'trial' ||
        (lower.includes('contact') || lower.includes('support') || lower.includes('email') || lower.includes('help')) && f.id === 'support' ||
        (lower.includes('what is') || lower.includes('smart print')) && f.id === 'what'
    );

    if (matchedFaq) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'user', text: trimmed },
        { sender: 'bot', text: matchedFaq!.answer, showSupportBtn: matchedFaq!.showSupportBtn }
      ]);
    } else {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'user', text: trimmed },
        {
          sender: 'bot',
          text: 'Thank you for your message. RTS Support will reply to your inquiry. Please use the "Contact RTS Support" option below or email info@rtsdigitalseva.online.',
          showSupportBtn: true
        }
      ]);
    }
    setChatInput('');
  };

  const firstPlan = dbPlans[0];
  const customMonthly = firstPlan?.form_monthly_price || '199';
  const customTrialDays = firstPlan?.form_trial_days || String(firstPlan?.trial_days || 7);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      {/* Top Navigation */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 py-3.5 px-4 sm:px-6 flex justify-between items-center sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-emerald-500/20 shrink-0">
            ⚡
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm sm:text-base leading-tight tracking-tight">RTS Smart Print</h1>
            <p className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
              RTS Reliable Technology Services
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setLang(lang === 'en' ? 'ml' : 'en')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 transition"
            aria-label="Switch Language"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'en' ? 'മലയാളം' : 'English'}</span>
          </button>
          
          <button
            onClick={scrollToForm}
            className="text-xs font-black px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <span>{t.applyNowBtn}</span>
            <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
          </button>
        </div>
      </header>

      {/* SUPER ADMIN LIVE OFFERS & UPDATES MESSAGE BOX */}
      {announcement && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/40 rounded-2xl px-4 py-3 flex items-center justify-center gap-2.5 shadow-lg">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </span>
            <p className="text-xs sm:text-sm font-bold text-emerald-200 text-center leading-snug">
              {announcement}
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-10 sm:pt-20 sm:pb-14 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-slate-950 -z-10" />
        
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Dual Badge & Trust Line */}
          <div className="inline-flex flex-col items-center gap-2">
            <span className="px-3.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{t.heroBadge}</span>
            </span>
            <span className="text-[11px] font-medium text-slate-400 flex flex-wrap items-center justify-center gap-1 px-2">
              <HardDrive className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{t.heroTrustLine}</span>
              <button
                type="button"
                onClick={() => setActiveModal('privacy')}
                className="text-emerald-400 underline hover:text-emerald-300 font-semibold ml-1"
              >
                Privacy Policy
              </button>
            </span>
          </div>

          <h2 className="text-2xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.2]">
            {t.heroTitle}
          </h2>

          <p className="text-slate-400 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed">
            {t.heroDesc}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={scrollToForm}
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-900/30 transition transform hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <span>{t.applyNowBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={scrollToPricing}
              className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs sm:text-sm rounded-2xl border border-slate-800 transition"
            >
              {t.viewPlansBtn}
            </button>
          </div>

          {/* Quick Stats Strip */}
          <div className="pt-8 grid grid-cols-3 gap-2 sm:gap-4 max-w-xl mx-auto border-t border-slate-800/80">
            <div>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">0%</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Commission</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white font-mono">100%</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Direct UPI</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-teal-400 font-mono">1h–24h</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Auto-Delete Timer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Highlights */}
      <section className="max-w-5xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-2.5 shadow-md hover:border-slate-700 transition">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold border border-emerald-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">{t.privacyTitle}</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            {t.privacyDesc}{' '}
            <button
              type="button"
              onClick={() => setActiveModal('privacy')}
              className="text-emerald-400 underline hover:text-emerald-300 font-semibold"
            >
              Privacy Policy
            </button>
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-2.5 shadow-md hover:border-slate-700 transition">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold border border-emerald-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">{t.upiTitle}</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">{t.upiDesc}</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-2.5 shadow-md hover:border-slate-700 transition">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">{t.safeTitle}</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">{t.safeDesc}</p>
        </div>
      </section>

      {/* Dedicated Section: Customer Privacy & File Deletion Schedule */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 p-6 sm:p-10 rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mb-2">
                Customer Privacy First
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {t.storageHeadline}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {t.storageSub}{' '}
                <button
                  type="button"
                  onClick={() => setActiveModal('privacy')}
                  className="text-emerald-400 underline hover:text-emerald-300 font-semibold"
                >
                  Read Privacy Policy
                </button>
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/20">
              <ServerOff className="w-6 h-6" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Point 1 */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <HardDrive className="w-4 h-4" />
                <h4>{t.storageP1Title}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.storageP1Desc}
              </p>
            </div>

            {/* Point 2 */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <Sliders className="w-4 h-4" />
                <h4>{t.storageP2Title}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.storageP2Desc}
              </p>
              <div className="flex gap-1.5 pt-1">
                {['1h', '4h', '12h', '24h'].map((time) => (
                  <span key={time} className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-teal-300">
                    {time}
                  </span>
                ))}
              </div>
            </div>

            {/* Point 3 */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Trash2 className="w-4 h-4" />
                <h4>{t.storageP3Title}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.storageP3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual 5-Step Process + Video Demo Above */}
      <section className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        {/* YOUTUBE DEMO VIDEO SHOWCASE CARD (Positioned above Step-By-Step Workflow) */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
          <div className="grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-4 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <PlayCircle className="w-3.5 h-3.5" />
                {t.videoBadge}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {t.videoTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {t.videoSub}
              </p>
              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-2.5 text-xs text-slate-300">
                <span className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" /> Print Standee
                </span>
                <span className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Direct UPI
                </span>
                <span className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-emerald-400" /> Auto-Pilot Mode / Manual Mode
                </span>
              </div>
            </div>

            <div className="md:col-span-5 flex justify-center">
              <div className="w-full max-w-[300px] aspect-[9/16] rounded-3xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl shadow-emerald-950/50 bg-slate-950">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/kr7fXGDH_wk"
                  title="നിങ്ങളുടെ പ്രിന്റിംഗ് കട ഇനി SMART ആക്കാം! 🚀 | RTS Smart Print"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>

        {/* 1. How RTS Smart Print Works (5-Step Cards with Readable Mobile Text) */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-md">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Step-By-Step Workflow</span>
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
              <Cpu className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>{lang === 'en' ? "1. How RTS Smart Print Works at Your Shop" : "1. RTS Smart Print എങ്ങനെ പ്രവർത്തിക്കുന്നു?"}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              {lang === 'en' 
                ? "A seamless end-to-end cloud spooler that routes mobile customer prints straight to your shop counter."
                : "കടകളിൽ വരുന്ന പ്രിന്റിംഗ് ഓർഡറുകൾ മൊബൈൽ വഴി സ്വീകരിക്കാനും, കമ്പ്യൂട്ടർ ഉപയോഗിച്ച് പ്രിന്റ് ചെയ്യാനും സഹായിക്കുന്ന സ്മാർട്ട് പ്രിന്റിംഗ് സംവിധാനം."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-full h-36 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step1_scan_qr_code.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-xs font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                  {lang === 'en' ? "Step 1" : "ഘട്ടം 1"}
                </span>
                <h4 className="font-bold text-base text-white mt-2">
                  {lang === 'en' ? "Customer Scans Print Standee QR" : "QR Code സ്കാൻ ചെയ്യുക"}
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  {lang === 'en' 
                    ? "Customer scans your counter Print Standee using their phone camera to open your shop kiosk page."
                    : "കടയിൽ സ്ഥാപിക്കുന്ന Print Standee-യിലെ QR Code ഉപഭോക്താവ് മൊബൈൽ ക്യാമറ ഉപയോഗിച്ച് സ്കാൻ ചെയ്യുന്നു."}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-full h-36 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step2_upload_file.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-xs font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                  {lang === 'en' ? "Step 2" : "ഘട്ടം 2"}
                </span>
                <h4 className="font-bold text-base text-white mt-2">
                  {lang === 'en' ? "Upload & Select Options" : "ഫയൽ അപ്‌ലോഡ് ചെയ്യുക"}
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  {lang === 'en' 
                    ? "Upload PDF or image files. Choose copies, paper size, and Black & White or Color based on your Dynamic Page Rate."
                    : "PDF അല്ലെങ്കിൽ ചിത്രങ്ങൾ അപ്‌ലോഡ് ചെയ്യാം. കോപ്പികളുടെ എണ്ണം, കളർ അല്ലെങ്കിൽ ബ്ലാക്ക് ആൻഡ് വൈറ്റ് എന്നിവ തിരഞ്ഞെടുക്കാം."}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-full h-36 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step3_pay_amount.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-xs font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                  {lang === 'en' ? "Step 3" : "ഘട്ടം 3"}
                </span>
                <h4 className="font-bold text-base text-white mt-2">
                  {lang === 'en' ? "Direct UPI or Cash Choice" : "തുകയും പേയ്‌മെന്റും"}
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  {lang === 'en' 
                    ? "The calculated amount is shown clearly. Customer pays directly via UPI QR (0% commission) or opts for cash at the counter."
                    : "തിരഞ്ഞെടുത്ത ഓപ്ഷനുകൾ അനുസരിച്ച് തുക കാണിക്കും. കടയിൽ ലഭ്യമായ Cash/UPI പേയ്‌മെന്റ് രീതികൾ (0% കമ്മീഷൻ) ഉപയോഗിക്കാം."}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-full h-36 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step4_order_received.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-xs font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                  {lang === 'en' ? "Step 4" : "ഘട്ടം 4"}
                </span>
                <h4 className="font-bold text-base text-white mt-2">
                  {lang === 'en' ? "Order Lands in Live Print Queue" : "ഓർഡർ Live Print Queue-ൽ എത്തുന്നു"}
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  {lang === 'en' 
                    ? "Incoming job appears in real-time inside your Live Print Queue and Windows Print Agent with full order details."
                    : "ഓർഡർ നിങ്ങളുടെ കമ്പ്യൂട്ടറിലെ RTS Smart Print Agent-ലും Live Print Queue-ലും തൽക്ഷണം ലഭിക്കുന്നു."}
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
              <div>
                <div className="w-full h-36 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step5_auto_print.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-xs font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                  {lang === 'en' ? "Step 5" : "ഘട്ടം 5"}
                </span>
                <h4 className="font-bold text-base text-white mt-2">
                  {lang === 'en' ? "Auto-Pilot Mode or Manual Mode" : "Auto-Pilot Mode അല്ലെങ്കിൽ Manual Mode"}
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                  {lang === 'en' 
                    ? "Auto-Pilot Mode: prints automatically after payment is confirmed. Manual Mode: prints after the shop approves each order."
                    : "Auto-Pilot Mode: പേയ്‌മെന്റ് ഉറപ്പാക്കിയ ശേഷം തനിയെ പ്രിന്റ് ആകുന്നു. Manual Mode: കടയുടമ ഓരോ ഓർഡറും അപ്രൂവ് ചെയ്ത ശേഷം പ്രിന്റ് ആകുന്നു."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Facilities for Shop Owners (Consistent Product Terms) */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4 shadow-md">
          <h3 className="text-xl sm:text-2xl font-black text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-400 shrink-0" />
            <span>{lang === 'en' ? "2. Confirmed Counter Features" : "2. കൗണ്ടറുകൾക്ക് ലഭിക്കുന്ന സൗകര്യങ്ങൾ"}</span>
          </h3>
          <ul className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-300">
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>{lang === 'en' ? "Print Standee generator with shop QR code and optional access PIN." : "Print Standee – QR കോഡും സുരക്ഷാ PIN-ഉം ഉൾപ്പെടുന്ന കൗണ്ടർ സ്റ്റാൻഡി."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>{lang === 'en' ? "Counter Configuration panel to manage UPI ID, printer selection, and PIN." : "Counter Configuration – പ്രിന്ററും UPI വിവരങ്ങളും ക്രമീകരിക്കാനുള്ള പാനൽ."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>{lang === 'en' ? "Dynamic Page Rate settings for B&W, Color, Single-sided, and Double-sided." : "Dynamic Page Rate – ബ്ലാക്ക് & വൈറ്റ്, കളർ നിരക്കുകൾ ക്രമീകരിക്കാം."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>{lang === 'en' ? "Live Print Queue for real-time order tracking and counter release." : "Live Print Queue – തത്സമയം ഓർഡറുകൾ കാണാനും നിയന്ത്രിക്കാനുമുള്ള സൗകര്യം."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>{lang === 'en' ? "Auto-Pilot Mode (prints after payment confirmation) & Manual Mode (prints after shop approval)." : "Auto-Pilot Mode & Manual Mode പ്രിന്റിംഗ് ഓപ്ഷനുകൾ."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>{lang === 'en' ? "Scheduled file deletion from dashboard and database (1h, 4h, 12h, or 24h)." : "1h, 4h, 12h, 24h സമയക്രമത്തിൽ ഫയലുകൾ dashboard-ൽ നിന്നും database-ൽ നിന്നും നീക്കം ചെയ്യപ്പെടുന്നു."}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Subscription Pricing Cards (No Strikethrough Prices, Confirmed ₹199/mo Starter Station) */}
      <section className="max-w-4xl mx-auto px-4 py-8" id="pricing-section">
        <div className="text-center mb-8 space-y-1.5">
          <span className="text-[11px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full inline-flex items-center gap-1">
            <Tag className="w-3 h-3" /> {t.trialBadge}
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-white">{t.plansTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-400">{t.plansSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {dbPlans.length > 0 ? (
            dbPlans.map((plan) => {
              const isPro = plan.plan_slug.includes('pro');

              return (
                <div 
                  key={plan.id}
                  className={`bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xl relative flex flex-col justify-between ${
                    isPro ? 'border border-slate-800 opacity-90' : 'border-2 border-emerald-500/80 shadow-emerald-950/30'
                  }`}
                >
                  {isPro ? (
                    <span className="absolute top-4 right-4 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                      Coming Soon
                    </span>
                  ) : (
                    <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                      {plan.badge_text || 'Starter Station'}
                    </span>
                  )}

                  <div>
                    <h4 className="font-extrabold text-xl text-white">{plan.name}</h4>
                    <div className="mt-3 mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white font-mono">₹{plan.offer_price}</span>
                        <span className="text-xs text-slate-400 capitalize">/{plan.billing_period}</span>
                      </div>
                      {!isPro && (
                        <p className="text-xs text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {plan.trial_days}-Day Free Trial Included
                        </p>
                      )}
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300">
                      {plan.features && Array.isArray(plan.features) ? (
                        plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Check className={`w-4 h-4 flex-shrink-0 ${isPro ? 'text-slate-500' : 'text-emerald-400'}`} />
                            <span>{feat}</span>
                          </li>
                        ))
                      ) : (
                        <>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Counter Configuration & Print Standee</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Auto-Pilot Mode & Manual Mode</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 0% Commission Direct UPI & Cash Support</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Auto-Delete Timer (1h, 4h, 12h, 24h)</li>
                        </>
                      )}
                    </ul>
                  </div>

                  {isPro ? (
                    <button
                      type="button"
                      disabled
                      className="mt-6 w-full py-2.5 bg-slate-800 text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed border border-slate-700"
                    >
                      Coming Soon
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, selectedPlan: plan.plan_slug }));
                        scrollToForm();
                      }}
                      className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition shadow-md"
                    >
                      Select {plan.name}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <>
              {/* Confirmed Fallback: Starter Station ₹199/month */}
              <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between relative">
                <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                  Popular Choice
                </span>
                <div>
                  <h4 className="font-extrabold text-xl text-white">Starter Station</h4>
                  <div className="mt-3 mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white font-mono">₹199</span>
                      <span className="text-xs text-slate-400">/month</span>
                    </div>
                    <p className="text-xs text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      7-Day Free Trial Included
                    </p>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Counter Configuration & Print Standee</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Live Print Queue & Windows Print Agent</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Auto-Pilot Mode & Manual Mode</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 1h, 4h, 12h, 24h File Auto-Deletion</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, selectedPlan: 'starter_monthly' }));
                    scrollToForm();
                  }}
                  className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition shadow-md"
                >
                  Select Starter Station
                </button>
              </div>

              {/* Pro Plan Card (Coming Soon, No Free Trial Line, Disabled Button) */}
              <div className="bg-slate-900 border border-slate-800 opacity-90 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between relative">
                <span classനിങ്ങളുടെ **`BusinessLandingPage.tsx`** കോഡിൽ നിലവിലുള്ള ഒരു ഫംഗ്ഷനുകൾക്കും ഡാറ്റാബേസ് ലോജിക്കിനും മാറ്റം വരുത്താതെ, നമ്മൾ ചർച്ച ചെയ്ത് ഉറപ്പിച്ച **എല്ലാ 16 നിർദ്ദേശങ്ങളും** കൃത്യമായി ഉൾപ്പെടുത്തിയിട്ടുണ്ട്:

1. **Super Admin Dynamic Offer & Update Banner:** മുകളിലായി ഹീറോ സെക്ഷന് തൊട്ടുമുൻപ് സൂപ്പർ അഡ്മിൻ പാനലിൽ നിന്ന് അയക്കുന്ന ഓഫറുകളും അറിയിപ്പുകളും തത്സമയം കാണിക്കുന്ന മനോഹരമായ മെസ്സേജ് ബോക്സ് ചേർത്തു[cite: 9].
2. **Interactive Support Chat Bot ("💬 Help & Offers Chat"):** നിങ്ങൾ നൽകിയ ചിത്രത്തിലെ അതേ പ്രൊഫഷണൽ ഡിസൈനിൽ[cite: 10], തിരഞ്ഞെടുത്ത ചോദ്യങ്ങളും (What RTS Smart Print does, How a customer orders, Pricing, File Deletion 1h/4h/12h/24h, Printing Modes, Free Trial, Contact Support) തത്സമയ മറുപടികളും അടങ്ങിയ ചാറ്റ് വിഡ്ജറ്റ് താഴെ വലതുവശത്തായി ചേർത്തു.
3. **Approved Branding, Privacy & Print Mode Wording:** *"RTS Smart Print, a product of RTS Reliable Technology Services"*, *"Customer privacy first"*, *"removed from the dashboard and database"*, Auto-Pilot & Manual Mode വിവരണങ്ങൾ, ₹199/month Starter Station പ്രൈസിങ് (സ്ട്രൈക്ക്-ത്രൂ ഒഴിവാക്കി), കൂടാതെ **Privacy Policy, Terms, Refund Policy, About Us (with UK `rtsprint.co.uk` disclaimer), Contact Support** എന്നിവയ്ക്കുള്ള പോപ്പ്-അപ്പ് മോഡലുകളും ഫൂട്ടറും കൃത്യമായി ചേർത്തു.

---

### Complete Updated `BusinessLandingPage.tsx` (Copy & Paste All)

```tsx
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Mail, 
  Lock, 
  Languages, 
  Tag, 
  Clock, 
  Store, 
  Cpu, 
  Printer, 
  CreditCard, 
  ArrowRight,
  HardDrive,
  Trash2,
  Sliders,
  Check,
  QrCode,
  Sparkles,
  ServerOff,
  PlayCircle,
  MessageCircle,
  X,
  Send,
  Bell,
  Info,
  FileText,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PlatformPlan {
  id: string;
  plan_slug: string;
  name: string;
  original_price: number;
  offer_price: number;
  billing_period: string;
  trial_days: number;
  badge_text: string;
  features: string[];
  is_active: boolean;
  form_monthly_price?: string;
  form_yearly_price?: string;
  form_trial_days?: string;
  landing_announcement?: string | null;
}

type LegalModalType = 'privacy' | 'terms' | 'refund' | 'about' | 'contact' | null;

const TEXTS = {
  en: {
    heroBadge: "Automated Cloud Kiosk & Print Management",
    heroTrustLine: "Customer privacy first. Files are deleted automatically on your shop's schedule.",
    heroTitle: "Transform Your Counter Into a Smart Printing Station",
    heroDesc: "Eliminate WhatsApp file transfers, USB pen drive risks, and crowded counter queues. Customers scan your counter QR code, upload documents, and pay directly into your UPI with 0% commission. Print automatically in Auto-Pilot Mode or after your approval in Manual Mode.",
    applyNowBtn: "Activate Free Trial",
    viewPlansBtn: "View Subscription Plans",
    privacyTitle: "Customer Privacy First",
    privacyDesc: "Encrypted cloud transmission with scheduled auto-delete. Files are removed from the dashboard and database after 1h, 4h, 12h, or 24h.",
    privacyLinkText: "Read Privacy Policy →",
    upiTitle: "Direct Bank UPI Settlement",
    upiDesc: "Customer payments go 100% directly to your Google Pay, PhonePe, or Paytm UPI ID with 0% platform commission for both UPI and cash modes.",
    safeTitle: "Works With Tested Printers",
    safeDesc: "Works with tested printers such as HP, Canon, Epson, and Brother via our lightweight Windows print agent.",
    storageHeadline: "Customer Privacy First. Automated Cloud File Deletion.",
    storageSub: "Designed for photocopy, DTP, and citizen service counters with configurable retention timers.",
    storageP1Title: "Streamlined Cloud Queue",
    storageP1Desc: "Uploaded documents are processed through an encrypted cloud queue and routed to your counter workstation.",
    storageP2Title: "You Control the Timer",
    storageP2Desc: "Shop Admins can customize how long files are kept. Choose exactly when files are deleted: 1 hour, 4 hours, 12 hours, or 24 hours.",
    storageP3Title: "Dashboard & Database Removal",
    storageP3Desc: "Once the timer ends, documents are automatically removed from both the dashboard and database.",
    videoBadge: "Live Video Demo",
    videoTitle: "Watch How RTS Smart Print Works in Action",
    videoSub: "See how easily customers can scan the counter QR code, upload files, and print at your counter.",
    plansTitle: "Transparent & Fair Pricing",
    plansSubtitle: "Simple subscription pricing with free trial access",
    trialBadge: "Free Trial Included",
    priceNote: "Prices are shown in Indian Rupees (₹). Applicable taxes/GST extra if applicable.",
    formTitle: "Get RTS Smart Print for Your Shop",
    formSubtitle: "Fill out this short form and our support team will contact you with your setup package.",
    businessNameLabel: "Shop / Business Name *",
    ownerNameLabel: "Owner Name *",
    whatsappLabel: "WhatsApp Number *",
    emailLabel: "Email Address *",
    cityLabel: "City / Town (Kerala) *",
    planLabel: "Selected Subscription Plan",
    printerLabel: "Counter Printer Model",
    btnSubmit: "Request My Counter Station",
    btnSubmitting: "Submitting Request...",
    successTitle: "Registration Received Successfully!",
    successDesc: "Thank you! RTS Reliable Technology Services support will contact you shortly with your pairing code and setup package.",
    supportTitle: "RTS Smart Print Support",
    supportSub: "Operated by RTS Reliable Technology Services, Kerala, India.",
    contactSupportBtn: "Contact RTS Support"
  },
  ml: {
    heroBadge: "ഓട്ടോമേറ്റഡ് ക്ലൗഡ് കിയോസ്ക് & പ്രിന്റ് മാനേജ്‌മെന്റ് സിസ്റ്റം",
    heroTrustLine: "Customer privacy first. ഉപഭോക്താക്കളുടെ ഫയലുകൾ നിങ്ങൾ തിരഞ്ഞെടുക്കുന്ന സമയത്ത് തനിയെ നീക്കം ചെയ്യപ്പെടും.",
    heroTitle: "നിങ്ങളുടെ കൗണ്ടർ ഇനി ഒരു സ്മാർട്ട് പ്രിന്റിംഗ് സ്റ്റേഷനാക്കാം!",
    heroDesc: "കടകളിലെ നീണ്ട ക്യൂ, പെൻഡ്രൈവ് കുത്തൽ, വാട്സാപ്പിൽ ഫയലുകൾ ചോദിച്ചു വാങ്ങൽ എന്നിവ ഒഴിവാക്കൂ. കസ്റ്റമർ കൗണ്ടറിലെ ക്യുആർ കോഡ് സ്കാൻ ചെയ്ത് ഫയലുകൾ അപ്‌ലോഡ് ചെയ്യുമ്പോൾ പണം 0% കമ്മീഷനിൽ നിങ്ങളുടെ UPI-ലേക്ക് എത്തുന്നു. Auto-Pilot Mode വഴി പേയ്‌മെന്റ് കഴിഞ്ഞ് തനിയെ പ്രിന്റ് ചെയ്യാം, അല്ലെങ്കിൽ Manual Mode വഴി നിങ്ങൾ അപ്രൂവ് ചെയ്ത ശേഷം പ്രിന്റ് ചെയ്യാം.",
    applyNowBtn: "സൗജന്യ ട്രയൽ ആരംഭിക്കൂ",
    viewPlansBtn: "പ്ലാനുകൾ കാണുക",
    privacyTitle: "Customer Privacy First",
    privacyDesc: "പ്രിന്റിംഗിന് ശേഷം കടയുടമ തിരഞ്ഞെടുക്കുന്ന സമയത്തിനുള്ളിൽ (1h, 4h, 12h, 24h) ഫയലുകൾ dashboard-ൽ നിന്നും database-ൽ നിന്നും നീക്കം ചെയ്യപ്പെടും.",
    privacyLinkText: "പ്രൈവസി പോളിസി കാണുക →",
    upiTitle: "നേരിട്ടുള്ള UPI പേയ്‌മെന്റ് (0% കമ്മീഷൻ)",
    upiDesc: "പണം ഇടനിലക്കാരില്ലാതെ നിങ്ങളുടെ Google Pay, PhonePe, Paytm എന്നിവയിലേക്ക് നേരിട്ടെത്തുന്നു. UPI, Cash പേയ്‌മെന്റുകൾക്ക് 0% കമ്മീഷൻ.",
    safeTitle: "പരീക്ഷിച്ചുറപ്പിച്ച പ്രിന്ററുകളിൽ പ്രവർത്തിക്കുന്നു",
    safeDesc: "Works with tested printers such as HP, Canon, Epson, and Brother.",
    storageHeadline: "Customer Privacy First. സമയബന്ധിതമായ ഫയൽ നീക്കം ചെയ്യൽ.",
    storageSub: "ഫോട്ടോകോപ്പി, DTP, ഡിജിറ്റൽ സേവാ കേന്ദ്രങ്ങൾക്കായുള്ള സുരക്ഷിത ക്ലൗഡ് പ്രിന്റ് ക്യൂ സിസ്റ്റം.",
    storageP1Title: "സുരക്ഷിത ക്ലൗഡ് പ്രിന്റ് ക്യൂ",
    storageP1Desc: "അപ്‌ലോഡ് ചെയ്യുന്ന ഓരോ ഡോക്യുമെന്റും സുരക്ഷിതമായി പ്രോസസ്സ് ചെയ്ത് നിങ്ങളുടെ കൗണ്ടറിലെ പ്രിന്റ് ക്യൂവിലേക്ക് എത്തുന്നു.",
    storageP2Title: "സമയം നിങ്ങളുടെ നിയന്ത്രണത്തിൽ",
    storageP2Desc: "ഉപഭോക്താവിന്റെ ഫയലുകൾ എത്ര നേരം സൂക്ഷിക്കണമെന്ന് നിങ്ങൾക്ക് തിരഞ്ഞെടുക്കാം: 1 മണിക്കൂർ, 4 മണിക്കൂർ, 12 മണിക്കൂർ, അല്ലെങ്കിൽ 24 മണിക്കൂർ.",
    storageP3Title: "ഡാഷ്‌ബോർഡിൽ നിന്നും ഡാറ്റാബേസിൽ നിന്നും നീക്കം ചെയ്യൽ",
    storageP3Desc: "നിശ്ചയിച്ച സമയം കഴിഞ്ഞാൽ ഫയലുകൾ dashboard-ൽ നിന്നും database-ൽ നിന്നും നീക്കം ചെയ്യപ്പെടും.",
    videoBadge: "തത്സമയ വീഡിയോ ഡെമോ",
    videoTitle: "നിങ്ങളുടെ പ്രിന്റിംഗ് കട ഇനി SMART ആക്കാം! 🚀",
    videoSub: "QR കോഡ് സ്കാൻ ചെയ്ത് എളുപ്പത്തിൽ പ്രിന്റ് ഓർഡർ നൽകുന്നതെങ്ങനെയെന്ന് വീഡിയോയിലൂടെ കാണാം.",
    plansTitle: "ലളിതമായ സബ്‌സ്‌ക്രിപ്ഷൻ പ്ലാനുകൾ",
    plansSubtitle: "സൗജന്യ ട്രയൽ ഉൾപ്പെടുന്ന സബ്‌സ്‌ക്രിപ്ഷൻ പ്ലാൻ",
    trialBadge: "സൗജന്യ ട്രയൽ ലഭ്യമാണ്",
    priceNote: "നിരക്കുകൾ ഇന്ത്യൻ രൂപയിലാണ് (₹) കാണിച്ചിരിക്കുന്നത്.",
    formTitle: "നിങ്ങളുടെ കടയിൽ RTS Smart Print തുടങ്ങാം",
    formSubtitle: "ചുവടെയുള്ള ഫോം പൂരിപ്പിക്കൂ, ഞങ്ങളുടെ സപ്പോർട്ട് ടീം നിങ്ങളെ ബന്ധപ്പെടുന്നതാണ്.",
    businessNameLabel: "സ്ഥാപനത്തിന്റെ പേര് *",
    ownerNameLabel: "ഉടമയുടെ പേര് *",
    whatsappLabel: "വാട്സാപ്പ് നമ്പർ *",
    emailLabel: "ഇമെയിൽ വിലാസം *",
    cityLabel: "സ്ഥലം / ടൗൺ (കേരളം) *",
    planLabel: "പ്ലാൻ തിരഞ്ഞെടുക്കുക",
    printerLabel: "പ്രിന്റർ മോഡൽ",
    btnSubmit: "ഷോപ്പ് രജിസ്റ്റർ ചെയ്യുക",
    btnSubmitting: "വിവരങ്ങൾ സമർപ്പിക്കുന്നു...",
    successTitle: "രജിസ്ട്രേഷൻ വിജയകരമായി ലഭിച്ചു!",
    successDesc: "നന്ദി! RTS Reliable Technology Services സപ്പോർട്ട് വിഭാഗം ഉടൻ തന്നെ ബന്ധപ്പെട്ട് ഇൻസ്റ്റാളേഷൻ വിവരങ്ങൾ നൽകുന്നതാണ്.",
    supportTitle: "RTS Smart Print സപ്പോർട്ട്",
    supportSub: "RTS Reliable Technology Services, Kerala, India.",
    contactSupportBtn: "Contact RTS Support"
  }
};

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
  showSupportBtn?: boolean;
}

const CHAT_TOPICS = [
  {
    id: 'what_is',
    labelEn: '🖨️ What RTS Smart Print does',
    labelMl: '🖨️ എന്താണ് RTS Smart Print?',
    replyEn: 'RTS Smart Print, a product of RTS Reliable Technology Services (Kerala, India), is a QR-based print kiosk software for shops. Customers scan your counter QR code, upload documents, and pay via direct UPI with 0% commission.',
    replyMl: 'RTS Reliable Technology Services (കേരളം, ഇന്ത്യ) വികസിപ്പിച്ച ഓട്ടോമേറ്റഡ് ക്യുആർ പ്രിന്റ് കിയോസ്ക് സിസ്റ്റമാണ് RTS Smart Print. ഉപഭോക്താക്കൾക്ക് ക്യുആർ കോഡ് സ്കാൻ ചെയ്ത് ഫയലുകൾ അപ്‌ലോഡ് ചെയ്യാനും നേരിട്ട് UPI വഴി 0% കമ്മീഷനിൽ പണമടയ്ക്കാനും സാധിക്കുന്നു.'
  },
  {
    id: 'how_order',
    labelEn: '📱 How a customer orders',
    labelMl: '📱 കസ്റ്റമർ എങ്ങനെ ഓർഡർ ചെയ്യും?',
    replyEn: '1. Scan counter QR code.\n2. Upload PDF/image files & choose copies/color.\n3. Pay via direct UPI or Cash at counter.\n4. Order appears on Shop PC.\n5. Prints automatically in Auto-Pilot Mode or after staff approval in Manual Mode.',
    replyMl: '1. കൗണ്ടറിലെ QR കോഡ് സ്കാൻ ചെയ്യുന്നു.\n2. ഫയൽ അപ്‌ലോഡ് ചെയ്ത് കോപ്പികളും കളറും തിരഞ്ഞെടുക്കുന്നു.\n3. UPI വഴിയോ ക്യാഷ് ആയോ പണമടയ്ക്കുന്നു.\n4. ഓർഡർ കമ്പ്യൂട്ടറിൽ എത്തുന്നു.\n5. Auto-Pilot Mode-ൽ തനിയെ പ്രിന്റ് ആകുന്നു, അല്ലെങ്കിൽ Manual Mode-ൽ കടയുടമ അപ്രൂവ് ചെയ്യുമ്പോൾ പ്രിന്റ് ആകുന്നു.'
  },
  {
    id: 'pricing',
    labelEn: '💰 How pricing works',
    labelMl: '💰 പ്ലാൻ നിരക്കുകൾ എങ്ങനെയാണ്?',
    replyEn: 'Starter Station is confirmed at ₹199/month (7-Day Free Trial included). There is 0% platform commission on your customer UPI or cash collections. Prices are in Indian Rupees (₹).',
    replyMl: 'Starter Station പ്ലാൻ പ്രതിമാസം ₹199 ആണ് (7 ദിവസത്തെ സൗജന്യ ട്രയൽ ലഭ്യമാണ്). കസ്റ്റമർ പേയ്‌മെന്റുകൾക്ക് 0% കമ്മീഷനാണ്.'
  },
  {
    id: 'file_retention',
    labelEn: '⏱️ How long files are kept (1/4/12/24h)',
    labelMl: '⏱️ ഫയലുകൾ എത്ര സമയം സൂക്ഷിക്കും?',
    replyEn: 'Customer privacy first: Uploaded files are automatically removed from the dashboard and database after the timer chosen by the shop in Counter Configuration: 1 hour, 4 hours, 12 hours, or 24 hours.',
    replyMl: 'Customer privacy first: കടയുടമ തിരഞ്ഞെടുക്കുന്ന സമയമനുസരിച്ച് (1 മണിക്കൂർ, 4 മണിക്കൂർ, 12 മണിക്കൂർ, അല്ലെങ്കിൽ 24 മണിക്കൂർ) ഫയലുകൾ dashboard-ൽ നിന്നും database-ൽ നിന്നും തനിയെ നീക്കം ചെയ്യപ്പെടും.'
  },
  {
    id: 'print_modes',
    labelEn: '⚙️ Auto-Pilot vs Manual Mode',
    labelMl: '⚙️ Auto-Pilot & Manual Mode',
    replyEn: '• Auto-Pilot Mode: Prints automatically after payment is confirmed.\n• Manual Mode: Prints only after the shop operator approves each order in the Live Print Queue.',
    replyMl: '• Auto-Pilot Mode: പേയ്‌മെന്റ് കൺഫേം ആയ ഉടൻ പ്രിന്റ് ചെയ്യുന്നു.\n• Manual Mode: Live Print Queue-ൽ കടയുടമ അപ്രൂവ് ചെയ്ത ശേഷം മാത്രം പ്രിന്റ് ചെയ്യുന്നു.'
  },
  {
    id: 'start_trial',
    labelEn: '🚀 How to start a trial or sign up',
    labelMl: '🚀 സൗജന്യ ട്രയൽ എങ്ങനെ തുടങ്ങാം?',
    replyEn: 'Click "Activate Free Trial" on this page and fill in your Shop Name, Owner Name, WhatsApp Number, Email, and Printer Model to register.',
    replyMl: 'ഈ പേജിലെ രജിസ്ട്രേഷൻ ഫോമിൽ നിങ്ങളുടെ കടയുടെ പേര്, ഫോൺ നമ്പർ, ഇമെയിൽ, പ്രിന്റർ മോഡൽ എന്നിവ നൽകി സൗജന്യ ട്രയലിനായി അപേക്ഷിക്കാം.'
  },
  {
    id: 'contact_support',
    labelEn: '✉️ How to contact RTS Support',
    labelMl: '✉️ RTS Support-നെ എങ്ങനെ ബന്ധപ്പെടാം?',
    replyEn: 'You can reach RTS Reliable Technology Services, Kerala, India via email at info@rtsdigitalseva.online or click the "Contact RTS Support" button below.',
    replyMl: 'info@rtsdigitalseva.online എന്ന ഇമെയിൽ വഴിയോ താഴെ കാണുന്ന "Contact RTS Support" ബട്ടൺ വഴിയോ RTS Reliable Technology Services സപ്പോർട്ടുമായി ബന്ധപ്പെടാം.',
    showSupportBtn: true
  }
];

export const BusinessLandingPage: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'ml'>('ml');
  const t = TEXTS[lang];

  const [dbPlans, setDbPlans] = useState<PlatformPlan[]>([]);
  const [superAdminAnnouncement, setSuperAdminAnnouncement] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<LegalModalType>(null);

  // Chat Bot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    city: '',
    selectedPlan: 'starter_monthly',
    printerModel: '',
    message: ''
  });

  // Update SEO Title & Meta Tags Dynamically
  useEffect(() => {
    document.title = "RTS Smart Print: QR Print & Pay for Shops | RTS Reliable Technology Services";
    document.documentElement.lang = lang;
  }, [lang]);

  // Load Dynamic Plans + Super Admin Landing Page Offer/Update Message
  useEffect(() => {
    async function loadPlansAndAnnouncements() {
      try {
        const { data, error } = await supabase
          .from('platform_plans')
          .select('*')
          .eq('is_active', true)
          .order('offer_price', { ascending: true });

        if (!error && data && data.length > 0) {
          setDbPlans(data as PlatformPlan[]);
          const msgFromPlan = (data[0] as any)?.landing_announcement || (data[0] as any)?.announcement_text;
          if (msgFromPlan) {
            setSuperAdminAnnouncement(msgFromPlan);
          }
        }

        // Also check optional landing_announcements / site_settings table or default shop admin_message if used by Super Admin
        const { data: settingData } = await supabase
          .from('shops')
          .select('admin_message')
          .not('admin_message', 'is', null)
          .limit(1);

        if (settingData && settingData.length > 0 && settingData[0].admin_message) {
          setSuperAdminAnnouncement(prev => prev || settingData[0].admin_message || '');
        }
      } catch (err) {
        console.error('Failed to load dynamic plans or announcements:', err);
      }
    }
    loadPlansAndAnnouncements();
  }, []);

  const handleTopicClick = (topic: typeof CHAT_TOPICS[0]) => {
    const userQ = lang === 'en' ? topic.labelEn : topic.labelMl;
    const botA = lang === 'en' ? topic.replyEn : topic.replyMl;
    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text: userQ },
      { sender: 'bot', text: botA, showSupportBtn: topic.showSupportBtn }
    ]);
  };

  const handleChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    let matchedTopic = null;

    if (lower.includes('price') || lower.includes('cost') || lower.includes('199') || lower.includes('plan')) {
      matchedTopic = CHAT_TOPICS.find(item => item.id === 'pricing');
    } else if (lower.includes('delete') || lower.includes('hour') || lower.includes('privacy') || lower.includes('keep')) {
      matchedTopic = CHAT_TOPICS.find(item => item.id === 'file_retention');
    } else if (lower.includes('trial') || lower.includes('sign') || lower.includes('register')) {
      matchedTopic = CHAT_TOPICS.find(item => item.id === 'start_trial');
    } else if (lower.includes('order') || lower.includes('scan') || lower.includes('work')) {
      matchedTopic = CHAT_TOPICS.find(item => item.id === 'how_order');
    } else if (lower.includes('mode') || lower.includes('auto') || lower.includes('manual')) {
      matchedTopic = CHAT_TOPICS.find(item => item.id === 'print_modes');
    } else if (lower.includes('contact') || lower.includes('support') || lower.includes('email')) {
      matchedTopic = CHAT_TOPICS.find(item => item.id === 'contact_support');
    }

    const replyText = matchedTopic
      ? (lang === 'en' ? matchedTopic.replyEn : matchedTopic.replyMl)
      : (lang === 'en'
          ? 'Thank you for your message. RTS Support will reply during working hours. Please use the "Contact RTS Support" option or email info@rtsdigitalseva.online.'
          : 'നിങ്ങളുടെ സന്ദേശത്തിന് നന്ദി. RTS Support പ്രവൃത്തി സമയങ്ങളിൽ മറുപടി നൽകുന്നതാണ്. കൂടുതൽ സഹായത്തിനായി "Contact RTS Support" ഉപയോഗിക്കുക അല്ലെങ്കിൽ info@rtsdigitalseva.online ലേക്ക് ഇമെയിൽ ചെയ്യുക.');

    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text: trimmed },
      { sender: 'bot', text: replyText, showSupportBtn: !matchedTopic || matchedTopic.showSupportBtn }
    ]);
    setChatInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await supabase.from('shop_inquiries').insert([
        {
          business_name: formData.businessName,
          owner_name: formData.ownerName,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          selected_plan: formData.selectedPlan,
          printer_model: formData.printerModel,
          message: formData.message,
        }
      ]);

      await fetch('[https://script.google.com/macros/s/AKfycbytAx6dxUypNjcrwCHWh537MguDjcvVYqdduYfe4k9_d3-x_HW8xPwc3vxt2NxTpNs/exec](https://script.google.com/macros/s/AKfycbytAx6dxUypNjcrwCHWh537MguDjcvVYqdduYfe4k9_d3-x_HW8xPwc3vxt2NxTpNs/exec)', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          ownerName: formData.ownerName,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          selectedPlan: formData.selectedPlan,
          printerModel: formData.printerModel
        })
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      alert('Error submitting inquiry. Please contact RTS Support at info@rtsdigitalseva.online.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById('inquiry-form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPricing = () => {
    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToSupport = () => {
    document.getElementById('support-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const firstPlan = dbPlans[0];
  const confirmedMonthly = firstPlan?.offer_price ? String(firstPlan.offer_price) : '199';
  const customTrialDays = firstPlan?.form_trial_days || String(firstPlan?.trial_days || 7);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      {/* Top Navigation */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 py-3.5 px-4 sm:px-6 flex justify-between items-center sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-emerald-500/20 shrink-0">
            ⚡
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm sm:text-base leading-tight tracking-tight">RTS Smart Print</h1>
            <p className="text-[9px] sm:text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
              RTS Reliable Technology Services
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'ml' : 'en')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 transition"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>
            <span>{lang === 'en' ? 'മലയാളം' : 'English'}</span>
          </button>
          
          <button
            type="button"
            onClick={scrollToForm}
            className="text-xs font-black px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <span>{t.applyNowBtn}</span>
            <ArrowRight className="w-3.5 h-3.5 hidden sm:inline"/>
          </button>
        </div>
      </header>

      {/* SUPER ADMIN LIVE OFFERS & UPDATES MESSAGE BOX */}
      {superAdminAnnouncement && (
        <div className="max-w-4xl mx-auto px-4 pt-5">
          <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/40 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 animate-bounce"/>
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  {lang === 'en' ? 'Special Offer & Platform Update' : 'പ്രത്യേക ഓഫറുകളും അറിയിപ്പുകളും'}
                </span>
                <p className="text-xs sm:text-sm font-bold text-white mt-0.5 leading-snug">
                  {superAdminAnnouncement}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={scrollToForm}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-[11px] shrink-0 transition"
            >
              {lang === 'en' ? 'Claim Now' : 'നേടുക'}
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-10 sm:pt-20 sm:pb-14 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-slate-950 -z-10" />
        
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Dual Badge & Trust Line */}
          <div className="inline-flex flex-col items-center gap-1.5">
            <span className="px-3.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-emerald-400 shrink-0"/>
              {t.heroBadge}
            </span>
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>
              {t.heroTrustLine}
            </span>
          </div>

          <h2 className="text-2xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.2]">
            {t.heroTitle}
          </h2>

          <p className="text-slate-400 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed">
            {t.heroDesc}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={scrollToForm}
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-900/30 transition transform hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <span>{t.applyNowBtn}</span>
              <ArrowRight className="w-4 h-4"/>
            </button>
            <button
              type="button"
              onClick={scrollToPricing}
              className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs sm:text-sm rounded-2xl border border-slate-800 transition"
            >
              {t.viewPlansBtn}
            </button>
          </div>

          {/* Quick Stats Strip */}
          <div className="pt-8 grid grid-cols-3 gap-2 sm:gap-4 max-w-xl mx-auto border-t border-slate-800/80">
            <div>
              <p className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">0%</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Commission</p>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-white font-mono">100%</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Direct UPI</p>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-teal-400 font-mono">1h–24h</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Auto-Delete Timer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Highlights */}
      <section className="max-w-5xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-2.5 shadow-md hover:border-slate-700 transition flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold border border-emerald-500/20">
              <Lock className="w-5 h-5"/>
            </div>
            <h3 className="font-bold text-white text-base">{t.privacyTitle}</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">{t.privacyDesc}</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveModal('privacy')}
            className="text-[11px] font-bold text-emerald-400 hover:underline text-left pt-1"
          >
            {t.privacyLinkText}
          </button>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-2.5 shadow-md hover:border-slate-700 transition">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold border border-emerald-500/20">
            <Zap className="w-5 h-5"/>
          </div>
          <h3 className="font-bold text-white text-base">{t.upiTitle}</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">{t.upiDesc}</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-2.5 shadow-md hover:border-slate-700 transition">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5"/>
          </div>
          <h3 className="font-bold text-white text-base">{t.safeTitle}</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">{t.safeDesc}</p>
        </div>
      </section>

      {/* Dedicated Section: Customer Privacy & File Deletion */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 p-6 sm:p-10 rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mb-2">
                Customer Privacy First
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                {t.storageHeadline}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {t.storageSub}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal('privacy')}
              className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
            >
              <FileText className="w-4 h-4"/>
              <span>Privacy Policy</span>
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Point 1 */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <HardDrive className="w-4 h-4"/>
                <h4>{t.storageP1Title}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.storageP1Desc}
              </p>
            </div>

            {/* Point 2 */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <Sliders className="w-4 h-4"/>
                <h4>{t.storageP2Title}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.storageP2Desc}
              </p>
              <div className="flex gap-1.5 pt-1">
                {['1h', '4h', '12h', '24h'].map((time) => (
                  <span key={time} className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-teal-300">
                    {time}
                  </span>
                ))}
              </div>
            </div>

            {/* Point 3 */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Trash2 className="w-4 h-4"/>
                <h4>{t.storageP3Title}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.storageP3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual 5-Step Process + Live Demo Video Above */}
      <section className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        {/* YOUTUBE DEMO VIDEO SHOWCASE CARD (Placed directly above Step-By-Step Workflow) */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
          <div className="grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-4 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <PlayCircle className="w-3.5 h-3.5"/>
                {t.videoBadge}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {t.videoTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {t.videoSub}
              </p>
              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-2.5 text-xs text-slate-300">
                <span className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-emerald-400"/> Print Standee
                </span>
                <span className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400"/> Direct UPI
                </span>
                <span className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-emerald-400"/> Auto-Pilot / Manual Mode
                </span>
              </div>
            </div>

            <div className="md:col-span-5 flex justify-center">
              <div className="w-full max-w-[300px] aspect-[9/16] rounded-3xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl shadow-emerald-950/50 bg-slate-950">
                <iframe
                  className="w-full h-full"
                  src="[https://www.youtube.com/embed/kr7fXGDH_wk](https://www.youtube.com/embed/kr7fXGDH_wk)"
                  title="നിങ്ങളുടെ പ്രിന്റിംഗ് കട ഇനി SMART ആക്കാം! 🚀 | RTS Smart Print"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>

        {/* 1. How RTS Smart Print Works (5-Step Cards with large readable headings) */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-md">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Step-By-Step Workflow</span>
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
              <Cpu className="w-6 h-6 text-emerald-400 shrink-0"/>
              <span>{lang === 'en' ? "1. How RTS Smart Print Works at Your Shop" : "1. RTS Smart Print എങ്ങനെ പ്രവർത്തിക്കുന്നു?"}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              {lang === 'en' 
                ? "A seamless end-to-end cloud spooler that routes mobile customer prints to your shop printer."
                : "കടകളിൽ വരുന്ന പ്രിന്റിംഗ് ഓർഡറുകൾ മൊബൈൽ വഴി സ്വീകരിക്കാനും, കമ്പ്യൂട്ടർ ഉപയോഗിച്ച് പ്രിന്റ് ചെയ്യാനും സഹായിക്കുന്ന സ്മാർട്ട് പ്രിന്റിംഗ് സംവിധാനം."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step1_scan_qr_code.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-[11px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                  {lang === 'en' ? "Step 1" : "ഘട്ടം 1"}
                </span>
                <h4 className="font-extrabold text-base text-white mt-2">
                  {lang === 'en' ? "Customer Scans Counter QR" : "QR Code സ്കാൻ ചെയ്യുക"}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {lang === 'en' 
                    ? "Customer scans your Print Standee using their phone camera to open your shop's upload page."
                    : "കടയിൽ സ്ഥാപിക്കുന്ന Print Standee-ലെ QR Code ഉപഭോക്താവ് മൊബൈൽ ക്യാമറ ഉപയോഗിച്ച് സ്കാൻ ചെയ്യുന്നു."}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step2_upload_file.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-[11px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                  {lang === 'en' ? "Step 2" : "ഘട്ടം 2"}
                </span>
                <h4 className="font-extrabold text-base text-white mt-2">
                  {lang === 'en' ? "Upload & Select Options" : "ഫയൽ അപ്‌ലോഡ് ചെയ്യുക"}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {lang === 'en' 
                    ? "Upload PDF or image files. Choose copies, paper size, Black & White or Color, and single or double-sided printing."
                    : "PDF അല്ലെങ്കിൽ ചിത്രങ്ങൾ അപ്‌ലോഡ് ചെയ്യാം. കോപ്പികളുടെ എണ്ണം, കളർ അല്ലെങ്കിൽ ബ്ലാക്ക് ആൻഡ് വൈറ്റ് എന്നിവ തിരഞ്ഞെടുക്കാം."}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step3_pay_amount.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-[11px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                  {lang === 'en' ? "Step 3" : "ഘട്ടം 3"}
                </span>
                <h4 className="font-extrabold text-base text-white mt-2">
                  {lang === 'en' ? "Instant UPI / Cash Choice" : "തുകയും പേയ്‌മെന്റും"}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {lang === 'en' 
                    ? "The calculated amount is shown clearly via Dynamic Page Rate. Customer pays directly via UPI or Cash at counter with 0% commission."
                    : "തിരഞ്ഞെടുത്ത ഓപ്ഷനുകൾ അനുസരിച്ച് തുക കാണിക്കും. കടയിൽ ലഭ്യമായ Cash/UPI പേയ്‌മെന്റ് രീതികൾ 0% കമ്മീഷനിൽ ഉപയോഗിക്കാം."}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step4_order_received.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-[11px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                  {lang === 'en' ? "Step 4" : "ഘട്ടം 4"}
                </span>
                <h4 className="font-extrabold text-base text-white mt-2">
                  {lang === 'en' ? "Order Lands in Live Print Queue" : "ഓർഡർ കമ്പ്യൂട്ടറിൽ എത്തുന്നു"}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {lang === 'en' 
                    ? "Incoming job appears in real-time inside your Live Print Queue and Windows Print Agent."
                    : "ഓർഡർ നിങ്ങളുടെ കമ്പ്യൂട്ടറിലെ RTS Smart Print Agent-ലും Live Print Queue-ലും തൽക്ഷണം ലഭിക്കുന്നു."}
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
              <div>
                <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step5_auto_print.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-[11px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                  {lang === 'en' ? "Step 5" : "ഘട്ടം 5"}
                </span>
                <h4 className="font-extrabold text-base text-white mt-2">
                  {lang === 'en' ? "Auto-Pilot Mode / Manual Mode" : "Auto-Pilot / Manual പ്രിന്റിംഗ്"}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {lang === 'en' 
                    ? "Auto-Pilot Mode: prints automatically after payment is confirmed. Manual Mode: prints after the shop approves each order."
                    : "Auto-Pilot Mode: പേയ്‌മെന്റ് കൺഫേം ആയ ശേഷം തനിയെ പ്രിന്റ് ചെയ്യുന്നു. Manual Mode: കടയുടമ ഓർഡർ അപ്രൂവ് ചെയ്ത ശേഷം പ്രിന്റ് ചെയ്യുന്നു."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Facilities for Shop Owners (Matching Dashboard Labels) */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4 shadow-md">
          <h3 className="text-xl sm:text-2xl font-black text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-400 shrink-0"/>
            <span>{lang === 'en' ? "2. Confirmed Features Provided to Your Shop" : "2. കടയുടമയ്ക്ക് ലഭിക്കുന്ന സൗകര്യങ്ങൾ"}</span>
          </h3>
          <ul className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-300">
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/> 
              <span>{lang === 'en' ? "Counter Configuration panel to manage your shop settings." : "Counter Configuration വഴി കടയുടെ ക്രമീകരണങ്ങൾ നിയന്ത്രിക്കാം."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/> 
              <span>{lang === 'en' ? "Print Standee generator with QR code and optional access PIN." : "Print Standee – ക്യുആർ കോഡും പിൻ നമ്പറും ഉൾപ്പെടുന്ന സ്റ്റാൻഡി പ്രിന്റ് ചെയ്യാം."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/> 
              <span>{lang === 'en' ? "Live Print Queue for real-time PDF and image order tracking." : "Live Print Queue വഴി PDF, ഇമേജ് ഓർഡറുകൾ തത്സമയം കാണാം."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/> 
              <span>{lang === 'en' ? "Dynamic Page Rate settings for B&W and Color pages." : "Dynamic Page Rate വഴി B&W, Color പ്രിന്റിംഗ് നിരക്കുകൾ ക്രമീകരിക്കാം."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/> 
              <span>{lang === 'en' ? "Direct Bank UPI & Cash modes with 0% platform commission." : "0% കമ്മീഷനിൽ നേരിട്ടുള്ള UPI, Cash പേയ്‌മെന്റ് സൗകര്യം."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/> 
              <span>{lang === 'en' ? "Switch anytime between Auto-Pilot Mode and Manual Mode." : "Auto-Pilot Mode, Manual Mode സൗകര്യങ്ങൾ."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/> 
              <span>{lang === 'en' ? "Scheduled file removal from dashboard & database (1h, 4h, 12h, 24h)." : "1h, 4h, 12h, 24h സമയപരിധിക്കുള്ളിൽ ഫയലുകൾ നീക്കം ചെയ്യാനുള്ള സൗകര്യം."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/> 
              <span>{lang === 'en' ? "Works with tested printers such as HP, Canon, Epson, and Brother." : "Works with tested printers such as HP, Canon, Epson, and Brother."}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Subscription Pricing Cards (No Strikethrough Prices, ₹199/month Confirmed) */}
      <section className="max-w-4xl mx-auto px-4 py-8" id="pricing-section">
        <div className="text-center mb-8 space-y-1.5">
          <span className="text-[11px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full inline-flex items-center gap-1">
            <Tag className="w-3 h-3"/> {t.trialBadge}
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-white">{t.plansTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-400">{t.plansSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Starter Station Confirmed Card */}
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between relative">
            <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
              Popular Choice
            </span>
            <div>
              <h4 className="font-extrabold text-xl text-white">Starter Station</h4>
              <div className="mt-3 mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white font-mono">₹{confirmedMonthly}</span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>
                <p className="text-xs text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5"/>
                  {customTrialDays}-Day Free Trial Included
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0"/> Counter Configuration & Print Standee</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0"/> Live Print Queue & Windows Print Agent</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0"/> Auto-Pilot Mode & Manual Mode</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0"/> Direct UPI & Cash Support (0% Commission)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0"/> Auto File Deletion (1h, 4h, 12h, 24h)</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, selectedPlan: 'starter_monthly' }));
                scrollToForm();
              }}
              className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition shadow-md"
            >
              Select Starter Station
            </button>
          </div>

          {/* Pro Plan Card (Coming Soon, No Free Trial Line, Disabled Button) */}
          <div className="bg-slate-900 border border-slate-800 opacity-90 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between relative">
            <span className="absolute top-4 right-4 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
              Coming Soon
            </span>
            <div>
              <h4 className="font-extrabold text-xl text-white">Pro Digital Seva</h4>
              <div className="mt-3 mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-400 font-mono">Coming Soon</span>
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-1.5">
                  Advanced multi-counter edition under development
                </p>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-600 shrink-0"/> All Starter Station Features</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-600 shrink-0"/> Multi-Counter Queue Management</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-600 shrink-0"/> Extended Analytics & Reports</li>
              </ul>
            </div>
            <button
              type="button"
              disabled
              className="mt-6 w-full py-3 bg-slate-800 text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed border border-slate-700"
            >
              Coming Soon
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          {t.priceNote}
        </p>
      </section>

      {/* Inquiry Registration Form */}
      <section id="inquiry-form-section" className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8"/>
              </div>
              <h4 className="text-xl font-black text-white">{t.successTitle}</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">{t.successDesc}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-xl font-black text-white">{t.formTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t.formSubtitle}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">{t.businessNameLabel}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Friends Xerox & Digital Center"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t.ownerNameLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t.whatsappLabel}</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t.emailLabel}</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t.cityLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Town / City in Kerala"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t.planLabel}</label>
                  <select
                    value={formData.selectedPlan}
                    onChange={(e) => setFormData({ ...formData, selectedPlan: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="starter_monthly">Starter Station (₹{confirmedMonthly}/month)</option>
                    <option value="trial_7">{customTrialDays}-Day Free Trial (₹0)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t.printerLabel}</label>
                  <input
                    type="text"
                    placeholder="e.g. HP, Canon, Epson, Brother"
                    value={formData.printerModel}
                    onChange={(e) => setFormData({ ...formData, printerModel: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2 mt-3 text-xs uppercase tracking-wider"
              >
                {loading ? t.btnSubmitting : t.btnSubmit}
              </button>

              <div className="text-[11px] text-center text-slate-400 space-y-1 pt-1">
                <p>
                  Your details are used only to contact you about RTS Smart Print.{' '}
                  <button
                    type="button"
                    onClick={() => setActiveModal('privacy')}
                    className="text-emerald-400 font-bold hover:underline"
                  >
                    Privacy Policy
                  </button>
                </p>
                <p className="text-[10px] text-slate-500">
                  RTS Smart Print, a product of RTS Reliable Technology Services (info@rtsdigitalseva.online).
                </p>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Dedicated Support Section */}
      <section id="support-section" className="max-w-4xl mx-auto px-4 py-8 pb-14">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-white">{t.supportTitle}</h3>
            <p className="text-xs text-slate-400">{t.supportSub}</p>
            <p className="text-xs text-emerald-400 font-mono font-bold">
              Email: info@rtsdigitalseva.online
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveModal('contact')}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition shadow-md flex items-center gap-2"
            >
              <Mail className="w-4 h-4"/>
              <span>{t.contactSupportBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('about')}
              className="px-4 py-3 bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 transition"
            >
              About Us
            </button>
          </div>
        </div>
      നിങ്ങൾ നൽകിയ **`BusinessLandingPage.tsx`** കോഡിൽ നിലവിലുള്ള ഒരു ഫംഗ്ഷനുകൾക്കും (Supabase inquiry submission, Google Apps Script webhook, dynamic plans loading) മാറ്റം വരുത്താതെ, നമ്മൾ ചർച്ച ചെയ്ത് ഉറപ്പിച്ച **എല്ലാ 16 നിർദ്ദേശങ്ങളും**, ഒപ്പം **Super Admin Live Offers & Updates Message Box**, **Interactive Support Chat Bot**, **Trust Modals (Privacy Policy, Terms, Refund Policy, About Us, Contact)** എന്നിവയും കൃത്യമായി ഉൾപ്പെടുത്തിയിട്ടുണ്ട്.

---

### 1. Complete Updated `BusinessLandingPage.tsx` (Copy & Paste All)

```tsx
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Mail, 
  Lock, 
  Languages, 
  Tag, 
  Clock, 
  Store, 
  Cpu, 
  Printer, 
  CreditCard, 
  ArrowRight,
  HardDrive,
  Trash2,
  Sliders,
  Check,
  QrCode,
  Sparkles,
  ServerOff,
  PlayCircle,
  MessageCircle,
  X,
  Send,
  Bell,
  HelpCircle,
  FileText,
  Info,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PlatformPlan {
  id: string;
  plan_slug: string;
  name: string;
  original_price: number;
  offer_price: number;
  billing_period: string;
  trial_days: number;
  badge_text: string;
  features: string[];
  is_active: boolean;
  form_monthly_price?: string;
  form_yearly_price?: string;
  form_trial_days?: string;
  landing_message?: string | null;
}

type TrustModalType = 'privacy' | 'terms' | 'refund' | 'about' | 'contact' | null;

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

const TEXTS = {
  en: {
    heroBadge: "Automated Cloud Kiosk & Zero-Touch Print Management",
    heroTrustLine: "Customer files are deleted automatically from the dashboard and database on your chosen schedule (1h, 4h, 12h, or 24h).",
    heroTitle: "Transform Your Counter Into an Automated Printing Station",
    heroDesc: "Eliminate WhatsApp file transfers, USB pen drive risks, and crowded counter queues. Customers scan your counter QR code, upload documents, and pay directly into your UPI with 0% platform commission. Print jobs execute via Auto-Pilot Mode (prints automatically after payment is confirmed) or Manual Mode (prints after the shop approves each order).",
    applyNowBtn: "Activate Free Trial",
    viewPlansBtn: "View Subscription Plans",
    privacyTitle: "Customer Privacy First",
    privacyDesc: "Encrypted cloud transmission with scheduled auto-deletion. Files are removed from the dashboard and database after 1h, 4h, 12h, or 24h.",
    privacyLinkText: "Read Privacy Policy →",
    upiTitle: "Direct Bank UPI Settlement",
    upiDesc: "Customer payments go 100% directly to your Google Pay, PhonePe, or Paytm UPI ID with 0% commission.",
    safeTitle: "Safe for Shop Workstations",
    safeDesc: "Works with tested printers such as HP, Canon, Epson, and Brother via our lightweight Windows print agent.",
    storageHeadline: "Customer Privacy First. Scheduled Automatic File Deletion.",
    storageSub: "A modern cloud print-queue architecture built for photocopy, DTP, and citizen service counters.",
    storageP1Title: "Streamlined Cloud Queue",
    storageP1Desc: "Uploaded documents are queued securely for counter printing and automatically removed from the dashboard and database on schedule.",
    storageP2Title: "You Control the Timer",
    storageP2Desc: "Shop Admins can customize the file retention schedule. Choose exactly when files are deleted: 1 hour, 4 hours, 12 hours, or 24 hours.",
    storageP3Title: "Automatic Purge Engine",
    storageP3Desc: "Once the timer ends, documents are removed from both the dashboard and database automatically.",
    videoBadge: "Video Tutorial",
    videoTitle: "Watch How RTS Smart Print Works in Action",
    videoSub: "See how easily customers scan the counter QR code, upload files, and print at your shop.",
    plansTitle: "Transparent & Fair Pricing",
    plansSubtitle: "Simple subscription plans with free trial access",
    trialBadge: "Free Trial Included",
    pricingFootnote: "Prices are shown in Indian Rupees (₹). Standard taxes apply as applicable.",
    formTitle: "Get RTS Smart Print for Your Shop",
    formSubtitle: "Fill out this short form and our team will contact you to set up your counter station.",
    businessNameLabel: "Shop / Business Name *",
    ownerNameLabel: "Owner Name *",
    whatsappLabel: "WhatsApp Number *",
    emailLabel: "Email Address *",
    cityLabel: "City / Taluk (Kerala) *",
    planLabel: "Selected Subscription Plan",
    printerLabel: "Counter Printer Model",
    btnSubmit: "Activate My Counter Station Now",
    btnSubmitting: "Registering Your Shop...",
    formPrivacyNote: "Your details are used only to contact you about RTS Smart Print.",
    successTitle: "Registration Received Successfully!",
    successDesc: "Thank you! Our support team at RTS Reliable Technology Services will connect with you shortly with your pairing code and setup package.",
    supportSectionTitle: "RTS Smart Print Support",
    supportSectionDesc: "Developed and operated by RTS Reliable Technology Services, Kerala, India.",
    contactSupportBtn: "Contact RTS Support"
  },
  ml: {
    heroBadge: "ഓട്ടോമേറ്റഡ് ക്ലൗഡ് കിയോസ്ക് & പ്രിന്റ് മാനേജ്‌മെന്റ് സിസ്റ്റം",
    heroTrustLine: "ഉപഭോക്താക്കളുടെ ഫയലുകൾ കടയുടമ തിരഞ്ഞെടുക്കുന്ന സമയത്ത് (1h, 4h, 12h, 24h) dashboard-ൽ നിന്നും database-ൽ നിന്നും തനിയെ നീക്കം ചെയ്യപ്പെടും.",
    heroTitle: "നിങ്ങളുടെ കൗണ്ടർ ഇനി ഒരു ഓട്ടോമേറ്റഡ് സ്മാർട്ട് പ്രിന്റിംഗ് സ്റ്റേഷനാക്കാം!",
    heroDesc: "കടകളിലെ നീണ്ട ക്യൂ, പെൻഡ്രൈവ് കുത്തൽ, വാട്സാപ്പിൽ ഫയലുകൾ ചോദിച്ചു വാങ്ങൽ എന്നിവ ഒഴിവാക്കൂ. കസ്റ്റമർ കൗണ്ടറിലെ ക്യുആർ കോഡ് സ്കാൻ ചെയ്ത് ഫയലുകൾ അപ്‌ലോഡ് ചെയ്യുമ്പോൾ പണം 0% കമ്മീഷനിൽ നേരിട്ട് നിങ്ങളുടെ UPI-ലേക്ക് എത്തുന്നു. Auto-Pilot Mode വഴി പേയ്‌മെന്റ് കൺഫേം ആയ ഉടൻ തനിയെ പ്രിന്റ് ആകുന്നു, അല്ലെങ്കിൽ Manual Mode വഴി കടയുടമ അപ്രൂവ് ചെയ്ത ശേഷം പ്രിന്റ് ചെയ്യുന്നു.",
    applyNowBtn: "സൗജന്യ ട്രയൽ ആരംഭിക്കൂ",
    viewPlansBtn: "പ്ലാനുകൾ കാണുക",
    privacyTitle: "Customer Privacy First",
    privacyDesc: "പ്രിന്റിംഗിന് ശേഷം നിശ്ചിത സമയത്തിനുള്ളിൽ (1h, 4h, 12h, 24h) ഫയലുകൾ dashboard-ൽ നിന്നും database-ൽ നിന്നും നീക്കം ചെയ്യപ്പെടും.",
    privacyLinkText: "പ്രൈവസി പോളിസി കാണുക →",
    upiTitle: "നേരിട്ടുള്ള UPI പേയ്‌മെന്റ് (0% കമ്മീഷൻ)",
    upiDesc: "പണം ഇടനിലക്കാരില്ലാതെ നിങ്ങളുടെ Google Pay, PhonePe, Paytm എന്നിവയിലേക്ക് നേരിട്ടെത്തുന്നു. 0% പ്ലാറ്റ്‌ഫോം കമ്മീഷൻ.",
    safeTitle: "പരീക്ഷിച്ചുറപ്പിച്ച പ്രിന്റർ സപ്പോർട്ട്",
    safeDesc: "Works with tested printers such as HP, Canon, Epson, and Brother (വിൻഡോസ് പ്രിന്റ് ഏജന്റ് വഴി പ്രവർത്തിക്കുന്നു).",
    storageHeadline: "Customer Privacy First. നിശ്ചിത സമയത്ത് സ്വയം ഡിലീറ്റ് ആകുന്ന ഫയലുകൾ.",
    storageSub: "ഫോട്ടോകോപ്പി, DTP, ഡിജിറ്റൽ സേവാ കേന്ദ്രങ്ങൾക്കായുള്ള സുരക്ഷിത ക്ലൗഡ് പ്രിന്റ് ക്യൂ സംവിധാനം.",
    storageP1Title: "ക്ലൗഡ് പ്രിന്റ് ക്യൂ",
    storageP1Desc: "അപ്‌ലോഡ് ചെയ്യുന്ന ഓരോ ഡോക്യുമെന്റും പ്രിന്റിംഗിനായി ക്ലൗഡിൽ പ്രോസസ്സ് ചെയ്യുകയും നിശ്ചിത സമയത്ത് നീക്കം ചെയ്യപ്പെടുകയും ചെയ്യുന്നു.",
    storageP2Title: "സമയം നിങ്ങളുടെ നിയന്ത്രണത്തിൽ",
    storageP2Desc: "ഉപഭോക്താവിന്റെ ഫയലുകൾ എത്ര നേരം സൂക്ഷിക്കണമെന്ന് കടയുടമയ്ക്ക് തിരഞ്ഞെടുക്കാം: 1 മണിക്കൂർ, 4 മണിക്കൂർ, 12 മണിക്കൂർ, അല്ലെങ്കിൽ 24 മണിക്കൂർ.",
    storageP3Title: "സ്വയം നീക്കം ചെയ്യപ്പെടുന്ന ഫയലുകൾ",
    storageP3Desc: "നിശ്ചയിച്ച സമയം കഴിഞ്ഞാൽ dashboard-ൽ നിന്നും database-ൽ നിന്നും ഫയലുകൾ നീക്കം ചെയ്യപ്പെടും.",
    videoBadge: "വീഡിയോ ഡെമോ",
    videoTitle: "RTS Smart Print പ്രവർത്തനം വീഡിയോയിലൂടെ കാണാം",
    videoSub: "QR കോഡ് സ്കാൻ ചെയ്ത് എളുപ്പത്തിൽ ഫയലുകൾ അപ്‌ലോഡ് ചെയ്ത് പ്രിന്റ് എടുക്കുന്ന രീതി.",
    plansTitle: "ലളിതമായ സബ്‌സ്‌ക്രിപ്ഷൻ പ്ലാനുകൾ",
    plansSubtitle: "സൗജന്യ ട്രയൽ ഉൾപ്പെടുന്ന പ്രതിമാസ പ്ലാനുകൾ",
    trialBadge: "സൗജന്യ ട്രയൽ ലഭ്യമാണ്",
    pricingFootnote: "നിരക്കുകൾ ഇന്ത്യൻ രൂപയിലാണ് (₹) നൽകിയിരിക്കുന്നത്.",
    formTitle: "നിങ്ങളുടെ കടയിൽ RTS Smart Print തുടങ്ങാം",
    formSubtitle: "താഴെയുള്ള ഫോം പൂരിപ്പിക്കുക, ഞങ്ങളുടെ സപ്പോർട്ട് ടീം നിങ്ങളെ ബന്ധപ്പെടുന്നതാണ്.",
    businessNameLabel: "സ്ഥാപനത്തിന്റെ പേര് *",
    ownerNameLabel: "ഉടമയുടെ പേര് *",
    whatsappLabel: "വാട്സാപ്പ് നമ്പർ *",
    emailLabel: "ഇമെയിൽ വിലാസം *",
    cityLabel: "സ്ഥലം / താലൂക്ക് *",
    planLabel: "പ്ലാൻ തിരഞ്ഞെടുക്കുക",
    printerLabel: "പ്രിന്റർ മോഡൽ",
    btnSubmit: "ഷോപ്പ് രജിസ്റ്റർ ചെയ്യുക",
    btnSubmitting: "വിവരങ്ങൾ സമർപ്പിക്കുന്നു...",
    formPrivacyNote: "നിങ്ങളുടെ വിവരങ്ങൾ RTS Smart Print സംബന്ധിച്ച ആവശ്യങ്ങൾക്ക് ബന്ധപ്പെടാൻ മാത്രമാണ് ഉപയോഗിക്കുന്നത്.",
    successTitle: "രജിസ്ട്രേഷൻ വിജയകരമായി ലഭിച്ചു!",
    successDesc: "നന്ദി! RTS Reliable Technology Services സപ്പോർട്ട് വിഭാഗം ഉടൻ തന്നെ നിങ്ങളെ ബന്ധപ്പെട്ട് ഇൻസ്റ്റാളേഷൻ വിവരങ്ങൾ നൽകുന്നതാണ്.",
    supportSectionTitle: "RTS Smart Print സപ്പോർട്ട്",
    supportSectionDesc: "RTS Reliable Technology Services (Kerala, India) നിർമ്മിച്ച് പ്രവർത്തിപ്പിക്കുന്ന സംവിധാനം.",
    contactSupportBtn: "Contact RTS Support"
  }
};

const CHAT_FAQ_OPTIONS = [
  {
    id: 'what_is',
    label: '🖨️ What RTS Smart Print does',
    answerEn: 'RTS Smart Print, a product of RTS Reliable Technology Services (Kerala, India), is a zero-touch automated printing kiosk system for shops. Customers scan your shop QR code, upload documents, and pay via UPI with 0% commission.',
    answerMl: 'RTS Reliable Technology Services (Kerala, India) പുറത്തിറക്കുന്ന ഓട്ടോമേറ്റഡ് ക്യുആർ പ്രിന്റിംഗ് കിയോസ്ക് സിസ്റ്റമാണ് RTS Smart Print. ഉപഭോക്താക്കൾക്ക് QR സ്കാൻ ചെയ്ത് ഫയലുകൾ അപ്‌ലോഡ് ചെയ്ത് 0% കമ്മീഷനിൽ നേരിട്ട് UPI വഴി പണമടച്ച് പ്രിന്റ് എടുക്കാം.'
  },
  {
    id: 'how_order',
    label: '📱 How a customer orders',
    answerEn: '5 Simple Steps: 1. Scan Counter QR Code -> 2. Upload PDF/Image & choose copies/color -> 3. Pay via Direct UPI or Cash -> 4. Live Order appears on Shop PC -> 5. Prints via Auto-Pilot Mode (automatic after payment) or Manual Mode (after shop approval).',
    answerMl: '5 ഘട്ടങ്ങൾ: 1. കടയിലെ QR സ്കാൻ ചെയ്യുന്നു -> 2. ഫയൽ അപ്‌ലോഡ് ചെയ്യുന്നു -> 3. UPI/Cash പേയ്‌മെന്റ് നൽകുന്നു -> 4. ഓർഡർ കമ്പ്യൂട്ടറിലെ Live Print Queue-ൽ എത്തുന്നു -> 5. Auto-Pilot Mode അഥവാ Manual Mode വഴി പ്രിന്റ് ചെയ്യുന്നു.'
  },
  {
    id: 'pricing',
    label: '💰 How pricing works',
    answerEn: 'Starter Station is ₹199/month (Indian Rupees ₹) and includes a 7-Day Free Trial. There is 0% platform commission on your customer payments.',
    answerMl: 'Starter Station പ്ലാൻ പ്രതിമാസം ₹199 ആണ് (7 ദിവസത്തെ സൗജന്യ ട്രയൽ ലഭ്യമാണ്). കസ്റ്റമർ പേയ്‌മെന്റുകൾക്ക് 0% കമ്മീഷനാണ്.'
  },
  {
    id: 'file_deletion',
    label: '⏱️ How long files are kept (1, 4, 12, 24h)',
    answerEn: 'Customer privacy first: Uploaded files are automatically removed from the dashboard and database based on the schedule set by the shop (1 hour, 4 hours, 12 hours, or 24 hours).',
    answerMl: 'Customer privacy first: കടയുടമ തിരഞ്ഞെടുക്കുന്ന സമയക്രമം അനുസരിച്ച് (1 മണിക്കൂർ, 4 മണിക്കൂർ, 12 മണിക്കൂർ, അല്ലെങ്കിൽ 24 മണിക്കൂർ) ഫയലുകൾ dashboard-ൽ നിന്നും database-ൽ നിന്നും തനിയെ നീക്കം ചെയ്യപ്പെടും.'
  },
  {
    id: 'print_modes',
    label: '⚙️ Auto-Pilot Mode vs Manual Mode',
    answerEn: 'Auto-Pilot Mode prints automatically after payment is confirmed. Manual Mode holds the job in the Live Print Queue and prints only after the shop approves each order.',
    answerMl: 'Auto-Pilot Mode-ൽ പേയ്‌മെന്റ് കൺഫേം ആയ ഉടൻ പ്രിന്റ് ആകുന്നു. Manual Mode-ൽ കടയുടമ ഓർഡർ പരിശോധിച്ച് അപ്രൂവ് ചെയ്ത ശേഷം മാത്രം പ്രിന്റ് ആകുന്നു.'
  },
  {
    id: 'start_trial',
    label: '🚀 How to start a trial or sign up',
    answerEn: 'Click "Activate Free Trial" on this page and fill in your Shop Name, WhatsApp number, Email, and Printer Model to register your station.',
    answerMl: 'ഈ പേജിലെ "സൗജന്യ ട്രയൽ ആരംഭിക്കൂ" എന്ന ബട്ടൺ ക്ലിക്ക് ചെയ്ത് നിങ്ങളുടെ കടയുടെ പേര്, ഫോൺ നമ്പർ, ഇമെയിൽ എന്നിവ പൂരിപ്പിച്ച് സൈൻ അപ്പ് ചെയ്യാം.'
  },
  {
    id: 'contact_support',
    label: '✉️ How to contact RTS Support',
    answerEn: 'You can reach RTS Reliable Technology Services Support directly at info@rtsdigitalseva.online or click the "Contact RTS Support" button on this page.',
    answerMl: 'സഹായത്തിനായി info@rtsdigitalseva.online എന്ന ഇമെയിലിലോ പേജിലെ "Contact RTS Support" ബട്ടൺ വഴിയോ ബന്ധപ്പെടാവുന്നതാണ്.'
  }
];

// Set to your own RTS tutorial YouTube embed URL once ready. Leave empty string "" to hide third-party video embeds.
const OWN_TUTORIAL_VIDEO_URL = "";

export const BusinessLandingPage: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'ml'>('ml');
  const t = TEXTS[lang];

  const [dbPlans, setDbPlans] = useState<PlatformPlan[]>([]);
  const [superAdminAnnouncement, setSuperAdminAnnouncement] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<TrustModalType>(null);

  // Chat Widget State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '👋 Namaskaram! Welcome to RTS Smart Print Support (RTS Reliable Technology Services). నമസ്കാരം! എങ്ങനെ സഹായിക്കാനാകും? Tap a topic below:'
    }
  ]);

  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    city: '',
    selectedPlan: 'starter_monthly',
    printerModel: '',
    message: ''
  });

  // Update SEO Title, Meta Description & Lang Attribute Dynamically
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = "RTS Smart Print: QR Print & Pay for Shops | RTS Reliable Technology Services";
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        "Customers scan your shop's QR code, upload files, and pay by UPI with 0% commission. Your shop prints automatically or after your approval."
      );
    }
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute(
        'content',
        "RTS Smart Print, QR print payment, UPI print kiosk, print shop software"
      );
    }
  }, [lang]);

  // Load Plans & Super Admin Dynamic Announcement Box (Real-time enabled)
  useEffect(() => {
    async function loadPlansAndAnnouncements() {
      try {
        // 1. Load active plans
        const { data, error } = await supabase
          .from('platform_plans')
          .select('*')
          .eq('is_active', true)
          .order('offer_price', { ascending: true });

        if (!error && data && data.length > 0) {
          setDbPlans(data as PlatformPlan[]);
          // Check if Super Admin stored a landing announcement in platform_plans
          const msgFromPlan = data.find((p: any) => p.landing_message && p.landing_message.trim() !== '')?.landing_message;
          if (msgFromPlan) {
            setSuperAdminAnnouncement(msgFromPlan);
          }
        }

        // 2. Also check site_announcements table (if created) or default shop landing_message
        const { data: announceData } = await supabase
          .from('site_announcements')
          .select('message')
          .eq('id', 1)
          .maybeSingle();

        if (announceData?.message) {
          setSuperAdminAnnouncement(announceData.message);
        } else {
          const { data: shopNotice } = await supabase
            .from('shops')
            .select('landing_message')
            .not('landing_message', 'is', null)
            .limit(1)
            .maybeSingle();
          if (shopNotice?.landing_message) {
            setSuperAdminAnnouncement(shopNotice.landing_message);
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic plans or announcements:', err);
      }
    }

    loadPlansAndAnnouncements();

    const channel = supabase
      .channel('landing-updates-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_plans' }, () => loadPlansAndAnnouncements())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_announcements' }, () => loadPlansAndAnnouncements())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shops' }, () => loadPlansAndAnnouncements())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await supabase.from('shop_inquiries').insert([
        {
          business_name: formData.businessName,
          owner_name: formData.ownerName,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          selected_plan: formData.selectedPlan,
          printer_model: formData.printerModel,
          message: formData.message,
        }
      ]);

      await fetch('https://script.google.com/macros/s/AKfycbytAx6dxUypNjcrwCHWh537MguDjcvVYqdduYfe4k9_d3-x_HW8xPwc3vxt2NxTpNs/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          ownerName: formData.ownerName,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          selectedPlan: formData.selectedPlan,
          printerModel: formData.printerModel
        })
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      alert('Error submitting inquiry. Please contact RTS Support at info@rtsdigitalseva.online.');
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById('inquiry-form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPricing = () => {
    document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToSupport = () => {
    document.getElementById('rts-support-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Chat Bot Handlers (Strictly bounded to approved answers)
  const handleSelectChatTopic = (option: typeof CHAT_FAQ_OPTIONS[0]) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: option.label
    };
    const botReply: ChatMessage = {
      id: `b-${Date.now() + 1}`,
      sender: 'bot',
      text: lang === 'en' ? option.answerEn : `${option.answerMl}\n\n(${option.answerEn})`
    };
    setChatMessages((prev) => [...prev, userMsg, botReply]);
  };

  const handleSendCustomChat = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed
    };

    let matchedOption = null;
    if (lower.includes('price') || lower.includes('cost') || lower.includes('plan') || lower.includes('199')) {
      matchedOption = CHAT_FAQ_OPTIONS.find(o => o.id === 'pricing');
    } else if (lower.includes('delete') || lower.includes('privacy') || lower.includes('hour') || lower.includes('keep') || lower.includes('storage')) {
      matchedOption = CHAT_FAQ_OPTIONS.find(o => o.id === 'file_deletion');
    } else if (lower.includes('trial') || lower.includes('sign up') || lower.includes('register') || lower.includes('start')) {
      matchedOption = CHAT_FAQ_OPTIONS.find(o => o.id === 'start_trial');
    } else if (lower.includes('order') || lower.includes('scan') || lower.includes('step')) {
      matchedOption = CHAT_FAQ_OPTIONS.find(o => o.id === 'how_order');
    } else if (lower.includes('contact') || lower.includes('email') || lower.includes('support') || lower.includes('help')) {
      matchedOption = CHAT_FAQ_OPTIONS.find(o => o.id === 'contact_support');
    } else if (lower.includes('what is') || lower.includes('about')) {
      matchedOption = CHAT_FAQ_OPTIONS.find(o => o.id === 'what_is');
    }

    const fallbackText = lang === 'en'
      ? "Thank you for your message. RTS Support will reply personally during working hours (9:00 AM – 7:00 PM IST). Please click 'Contact RTS Support' below or email info@rtsdigitalseva.online."
      : "നിങ്ങളുടെ സന്ദേശത്തിന് നന്ദി. പ്രവൃത്തി സമയങ്ങളിൽ (9:00 AM – 7:00 PM IST) RTS Support ടീം മറുപടി നൽകുന്നതാണ്. കൂടുതൽ സഹായത്തിനായി താഴെ കാണുന്ന 'Contact RTS Support' ക്ലിക്ക് ചെയ്യുക അല്ലെങ്കിൽ info@rtsdigitalseva.online-ൽ ഇമെയിൽ ചെയ്യുക.";

    const botReply: ChatMessage = {
      id: `b-${Date.now() + 1}`,
      sender: 'bot',
      text: matchedOption
        ? (lang === 'en' ? matchedOption.answerEn : matchedOption.answerMl)
        : fallbackText
    };

    setChatMessages((prev) => [...prev, userMsg, botReply]);
    setChatInput('');
  };

  const firstPlan = dbPlans[0];
  const confirmedMonthlyPrice = firstPlan?.offer_price || 199;
  const customTrialDays = firstPlan?.form_trial_days || String(firstPlan?.trial_days || 7);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      {/* Top Navigation (Mobile 375px+ optimized) */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-3 px-3 sm:px-6 flex justify-between items-center sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-base sm:text-lg shadow-lg shadow-emerald-500/20 shrink-0">
            ⚡
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm sm:text-base leading-tight tracking-tight">RTS Smart Print</h1>
            <p className="text-[9px] sm:text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
              RTS Reliable Technology Services
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'ml' : 'en')}
            aria-label="Switch Language"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-[11px] sm:text-xs font-bold text-slate-200 transition"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{lang === 'en' ? 'മലയാളം' : 'English'}</span>
          </button>
          
          <button
            type="button"
            onClick={scrollToForm}
            className="text-[11px] sm:text-xs font-black px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition flex items-center gap-1"
          >
            <span>{t.applyNowBtn}</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          </button>
        </div>
      </header>

      {/* SUPER ADMIN DYNAMIC OFFERS & UPDATES MESSAGE BOX (Appears right below header as requested) */}
      {superAdminAnnouncement && (
        <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4">
          <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border-2 border-emerald-500/50 rounded-2xl p-3.5 sm:p-4 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  {lang === 'en' ? 'Latest Offer & Update' : 'പ്രത്യേക അറിയിപ്പും ഓഫറുകളും'}
                </span>
                <p className="text-xs sm:text-sm font-bold text-white mt-0.5 leading-snug">
                  {superAdminAnnouncement}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={scrollToForm}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] rounded-xl transition shrink-0"
            >
              <span>Claim Now</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-10 sm:pt-16 sm:pb-14 px-3 sm:px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-slate-950 -z-10" />
        
        <div className="max-w-4xl mx-auto text-center space-y-5">
          {/* Dual Badge & Trust Line */}
          <div className="inline-flex flex-col items-center gap-2 max-w-xl mx-auto">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] sm:text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
              {t.heroBadge}
            </span>
            <p className="text-[11px] sm:text-xs font-medium text-slate-400 leading-relaxed px-2">
              {t.heroTrustLine}{' '}
              <button
                type="button"
                onClick={() => setActiveModal('privacy')}
                className="text-emerald-400 hover:underline font-bold inline-flex items-center gap-0.5"
              >
                {t.privacyLinkText}
              </button>
            </p>
          </div>

          <h2 className="text-2xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.2]">
            {t.heroTitle}
          </h2>

          <p className="text-slate-300 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed">
            {t.heroDesc}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={scrollToForm}
              className="px-5 sm:px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-900/30 transition transform hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              <span>{t.applyNowBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={scrollToPricing}
              className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs sm:text-sm rounded-2xl border border-slate-800 transition"
            >
              {t.viewPlansBtn}
            </button>
          </div>

          {/* Quick Stats Strip */}
          <div className="pt-6 grid grid-cols-3 gap-2 sm:gap-4 max-w-xl mx-auto border-t border-slate-800/80">
            <div>
              <p className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">0%</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Commission</p>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-white font-mono">100%</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Direct UPI</p>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-teal-400 font-mono">1h–24h</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Auto-Deletion</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Highlights */}
      <section className="max-w-5xl mx-auto px-3 sm:px-4 py-6 grid md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-2.5 shadow-md hover:border-slate-700 transition">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold border border-emerald-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">{t.privacyTitle}</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">{t.privacyDesc}</p>
          <button
            type="button"
            onClick={() => setActiveModal('privacy')}
            className="text-[11px] font-bold text-emerald-400 hover:underline inline-block pt-1"
          >
            {t.privacyLinkText}
          </button>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-2.5 shadow-md hover:border-slate-700 transition">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold border border-emerald-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">{t.upiTitle}</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">{t.upiDesc}</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-2.5 shadow-md hover:border-slate-700 transition">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">{t.safeTitle}</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">{t.safeDesc}</p>
        </div>
      </section>

      {/* Dedicated Section: Customer Privacy & File-Deletion Schedule */}
      <section className="max-w-5xl mx-auto px-3 sm:px-4 py-6">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 p-6 sm:p-10 rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mb-2">
                Customer Privacy First
              </span>
              <h3 className="text-lg sm:text-2xl font-black text-white">
                {t.storageHeadline}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {t.storageSub}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/20">
              <ServerOff className="w-6 h-6" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
            {/* Point 1 */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <HardDrive className="w-4 h-4 shrink-0" />
                <h4>{t.storageP1Title}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.storageP1Desc}
              </p>
            </div>

            {/* Point 2 */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <Sliders className="w-4 h-4 shrink-0" />
                <h4>{t.storageP2Title}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.storageP2Desc}
              </p>
              <div className="flex gap-1.5 pt-1">
                {['1h', '4h', '12h', '24h'].map((time) => (
                  <span key={time} className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-teal-300">
                    {time}
                  </span>
                ))}
              </div>
            </div>

            {/* Point 3 */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Trash2 className="w-4 h-4 shrink-0" />
                <h4>{t.storageP3Title}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t.storageP3Desc}
              </p>
              <button
                type="button"
                onClick={() => setActiveModal('privacy')}
                className="text-[11px] font-bold text-emerald-400 hover:underline inline-block pt-1"
              >
                {t.privacyLinkText}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Visual 5-Step Process (With clear readable text badges under decorative icons for 375px phones) */}
      <section className="max-w-5xl mx-auto px-3 sm:px-4 py-6 space-y-6">
        
        {/* Only renders when RTS's own tutorial video URL is set (third-party channel embed removed per Task 8) */}
        {OWN_TUTORIAL_VIDEO_URL && (
          <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
            <div className="grid md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-4 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <PlayCircle className="w-3.5 h-3.5" />
                  {t.videoBadge}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {t.videoTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {t.videoSub}
                </p>
              </div>
              <div className="md:col-span-5 flex justify-center">
                <div className="w-full max-w-[300px] aspect-[9/16] rounded-3xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl bg-slate-950">
                  <iframe
                    className="w-full h-full"
                    src={OWN_TUTORIAL_VIDEO_URL}
                    title="RTS Smart Print Official Tutorial"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. How RTS Smart Print Works (5-Step Cards with large mobile-readable headings) */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-8 rounded-3xl space-y-6 shadow-md">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Step-By-Step Workflow</span>
            <h3 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />
              <span>{lang === 'en' ? "1. How RTS Smart Print Works at Your Shop" : "1. RTS Smart Print എങ്ങനെ പ്രവർത്തിക്കുന്നു?"}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              {lang === 'en' 
                ? "A seamless 5-step workflow that routes mobile customer documents to your shop's Live Print Queue."
                : "കടകളിൽ വരുന്ന പ്രിന്റിംഗ് ഓർഡറുകൾ മൊബൈൽ വഴി സ്വീകരിക്കാനും, കമ്പ്യൂട്ടറിലെ Live Print Queue വഴി പ്രിന്റ് ചെയ്യാനും സഹായിക്കുന്ന 5 ഘട്ടങ്ങൾ."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step1_scan_qr_code.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md inline-block">
                  {lang === 'en' ? "Step 1 • Print Standee" : "ഘട്ടം 1 • Print Standee"}
                </span>
                <h4 className="font-extrabold text-base text-white mt-2">
                  {lang === 'en' ? "Customer Scans Counter QR" : "QR Code സ്കാൻ ചെയ്യുക"}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {lang === 'en' 
                    ? "Customer scans your shop's Print Standee QR code using their phone camera to open your upload page."
                    : "കടയിൽ വെച്ചിട്ടുള്ള Print Standee-ലെ QR Code ഉപഭോക്താവ് ഫോൺ ക്യാമറ ഉപയോഗിച്ച് സ്കാൻ ചെയ്യുന്നു."}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step2_upload_file.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md inline-block">
                  {lang === 'en' ? "Step 2 • Document Upload" : "ഘട്ടം 2 • ഫയൽ അപ്‌ലോഡ്"}
                </span>
                <h4 className="font-extrabold text-base text-white mt-2">
                  {lang === 'en' ? "Upload & Select Print Options" : "ഫയൽ അപ്‌ലോഡ് ചെയ്യുക"}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {lang === 'en' 
                    ? "Upload PDF or image files and choose copies, Black & White or Color, and page settings."
                    : "PDF അല്ലെങ്കിൽ ചിത്രങ്ങൾ അപ്‌ലോഡ് ചെയ്യാം. കോപ്പികളുടെ എണ്ണം, കളർ അല്ലെങ്കിൽ ബ്ലാക്ക് ആൻഡ് വൈറ്റ് എന്നിവ തിരഞ്ഞെടുക്കാം."}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step3_pay_amount.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md inline-block">
                  {lang === 'en' ? "Step 3 • Dynamic Page Rate" : "ഘട്ടം 3 • Dynamic Page Rate"}
                </span>
                <h4 className="font-extrabold text-base text-white mt-2">
                  {lang === 'en' ? "Direct UPI or Cash Payment" : "തുകയും പേയ്‌മെന്റും"}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {lang === 'en' 
                    ? "The total is calculated automatically using your Dynamic Page Rate. Customer pays via Direct UPI (0% commission) or cash at counter."
                    : "നിരക്കുകൾ അനുസരിച്ച് തുക കാണിക്കുന്നു. 0% കമ്മീഷനിൽ നേരിട്ട് UPI വഴിയോ കൗണ്ടറിൽ പണമായോ നൽകാം."}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step4_order_received.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md inline-block">
                  {lang === 'en' ? "Step 4 • Live Print Queue" : "ഘട്ടം 4 • Live Print Queue"}
                </span>
                <h4 className="font-extrabold text-base text-white mt-2">
                  {lang === 'en' ? "Order Lands in Live Print Queue" : "ഓർഡർ കമ്പ്യൂട്ടറിൽ എത്തുന്നു"}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {lang === 'en' 
                    ? "Incoming order appears immediately in your Shop Admin Live Print Queue and Windows Print Agent."
                    : "ഓർഡർ നിങ്ങളുടെ കമ്പ്യൂട്ടറിലെ Live Print Queue-ലും RTS Windows Print Agent-ലും തൽക്ഷണം ലഭിക്കുന്നു."}
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
              <div>
                <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step5_auto_print.png" alt="" aria-hidden="true" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md inline-block">
                  {lang === 'en' ? "Step 5 • Auto-Pilot / Manual Mode" : "ഘട്ടം 5 • Auto-Pilot / Manual Mode"}
                </span>
                <h4 className="font-extrabold text-base text-white mt-2">
                  {lang === 'en' ? "Auto-Pilot or Manual Mode Print" : "Auto-Pilot / Manual പ്രിന്റിംഗ്"}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {lang === 'en' 
                    ? "Auto-Pilot Mode prints automatically after payment is confirmed. Manual Mode prints after the shop approves each order."
                    : "Auto-Pilot Mode-ൽ പേയ്‌മെന്റ് കൺഫേം ആയ ഉടൻ പ്രിന്റ് ആകുന്നു. Manual Mode-ൽ കടയുടമ അപ്രൂവ് ചെയ്ത ശേഷം പ്രിന്റ് ചെയ്യുന്നു."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmed Facilities for Shop Owners (Matching exact dashboard labels) */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-8 rounded-3xl space-y-4 shadow-md">
          <h3 className="text-lg sm:text-2xl font-black text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Store className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />
            <span>{lang === 'en' ? "2. Confirmed Dashboard & Counter Features" : "2. കടയുടമയ്ക്ക് ലഭിക്കുന്ന പ്രധാന സൗകര്യങ്ങൾ"}</span>
          </h3>
          <ul className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-300">
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>
                <strong>Print Standee:</strong>{' '}
                {lang === 'en' ? "Printable counter QR code standee with optional access PIN." : "ഉപഭോക്താക്കൾക്ക് സ്കാൻ ചെയ്യാൻ കൗണ്ടർ QR Code Print Standee."}
              </span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>
                <strong>Counter Configuration:</strong>{' '}
                {lang === 'en' ? "Manage shop name, UPI ID, printer selection, and PIN settings." : "കടയുടെ പേര്, UPI ID, പ്രിന്റർ എന്നിവ ക്രമീകരിക്കാനുള്ള സൗകര്യം."}
              </span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>
                <strong>Dynamic Page Rate:</strong>{' '}
                {lang === 'en' ? "Configure per-page rates for Black & White and Color printing." : "ബ്ലാക്ക് & വൈറ്റ്, കളർ പ്രിന്റിംഗ് നിരക്കുകൾ ക്രമീകരിക്കാം."}
              </span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>
                <strong>Live Print Queue:</strong>{' '}
                {lang === 'en' ? "View incoming PDF and image orders in real time with 0% commission UPI/Cash options." : "വരുന്ന ഓർഡറുകൾ തത്സമയം കാണാനും കൈകാര്യം ചെയ്യാനുമുള്ള ക്യൂ."}
              </span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>
                <strong>Auto-Pilot Mode & Manual Mode:</strong>{' '}
                {lang === 'en' ? "Print automatically after payment confirmation, or hold until counter approval." : "പേയ്‌മെന്റിന് ശേഷം തനിയെ പ്രിന്റ് ആകുന്ന രീതി അല്ലെങ്കിൽ മാന്വൽ അപ്രൂവൽ."}
              </span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>
                <strong>Scheduled File Deletion:</strong>{' '}
                {lang === 'en' ? "Automatic removal from dashboard and database after 1h, 4h, 12h, or 24h." : "1h, 4h, 12h, 24h സമയക്രമത്തിൽ ഫയലുകൾ നീക്കം ചെയ്യാനുള്ള സൗകര്യം."}
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Subscription Pricing Cards (Task 5: Starter Station ₹199/mo, no strikethrough prices, Pro trial line removed) */}
      <section className="max-w-4xl mx-auto px-3 sm:px-4 py-8" id="pricing-section">
        <div className="text-center mb-8 space-y-1.5">
          <span className="text-[11px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full inline-flex items-center gap-1">
            <Tag className="w-3 h-3" /> {t.trialBadge}
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-white">{t.plansTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-400">{t.plansSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {dbPlans.length > 0 ? (
            dbPlans.map((plan) => {
              const isPro = plan.plan_slug.includes('pro');
              const displayPrice = !isPro ? 199 : plan.offer_price;

              return (
                <div 
                  key={plan.id}
                  className={`bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-xl relative flex flex-col justify-between ${
                    isPro ? 'border border-slate-800 opacity-90' : 'border-2 border-emerald-500/80 shadow-emerald-950/30'
                  }`}
                >
                  {isPro ? (
                    <span className="absolute top-4 right-4 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                      Coming Soon
                    </span>
                  ) : (
                    <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                      {plan.badge_text || 'Popular Choice'}
                    </span>
                  )}

                  <div>
                    <h4 className="font-extrabold text-xl text-white">
                      {isPro ? plan.name : 'Starter Station'}
                    </h4>
                    <div className="mt-3 mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white font-mono">₹{displayPrice}</span>
                        <span className="text-xs text-slate-400 capitalize">/month</span>
                      </div>
                      {/* Free trial line shown ONLY on Starter plan, removed from Pro Digital Seva card */}
                      {!isPro && (
                        <p className="text-xs text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {plan.trial_days || 7}-Day Free Trial Included
                        </p>
                      )}
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 ${isPro ? 'text-slate-500' : 'text-emerald-400'}`} /> Counter Configuration & Print Standee</li>
                      <li className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 ${isPro ? 'text-slate-500' : 'text-emerald-400'}`} /> Live Print Queue & Dynamic Page Rate</li>
                      <li className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 ${isPro ? 'text-slate-500' : 'text-emerald-400'}`} /> Auto-Pilot Mode & Manual Mode</li>
                      <li className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 ${isPro ? 'text-slate-500' : 'text-emerald-400'}`} /> 0% Commission Direct UPI & Cash Support</li>
                      <li className="flex items-center gap-2"><Check className={`w-4 h-4 flex-shrink-0 ${isPro ? 'text-slate-500' : 'text-emerald-400'}`} /> Scheduled File Deletion (1h, 4h, 12h, 24h)</li>
                    </ul>
                  </div>

                  {isPro ? (
                    <button
                      type="button"
                      disabled
                      className="mt-6 w-full py-2.5 bg-slate-800 text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed border border-slate-700"
                    >
                      Coming Soon
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, selectedPlan: plan.plan_slug }));
                        scrollToForm();
                      }}
                      className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition shadow-md"
                    >
                      Select Starter Station
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <>
              {/* Confirmed Starter Station Card */}
              <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between relative">
                <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                  Popular Choice
                </span>
                <div>
                  <h4 className="font-extrabold text-xl text-white">Starter Station</h4>
                  <div className="mt-3 mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white font-mono">₹199</span>
                      <span className="text-xs text-slate-400">/month</span>
                    </div>
                    <p className="text-xs text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      7-Day Free Trial Included
                    </p>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Counter Configuration & Print Standee</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Live Print Queue & Dynamic Page Rate</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Auto-Pilot Mode & Manual Mode</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 0% Commission Direct UPI & Cash Support</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Scheduled File Deletion (1h, 4h, 12h, 24h)</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, selectedPlan: 'starter_monthly' }));
                    scrollToForm();
                  }}
                  className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition shadow-md"
                >
                  Select Starter Station
                </button>
              </div>

              {/* Pro Digital Seva Card (Coming Soon, No Free Trial line, Disabled Button) */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between relative opacity-90">
                <span className="absolute top-4 right-4 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                  Coming Soon
                </span>
                <div>
                  <h4 className="font-extrabold text-xl text-white">Pro Digital Seva</h4>
                  <div className="mt-3 mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-400 font-mono">Coming Soon</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-400">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-500" /> All Starter Station Features</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-500" /> Advanced Multi-Counter Controls</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-500" /> Extended Analytics & Reports</li>
                  </ul>
                </div>
                <button
                  type="button"
                  disabled
                  className="mt-6 w-full py-3 bg-slate-800 text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed border border-slate-700"
                >
                  Coming Soon
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">
          {t.pricingFootnote}
        </p>
      </section>

      {/* Inquiry Registration Form (Task 10 compliant) */}
      <section id="inquiry-form-section" className="max-w-xl mx-auto px-3 sm:px-4 py-8">
        <div className="bg-slate-900 border border-slate-800 p-5 sm:p-8 rounded-3xl shadow-2xl">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black text-white">{t.successTitle}</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">{t.successDesc}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-xl font-black text-white">{t.formTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t.formSubtitle}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">{t.businessNameLabel}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Friends Xerox & Janasevana Kendra"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t.ownerNameLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t.whatsappLabel}</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t.emailLabel}</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t.cityLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder="City / Town in Kerala"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t.planLabel}</label>
                  <select
                    value={formData.selectedPlan}
                    onChange={(e) => setFormData({ ...formData, selectedPlan: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="starter_monthly">Starter Station (₹{confirmedMonthlyPrice}/month)</option>
                    <option value="trial_7">{customTrialDays}-Day Free Trial (₹0)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t.printerLabel}</label>
                  <input
                    type="text"
                    placeholder="e.g. HP, Canon, Epson, Brother"
                    value={formData.printerModel}
                    onChange={(e) => setFormData({ ...formData, printerModel: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2 mt-3 text-xs uppercase tracking-wider"
              >
                {loading ? t.btnSubmitting : t.btnSubmit}
              </button>

              <div className="text-[11px] text-center text-slate-400 space-y-1 pt-1">
                <p>
                  {t.formPrivacyNote}{' '}
                  <button
                    type="button"
                    onClick={() => setActiveModal('privacy')}
                    className="text-emerald-400 hover:underline font-semibold"
                  >
                    Privacy Policy
                  </button>
                </p>
                <p className="text-slate-500">
                  RTS Smart Print, a product of RTS Reliable Technology Services (info@rtsdigitalseva.online).
                </p>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Dedicated Support Section (Task 2 compliant) */}
      <section id="rts-support-section" className="max-w-4xl mx-auto px-3 sm:px-4 py-8">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4">
          <h3 className="text-lg sm:text-xl font-black text-white">{t.supportSectionTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            <strong>RTS Smart Print, a product of RTS Reliable Technology Services</strong> • Location: Kerala, India
          </p>
          <p className="text-xs text-slate-400">
            Official Support Email:{' '}
            <a href="mailto:info@rtsdigitalseva.online" className="text-emerald-400 font-bold hover:underline">
              info@rtsdigitalseva.online
            </a>
          </p>
          <div className="pt-1 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:info@rtsdigitalseva.online?subject=RTS%20Smart%20Print%20Support%20Request"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition inline-flex items-center gap-2 shadow"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{t.contactSupportBtn}</span>
            </a>
            <button
              type="button"
              onClick={() => setActiveModal('about')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition"
            >
              About Us
            </button>
          </div>
        </div>
      </section>

      {/* Standardized Footer (Task 1, 2, 3, 15 compliant) */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 px-4 text-center text-xs text-slate-400 space-y-3 pb-24">
        <p className="font-bold text-slate-200">
          © 2026 RTS Smart Print. A product of RTS Reliable Technology Services, Kerala, India.
        </p>
        <p className="text-[11px] sm:text-xs text-slate-400">
          Our other service:{' '}
          <a
            href="https://rtsdigitalseva.online/"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 font-semibold hover:underline"
          >
            RTS Digital Seva
          </a>{' '}
          <span className="text-slate-500">
            (an online citizen services portal in Kerala, also owned and operated by RTS Reliable Technology Services)
          </span>{' '}
          | Contact:{' '}
          <a href="mailto:info@rtsdigitalseva.online" className="text-emerald-400 hover:underline">
            info@rtsdigitalseva.online
          </a>
        </p>

        <div className="pt-1">
          <button
            type="button"
            onClick={scrollToSupport}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 rounded-xl text-[11px] font-bold transition"
          >
            Contact RTS Support
          </button>
        </div>

        {/* Footer Legal & Trust Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pt-2 text-[11px] font-semibold text-slate-400">
          <button type="button" onClick={() => setActiveModal('privacy')} className="hover:text-emerald-400 transition">
            Privacy Policy
          </button>
          <span className="text-slate-700">|</span>
          <button type="button" onClick={() => setActiveModal('terms')} className="hover:text-emerald-400 transition">
            Terms and Conditions
          </button>
          <span className="text-slate-700">|</span>
          <button type="button" onClick={() => setActiveModal('refund')} className="hover:text-emerald-400 transition">
            Refund Policy
          </button>
          <span className="text-slate-700">|</span>
          <button type="button" onClick={() => setActiveModal('about')} className="hover:text-emerald-400 transition">
            About Us
          </button>
          <span className="text-slate-700">|</span>
          <button type="button" onClick={() => setActiveModal('contact')} className="hover:text-emerald-400 transition">
            Contact
          </button>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* TRUST & LEGAL MODALS (Privacy, Terms, Refund, About Us, Contact)          */}
      {/* ========================================================================= */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white uppercase tracking-wide">
                {activeModal === 'privacy' && 'Privacy Policy'}
                {activeModal === 'terms' && 'Terms and Conditions'}
                {activeModal === 'refund' && 'Refund Policy'}
                {activeModal === 'about' && 'About Us'}
                {activeModal === 'contact' && 'Contact RTS Support'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeModal === 'about' && (
              <div className="space-y-3 leading-relaxed">
                <p>
                  <strong>Company:</strong> RTS Reliable Technology Services
                </p>
                <p>
                  <strong>Location:</strong> Kerala, India
                </p>
                <p>
                  <strong>What RTS Smart Print Does:</strong> RTS Smart Print, a product of RTS Reliable Technology Services, is a zero-touch automated printing kiosk system for print shops. Customers scan a counter QR code, upload documents, and pay via UPI with 0% commission, while shops print orders automatically in Auto-Pilot Mode or after approval in Manual Mode.
                </p>
                <p>
                  <strong>Related Service:</strong> RTS Digital Seva (<a href="https://rtsdigitalseva.online/" target="_blank" rel="noreferrer" className="text-emerald-400 underline">https://rtsdigitalseva.online/</a>) is an online citizen services portal in Kerala, also owned and operated by RTS Reliable Technology Services.
                </p>
                <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
                  <strong>Clarification:</strong> RTS Smart Print (rtsprint.online) is operated by RTS Reliable Technology Services in Kerala, India, and is not connected to any business in the UK that uses rtsprint.co.uk.
                </p>
                <p>
                  <strong>Contact Email:</strong>{' '}
                  <a href="mailto:info@rtsdigitalseva.online" className="text-emerald-400 font-bold underline">
                    info@rtsdigitalseva.online
                  </a>
                </p>
                <div className="pt-2">
                  <a
                    href="mailto:info@rtsdigitalseva.online?subject=RTS%20Smart%20Print%20Inquiry"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Contact RTS Support</span>
                  </a>
                </div>
              </div>
            )}

            {activeModal === 'privacy' && (
              <div className="space-y-3 leading-relaxed">
                <p>
                  <strong>Operator:</strong> RTS Smart Print, a product of RTS Reliable Technology Services, Kerala, India.
                </p>
                <p>
                  <strong>Customer Privacy First & File-Deletion Schedule:</strong> Documents uploaded by customers for printing are transmitted over encrypted connections for queuing at the selected shop counter. Files are deleted automatically from the dashboard and database after the retention time chosen by the shop: <strong>1 hour, 4 hours, 12 hours, or 24 hours</strong>.
                </p>
                <p>
                  <strong>Sign-Up Information:</strong> Shop owner details submitted through the registration form (business name, owner name, phone number, email, and city) are used only to contact you about RTS Smart Print setup and support.
                </p>
                <p>
                  <strong>Privacy Contact:</strong> For any privacy questions, email{' '}
                  <a href="mailto:info@rtsdigitalseva.online" className="text-emerald-400 underline">
                    info@rtsdigitalseva.online
                  </a>.
                </p>
              </div>
            )}

            {activeModal === 'terms' && (
              <div className="space-y-3 leading-relaxed">
                <p>
                  <strong>1. Service Provider:</strong> RTS Smart Print is developed and operated by RTS Reliable Technology Services, Kerala, India.
                </p>
                <p>
                  <strong>2. Software Licence:</strong> Subscribing shops receive a non-transferable licence to use the RTS Smart Print web dashboard, QR Print Standee, and Windows Print Agent for their designated counter.
                </p>
                <p>
                  <strong>3. Payment & Settlement Terms:</strong> Customer print payments made via Direct UPI are settled directly between the customer and the shop's configured UPI ID with 0% platform commission. Shop subscription fees (Starter Station ₹199/month) are billed in Indian Rupees (₹) after the applicable free trial period.
                </p>
                <p>
                  <strong>4. Printing Modes:</strong> Shops can operate in Auto-Pilot Mode (prints automatically after payment confirmation) or Manual Mode (prints after shop approval).
                </p>
              </div>
            )}

            {activeModal === 'refund' && (
              <div className="space-y-3 leading-relaxed">
                <p>
                  <strong>Free Trial Before Billing:</strong> RTS Smart Print provides a 7-Day Free Trial on the Starter Station plan so shops can test printer compatibility and workflow before paying a subscription fee.
                </p>
                <p>
                  <strong>Subscription Cancellations & Refunds:</strong> Shop owners may cancel their monthly subscription at any time prior to the next billing cycle. If you experience a technical issue that prevents your station from operating, please contact RTS Support at{' '}
                  <a href="mailto:info@rtsdigitalseva.online" className="text-emerald-400 underline">
                    info@rtsdigitalseva.online
                  </a>{' '}
                  within 7 days of billing for review and resolution.
                </p>
              </div>
            )}

            {activeModal === 'contact' && (
              <div className="space-y-3 leading-relaxed">
                <p>
                  <strong>Company:</strong> RTS Reliable Technology Services
                </p>
                <p>
                  <strong>Product:</strong> RTS Smart Print
                </p>
                <p>
                  <strong>Location:</strong> Kerala, India
                </p>
                <p>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:info@rtsdigitalseva.online" className="text-emerald-400 font-bold underline">
                    info@rtsdigitalseva.online
                  </a>
                </p>
                <div className="pt-2 flex gap-2">
                  <a
                    href="mailto:info@rtsdigitalseva.online?subject=RTS%20Smart%20Print%20Support"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl inline-flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email RTS Support</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal(null);
                      scrollToForm();
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
                  >
                    Go to Sign-Up Form
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING SUPPORT CHAT WIDGET (Task 14 - Clean Professional Bot)          */}
      {/* ========================================================================= */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
        {chatOpen && (
          <div className="w-[340px] sm:w-[360px] max-w-[calc(100vw-24px)] bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden mb-3 flex flex-col">
            {/* Bot Header */}
            <div className="bg-teal-900 text-white px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-emerald-300 text-base">
                  ⚡
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-white leading-tight">RTS Smart Print Support Bot</h4>
                  <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online • Instant Reply
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg"
                aria-label="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="p-3.5 max-h-80 overflow-y-auto space-y-3 bg-slate-50 text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 max-w-[88%] whitespace-pre-line leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-teal-800 text-white font-semibold'
                        : 'bg-white border border-slate-200 text-slate-700 shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Approved Topic Quick-Reply Pills */}
              <div className="pt-1 flex flex-col gap-1.5">
                {CHAT_FAQ_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectChatTopic(opt)}
                    className="text-left px-3 py-2 rounded-full bg-slate-200/75 hover:bg-emerald-100 text-slate-800 font-bold text-[11px] transition border border-slate-300/60 w-fit"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Direct Contact RTS Support Button inside Chat */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Staff Hours: 9 AM – 7 PM IST</span>
                <button
                  type="button"
                  onClick={() => {
                    setChatOpen(false);
                    setActiveModal('contact');
                  }}
                  className="text-[11px] font-extrabold text-teal-700 hover:underline"
                >
                  Contact RTS Support →
                </button>
              </div>
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendCustomChat} className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type your question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-full outline-none focus:border-teal-600 text-slate-800"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs rounded-full transition flex items-center gap-1 shrink-0"
              >
                <span>Send</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </form>
          </div>
        )}

        {/* Floating Toggle Button */}
        <button
          type="button"
          onClick={() => setChatOpen(!chatOpen)}
          className="px-4 py-3 rounded-full bg-teal-700 hover:bg-teal-600 text-white font-extrabold text-xs shadow-xl flex items-center gap-2 border border-teal-500/40 transition transform hover:scale-105"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Help & Offers Chat</span>
        </button>
      </div>
    </div>
  );
};

export default BusinessLandingPage;
