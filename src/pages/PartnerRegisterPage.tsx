import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Loader2, Printer, Store, Wallet, Zap } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { getErrorMessage } from '@/lib/errors';
import type { PartnerRegistrationInput } from '@/lib/types';
import { printService } from '@/services/printService';

const PRINTER_BRANDS = ['Brother', 'Epson', 'Canon', 'HP', 'Other'];
const SLUG_PATTERN = /^[a-z0-9-]{3,40}$/;
const PUBLIC_DOMAIN = 'rtsdigitalseva.online';

const HIGHLIGHTS = [
  { icon: Zap, label: 'Zero queues' },
  { icon: Printer, label: '24/7 self-service' },
  { icon: Wallet, label: 'Instant UPI settlement' },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

const INITIAL_FORM = {
  ownerName: '',
  businessName: '',
  phone: '',
  address: '',
  printerBrand: 'Brother',
  email: '',
  password: '',
};

export default function PartnerRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveSlug = slugTouched ? slug : slugify(form.businessName);

  function update<K extends keyof typeof INITIAL_FORM>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!SLUG_PATTERN.test(effectiveSlug)) {
      setError('The shop link can use only lowercase letters, numbers and dashes (3 to 40 characters).');
      return;
    }
    if (form.phone.replace(/\D/g, '').length < 10) {
      setError('Enter a 10-digit counter mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const existing = await printService.getUser();
      if (!existing) {
        await printService.signUp(form.email.trim(), form.password);
        const signedIn = await printService.getUser();
        if (!signedIn) {
          await printService.signIn(form.email.trim(), form.password);
        }
      }

      const input: PartnerRegistrationInput = {
        ownerName: form.ownerName.trim(),
        businessName: form.businessName.trim(),
        slug: effectiveSlug,
        phone: form.phone.trim(),
        address: form.address.trim(),
        printerBrand: form.printerBrand,
      };
      await printService.registerShop(input);
      navigate('/admin', { replace: true });
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 md:px-8">
          <div className="flex items-center gap-3">
            <BrandMark className="h-9 w-9" />
            <span className="text-sm font-semibold">RTS Smart Print</span>
          </div>
          <Link to="/admin" className="text-sm font-medium text-slate-300 transition hover:text-white">
            Already registered? Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-5 py-10 md:px-8 lg:grid-cols-[1fr_1.1fr] lg:py-16">
        <section className="space-y-6 self-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            <Store className="h-3.5 w-3.5" aria-hidden="true" />
            For photocopy shops and cyber cafes
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
            Turn Your Counter Printer into a 24/7 Self-Service Kiosk
          </h1>
          <p className="text-lg text-slate-600">Zero queues. Instant UPI settlement.</p>
          <ul className="flex flex-wrap gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm">
                <Icon className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />Customers upload, pay and print from their phone.</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />Your shop starts with standard A4 rates that you can change any time.</li>
            <li className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />You land straight in your own admin dashboard.</li>
          </ol>
        </section>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 md:p-8">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Register your shop</h2>
            <p className="mt-1 text-sm text-slate-500">Takes about two minutes.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Owner legal name" htmlFor="owner-name">
              <input id="owner-name" required value={form.ownerName} onChange={(e) => update('ownerName', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Business name" htmlFor="business-name">
              <input id="business-name" required value={form.businessName} onChange={(e) => update('businessName', e.target.value)} className={inputClass} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Shop counter mobile" htmlFor="shop-phone">
              <input id="shop-phone" type="tel" inputMode="tel" required value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="7025916338" className={inputClass} />
            </Field>
            <Field label="Verification code" htmlFor="otp">
              <div className="flex gap-2">
                <input id="otp" disabled placeholder="OTP coming soon" className={`${inputClass} disabled:bg-slate-50`} />
                <button type="button" disabled className="h-11 shrink-0 rounded-xl border border-slate-300 px-3 text-xs font-semibold text-slate-400">
                  Send OTP
                </button>
              </div>
            </Field>
          </div>

          <Field label="Shop full address and landmark" htmlFor="address">
            <textarea id="address" required rows={2} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Near Bus Stand, Taluk Office Road" className={`${inputClass} h-auto py-3`} />
          </Field>

          <Field label="Shop link" htmlFor="slug" hint={`Preview: ${PUBLIC_DOMAIN}/shop/${effectiveSlug || 'my-shop-name'}`}>
            <input
              id="slug"
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className={inputClass}
            />
          </Field>

          <Field label="Primary printer brand" htmlFor="printer-brand">
            <select id="printer-brand" value={form.printerBrand} onChange={(e) => update('printerBrand', e.target.value)} className={inputClass}>
              {PRINTER_BRANDS.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 border-t border-slate-200 pt-5 md:grid-cols-2">
            <Field label="Login email" htmlFor="email">
              <input id="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Password" htmlFor="password">
              <input id="password" type="password" autoComplete="new-password" required minLength={6} value={form.password} onChange={(e) => update('password', e.target.value)} className={inputClass} />
            </Field>
          </div>

          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-5 w-5" aria-hidden="true" />}
            {submitting ? 'Setting up your shop...' : 'Register and open my dashboard'}
          </button>
        </form>
      </main>
    </div>
  );
}

const inputClass =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20';

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
