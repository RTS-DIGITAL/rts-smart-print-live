import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { PreviewDocument } from '@/lib/pdfPreview';

interface Props {
  doc: PreviewDocument;
  fileName: string;
  onBack: () => void;
  onNext: () => void;
}

export function PreviewStep({ doc, fileName, onBack, onNext }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(1);
  const [rendering, setRendering] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let active = true;
    setRendering(true);
    setRenderError(null);
    doc
      .renderPage(page, canvas, 360)
      .then(() => {
        if (active) setRendering(false);
      })
      .catch(() => {
        if (!active) return;
        setRenderError('This page could not be previewed.');
        setRendering(false);
      });
    return () => {
      active = false;
    };
  }, [doc, page]);

  const isLast = page >= doc.pageCount;

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Check your document</h2>
        <p className="mt-1 truncate text-sm text-slate-500">{fileName}</p>
      </div>

      <div className="relative flex min-h-64 items-center justify-center rounded-2xl bg-slate-100 p-4">
        <canvas ref={canvasRef} className="max-h-96 w-full rounded-lg bg-white object-contain shadow-md" />
        {rendering && !renderError && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-100/80">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" aria-label="Loading preview" />
          </div>
        )}
        {renderError && <p className="absolute text-sm text-rose-700">{renderError}</p>}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 p-2">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <span className="text-sm font-medium text-slate-700">
          Page {page} of {doc.pageCount}
        </span>
        <button
          type="button"
          onClick={() => setPage((current) => Math.min(doc.pageCount, current + 1))}
          disabled={isLast}
          aria-label="Next page"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-12 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Choose another
        </button>
        <button
          type="button"
          onClick={onNext}
          className="h-12 rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
