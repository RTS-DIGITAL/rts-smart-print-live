import { useCallback, useState, type FormEvent } from 'react';
import { Loader2, Printer, Save } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import { useLiveData } from '@/lib/useLiveData';
import type { PaperSize, Printer as PrinterInfo, Shop } from '@/lib/types';
import { printService } from '@/services/printService';

const PAPER_TRAYS: PaperSize[] = ['A4', 'Letter', 'Legal'];

interface Props {
  shop: Shop;
  onSaved: () => void;
}

export function PrintersPanel({ shop, onSaved }: Props) {
  const load = useCallback(() => printService.listPrinters(shop.id), [shop.id]);
  const { data: printers, error, refresh } = useLiveData(load, 10000);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [targetName, setTargetName] = useState(shop.targetPrinterName);
  const [tray, setTray] = useState<PaperSize>(shop.defaultPaperTray);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function toggle(printer: PrinterInfo) {
    setBusyId(printer.id);
    setActionError(null);
    try {
      await printService.setPrinterStatus(printer.id, printer.status === 'online' ? 'offline' : 'online');
      refresh();
    } catch (caught) {
      setActionError(getErrorMessage(caught));
    } finally {
      setBusyId(null);
    }
  }

  async function savePrinterTarget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = targetName.trim();
    if (!name) {
      setSaveError('Enter the exact printer name from Windows.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await printService.updatePrinterTarget(shop.id, name, tray);
      setTargetName(name);
      setSaved(true);
      onSaved();
    } catch (caught) {
      setSaveError(getErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Printers</h1>

      <form onSubmit={savePrinterTarget} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <p className="font-semibold text-slate-900">Windows print target</p>
          <p className="mt-1 text-sm text-slate-500">
            Paste the printer name exactly as it appears in Windows Settings. The print agent sends jobs to this printer.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Printer name</span>
            <input
              value={targetName}
              onChange={(event) => setTargetName(event.target.value)}
              disabled={saving}
              className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Default paper tray</span>
            <select
              value={tray}
              onChange={(event) => setTray(event.target.value as PaperSize)}
              disabled={saving}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
            >
              {PAPER_TRAYS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
        {saveError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{saveError}</p>}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-70"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            Save printer
          </button>
          {saved && <p className="text-sm font-medium text-emerald-700">Saved</p>}
        </div>
      </form>

      {!printers ? (
        error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : <Loader2 className="h-6 w-6 animate-spin text-emerald-600" aria-label="Loading" />
      ) : (
        <>
          {actionError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{actionError}</p>}
          <ul className="grid gap-3 md:grid-cols-2">
            {printers.map((printer) => {
              const online = printer.status === 'online';
              return (
                <li key={printer.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${online ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      <Printer className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{printer.displayName}</p>
                      <p className="text-xs text-slate-500">
                        {printer.systemName} · {printer.supportedSizes.join(', ')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={online}
                    aria-label={`Toggle ${printer.displayName}`}
                    disabled={busyId === printer.id}
                    onClick={() => void toggle(printer)}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${online ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${online ? 'left-5.5' : 'left-0.5'}`} />
                  </button>
                </li>
              );
            })}
          </ul>
          {printers.length === 0 && <p className="text-sm text-slate-500">No printers are connected to this shop.</p>}
        </>
      )}
    </div>
  );
}
