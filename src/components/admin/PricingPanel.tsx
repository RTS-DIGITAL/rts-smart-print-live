import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import { formatINR } from '@/lib/pricing';
import { useLiveData } from '@/lib/useLiveData';
import type { PricingRule } from '@/lib/types';
import { printService } from '@/services/printService';

export function PricingPanel({ shopId }: { shopId: string }) {
  const load = useCallback(() => printService.listPricing(shopId), [shopId]);
  const { data: rules, error, refresh } = useLiveData(load);

  if (!rules) {
    return error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : <Loader2 className="h-6 w-6 animate-spin text-emerald-600" aria-label="Loading" />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Pricing</h1>
        <p className="mt-1 text-sm text-slate-500">Price per page, charged for each copy.</p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {rules.map((rule) => (
          <PriceRow key={rule.id} rule={rule} onSaved={refresh} />
        ))}
      </ul>
    </div>
  );
}

function PriceRow({ rule, onSaved }: { rule: PricingRule; onSaved: () => void }) {
  const [draft, setDraft] = useState(String(rule.pricePerPage));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(String(rule.pricePerPage));
  }, [rule.pricePerPage]);

  const parsed = Number(draft);
  const valid = draft.trim() !== '' && Number.isFinite(parsed) && parsed >= 0 && parsed <= 10000;
  const changed = valid && parsed !== rule.pricePerPage;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await printService.updatePrice(rule.id, parsed);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
      onSaved();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="font-semibold text-slate-900">
        {rule.paperSize} · {rule.isColor ? 'Colour' : 'B&W'} · {rule.isDoubleSided ? 'Double-sided' : 'Single-sided'}
      </p>
      <p className="mt-1 text-sm text-slate-500">Currently {formatINR(rule.pricePerPage)} per page</p>
      <div className="mt-4 flex items-center gap-2">
        <span className="text-slate-500" aria-hidden="true">₹</span>
        <input
          type="number"
          min={0}
          step="0.5"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label={`Price per page for ${rule.paperSize} ${rule.isColor ? 'colour' : 'B&W'}`}
          className="h-11 w-full rounded-xl border border-slate-300 px-3 text-base tabular-nums outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
        />
        <button
          type="button"
          onClick={save}
          disabled={!changed || saving}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {saved && <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
    </li>
  );
}
