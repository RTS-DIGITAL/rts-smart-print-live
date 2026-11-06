import React, { useState } from 'react';
import { ShieldCheck, Printer, Zap, CheckCircle2, ArrowRight, Phone, Mail, FileText, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const BusinessLandingPage: React.FC = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('shop_inquiries').insert([
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
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      alert('Error submitting form. Please call RTS Digital Seva directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navigation */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            R
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 leading-tight">RTS Smart Print</h1>
            <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Business Solution</p>
          </div>
        </div>
        <a
  href="https://wa.me/917012833699?text=Hello%20RTS,%20I%20am%20interested%20in%20setting%20up%20Smart%20Print%20for%20my%20shop"
  target="_blank"
  rel="noreferrer"
  className="text-xs font-bold px-4 py-2 bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition"
>
  WhatsApp Us (7012833699)
</a>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center space-y-4">
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase">
          Zero-Touch Customer Printing
        </span>
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
          Eliminate WhatsApp & Pen Drive Queues in Your Shop
        </h2>
        <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Let customers scan a QR code at your counter, upload their documents, pay via UPI directly into your bank, and have their pages spool straight to your printer automatically.
        </p>
      </section>

      {/* Safety & Trust Pillars */}
      <section className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900">Total Customer Privacy</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Files are transmitted via encrypted SSL and deleted automatically from the server right after printing. No pen drive viruses, no customer WhatsApp numbers cluttering your phone.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900">Direct 100% UPI Settlement</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            All customer payments go directly into your personal or business UPI ID (Google Pay, PhonePe, Paytm). RTS charges 0% transaction commission.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900">Safe for Your Shop PC</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            The lightweight Windows agent does not alter system registries or open firewall ports. It uses standard Windows print drivers compatible with HP, Canon, Epson, and Brother.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-black text-slate-900">Transparent Subscription Plans</h3>
          <p className="text-xs text-slate-500 mt-1">One-time setup fee + 1 year free maintenance included</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-md relative">
            <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
              Most Popular
            </span>
            <h4 className="font-bold text-lg text-slate-900">Starter Counter Pack</h4>
            <div className="mt-3 mb-4">
              <span className="text-3xl font-black text-slate-900">₹2,499</span>
              <span className="text-xs text-slate-500 ml-1">one-time setup</span>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">₹999/year renewal from Year 2 onwards</p>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1 Counter Kiosk Page</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Direct UPI Payments (0% fee)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automatic Windows Print Agent</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Ready-to-print Shop QR Signage PDF</li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h4 className="font-bold text-lg text-slate-900">Pro Multi-Printer Pack</h4>
            <div className="mt-3 mb-4">
              <span className="text-3xl font-black text-slate-900">₹4,999</span>
              <span className="text-xs text-slate-500 ml-1">one-time setup</span>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">₹1,499/year renewal from Year 2 onwards</p>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Everything in Starter</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dual-Printer routing (B&W + Color)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Razorpay Gateway Integration toggle</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Priority WhatsApp & Remote Support</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Request Received!</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Thank you! Our technical team from RTS Digital Seva will contact you shortly on WhatsApp to configure your shop and provide your installation bundle.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-slate-900">Get RTS Smart Print for Your Shop</h3>
                <p className="text-xs text-slate-500">Fill this quick form and we will set up your custom kiosk within 2 hours.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shop / Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Friends Xerox & Akshaya Center"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City / Taluk *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Payyanur / Kannur"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Plan</label>
                  <select
                    value={formData.selectedPlan}
                    onChange={(e) => setFormData({ ...formData, selectedPlan: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white outline-none"
                  >
                    <option value="starter">Starter Pack (₹2,499)</option>
                    <option value="pro">Pro Pack (₹4,999)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Printer Model</label>
                  <input
                    type="text"
                    placeholder="e.g. HP LaserJet 1020"
                    value={formData.printerModel}
                    onChange={(e) => setFormData({ ...formData, printerModel: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Submitting...' : 'Register My Shop Now'}
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Official inquiries handled by RTS Digital Seva (info@rtsdigitalseva.online).
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
