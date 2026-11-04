import { FileUp, Printer, Wallet, Store } from 'lucide-react';

const STEPS = [
  { icon: FileUp, title: 'Upload PDF or image', detail: 'Up to 50 MB' },
  { icon: Printer, title: 'Choose B&W or Colour', detail: 'Single or double-sided' },
  { icon: Wallet, title: 'Pay via UPI', detail: 'Secure online payment' },
  { icon: Store, title: 'Collect at the counter', detail: 'Your printout is ready at the desk' },
];

export function HowItWorks() {
  return (
    <ol className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3" aria-label="How it works">
      {STEPS.map(({ icon: Icon, title, detail }, index) => (
        <li key={title} className="flex items-start gap-2.5 rounded-xl bg-white p-3 shadow-sm">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-xs font-bold text-white">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-xs font-semibold leading-snug text-slate-900">
              <Icon className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />
              {title}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
