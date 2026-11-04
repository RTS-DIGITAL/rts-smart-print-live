import { useEffect, useState } from 'react';
import { Check, ChevronDown, Copy, Download, Loader2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import { printService } from '@/services/printService';

const SETUP_STEPS = [
  'Download and run the setup file on your counter computer.',
  'Paste your 6-digit Shop Pairing Code when prompted.',
  'Select your installed counter printer and click "Start Service".',
];

export function ConnectorCard({ shopId }: { shopId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    printService
      .getPairingCode(shopId)
      .then((found) => {
        if (active) setCode(found);
      })
      .catch((caught: unknown) => {
        if (active) setError(getErrorMessage(caught));
      });
    return () => {
      active = false;
    };
  }, [shopId]);

  async function copyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copying failed. Select the code and copy it manually.');
    }
  }

  const spaced = code ? `${code.slice(0, 3)} ${code.slice(3)}` : null;

  return (
    <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm open:shadow-md">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
        <div>
          <p className="font-semibold text-slate-900">Windows Print Connector</p>
          <p className="mt-1 text-sm text-slate-500">Link your counter printer to the kiosk.</p>
        </div>
        <ChevronDown className="h-5 w-5 shrink-0 text-slate-500 transition group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="space-y-6 border-t border-slate-100 p-5">
        <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">Version 1.0</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">64-bit</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">Free</span>
          </div>
          <button
            type="button"
            disabled
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-300 px-4 text-sm font-semibold text-white"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download RTS Print Setup (Windows 10/11)
          </button>
        </div>
        <p className="-mt-3 text-xs text-slate-500">The installer is not published yet, so this download is unavailable for now.</p>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Shop Pairing Code</p>
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          {!error && !code && <Loader2 className="h-5 w-5 animate-spin text-emerald-600" aria-label="Loading pairing code" />}
          {spaced && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="font-mono text-3xl font-semibold tracking-[0.25em] text-slate-900 tabular-nums">{spaced}</p>
              <button
                type="button"
                onClick={copyCode}
                className="flex h-10 w-fit items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copied ? 'Copied' : 'Copy code'}
              </button>
            </div>
          )}
          <p className="text-sm text-slate-500">Enter this code into the desktop installer to securely link your counter printer.</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">Quick setup</p>
          <ol className="space-y-2">
            {SETUP_STEPS.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm text-slate-600">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </details>
  );
}
