import { useRef, useState, type DragEvent } from 'react';
import { AlertCircle, FileUp, Loader2 } from 'lucide-react';

interface Props {
  busy: boolean;
  error: string | null;
  onFile: (file: File) => void;
}

const ACCEPT = 'application/pdf,image/jpeg,image/png';

export function UploadStep({ busy, error, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    const next = event.dataTransfer.files[0];
    if (next) onFile(next);
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Upload your document</h2>
        <p className="mt-1 text-sm text-slate-500">PDF, JPG or PNG, up to 50 MB.</p>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition duration-200 disabled:cursor-wait ${
          dragging
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-slate-300 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50/60'
        }`}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-emerald-400">
          {busy ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" /> : <FileUp className="h-6 w-6" aria-hidden="true" />}
        </span>
        <span className="text-base font-semibold text-slate-900">
          {busy ? 'Reading your file...' : 'Tap to choose a file'}
        </span>
        <span className="text-sm text-slate-500">or drag and drop it here</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          const next = event.target.files?.[0];
          if (next) onFile(next);
          event.target.value = '';
        }}
      />

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
