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
  Bell
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
    videoBadge: "Live Video Demo",
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
    videoBadge: "തത്സമയ വീഡിയോ ഡെമോ",
    videoTitle: "നിങ്ങളുടെ പ്രിന്റിംഗ് കട ഇനി SMART ആക്കാം! 🚀",
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

export const BusinessLandingPage: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'ml'>('ml');
  const t = TEXTS[lang];

  const [dbPlans, setDbPlans] = useState<PlatformPlan[]>([]);
  const [superAdminAnnouncement, setSuperAdminAnnouncement] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<TrustModalType>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '👋 Namaskaram! Welcome to RTS Smart Print Support (RTS Reliable Technology Services). നമസ്കാരം! എങ്ങനെ സഹായിക്കാനാകും? Tap a topic below:'
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
    document.title = "RTS Smart Print: QR Print & Pay for Shops | RTS Reliable Technology Services";
  }, [lang]);

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
          const msgFromPlan = data.find((p: any) => p.landing_message && p.landing_message.trim() !== '')?.landing_message;
          if (msgFromPlan) setSuperAdminAnnouncement(msgFromPlan);
        }

        const { data: announceData } = await supabase
          .from('site_announcements')
          .select('message')
          .eq('id', 1)
          .maybeSingle();

        if (announceData?.message) {
          setSuperAdminAnnouncement(announceData.message);
        }
      } catch (err) {
        console.error('Failed to load plans:', err);
      }
    }

    loadPlansAndAnnouncements();
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

  const handleSelectChatTopic = (option: typeof CHAT_FAQ_OPTIONS[0]) => {
    setChatMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: 'user', text: option.label },
      { id: `b-${Date.now() + 1}`, sender: 'bot', text: lang === 'en' ? option.answerEn : option.answerMl }
    ]);
  };

  const handleSendCustomChat = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    let matchedOption = null;
    if (lower.includes('price') || lower.includes('cost') || lower.includes('199')) {
      matchedOption = CHAT_FAQ_OPTIONS.find(o => o.id === 'pricing');
    } else if (lower.includes('delete') || lower.includes('privacy') || lower.includes('hour')) {
      matchedOption = CHAT_FAQ_OPTIONS.find(o => o.id === 'file_deletion');
    } else if (lower.includes('trial') || lower.includes('sign up') || lower.includes('register')) {
      matchedOption = CHAT_FAQ_OPTIONS.find(o => o.id === 'start_trial');
    } else if (lower.includes('order') || lower.includes('scan')) {
      matchedOption = CHAT_FAQ_OPTIONS.find(o => o.id === 'how_order');
    } else if (lower.includes('contact') || lower.includes('email') || lower.includes('support')) {
      matchedOption = CHAT_FAQ_OPTIONS.find(o => o.id === 'contact_support');
    }

    const fallbackText = lang === 'en'
      ? "Thank you for your question. RTS Support will reply personally. Please click 'Contact RTS Support' or email info@rtsdigitalseva.online."
      : "നിങ്ങളുടെ ചോദ്യത്തിന് നന്ദി. RTS Support ടീം മറുപടി നൽകുന്നതാണ്. കൂടുതൽ സഹായത്തിനായി info@rtsdigitalseva.online-ൽ ബന്ധപ്പെടുക.";

    setChatMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: 'user', text: trimmed },
      { id: `b-${Date.now() + 1}`, sender: 'bot', text: matchedOption ? (lang === 'en' ? matchedOption.answerEn : matchedOption.answerMl) : fallbackText }
    ]);
    setChatInput('');
  };

  const firstPlan = dbPlans[0];
  const confirmedMonthlyPrice = firstPlan?.offer_price || 199;
  const customTrialDays = firstPlan?.form_trial_days || String(firstPlan?.trial_days || 7);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-3 px-3 sm:px-6 flex justify-between items-center sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-base sm:text-lg shadow-lg shadow-emerald-500/20 shrink-0">
            ⚡
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm sm:text-base leading-tight">RTS Smart Print</h1>
            <p className="text-[9px] sm:text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
              RTS Reliable Technology Services
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'ml' : 'en')}
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

      {/* SUPER ADMIN DYNAMIC OFFERS & UPDATES MESSAGE BOX */}
      {superAdminAnnouncement && (
        <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4">
          <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border-2 border-emerald-500/50 rounded-2xl p-3.5 sm:p-4 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  {lang === 'en' ? 'Special Offer & Update' : 'പ്രത്യേക അറിയിപ്പും ഓഫറുകളും'}
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
          <div className="inline-flex flex-col items-center gap-2 max-w-xl mx-auto">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] sm:text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
              {t.heroBadge}
            </span>
            <p className="text-[11px] sm:text-xs font-medium text-slate-400 leading-relaxed px-2">
              {t.heroTrustLine}{' '}
              <button
                type="button"
                onClick={() => setActiveModal('privacy')}
                className="text-emerald-400 hover:underline font-bold"
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
              className="px-5 sm:px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl transition inline-flex items-center gap-2"
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

      {/* Highlights */}
      <section className="max-w-5xl mx-auto px-3 sm:px-4 py-6 grid md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-2.5 shadow-md">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">{t.privacyTitle}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{t.privacyDesc}</p>
          <button
            type="button"
            onClick={() => setActiveModal('privacy')}
            className="text-[11px] font-bold text-emerald-400 hover:underline inline-block pt-1"
          >
            {t.privacyLinkText}
          </button>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-2.5 shadow-md">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">{t.upiTitle}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{t.upiDesc}</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl space-y-2.5 shadow-md">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">{t.safeTitle}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{t.safeDesc}</p>
        </div>
      </section>

      {/* Customer Privacy & File-Deletion Section */}
      <section className="max-w-5xl mx-auto px-3 sm:px-4 py-6">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 p-6 sm:p-10 rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mb-2">
                Customer Privacy First
              </span>
              <h3 className="text-lg sm:text-2xl font-black text-white">{t.storageHeadline}</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">{t.storageSub}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/20">
              <ServerOff className="w-6 h-6" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <HardDrive className="w-4 h-4 shrink-0" />
                <h4>{t.storageP1Title}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{t.storageP1Desc}</p>
            </div>

            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <Sliders className="w-4 h-4 shrink-0" />
                <h4>{t.storageP2Title}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{t.storageP2Desc}</p>
              <div className="flex gap-1.5 pt-1">
                {['1h', '4h', '12h', '24h'].map((time) => (
                  <span key={time} className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-teal-300">
                    {time}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Trash2 className="w-4 h-4 shrink-0" />
                <h4>{t.storageP3Title}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{t.storageP3Desc}</p>
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

      {/* Video Demo + 5-Step Process */}
      <section className="max-w-5xl mx-auto px-3 sm:px-4 py-6 space-y-6">
        {/* YouTube Video Demo Card above 5-Step Workflow */}
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
                  <Printer className="w-3.5 h-3.5 text-emerald-400" /> Auto-Pilot / Manual Mode
                </span>
              </div>
            </div>

            <div className="md:col-span-5 flex justify-center">
              <div className="w-full max-w-[300px] aspect-[9/16] rounded-3xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl bg-slate-950">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/kr7fXGDH_wk"
                  title="RTS Smart Print Demo"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>

        {/* 1. 5-Step Process */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-8 rounded-3xl space-y-6 shadow-md">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Step-By-Step Workflow</span>
            <h3 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />
              <span>{lang === 'en' ? "1. How RTS Smart Print Works at Your Shop" : "1. RTS Smart Print എങ്ങനെ പ്രവർത്തിക്കുന്നു?"}</span>
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800">
              <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                <img src="/step1_scan_qr_code.png" alt="Step 1" className="max-h-full max-w-full object-contain rounded-lg" />
              </div>
              <span className="text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md inline-block">
                {lang === 'en' ? "Step 1 • Print Standee" : "ഘട്ടം 1 • Print Standee"}
              </span>
              <h4 className="font-extrabold text-base text-white mt-2">
                {lang === 'en' ? "Customer Scans Counter QR" : "QR Code സ്കാൻ ചെയ്യുക"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {lang === 'en' 
                  ? "Customer scans your Print Standee QR code using their phone camera to open your shop's upload page."
                  : "കടയിൽ സ്ഥാപിക്കുന്ന Print Standee-ലെ QR Code ഉപഭോക്താവ് ഫോൺ ക്യാമറ ഉപയോഗിച്ച് സ്കാൻ ചെയ്യുന്നു."}
              </p>
            </div>

            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800">
              <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                <img src="/step2_upload_file.png" alt="Step 2" className="max-h-full max-w-full object-contain rounded-lg" />
              </div>
              <span className="text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md inline-block">
                {lang === 'en' ? "Step 2 • Upload" : "ഘട്ടം 2 • ഫയൽ അപ്‌ലോഡ്"}
              </span>
              <h4 className="font-extrabold text-base text-white mt-2">
                {lang === 'en' ? "Upload & Select Options" : "ഫയൽ അപ്‌ലോഡ് ചെയ്യുക"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {lang === 'en' 
                  ? "Upload PDF or image files and choose copies, Black & White or Color, and page settings."
                  : "PDF അല്ലെങ്കിൽ ചിത്രങ്ങൾ അപ്‌ലോഡ് ചെയ്യാം. കോപ്പികളുടെ എണ്ണം, കളർ അല്ലെങ്കിൽ ബ്ലാക്ക് ആൻഡ് വൈറ്റ് തിരഞ്ഞെടുക്കാം."}
              </p>
            </div>

            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800">
              <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                <img src="/step3_pay_amount.png" alt="Step 3" className="max-h-full max-w-full object-contain rounded-lg" />
              </div>
              <span className="text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md inline-block">
                {lang === 'en' ? "Step 3 • Dynamic Page Rate" : "ഘട്ടം 3 • Dynamic Page Rate"}
              </span>
              <h4 className="font-extrabold text-base text-white mt-2">
                {lang === 'en' ? "Direct UPI or Cash Choice" : "തുകയും പേയ്‌മെന്റും"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {lang === 'en' 
                  ? "Amount is calculated via your Dynamic Page Rate. Customer pays via Direct UPI (0% commission) or cash at counter."
                  : "നിരക്കുകൾ അനുസരിച്ച് തുക കാണിക്കുന്നു. 0% കമ്മീഷനിൽ നേരിട്ട് UPI വഴിയോ കൗണ്ടറിൽ പണമായോ നൽകാം."}
              </p>
            </div>

            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800">
              <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                <img src="/step4_order_received.png" alt="Step 4" className="max-h-full max-w-full object-contain rounded-lg" />
              </div>
              <span className="text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md inline-block">
                {lang === 'en' ? "Step 4 • Live Print Queue" : "ഘട്ടം 4 • Live Print Queue"}
              </span>
              <h4 className="font-extrabold text-base text-white mt-2">
                {lang === 'en' ? "Order Lands in Live Print Queue" : "ഓർഡർ കമ്പ്യൂട്ടറിൽ എത്തുന്നു"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {lang === 'en' 
                  ? "Incoming order appears immediately in your Shop Admin Live Print Queue and Windows Print Agent."
                  : "ഓർഡർ നിങ്ങളുടെ കമ്പ്യൂട്ടറിലെ Live Print Queue-ലും RTS Windows Print Agent-ലും തൽക്ഷണം ലഭിക്കുന്നു."}
              </p>
            </div>

            <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 sm:col-span-2 lg:col-span-1">
              <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                <img src="/step5_auto_print.png" alt="Step 5" className="max-h-full max-w-full object-contain rounded-lg" />
              </div>
              <span className="text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md inline-block">
                {lang === 'en' ? "Step 5 • Auto-Pilot / Manual Mode" : "ഘട്ടം 5 • Auto-Pilot / Manual Mode"}
              </span>
              <h4 className="font-extrabold text-base text-white mt-2">
                {lang === 'en' ? "Auto-Pilot or Manual Mode Print" : "Auto-Pilot / Manual പ്രിന്റിംഗ്"}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {lang === 'en' 
                  ? "Auto-Pilot Mode prints automatically after payment is confirmed. Manual Mode prints after the shop approves each order."
                  : "Auto-Pilot Mode-ൽ പേയ്‌മെന്റ് കൺഫേം ആയ ഉടൻ പ്രിന്റ് ആകുന്നു. Manual Mode-ൽ കടയുടമ അപ്രൂവ് ചെയ്ത ശേഷം പ്രിന്റ് ചെയ്യുന്നു."}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Shop Facilities */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-8 rounded-3xl space-y-4 shadow-md">
          <h3 className="text-lg sm:text-2xl font-black text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Store className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />
            <span>{lang === 'en' ? "2. Confirmed Dashboard & Counter Features" : "2. കടയുടമയ്ക്ക് ലഭിക്കുന്ന പ്രധാന സൗകര്യങ്ങൾ"}</span>
          </h3>
          <ul className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-300">
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span><strong>Print Standee:</strong> Counter QR code standee with optional access PIN.</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span><strong>Counter Configuration:</strong> Manage shop name, UPI ID, printer selection, and PIN.</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span><strong>Dynamic Page Rate:</strong> Configure per-page rates for B&W and Color printing.</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span><strong>Live Print Queue:</strong> Real-time incoming order management with 0% commission UPI/Cash.</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span><strong>Auto-Pilot Mode & Manual Mode:</strong> Automatic printing after payment or manual counter release.</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span><strong>Scheduled File Deletion:</strong> Automatic removal from dashboard and database (1h, 4h, 12h, 24h).</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Pricing Section (Starter Station ₹199/month, no strikethroughs) */}
      <section className="max-w-4xl mx-auto px-3 sm:px-4 py-8" id="pricing-section">
        <div className="text-center mb-8 space-y-1.5">
          <span className="text-[11px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full inline-flex items-center gap-1">
            <Tag className="w-3 h-3" /> {t.trialBadge}
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-white">{t.plansTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-400">{t.plansSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
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
        </div>

        <p className="text-center text-xs text-slate-400 mt-5">{t.pricingFootnote}</p>
      </section>

      {/* Sign-Up Form */}
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
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-3 text-xs uppercase tracking-wider"
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

      {/* Support Section */}
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
              href="mailto:info@rtsdigitalseva.online?subject=RTS%20Smart%20Print%20Support"
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

      {/* Footer */}
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

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pt-2 text-[11px] font-semibold text-slate-400">
          <button type="button" onClick={() => setActiveModal('privacy')} className="hover:text-emerald-400">Privacy Policy</button>
          <span className="text-slate-700">|</span>
          <button type="button" onClick={() => setActiveModal('terms')} className="hover:text-emerald-400">Terms and Conditions</button>
          <span className="text-slate-700">|</span>
          <button type="button" onClick={() => setActiveModal('refund')} className="hover:text-emerald-400">Refund Policy</button>
          <span className="text-slate-700">|</span>
          <button type="button" onClick={() => setActiveModal('about')} className="hover:text-emerald-400">About Us</button>
          <span className="text-slate-700">|</span>
          <button type="button" onClick={() => setActiveModal('contact')} className="hover:text-emerald-400">Contact</button>
        </div>
      </footer>

      {/* Legal & Trust Modals */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white uppercase">
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
                <p><strong>Company:</strong> RTS Reliable Technology Services</p>
                <p><strong>Location:</strong> Kerala, India</p>
                <p>
                  <strong>What RTS Smart Print Does:</strong> RTS Smart Print, a product of RTS Reliable Technology Services, is a zero-touch automated printing kiosk system for print shops. Customers scan a counter QR code, upload documents, and pay via UPI with 0% commission, while shops print orders automatically in Auto-Pilot Mode or after approval in Manual Mode.
                </p>
                <p>
                  <strong>Related Service:</strong> RTS Digital Seva (https://rtsdigitalseva.online/) is an online citizen services portal in Kerala, also owned and operated by RTS Reliable Technology Services.
                </p>
                <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
                  RTS Smart Print is not connected to any business in the UK that uses rtsprint.co.uk.
                </p>
                <p>
                  <strong>Contact Email:</strong>{' '}
                  <a href="mailto:info@rtsdigitalseva.online" className="text-emerald-400 font-bold underline">
                    info@rtsdigitalseva.online
                  </a>
                </p>
              </div>
            )}

            {activeModal === 'privacy' && (
              <div className="space-y-3 leading-relaxed">
                <p><strong>Customer Privacy First:</strong> Uploaded print files are used solely to fulfill the customer's print job at the selected counter.</p>
                <p><strong>Automatic File Deletion:</strong> Files are deleted automatically from the dashboard and database after the retention timer selected by the shop: <strong>1 hour, 4 hours, 12 hours, or 24 hours</strong>.</p>
                <p><strong>Sign-Up Data:</strong> Shop registration form details are used only to contact you about RTS Smart Print.</p>
                <p><strong>Contact:</strong> info@rtsdigitalseva.online</p>
              </div>
            )}

            {activeModal === 'terms' && (
              <div className="space-y-3 leading-relaxed">
                <p><strong>Operator:</strong> RTS Smart Print, a product of RTS Reliable Technology Services, Kerala, India.</p>
                <p><strong>Licence & Pricing:</strong> Subscribing shops receive access to the Counter Configuration dashboard, QR Print Standee, and Windows Print Agent. Starter Station is ₹199/month in Indian Rupees (₹).</p>
                <p><strong>Direct UPI Payments:</strong> Customer UPI payments go directly to the shop's configured UPI ID with 0% commission.</p>
              </div>
            )}

            {activeModal === 'refund' && (
              <div className="space-y-3 leading-relaxed">
                <p><strong>Free Trial:</strong> Every new shop receives a 7-Day Free Trial to test printer compatibility before billing.</p>
                <p><strong>Support & Refunds:</strong> For subscription billing assistance, contact info@rtsdigitalseva.online.</p>
              </div>
            )}

            {activeModal === 'contact' && (
              <div className="space-y-3 leading-relaxed">
                <p><strong>Company:</strong> RTS Reliable Technology Services, Kerala, India</p>
                <p><strong>Email:</strong> <a href="mailto:info@rtsdigitalseva.online" className="text-emerald-400 underline">info@rtsdigitalseva.online</a></p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Chat Bot Widget */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
        {chatOpen && (
          <div className="w-[340px] sm:w-[360px] max-w-[calc(100vw-24px)] bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden mb-3 flex flex-col">
            <div className="bg-teal-900 text-white px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-black text-emerald-300">⚡</div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-white">RTS Smart Print Support Bot</h4>
                  <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online • Instant Reply
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setChatOpen(false)} className="p-1 text-slate-300 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 max-h-80 overflow-y-auto space-y-3 bg-slate-50 text-xs">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-2xl px-3.5 py-2.5 max-w-[88%] leading-relaxed ${
                    msg.sender === 'user' ? 'bg-teal-800 text-white font-semibold' : 'bg-white border border-slate-200 text-slate-700 shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              <div className="pt-1 flex flex-col gap-1.5">
                {CHAT_FAQ_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectChatTopic(opt)}
                    className="text-left px-3 py-2 rounded-full bg-slate-200/80 hover:bg-emerald-100 text-slate-800 font-bold text-[11px] transition border border-slate-300/60 w-fit"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendCustomChat} className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type your question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-full outline-none focus:border-teal-600 text-slate-800"
              />
              <button type="submit" className="px-3.5 py-2 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs rounded-full">
                Send →
              </button>
            </form>
          </div>
        )}

        <button
          type="button"
          onClick={() => setChatOpen(!chatOpen)}
          className="px-4 py-3 rounded-full bg-teal-700 hover:bg-teal-600 text-white font-extrabold text-xs shadow-xl flex items-center gap-2 border border-teal-500/40"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Help & Offers Chat</span>
        </button>
      </div>
    </div>
  );
};

export default BusinessLandingPage;
