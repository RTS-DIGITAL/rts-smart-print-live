import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Check, Loader2, MapPin, Phone, Store } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { CheckoutStep } from '@/components/kiosk/CheckoutStep';
import { HowItWorks } from '@/components/kiosk/HowItWorks';
import { OptionsStep } from '@/components/kiosk/OptionsStep';
import { PreviewStep } from '@/components/kiosk/PreviewStep';
import { UploadStep } from '@/components/kiosk/UploadStep';
import { calculateTotal, findRule, validateUpload } from '@/lib/pricing';
import { loadPreview, type PreviewDocument } from '@/lib/pdfPreview';
import type { KioskData, PrintSelection } from '@/lib/types';
import { printService } from '@/services/printService';

const STEP_LABELS = ['Upload', 'Preview', 'Customize', 'Checkout'];

const DEFAULT_SELECTION: PrintSelection = {
  paperSize: 'A4',
  isColor: false,
  isDoubleSided: false,
  copies: 1,
};

type LoadState = 'loading' | 'ready' | 'missing' | 'error';

export default function KioskPage() {
  const { shopSlug = '' } = useParams();
  const [kiosk, setKiosk] = useState<KioskData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewDocument | null>(null);
  const [selection, setSelection] = useState<PrintSelection>(DEFAULT_SELECTION);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoadState('loading');
    printService
      .getKioskData(shopSlug)
      .then((data) => {
        if (!active) return;
        setKiosk(data);
        setLoadState(data ? 'ready' : 'missing');
      })
      .catch(() => {
        if (active) setLoadState('error');
      });
    return () => {
      active = false;
    };
  }, [shopSlug]);

  useEffect(() => () => preview?.destroy(), [preview]);

  async function handleFile(next: File) {
    const problem = validateUpload(next);
    if (problem) {
      setUploadError(problem);
      return;
    }
    setBusy(true);
    setUploadError(null);
    try {
      const doc = await loadPreview(next);
      setFile(next);
      setPreview(doc);
      setSelection(DEFAULT_SELECTION);
      setStep(1);
    } catch {
      setUploadError('We could not read this file. Please try another PDF, JPG or PNG.');
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    setFile(null);
    setPreview(null);
    setSelection(DEFAULT_SELECTION);
    setStep(0);
  }

  if (loadState !== 'ready' || !kiosk) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        {loadState === 'loading' && <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-label="Loading shop" />}
        {loadState === 'missing' && (
          <StatusMessage title="Shop not found" text="Check the link or ask the shop for a new one." />
        )}
        {loadState === 'error' && (
          <StatusMessage title="Something went wrong" text="We could not reach the shop. Please refresh and try again." />
        )}
      </div>
    );
  }

  const isOpen = kiosk.shop.isAcceptingOrders;
  const pricedSizes = [...new Set(kiosk.pricing.map((rule) => rule.paperSize))];
  const pageCount = preview?.pageCount ?? 0;
  const rule = findRule(kiosk.pricing, selection);
  const rate = rule?.pricePerPage ?? null;
  const total = rate === null ? 0 : calculateTotal(pageCount, selection.copies, rate);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-xl shadow-slate-900/5">
        <header className="bg-slate-900 px-5 pb-6 pt-6 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <BrandMark />
              <div>
                <h1 className="text-base font-semibold leading-tight">{kiosk.shop.name}</h1>
                {kiosk.shop.address && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-300">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {kiosk.shop.address}
                  </p>
                )}
                {kiosk.shop.phone && (
                  <p className="flex items-center gap-1 text-xs text-slate-300">
                    <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {kiosk.shop.phone}
                  </p>
                )}
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isOpen ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-300'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-emerald-400' : 'bg-slate-400'}`} />
              {isOpen ? 'Open' : 'Offline'}
            </span>
          </div>

          <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Progress">
            {STEP_LABELS.map((label, index) => {
              const done = index < step;
              const current = index === step;
              return (
                <li key={label} className="space-y-1.5">
                  <div
                    className={`h-1 rounded-full transition-colors duration-300 ${
                      done || current ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  />
                  <p
                    className={`flex items-center gap-1 text-[11px] font-medium ${
                      current ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {done && <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />}
                    {label}
                  </p>
                </li>
              );
            })}
          </ol>
        </header>

        <main className="flex-1 px-5 py-6">
          {!file && isOpen && (
            <div className="space-y-5">
              <HowItWorks />
              <UploadStep busy={busy} error={uploadError} onFile={handleFile} />
            </div>
          )}

          {!file && !isOpen && (
            <div role="status" className="flex flex-col items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden="true" />
              <p className="font-semibold text-amber-900">This shop is temporarily not accepting print orders right now.</p>
              <p className="text-sm text-amber-800">Please check back shortly.</p>
            </div>
          )}

          {file && preview && step === 1 && (
            <PreviewStep
              doc={preview}
              fileName={file.name}
              onBack={startOver}
              onNext={() => setStep(2)}
            />
          )}

          {file && preview && step === 2 && (
            <OptionsStep
              selection={selection}
              pageCount={pageCount}
              rate={rate}
              total={total}
              pricedSizes={pricedSizes}
              onChange={setSelection}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {file && preview && step === 3 && (
            <CheckoutStep
              shopName={kiosk.shop.name}
              shopSlug={kiosk.shop.slug}
              razorpayKeyId={kiosk.shop.razorpayEnabled ? kiosk.shop.razorpayKeyId : null}
              file={file}
              pageCount={pageCount}
              selection={selection}
              total={total}
              onBack={() => setStep(2)}
            />
          )}
        </main>

        <footer className="flex items-center justify-center gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-400">
          <Store className="h-3.5 w-3.5" aria-hidden="true" />
          {kiosk.shop.name}
        </footer>
      </div>
    </div>
  );
}

function StatusMessage({ title, text }: { title: string; text: string }) {
  return (
    <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
      <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" aria-hidden="true" />
      <p className="mt-3 font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}
