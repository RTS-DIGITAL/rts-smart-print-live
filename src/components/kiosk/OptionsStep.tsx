import type { ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { MAX_COPIES, PAPER_SIZES, formatINR } from '@/lib/pricing';
import type { PaperSize, PrintSelection } from '@/lib/types';

interface Props {
  selection: PrintSelection;
  pageCount: number;
  rate: number | null;
  total: number;
  pricedSizes: PaperSize[];
  onChange: (next: PrintSelection) => void;
  onBack: () => void;
  onNext: () => void;
}

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-2 rounded-xl bg-slate-100 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`h-10 rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
            value === option.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function OptionGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {children}
    </div>
  );
}

export function OptionsStep({
  selection,
  pageCount,
  rate,
  total,
  pricedSizes,
  onChange,
  onBack,
  onNext,
}: Props) {
  const update = (patch: Partial<PrintSelection>) => onChange({ ...selection, ...patch });
  const setCopies = (copies: number) => update({ copies: Math.min(MAX_COPIES, Math.max(1, copies)) });
  const copyWord = selection.copies === 1 ? 'copy' : 'copies';

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Print settings</h2>
        <p className="mt-1 text-sm text-slate-500">Choose how your pages should print.</p>
      </div>

      <OptionGroup title="Paper size">
        <Segmented
          value={selection.paperSize}
          onChange={(paperSize) => update({ paperSize })}
          options={PAPER_SIZES.map((size) => ({
            value: size,
            label: size,
            disabled: !pricedSizes.includes(size),
          }))}
        />
      </OptionGroup>

      <OptionGroup title="Colour">
        <Segmented
          value={selection.isColor ? 'color' : 'bw'}
          onChange={(value) => update({ isColor: value === 'color' })}
          options={[
            { value: 'bw', label: 'Black & white' },
            { value: 'color', label: 'Colour' },
          ]}
        />
      </OptionGroup>

      <OptionGroup title="Sides">
        <Segmented
          value={selection.isDoubleSided ? 'duplex' : 'simplex'}
          onChange={(value) => update({ isDoubleSided: value === 'duplex' })}
          options={[
            { value: 'simplex', label: 'Single-sided' },
            { value: 'duplex', label: 'Double-sided' },
          ]}
        />
      </OptionGroup>

      <OptionGroup title="Copies">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-2">
          <button
            type="button"
            onClick={() => setCopies(selection.copies - 1)}
            disabled={selection.copies <= 1}
            aria-label="Decrease copies"
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-slate-200 disabled:opacity-40"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="min-w-16 text-center text-lg font-semibold tabular-nums text-slate-900">
            {selection.copies}
          </span>
          <button
            type="button"
            onClick={() => setCopies(selection.copies + 1)}
            disabled={selection.copies >= MAX_COPIES}
            aria-label="Increase copies"
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </OptionGroup>

      <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-lg">
        <p className="text-sm text-slate-300">Estimated total</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">{rate === null ? '--' : formatINR(total)}</p>
        <p className="mt-3 text-sm text-slate-300">
          {rate === null
            ? 'This option is not priced yet. Try another paper size, colour or side setting.'
            : `${pageCount} ${pageCount === 1 ? 'page' : 'pages'} × ${selection.copies} ${copyWord} × ${formatINR(rate)} per page`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-12 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={rate === null}
          className="h-12 rounded-xl bg-emerald-500 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
