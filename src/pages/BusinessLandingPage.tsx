import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, CheckCircle2, Phone, Mail, Lock, Languages, Tag, Clock, Store, Cpu, Printer, CreditCard } from 'lucide-react';
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
}

const TEXTS = {
  en: {
    heroBadge: "Zero-Touch Customer Printing",
    heroTitle: "Eliminate WhatsApp & Pen Drive Queues in Your Shop",
    heroDesc: "Let customers scan a QR code at your counter, upload documents, pay via UPI directly into your bank account, and have pages print automatically.",
    privacyTitle: "100% Customer Privacy",
    privacyDesc: "Encrypted SSL transfer with auto-deletion after printing. No pen drive viruses, no crowded counters.",
    upiTitle: "Direct Bank UPI Settlement",
    upiDesc: "Payments go directly to your Google Pay, PhonePe, or Paytm UPI ID with 0% transaction commission.",
    safeTitle: "Safe for Shop Workstations",
    safeDesc: "Lightweight Windows agent works cleanly with HP, Canon, Epson, and Brother printers without modifying registry files.",
    plansTitle: "Transparent Subscription Plans",
    plansSubtitle: "Flexible monthly & yearly plans with free trial included",
    trialBadge: "Free Trial Available",
    formTitle: "Get RTS Smart Print for Your Shop",
    formSubtitle: "Fill this form to activate your shop kiosk today.",
    businessNameLabel: "Shop / Business Name *",
    ownerNameLabel: "Owner Name *",
    whatsappLabel: "WhatsApp Number *",
    emailLabel: "Email Address *",
    cityLabel: "City / Taluk *",
    planLabel: "Selected Plan",
    printerLabel: "Default Printer Model",
    btnSubmit: "Activate My Shop Now",
    btnSubmitting: "Submitting Details...",
    successTitle: "Registration Received!",
    successDesc: "Thank you! Our technical team from RTS Digital Seva will connect with you on WhatsApp within 2 hours with your setup package."
  },
  ml: {
    heroBadge: "ഓട്ടോമേറ്റഡ് പ്രിന്റിംഗ് സിസ്റ്റം",
    heroTitle: "കടയിലെ വാട്സാപ്പ്, പെൻഡ്രൈവ് ക്യൂവിന് വിട നൽകാം!",
    heroDesc: "ഉപഭോക്താക്കൾ കൗണ്ടറിലെ ക്യുആർ കോഡ് സ്കാൻ ചെയ്ത് ഫയലുകൾ അപ്‌ലോഡ് ചെയ്യട്ടെ. തുക നേരിട്ട് നിങ്ങളുടെ ബാങ്കിലേക്ക് UPI വഴി എത്തുകയും രേഖകൾ തനിയെ പ്രിന്റ് ആവുകയും ചെയ്യും.",
    privacyTitle: "പൂർണ്ണ സുരക്ഷിതത്വം",
    privacyDesc: "പ്രിന്റിംഗിന് ശേഷം ഫയലുകൾ ഓട്ടോമാറ്റിക്കായി ഡിലീറ്റ് ചെയ്യപ്പെടുന്നു. പെൻഡ്രൈവ് വൈറസ് ഭീഷണികളോ ഫയൽ ചോർച്ചയോ ഇല്ല.",
    upiTitle: "നേരിട്ടുള്ള UPI പേയ്‌മെന്റ്",
    upiDesc: "പണം ഇടനിലക്കാരില്ലാതെ നിങ്ങളുടെ Google Pay, PhonePe എന്നിവയിലേക്ക് നേരിട്ടെത്തും. യാതൊരു കമ്മീഷനും ഇല്ല.",
    safeTitle: "കമ്പ്യൂട്ടറുകൾക്ക് സുരക്ഷിതം",
    safeDesc: "HP, Canon, Epson, Brother പ്രിന്ററുകളിൽ സുരക്ഷിതമായി പ്രവർത്തിക്കുന്ന ലളിതമായ വിൻഡോസ് ആപ്ലിക്കേഷൻ.",
    plansTitle: "സബ്‌സ്‌ക്രിപ്ഷൻ പ്ലാനുകൾ",
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-600/30">
            R
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 leading-tight">RTS Smart Print</h1>
            <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Business Automation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'en' ? 'ml' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'en' ? 'മലയാളം' : 'English'}</span>
          </button>
          <a
            href="https://wa.me/917012833699?text=Hello%20RTS,%20I%20am%20interested%20in%20setting%20up%20Smart%20Print%20for%20my%20shop"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition"
          >
            WhatsApp (7012833699)
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center space-y-4">
        <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase">
          {t.heroBadge}
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          {t.heroTitle}
        </h2>
        <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          {t.heroDesc}
        </p>
      </section>

      {/* Trust & Safety Cards */}
      <section className="max-w-5xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">{t.privacyTitle}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{t.privacyDesc}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">{t.upiTitle}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{t.upiDesc}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">{t.safeTitle}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{t.safeDesc}</p>
        </div>
      </section>

      {/* DETAILED MALAYALAM EXPLANATION SECTIONS WITH STEP IMAGES */}
      <section className="max-w-4xl mx-auto px-4 py-10 space-y-12">
        
        {/* Section 1: How it Works */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xl md:text-2xl font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-emerald-600" />
            <span>1. RTS Smart Print എങ്ങനെ പ്രവർത്തിക്കുന്നു?</span>
          </h3>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            കടകളിൽ വരുന്ന പ്രിന്റിംഗ് ഓർഡറുകൾ മൊബൈൽ വഴി സ്വീകരിക്കാനും, കമ്പ്യൂട്ടർ ഉപയോഗിച്ച് നേരിട്ട് പ്രിന്റ് ചെയ്യാനും സഹായിക്കുന്ന ഒരു സ്മാർട്ട് പ്രിന്റിംഗ് സംവിധാനമാണ് RTS Smart Print. ഇതിലൂടെ ഉപഭോക്താക്കൾക്ക് കടയിൽ നേരിട്ട് വരുന്നതിന് മുമ്പുതന്നെ മൊബൈൽ ഉപയോഗിച്ച് പ്രിന്റ് ഓർഡർ നൽകാം. കടയുടമയ്ക്ക് ഓർഡറുകൾ കമ്പ്യൂട്ടറിൽ ലഭിക്കുകയും പ്രിന്റ് ചെയ്യുകയും ചെയ്യാം.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {/* Step 1 */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 flex flex-col justify-between">
              <div>
                <div className="w-full h-32 bg-white rounded-xl mb-3 overflow-hidden border border-slate-200 flex items-center justify-center p-1">
                  <img src="/step1_scan_qr_code.png" alt="Scan QR Code" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">ഘട്ടം 1</span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">QR Code സ്കാൻ ചെയ്യുക</h4>
                <p className="text-xs text-slate-500 mt-1">കടയിൽ സ്ഥാപിക്കുന്ന QR Code ഉപഭോക്താവ് മൊബൈൽ ക്യാമറ ഉപയോഗിച്ച് സ്കാൻ ചെയ്യുന്നു. അതിലൂടെ നിങ്ങളുടെ കടയുടെ ഓൺലൈൻ പ്രിന്റിംഗ് പേജ് തുറക്കും.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 flex flex-col justify-between">
              <div>
                <div className="w-full h-32 bg-white rounded-xl mb-3 overflow-hidden border border-slate-200 flex items-center justify-center p-1">
                  <img src="/step2_upload_file.png" alt="Upload File" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">ഘട്ടം 2</span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">ഫയൽ അപ്‌ലോഡ് ചെയ്യുക</h4>
                <p className="text-xs text-slate-500 mt-1">PDF അല്ലെങ്കിൽ പിന്തുണയ്ക്കുന്ന ചിത്രങ്ങൾ അപ്‌ലോഡ് ചെയ്യാം. ആവശ്യമായ കോപ്പികളുടെ എണ്ണം, കളർ അല്ലെങ്കിൽ ബ്ലാക്ക് ആൻഡ് വൈറ്റ് എന്നിവ തിരഞ്ഞെടുക്കാം.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 flex flex-col justify-between">
              <div>
                <div className="w-full h-32 bg-white rounded-xl mb-3 overflow-hidden border border-slate-200 flex items-center justify-center p-1">
                  <img src="/step3_pay_amount.png" alt="Pay Amount" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">ഘട്ടം 3</span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">തുകയും പേയ്‌മെന്റും</h4>
                <p className="text-xs text-slate-500 mt-1">തിരഞ്ഞെടുത്ത പ്രിന്റിംഗ് ഓപ്ഷനുകൾ അനുസരിച്ച് തുക കാണിക്കും. കടയിൽ ലഭ്യമായ Cash/UPI പേയ്‌മെന്റ് രീതികൾ ഉപയോഗിക്കാം.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 flex flex-col justify-between">
              <div>
                <div className="w-full h-32 bg-white rounded-xl mb-3 overflow-hidden border border-slate-200 flex items-center justify-center p-1">
                  <img src="/step4_order_received.png" alt="Order Received" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">ഘട്ടം 4</span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">ഓർഡർ ലഭിക്കുന്നു</h4>
                <p className="text-xs text-slate-500 mt-1">ഓർഡർ നിങ്ങളുടെ കമ്പ്യൂട്ടറിലെ RTS Smart Print Agent-ലും Shop Admin Dashboard-ലും തൽക്ഷണം ലഭിക്കുന്നു.</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 flex flex-col justify-between md:col-span-2 lg:col-span-1">
              <div>
                <div className="w-full h-32 bg-white rounded-xl mb-3 overflow-hidden border border-slate-200 flex items-center justify-center p-1">
                  <img src="/step5_auto_print.png" alt="Auto Print" className="max-h-full max-w-full object-contain rounded-lg" />
                </div>
                <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">ഘട്ടം 5</span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">ഓട്ടോമാറ്റിക് പ്രിന്റ്</h4>
                <p className="text-xs text-slate-500 mt-1">പണം ലഭിച്ചെന്ന് ഉറപ്പാക്കിയ ശേഷം ഒറ്റ ക്ലിക്കിൽ പ്രിന്റ് എടുക്കാം.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Shop Owner Facilities */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xl md:text-2xl font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-600" />
            <span>2. കടയുടമയ്ക്ക് ലഭിക്കുന്ന സൗകര്യങ്ങൾ</span>
          </h3>
          <ul className="grid md:grid-cols-2 gap-3 text-xs md:text-sm text-slate-700">
            <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> സ്വന്തം കടയുടെ പേരിൽ പ്രത്യേക Online Printing Page.</li>
            <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> QR Code Standee – ഉപഭോക്താക്കൾക്ക് എളുപ്പത്തിൽ ഓർഡർ നൽകാം.</li>
            <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> PDF, ചിത്രങ്ങൾ തുടങ്ങിയ ഫയലുകൾ സ്വീകരിക്കാം.</li>
            <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> കോപ്പികളുടെ എണ്ണം, കളർ/B&W എന്നിവ തിരഞ്ഞെടുക്കാം.</li>
            <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> പ്രിന്റിംഗ് നിരക്ക് കടയുടമയ്ക്ക് ക്രമീകരിക്കാം.</li>
            <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Cash, UPI ഓർഡറുകൾ കൈകാര്യം ചെയ്യാം.</li>
            <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Manual Mode, Auto-Pilot Mode സൗകര്യങ്ങൾ.</li>
            <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Shop Admin Dashboard വഴി ഓർഡറുകൾ നിയന്ത്രിക്കാം.</li>
            <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> Windows കമ്പ്യൂട്ടറിലെ RTS Smart Print Agent വഴി പ്രിന്റിംഗ്.</li>
            <li className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> ഇന്റർനെറ്റ് ഇല്ലാത്ത സമയത്ത് ഡൗൺലോഡ് ചെയ്തിട്ടുള്ള ഓർഡറുകൾ പ്രിന്റ് ചെയ്യാം.</li>
          </ul>
        </div>

        {/* Section 3: How to Install */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xl md:text-2xl font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Printer className="w-6 h-6 text-emerald-600" />
            <span>3. കടയിൽ എങ്ങനെ ഇൻസ്റ്റാൾ ചെയ്യാം?</span>
          </h3>
          <div className="space-y-3 text-xs md:text-sm text-slate-700">
            <p><strong>1. കട രജിസ്ട്രേഷൻ:</strong> RTS Smart Print-ൽ നിങ്ങളുടെ കടയുടെ വിവരങ്ങൾ നൽകി രജിസ്റ്റർ ചെയ്യുക.</p>
            <p><strong>2. അക്കൗണ്ട് ആക്ടിവേഷൻ:</strong> RTS ടീം നിങ്ങളുടെ കടയുടെ അക്കൗണ്ട് പരിശോധിച്ച് ആക്ടിവേറ്റ് ചെയ്യും.</p>
            <p><strong>3. QR Code & Dashboard:</strong> നിങ്ങളുടെ കടയ്ക്ക് പ്രത്യേകമായ Online Printing Page, Admin Dashboard, QR Code എന്നിവ ലഭിക്കും.</p>
            <p><strong>4. കമ്പ്യൂട്ടറിൽ ഇൻസ്റ്റാൾ ചെയ്യുക:</strong> നൽകുന്ന RTS Smart Print Agent Setup ഫയൽ Windows കമ്പ്യൂട്ടറിൽ ഇൻസ്റ്റാൾ ചെയ്യുക.</p>
            <p><strong>5. Pairing & Testing:</strong> ലഭിക്കുന്ന Pairing Code ഉപയോഗിച്ച് കമ്പ്യൂട്ടറിനെ നിങ്ങളുടെ കടയുടെ അക്കൗണ്ടുമായി ബന്ധിപ്പിക്കുക.</p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <strong>ആവശ്യമായ അടിസ്ഥാന സൗകര്യങ്ങൾ:</strong> Windows കമ്പ്യൂട്ടർ/ലാപ്‌ടോപ്പ്, കണക്റ്റ് ചെയ്ത പ്രിന്റർ, ഇന്റർനെറ്റ് കണക്ഷൻ, ഉപഭോക്താക്കൾക്ക് സ്മാർട്ട്ഫോൺ.
          </div>
        </div>

      </section>

      {/* Pricing Cards */}
      <section className="max-w-4xl mx-auto px-4 py-8" id="pricing-section">
        <div className="text-center mb-8 space-y-1">
          <span className="text-[11px] font-extrabold uppercase bg-amber-100 text-amber-800 px-3 py-0.5 rounded-full inline-flex items-center gap-1">
            <Tag className="w-3 h-3" /> {t.trialBadge}
          </span>
          <h3 className="text-2xl font-black text-slate-900">{t.plansTitle}</h3>
          <p className="text-xs text-slate-500">{t.plansSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {dbPlans.length > 0 ? (
            dbPlans.map((plan) => {
              const isPro = plan.plan_slug.includes('pro');

              return (
                <div 
                  key={plan.id}
                  className={`bg-white rounded-3xl p-6 shadow-md relative flex flex-col justify-between ${
                    isPro ? 'border border-slate-200 opacity-90' : 'border-2 border-emerald-500'
                  }`}
                >
                  {isPro ? (
                    <span className="absolute top-4 right-4 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      Coming Soon
                    </span>
                  ) : (
                    <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                      {plan.badge_text || 'Popular Choice'}
                    </span>
                  )}

                  <div>
                    <h4 className="font-bold text-lg text-slate-900">{plan.name}</h4>
                    <div className="mt-3 mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">₹{plan.offer_price}</span>
                        {plan.original_price > plan.offer_price && (
                          <span className="text-xs text-slate-400 line-through">₹{plan.original_price}</span>
                        )}
                        <span className="text-xs text-slate-500 capitalize">/{plan.billing_period}</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                        {plan.trial_days}-Day Free Trial Included
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600">
                      {plan.features && Array.isArray(plan.features) ? (
                        plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isPro ? 'text-slate-400' : 'text-emerald-600'}`} />
                            <span>{feat}</span>
                          </li>
                        ))
                      ) : (
                        <>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1 Counter Printer Connection</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> QR Standee Generator with PIN</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Cash & Direct UPI Support</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Live Counter Order Queue</li>
                        </>
                      )}
                    </ul>
                  </div>

                  {isPro ? (
                    <button
                      type="button"
                      disabled
                      className="mt-6 w-full py-2.5 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed border border-slate-200"
                    >
                      Pro Plan Coming Soon
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, selectedPlan: plan.plan_slug }));
                        document.getElementById('inquiry-form-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Select {plan.name}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <>
              {/* Starter Station */}
              <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-md relative flex flex-col justify-between">
                <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                  Popular Choice
                </span>
                <div>
                  <h4 className="font-bold text-lg text-slate-900">Starter Monthly / Yearly</h4>
                  <div className="mt-3 mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">₹499</span>
                      <span className="text-xs text-slate-400 line-through">₹999</span>
                      <span className="text-xs text-slate-500">/Monthly</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                      Yearly Plan: ₹2,499 / വർഷം (ഏകദേശം ₹208/മാസം)
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Online Printing Page & QR Standee</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Shop Admin Dashboard & Print Agent</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Cash & Direct UPI Support (0% Commission)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Auto/Manual Printing & Order Queue</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, selectedPlan: 'starter_monthly' }));
                    document.getElementById('inquiry-form-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Select Starter Plan
                </button>
              </div>

              {/* Yearly Plan Box */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative">
                <span className="absolute top-4 right-4 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  കൂടുതൽ ലാഭകരം
                </span>
                <div>
                  <h4 className="font-bold text-lg text-slate-900">Yearly Plan (വാർഷികം)</h4>
                  <div className="mt-3 mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">₹2,499</span>
                      <span className="text-xs text-slate-500">/Yearly</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                      മാസത്തിൽ ശരാശരി ₹208 മാത്രം (₹990 ലാഭം)
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> ഒരു വർഷത്തെ മുഴുവൻ സബ്സ്ക്രിപ്ഷൻ</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> എല്ലാ മാസപ്ലാൻ സൗകര്യങ്ങളും ലഭ്യമാണ്</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> മുൻഗണനാ സാങ്കേതിക പിന്തുണ</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, selectedPlan: 'starter_yearly' }));
                    document.getElementById('inquiry-form-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Select Yearly Plan
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Section 5 & 6: Benefits & Important Notes */}
      <section className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg md:text-xl font-black text-slate-900 border-b border-slate-100 pb-2">
            5. കടയുടമയ്ക്ക് ലഭിക്കുന്ന പ്രധാന നേട്ടങ്ങൾ
          </h3>
          <ul className="grid md:grid-cols-2 gap-2 text-xs md:text-sm text-slate-700">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> ഉപഭോക്താക്കൾക്ക് കടയിൽ വരുന്നതിന് മുമ്പ് തന്നെ ഓർഡർ നൽകാം.</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> ഫയലുകൾ WhatsApp-ൽ ചോദിച്ച് വാങ്ങേണ്ട സാഹചര്യം കുറയ്ക്കാം.</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> ഓർഡറുകൾ ഒരിടത്ത് ക്രമീകരിച്ച് കൈകാര്യം ചെയ്യാം.</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> പ്രിന്റിംഗ് നിരക്കുകൾ കടയുടമയ്ക്ക് നിയന്ത്രിക്കാം.</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> ഒരേ സമയം ഒന്നിലധികം ഓർഡറുകൾ കൈകാര്യം ചെയ്യാം.</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> കടയുടെ സേവനത്തിന് കൂടുതൽ പ്രൊഫഷണൽ രൂപം നൽകാം.</li>
          </ul>
        </div>

        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 shadow-sm space-y-2 text-xs md:text-sm text-amber-900">
          <h4 className="font-bold text-amber-950 text-base">6. പ്രധാനമായി അറിയേണ്ട കാര്യങ്ങൾ</h4>
          <p>• RTS Smart Print ഒരു പ്രിന്റിംഗ് മാനേജ്മെന്റ് സംവിധാനമാണ്; പ്രിന്ററും കമ്പ്യൂട്ടറും കടയുടമ തന്നെ ഒരുക്കണം.</p>
          <p>• UPI പേയ്‌മെന്റ് വിജയിച്ചതായി കാണിക്കുന്ന സ്ക്രീൻ മാത്രം പണം ലഭിച്ചതിന്റെ ഉറപ്പല്ല. പണം ലഭിച്ചെന്ന് സ്ഥിതിീകരിച്ചശേഷം മാത്രമേ പ്രിന്റിംഗ് നടത്താവൂ.</p>
          <p>• ഇന്റർനെറ്റ് ഇല്ലാത്തപ്പോൾ പുതിയ ഓൺലൈൻ ഓർഡറുകൾ ലഭിക്കില്ല. മുമ്പ് ഡൗൺലോഡ് ചെയ്തിട്ടുള്ള ഓർഡറുകൾ മാത്രമേ ഓഫ്ലൈനായി പ്രിന്റ് ചെയ്യാൻ കഴിയൂ.</p>
          <p>• പ്രിന്ററിന്റെ പ്രവർത്തനക്ഷമതയും പേപ്പർ, മഷി/ടോണർ തുടങ്ങിയവയും കടയുടമയുടെ ഉത്തരവാദിത്തമാണ്.</p>
        </div>
      </section>

      {/* Inquiry Form */}
      <section id="inquiry-form-section" className="max-w-xl mx-auto px-4 py-8 pb-16">
        <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xl">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">{t.successTitle}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{t.successDesc}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="text-center mb-3">
                <h3 className="text-xl font-bold text-slate-900">{t.formTitle}</h3>
                <p className="text-xs text-slate-500">{t.formSubtitle}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t.businessNameLabel}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Friends Xerox & Akshaya Center"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.ownerNameLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.whatsappLabel}</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.emailLabel}</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.cityLabel}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Payyanur / Kannur"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.planLabel}</label>
                  <select
                    value={formData.selectedPlan}
                    onChange={(e) => setFormData({ ...formData, selectedPlan: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none"
                  >
                    <option value="starter_monthly">Monthly Plan (₹499/mo)</option>
                    <option value="starter_yearly">Yearly Plan (₹2,499/yr)</option>
                    <option value="trial_7">7-Day Free Trial (₹0)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{t.printerLabel}</label>
                  <input
                    type="text"
                    placeholder="e.g. HP LaserJet 1020"
                    value={formData.printerModel}
                    onChange={(e) => setFormData({ ...formData, printerModel: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-2 text-xs"
              >
                {loading ? t.btnSubmitting : t.btnSubmit}
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Official RTS Smart Print distribution by RTS Digital Seva (info@rtsdigitalseva.online).
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default BusinessLandingPage;
