import { useState, type FormEvent, type ReactNode } from 'react';
import { CreditCard, Eye, EyeOff, Loader2, Save, ShieldCheck, Store } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import type { Shop, ShopSettingsInput } from '@/lib/types';
import { printService } from '@/services/printService';

const RETENTION_OPTIONS: Array<{ hours: number; label: string }> = [
  { hours: 1, label: '1 hour' },
  { hours: 6, label: '6 hours' },
  { hours: 24, label: '24 hours' },
  { hours: 48, label: '48 hours' },
];

const blankToNull = (value: string | null) => {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
};

function validate(form: ShopSettingsInput, keySecret: string): string | null {
  if (form.name.trim() === '') return 'Shop name cannot be empty.';
  if (form.phone && !/^\+?[0-9 -]{10,15}$/.test(form.phone.trim())) return 'Enter a valid phone number.';
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Enter a valid email address.';
  if (form.razorpayKeyId && !/^rzp_(test|live)_[A-Za-z0-9]+$/.test(form.razorpayKeyId.trim())) {
    return 'Razorpay Key IDs start with rzp_test_ or rzp_live_.';
  }
  if (form.razorpayEnabled && !form.razorpayKeyId?.trim()) return 'Add a Razorpay Key ID, or turn payments off.';
  if (keySecret && keySecret.trim().length < 8) return 'The Razorpay key secret looks too short.';
  return null;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const inputClass =
  'h-11 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 disabled:bg-slate-50 disabled:text-slate-500';

interface Props {
  shop: Shop;
  onSaved: () => void;
}

export function SettingsPanel({ shop, onSaved }: Props) {
  const [form, setForm] = useState<ShopSettingsInput>(() => ({
    name: shop.name,
    tagline: shop.tagline,
    phone: shop.phone,
    email: shop.email,
    address: shop.address,
    counterNotice: shop.counterNotice,
    isAcceptingOrders: shop.isAcceptingOrders,
    retentionHours: shop.retentionHours,
    razorpayEnabled: shop.razorpayEnabled,
    razorpayKeyId: shop.razorpayKeyId,
    targetPrinterName: shop.targetPrinterName,
    defaultPaperTray: shop.defaultPaperTray,
  }));
  const [keySecret, setKeySecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const update = <K extends keyof ShopSettingsInput>(key: K, value: ShopSettingsInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const keyId = form.razorpayKeyId?.trim() ?? '';
  const mode = keyId.startsWith('rzp_live_') ? 'Live' : keyId.startsWith('rzp_test_') ? 'Test' : null;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const problem = validate(form, keySecret);
    if (problem) {
      setMessage({ tone: 'error', text: problem });
      return;
    }
    setSaving(true);
    try {
      await printService.updateShopSettings(shop.id, {
        ...form,
        name: form.name.trim(),
        tagline: form.tagline.trim(),
        phone: blankToNull(form.phone),
        email: blankToNull(form.email),
        address: blankToNull(form.address),
        counterNotice: blankToNull(form.counterNotice),
        razorpayKeyId: blankToNull(form.razorpayKeyId),
      });
      if (keySecret.trim()) {
        await printService.saveRazorpaySecret(shop.id, keySecret.trim());
        setKeySecret('');
      }
      setMessage({ tone: 'ok', text: 'Settings saved. Your kiosk now uses these details.' });
      onSaved();
    } catch (caught) {
      setMessage({ tone: 'error', text: getErrorMessage(caught) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Changes appear on your kiosk and counter stand after you save.</p>
      </div>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Store className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          Shop profile
        </h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Shop name">
            <input className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} />
          </Field>
          <Field label="Store slug" hint="Used in your kiosk link. Contact support to change it.">
            <input className={inputClass} value={shop.slug} disabled readOnly />
          </Field>
          <Field label="Phone number">
            <input className={inputClass} type="tel" value={form.phone ?? ''} onChange={(e) => update('phone', e.target.value)} />
          </Field>
          <Field label="Email">
            <input className={inputClass} type="email" value={form.email ?? ''} onChange={(e) => update('email', e.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Shop address">
              <input className={inputClass} value={form.address ?? ''} onChange={(e) => update('address', e.target.value)} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Counter notice" hint="Shown to customers after payment, for example where to collect.">
              <input className={inputClass} value={form.counterNotice ?? ''} onChange={(e) => update('counterNotice', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{form.isAcceptingOrders ? 'Open for orders' : 'Closed for orders'}</p>
            <p className="text-xs text-slate-500">Closed shops show a notice on the kiosk and refuse new uploads.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.isAcceptingOrders}
            onClick={() => update('isAcceptingOrders', !form.isAcceptingOrders)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${form.isAcceptingOrders ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${form.isAcceptingOrders ? 'left-5.5' : 'left-0.5'}`} />
          </button>
        </div>
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <CreditCard className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Payment gateway
          </h2>
          {mode && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${mode === 'Live' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {mode} mode
            </span>
          )}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Enable Razorpay payments</p>
          <button
            type="button"
            role="switch"
            aria-checked={form.razorpayEnabled}
            onClick={() => update('razorpayEnabled', !form.razorpayEnabled)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${form.razorpayEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${form.razorpayEnabled ? 'left-5.5' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Razorpay Key ID" hint="Starts with rzp_test_ or rzp_live_.">
            <input
              className={inputClass}
              placeholder="rzp_test_..."
              value={form.razorpayKeyId ?? ''}
              onChange={(e) => update('razorpayKeyId', e.target.value)}
              autoComplete="off"
            />
          </Field>
          <Field label="Razorpay Key Secret" hint="Stored privately. Leave blank to keep the saved secret.">
            <div className="relative">
              <input
                className={`${inputClass} pr-12`}
                type={showSecret ? 'text' : 'password'}
                value={keySecret}
                onChange={(e) => setKeySecret(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowSecret((current) => !current)}
                aria-label={showSecret ? 'Hide key secret' : 'Show key secret'}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                {showSecret ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </Field>
        </div>

        <p className="flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Funds will settle directly to the bank account linked with your Razorpay account.
        </p>
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">Data retention and privacy</h2>
        <Field label="Auto-delete customer files after">
          <select
            className={inputClass}
            value={form.retentionHours}
            onChange={(e) => update('retentionHours', Number(e.target.value))}
          >
            {RETENTION_OPTIONS.map((option) => (
              <option key={option.hours} value={option.hours}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </section>

      {message && (
        <p role="alert" className={`rounded-xl p-3 text-sm ${message.tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>
          {message.text}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-6xl justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:opacity-70"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            Save Settings
          </button>
        </div>
      </div>
    </form>
  );
}
