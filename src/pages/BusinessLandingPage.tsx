import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Phone, 
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
  ServerOff
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
}

const TEXTS = {
  en: {
    heroBadge: "Automated Cloud Kiosk & Zero-Touch Print Management",
    heroTrustLine: "No storage needed. Customer files delete automatically on your schedule.",
    heroTitle: "Transform Your Counter Into an Automated Printing Station",
    heroDesc: "Eliminate WhatsApp file transfers, USB pen drive viruses, and crowded counter queues. Customers scan your counter QR code, upload documents, and pay directly into your UPI. Pages print automatically with 0% platform commission.",
    applyNowBtn: "Activate Free Trial",
    viewPlansBtn: "View Subscription Plans",
    privacyTitle: "100% Customer Privacy",
    privacyDesc: "Encrypted cloud transmission with scheduled auto-purge. Zero customer files left behind on your shop computer.",
    upiTitle: "Direct Bank UPI Settlement",
    upiDesc: "Customer payments go 100% directly to your Google Pay, PhonePe, or Paytm UPI ID with 0% commission.",
    safeTitle: "Safe for Shop Workstations",
    safeDesc: "Lightweight Windows agent works cleanly with HP, Canon, Epson, and Brother printers without registry modifications.",
    storageHeadline: "No Storage. No Worry. Your Customers' Files Stay Private.",
    storageSub: "A modern zero-local-storage architecture designed for high-traffic photocopy, DTP, and Akshaya counters.",
    storageP1Title: "Zero Storage for Your Shop",
    storageP1Desc: "Your shop workstation never needs to free up disk space. Every uploaded document is processed in the secure cloud and removed on schedule.",
    storageP2Title: "You Control the Timer",
    storageP2Desc: "Shop Admins and Super Admins can customize the file lifetime. Choose exactly when files disappear: 1 hour, 4 hours, 12 hours, or 24 hours.",
    storageP3Title: "Automatic Purge Engine",
    storageP3Desc: "Once the timer ends, documents are permanently deleted from both the dashboard and database. Zero manual cleanup required.",
    plansTitle: "Transparent & Fair Pricing",
    plansSubtitle: "Flexible monthly & yearly plans with instant free trial access",
    trialBadge: "Free Trial Included",
    formTitle: "Get RTS Smart Print for Your Shop",
    formSubtitle: "Fill this form to activate your automated counter station within 2 hours.",
    businessNameLabel: "Shop / Business Name *",
    ownerNameLabel: "Owner Name *",
    whatsappLabel: "WhatsApp Number *",
    emailLabel: "Email Address *",
    cityLabel: "City / Taluk (Kerala) *",
    planLabel: "Selected Subscription Plan",
    printerLabel: "Counter Printer Model",
    btnSubmit: "Activate My Counter Station Now",
    btnSubmitting: "Registering Your Shop...",
    successTitle: "Registration Received Successfully!",
    successDesc: "Thank you! Our technical support team from RTS Digital Seva will connect via WhatsApp within 2 hours with your pairing code and setup package."
  },
  ml: {
    heroBadge: "ഓട്ടോമേറ്റഡ് ക്ലൗഡ് കിയോസ്ക് & പ്രിന്റ് മാനേജ്‌മെന്റ് സിസ്റ്റം",
    heroTrustLine: "സ്റ്റോറേജ് ആവശ്യമില്ല. ഉപഭോക്താക്കളുടെ ഫയലുകൾ നിങ്ങൾ തീരുമാനിച്ച സമയത്ത് തനിയെ ഡിലീറ്റ് ആകും.",
    heroTitle: "നിങ്ങളുടെ കൗണ്ടർ ഇനി ഒരു ഓട്ടോമേറ്റഡ് സ്മാർട്ട് പ്രിന്റിംഗ് സ്റ്റേഷനാക്കാം!",
    heroDesc: "കടകളിലെ നീണ്ട ക്യൂ, പെൻഡ്രൈവ് കുത്തൽ, വാട്സാപ്പിൽ ഫയലുകൾ ചോദിച്ചു വാങ്ങൽ എന്നിവ പൂർണ്ണമായി ഒഴിവാക്കൂ. കസ്റ്റമർ കൗണ്ടറിലെ ക്യുആർ കോഡ് സ്കാൻ ചെയ്ത് ഫയലുകൾ അപ്‌ലോഡ് ചെയ്യുമ്പോൾ പണം നേരിട്ട് നിങ്ങളുടെ UPI-ലേക്ക് എത്തുകയും പ്രിന്റർ തനിയെ പ്രിന്റ് ചെയ്യുകയും ചെയ്യുന്നു.",
    applyNowBtn: "സൗജന്യ ട്രയൽ ആരംഭിക്കൂ",
    viewPlansBtn: "പ്ലാനുകൾ കാണുക",
    privacyTitle: "100% ഉപഭോക്തൃ സ്വകാര്യത",
    privacyDesc: "ഫയലുകൾ പ്രിന്റിംഗിന് ശേഷം നിശ്ചിത സമയത്തിനുള്ളിൽ പൂർണ്ണമായി ഡിലീറ്റ് ചെയ്യപ്പെടുന്നു. ഫയൽ ചോർച്ചയോ പെൻഡ്രൈവ് വൈറസ് ഭീഷണിയോ ഇല്ല.",
    upiTitle: "നേരിട്ടുള്ള UPI പേയ്‌മെന്റ് (0% കമ്മീഷൻ)",
    upiDesc: "പണം ഇടനിലക്കാരില്ലാതെ നിങ്ങളുടെ Google Pay, PhonePe, Paytm എന്നിവയിലേക്ക് നേരിട്ടെത്തുന്നു. പൈസ കമ്മീഷൻ ഇല്ല.",
    safeTitle: "കമ്പ്യൂട്ടറുകൾക്ക് തികച്ചും സുരക്ഷിതം",
    safeDesc: "HP, Canon, Epson, Brother പ്രിന്ററുകളിൽ സുരക്ഷിതമായി പ്രവർത്തിക്കുന്ന വിൻഡോസ് ആപ്ലിക്കേഷൻ.",
    storageHeadline: "സ്റ്റോറേജ് ആവശ്യമില്ല, ആശങ്കയും വേണ്ട. ഉപഭോക്താക്കളുടെ ഫയലുകൾ സുരക്ഷിതമായിരിക്കും.",
    storageSub: "ഫോട്ടോകോപ്പി, DTP, അക്ഷയ, ഡിജിറ്റൽ സേവാ കേന്ദ്രങ്ങൾക്കായുള്ള അത്യാധുനിക സീറോ-സ്റ്റോറേജ് സിസ്റ്റം.",
    storageP1Title: "കടയ്ക്ക് സ്റ്റോറേജ് വേണ്ട",
    storageP1Desc: "ഡിസ്ക് സ്പേസ് കാലിയാക്കാൻ നിങ്ങൾ ഒന്നും ചെയ്യേണ്ടതില്ല. അപ്‌ലോഡ് ചെയ്യുന്ന ഓരോ ഡോക്യുമെന്റും ക്ലൗഡിൽ പ്രോസസ്സ് ചെയ്ത് നിശ്ചിത സമയത്ത് നീക്കം ചെയ്യപ്പെടുന്നു.",
    storageP2Title: "സമയം നിങ്ങളുടെ നിയന്ത്രണത്തിൽ",
    storageP2Desc: "ഉപഭോക്താവിന്റെ ഫയലുകൾ എത്ര നേരം സൂക്ഷിക്കണമെന്ന് നിങ്ങൾക്ക് തിരഞ്ഞെടുക്കാം: 1 മണിക്കൂർ, 4 മണിക്കൂർ, 12 മണിക്കൂർ, അല്ലെങ്കിൽ 24 മണിക്കൂർ.",
    storageP3Title: "സ്വയം നീക്കം ചെയ്യപ്പെടുന്ന ഫയലുകൾ",
    storageP3Desc: "നിശ്ചയിച്ച സമയം കഴിഞ്ഞാൽ ഡാഷ്‌ബോർഡിൽ നിന്നും ഡാറ്റാബേസിൽ നിന്നും ഫയലുകൾ എന്നെന്നേക്കുമായി ഒഴിവാക്കപ്പെടും. സ്വമേധയാ ഡിലീറ്റ് ചെയ്യേണ്ടതില്ല.",
    plansTitle: "ലളിതമായ സബ്‌സ്‌ക്രിപ്ഷൻ പ്ലാനുകൾ",
    plansSubtitle: "പ്രതിമാസ, വാർഷിക പ്ലാനുകളും സൗജന്യ ട്രയലും ഉൾപ്പെടുന്നു",
    trialBadge: "സൗജന്യ ട്രയൽ ലഭ്യമാണ്",
    formTitle: "നിങ്ങളുടെ കടയിൽ RTS സ്മാർട്ട് പ്രിന്റ് തുടങ്ങാം",
    formSubtitle: "വിവരങ്ങൾ പൂരിപ്പിക്കൂ, 2 മണിക്കൂറിനകം സെറ്റപ്പ് ചെയ്തുകൊടുക്കും.",
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
    successDesc: "നന്ദി! RTS ഡിജിറ്റൽ സേവ സാങ്കേതിക വിഭാഗം ഉടൻ തന്നെ വാട്സാപ്പിൽ ബന്ധപ്പെട്ട് ഇൻസ്റ്റാളേഷൻ പൂർത്തിയാക്കുന്നതാണ്."
  }
};

export const BusinessLandingPage: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'ml'>('ml');
  const t = TEXTS[lang];

  const [dbPlans, setDbPlans] = useState<PlatformPlan[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
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
    async function loadPlans() {
      try {
        const { data, error } = await supabase
          .from('platform_plans')
          .select('*')
          .eq('is_active', true)
          .order('offer_price', { ascending: true });

        if (!error && data && data.length > 0) {
          setDbPlans(data as PlatformPlan[]);
        }
      } catch (err) {
        console.error('Failed to load dynamic plans:', err);
      }
    }
    loadPlans();
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
      alert('Error submitting inquiry. Please call RTS Digital Seva at 7012833699.');
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

  const firstPlan = dbPlans[0];
  const customMonthly = firstPlan?.form_monthly_price || '499';
  const customYearly = firstPlan?.form_yearly_price || '2,499';
  const customTrialDays = firstPlan?.form_trial_days || String(firstPlan?.trial_days || 7);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 py-3.5 px-6 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-emerald-500/20">
            ⚡
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base leading-tight tracking-tight">RTS Smart Print</h1>
            <p className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">Zero-Touch Automation</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => setLang(lang === 'en' ? 'ml' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 transition"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'en' ? 'മലയാളം' : 'English'}</span>
          </button>
          
          <button
            onClick={scrollToForm}
            className="text-xs font-black px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <span>{t.applyNowBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-12 sm:pt-24 sm:pb-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-slate-950 -z-10" />
        
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Dual Badge & Trust Line */}
          <div className="inline-flex flex-col items-center gap-1.5">
            <span className="px-3.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-black rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              {t.heroBadge}
            </span>
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-emerald-400" />
              {t.heroTrustLine}
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15]">
            {t.heroTitle}
          </h2>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
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
              <p className="text-xl sm:text-2xl font-black text-teal-400 font-mono">0 MB</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Shop Storage</p>
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
          <p className="text-xs text-slate-400 leading-relaxed font-normal">{t.privacyDesc}</p>
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

      {/* Dedicated Section: Storage & Customer Privacy */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 p-7 sm:p-10 rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mb-2">
                Customer Data Safety Promise
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
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

      {/* Visual 5-Step Process */}
      <section className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-6 shadow-md">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Step-By-Step Workflow</span>
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
              <Cpu className="w-6 h-6 text-emerald-400" />
              <span>{lang === 'en' ? "1. How RTS Smart Print Works at Your Shop" : "1. RTS Smart Print എങ്ങനെ പ്രവർത്തിക്കുന്നു?"}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              {lang === 'en' 
                ? "A seamless end-to-end cloud spooler that routes mobile customer prints straight to your shop printer."
                : "കടകളിൽ വരുന്ന പ്രിന്റിംഗ് ഓർഡറുകൾ മൊബൈൽ വഴി സ്വീകരിക്കാനും, കമ്പ്യൂട്ടർ ഉപയോഗിച്ച് നേരിട്ട് പ്രിന്റ് ചെയ്യാനും സഹായിക്കുന്ന ഒരു സ്മാർട്ട് പ്രിന്റിംഗ് സംവിധാനം."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step1_scan_qr_code.png" alt="Scan QR Code" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {lang === 'en' ? "Step 1" : "ഘട്ടം 1"}
                </span>
                <h4 className="font-bold text-sm text-white mt-1.5">
                  {lang === 'en' ? "Customer Scans Counter QR" : "QR Code സ്കാൻ ചെയ്യുക"}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'en' 
                    ? "Customer scans your personalized standee using their phone camera to instantly open your direct kiosk portal."
                    : "കടയിൽ സ്ഥാപിക്കുന്ന QR Code ഉപഭോക്താവ് മൊബൈൽ ക്യാമറ ഉപയോഗിച്ച് സ്കാൻ ചെയ്യുന്നു. നിങ്ങളുടെ ഓൺലൈൻ പേജ് തുറക്കും."}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step2_upload_file.png" alt="Upload File" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {lang === 'en' ? "Step 2" : "ഘട്ടം 2"}
                </span>
                <h4 className="font-bold text-sm text-white mt-1.5">
                  {lang === 'en' ? "Upload & Select Options" : "ഫയൽ അപ്‌ലോഡ് ചെയ്യുക"}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
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
                  <img src="/step3_pay_amount.png" alt="Pay Amount" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {lang === 'en' ? "Step 3" : "ഘട്ടം 3"}
                </span>
                <h4 className="font-bold text-sm text-white mt-1.5">
                  {lang === 'en' ? "Instant UPI / Cash Choice" : "തുകയും പേയ്‌മെന്റും"}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'en' 
                    ? "The calculated amount is shown clearly. Customer pays directly via UPI QR or opts for cash collection at your counter."
                    : "തിരഞ്ഞെടുത്ത ഓപ്ഷനുകൾ അനുസരിച്ച് തുക കാണിക്കും. കടയിൽ ലഭ്യമായ Cash/UPI പേയ്‌മെന്റ് രീതികൾ ഉപയോഗിക്കാം."}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step4_order_received.png" alt="Order Received" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {lang === 'en' ? "Step 4" : "ഘട്ടം 4"}
                </span>
                <h4 className="font-bold text-sm text-white mt-1.5">
                  {lang === 'en' ? "Live Order Appears on PC" : "ഓർഡർ കമ്പ്യൂട്ടറിൽ എത്തുന്നു"}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'en' 
                    ? "Incoming job lands in real-time inside your Shop Admin Dashboard and Windows Print Agent with full order details."
                    : "ഓർഡർ നിങ്ങളുടെ കമ്പ്യൂട്ടറിലെ RTS Smart Print Agent-ലും Shop Admin Dashboard-ലും തൽക്ഷണം ലഭിക്കുന്നു."}
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
              <div>
                <div className="w-full h-32 bg-slate-900 rounded-xl mb-3 overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img src="/step5_auto_print.png" alt="Auto Print" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {lang === 'en' ? "Step 5" : "ഘട്ടം 5"}
                </span>
                <h4 className="font-bold text-sm text-white mt-1.5">
                  {lang === 'en' ? "Zero-Touch Auto-Print" : "ഓട്ടോമാറ്റിക് പ്രിന്റ്"}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'en' 
                    ? "In Auto-Pilot mode, paid jobs print straight from your connected printer without needing to click or open files."
                    : "പണം ലഭിച്ചെന്ന് ഉറപ്പാക്കിയ ശേഷം ഒറ്റ ക്ലിക്കിലോ അല്ലെങ്കിൽ ഓട്ടോ-പൈലറ്റ് വഴിയോ പ്രിന്റർ തനിയെ പ്രിന്റ് ചെയ്യുന്നു."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Facilities for Shop Owners */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4 shadow-md">
          <h3 className="text-xl sm:text-2xl font-black text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-400" />
            <span>{lang === 'en' ? "2. Complete Facilities Provided to Your Shop" : "2. കടയുടമയ്ക്ക് ലഭിക്കുന്ന സൗകര്യങ്ങൾ"}</span>
          </h3>
          <ul className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-300">
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>{lang === 'en' ? "Custom Online Kiosk URL under your shop name." : "സ്വന്തം കടയുടെ പേരിൽ പ്രത്യേക Online Printing Page."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>{lang === 'en' ? "Printable Counter Standee with embedded QR and security PIN." : "QR Code Standee – ഉപഭോക്താക്കൾക്ക് എളുപ്പത്തിൽ ഓർഡർ നൽകാം."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>{lang === 'en' ? "Full PDF and multi-format image processing support." : "PDF, ചിത്രങ്ങൾ തുടങ്ങിയ ഫയലുകൾ സ്വീകരിക്കാം."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>{lang === 'en' ? "Dynamic pricing controls for B&W, Color, A4 & Legal." : "പ്രിന്റിംഗ് നിരക്ക് കടയുടമയ്ക്ക് തന്നെ ക്രമീകരിക്കാം."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>{lang === 'en' ? "Direct Bank UPI settlement with 0% platform commission." : "Cash, UPI ഓർഡറുകൾ ഇടനിലക്കാരില്ലാതെ കൈകാര്യം ചെയ്യാം."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>{lang === 'en' ? "Auto-Pilot Zero-Touch printing mode or Manual approval." : "Manual Mode, Auto-Pilot Mode സൗകര്യങ്ങൾ."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>{lang === 'en' ? "Auto-Purge customer data timer (1h, 4h, 12h, 24h)." : "ഫയൽ ഓട്ടോ-ഡിലീറ്റ് സമയം ക്രമീകരിക്കാനുള്ള സൗകര്യം."}</span>
            </li>
            <li className="flex items-start gap-2.5 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> 
              <span>{lang === 'en' ? "Dedicated Windows Desktop agent with permanent pairing." : "Windows കമ്പ്യൂട്ടറിലെ RTS Smart Print Agent വഴി പ്രിന്റിംഗ്."}</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Subscription Pricing Cards */}
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
                      {plan.badge_text || 'Popular Choice'}
                    </span>
                  )}

                  <div>
                    <h4 className="font-extrabold text-xl text-white">{plan.name}</h4>
                    <div className="mt-3 mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white font-mono">₹{plan.offer_price}</span>
                        {plan.original_price > plan.offer_price && (
                          <span className="text-xs text-slate-500 line-through font-mono">₹{plan.original_price}</span>
                        )}
                        <span className="text-xs text-slate-400 capitalize">/{plan.billing_period}</span>
                      </div>
                      <p className="text-xs text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {plan.trial_days}-Day Free Trial Included
                      </p>
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
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 1 Counter Printer Connection</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> QR Standee Generator with PIN</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 0% Commission Direct UPI Support</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Auto-Purge Privacy Storage Engine</li>
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
                      Pro Plan Coming Soon
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
              {/* Fallback Starter Monthly */}
              <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between relative">
                <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                  Popular Choice
                </span>
                <div>
                  <h4 className="font-extrabold text-xl text-white">Starter Monthly</h4>
                  <div className="mt-3 mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white font-mono">₹499</span>
                      <span className="text-xs text-slate-500 line-through font-mono">₹999</span>
                      <span className="text-xs text-slate-400">/Monthly</span>
                    </div>
                    <p className="text-xs text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      7-Day Free Trial Included
                    </p>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Online Printing Page & Counter QR Standee</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Shop Admin Dashboard & PC Print Agent</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Cash & Direct UPI Support (0% Commission)</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Auto-Purge Privacy Storage Protection</li>
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
                  Select Starter Monthly
                </button>
              </div>

              {/* Fallback Starter Yearly */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between relative">
                <span className="absolute top-4 right-4 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow">
                  Best Value
                </span>
                <div>
                  <h4 className="font-extrabold text-xl text-white">Starter Yearly</h4>
                  <div className="mt-3 mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white font-mono">₹2,499</span>
                      <span className="text-xs text-slate-400">/Yearly</span>
                    </div>
                    <p className="text-xs text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Only ~₹208/Month (Save ₹990 Yearly)
                    </p>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Full 365 Days Uninterrupted Kiosk Access</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> All Starter Monthly Features Included</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Priority WhatsApp Counter Technical Support</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Free Remote Installation Setup via AnyDesk</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, selectedPlan: 'starter_yearly' }));
                    scrollToForm();
                  }}
                  className="mt-6 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition shadow-md"
                >
                  Select Starter Yearly
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Inquiry Registration Form */}
      <section id="inquiry-form-section" className="max-w-xl mx-auto px-4 py-8 pb-20">
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl">
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
                  placeholder="e.g. Friends Xerox & Akshaya Center"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-2 gap-3">
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
                    placeholder="e.g. Payyanur / Kannur"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t.planLabel}</label>
                  <select
                    value={formData.selectedPlan}
                    onChange={(e) => setFormData({ ...formData, selectedPlan: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="starter_monthly">Monthly Plan (₹{customMonthly}/mo)</option>
                    <option value="starter_yearly">Yearly Plan (₹{customYearly}/yr)</option>
                    <option value="trial_7">{customTrialDays}-Day Free Trial (₹0)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t.printerLabel}</label>
                  <input
                    type="text"
                    placeholder="e.g. Canon LBP2900 / HP 1020"
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

              <p className="text-[11px] text-center text-slate-500 font-normal">
                Official RTS Smart Print distribution by RTS Digital Seva (info@rtsdigitalseva.online).
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
        <p className="font-bold text-slate-400">RTS Smart Print Automation — An RTS Reliable Technology Services Project</p>
        <p className="mt-1 text-[11px]">Payyanur, Kannur District, Kerala • Support: +91 7012833699</p>
      </footer>
    </div>
  );
};

export default BusinessLandingPage;
