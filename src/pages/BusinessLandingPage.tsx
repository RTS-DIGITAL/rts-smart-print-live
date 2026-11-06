import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, CheckCircle2, Phone, Mail, Lock, Languages, Tag } from 'lucide-react';
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
    plansSubtitle: "One-time setup with free maintenance (AMC) and trial included",
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
    plansSubtitle: "വൺ-ടൈം സെറ്റപ്പും വാർഷിക മെയിന്റനൻസും ട്രയലും ഉൾപ്പെടുന്നു",
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

  // Dynamic Plans from Supabase
  const [dbPlans, setDbPlans] = useState<PlatformPlan[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    city: '',
    selectedPlan: 'starter',
    printerModel: '',
    message: ''
  });

  // Load platform plans configured in Super Admin
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
      // 1. Save inquiry to Supabase
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

      // 2. Dispatch email to info@rtsdigitalseva.online via Web3Forms
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: 'c6424f38-4a5e-4f4c-b874-460081e81c74',
          subject: `New Shop Registration: ${formData.businessName}`,
          from_name: 'RTS Smart Print Inquiries',
          ...formData
        })
      }).catch(() => {});

      setSubmitted(true);
    } catch {
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
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
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

      {/* Pricing Cards with Dynamic Super Admin Offers */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8 space-y-1">
          <span className="text-[11px] font-extrabold uppercase bg-amber-100 text-amber-800 px-3 py-0.5 rounded-full inline-flex items-center gap-1">
            <Tag className="w-3 h-3" /> {t.trialBadge}
          </span>
          <h3 className="text-2xl font-black text-slate-900">{t.plansTitle}</h3>
          <p className="text-xs text-slate-500">{t.plansSubtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {dbPlans.length > 0 ? (
            // Render Dynamic Plans from Super Admin platform_plans table
            dbPlans.map((plan) => (
              <div 
                key={plan.id}
                className="bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-md relative flex flex-col justify-between"
              >
                {plan.badge_text && (
                  <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                    {plan.badge_text}
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
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Kiosk Portal & Standee</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% Direct UPI / Cash Flow</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automatic Windows Print Spooler</li>
                      </>
                    )}
                  </ul>
                </div>
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
              </div>
            ))
          ) : (
            // Fallback Static Starter and Pro Cards
            <>
              <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-md relative flex flex-col justify-between">
                <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                  Popular
                </span>
                <div>
                  <h4 className="font-bold text-lg text-slate-900">{t.starterTitle}</h4>
                  <div className="mt-3 mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">{t.starterOffer}</span>
                      <span className="text-xs text-slate-400 line-through">{t.starterSetup}</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1">{t.starterRenewal}</p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1 Kiosk Portal</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% Direct UPI Payments</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automatic Windows Print Spooler</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 7-Day Free Trial Available</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, selectedPlan: 'starter' }));
                    document.getElementById('inquiry-form-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Select Starter
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-lg text-slate-900">{t.proTitle}</h4>
                  <div className="mt-3 mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900">{t.proOffer}</span>
                      <span className="text-xs text-slate-400 line-through">{t.proSetup}</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1">{t.proRenewal}</p>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Multi-Printer Support (B&W + Color)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dual UPI & Cash Counter mode</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Priority WhatsApp & Remote Support</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Free QR Counter Standee Design</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, selectedPlan: 'pro' }));
                    document.getElementById('inquiry-form-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition"
                >
                  Select Pro
                </button>
              </div>
            </>
          )}
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
                    {dbPlans.length > 0 ? (
                      dbPlans.map((p) => (
                        <option key={p.id} value={p.plan_slug}>
                          {p.name} (₹{p.offer_price})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="starter">Starter Pack (Offer: ₹1,999)</option>
                        <option value="pro">Pro Pack (Offer: ₹3,999)</option>
                      </>
                    )}
                    <option value="trial">7-Day Free Trial (₹0)</option>
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
