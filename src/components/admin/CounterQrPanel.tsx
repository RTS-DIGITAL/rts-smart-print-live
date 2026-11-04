import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';
import type { Shop } from '@/lib/types';

const STAND_WIDTH = 600;
const STAND_HEIGHT = 900;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function buildStandSvg(shop: Shop, url: string): Promise<string> {
  const qrSvg = await QRCode.toString(url, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#0F172A', light: '#FFFFFF' },
  });
  const qrDoc = new DOMParser().parseFromString(qrSvg, 'image/svg+xml');
  const qrRoot = qrDoc.documentElement;
  const qrInner = Array.from(qrRoot.childNodes)
    .map((node) => new XMLSerializer().serializeToString(node))
    .join('');
  const qrViewBox = qrRoot.getAttribute('viewBox') ?? '0 0 1 1';

  const notice = shop.counterNotice?.trim() || 'Collect your prints at the counter';
  const address = shop.address?.trim() ?? '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${STAND_WIDTH}" height="${STAND_HEIGHT}" viewBox="0 0 ${STAND_WIDTH} ${STAND_HEIGHT}">
  <rect width="${STAND_WIDTH}" height="${STAND_HEIGHT}" fill="#FFFFFF"/>
  <rect width="${STAND_WIDTH}" height="210" fill="#0F172A"/>
  <rect x="40" y="62" width="84" height="84" rx="20" fill="#10B981"/>
  <text x="82" y="114" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="700" fill="#FFFFFF">RTS</text>
  <text x="152" y="98" font-family="Helvetica, Arial, sans-serif" font-size="40" font-weight="700" fill="#FFFFFF">${escapeXml(shop.name)}</text>
  <text x="152" y="140" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#CBD5E1">${escapeXml(address)}</text>
  <text x="152" y="178" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#10B981">${escapeXml(shop.tagline)}</text>
  <text x="300" y="296" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="46" font-weight="700" fill="#0F172A">Scan to print</text>
  <text x="300" y="338" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#475569">Upload your file, pay, and collect</text>
  <rect x="150" y="372" width="300" height="300" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="3"/>
  <svg x="180" y="402" width="240" height="240" viewBox="${qrViewBox}">${qrInner}</svg>
  <text x="300" y="724" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#0F172A">${escapeXml(url)}</text>
  <rect x="60" y="758" width="480" height="60" rx="16" fill="#ECFDF5"/>
  <text x="300" y="796" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#065F46">${escapeXml(notice)}</text>
  <text x="300" y="864" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#10B981">Scan • Upload • Pay • Print</text>
</svg>`;
}

async function svgToPngBlob(svg: string): Promise<Blob> {
  const scale = 3;
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = STAND_WIDTH * scale;
  canvas.height = STAND_HEIGHT * scale;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available in this browser.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed.'))), 'image/png');
  });
}

function download(blob: Blob, filename: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function CounterQrPanel({ shop }: { shop: Shop }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const url = `${window.location.origin}/shop/${shop.slug}`;

  useEffect(() => {
    let active = true;
    buildStandSvg(shop, url)
      .then((built) => {
        if (active) setSvg(built);
      })
      .catch(() => {
        if (active) setError('The QR code could not be generated.');
      });
    return () => {
      active = false;
    };
  }, [shop, url]);

  async function downloadPng() {
    if (!svg) return;
    try {
      download(await svgToPngBlob(svg), 'rts-counter-stand.png');
    } catch {
      setError('PNG export failed. Try the SVG download instead.');
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Counter QR stand</h1>
          <p className="mt-1 text-sm text-slate-500">
            Print this and place it at the counter. Customers scan it to open {url}
          </p>
        </div>
        <div className="flex items-center justify-center rounded-3xl bg-slate-100 p-6">
          {svg ? (
            <img
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
              alt="Printable counter QR stand preview"
              className="w-full max-w-md rounded-2xl shadow-xl"
            />
          ) : (
            <p className="text-sm text-slate-500">{error ?? 'Generating...'}</p>
          )}
        </div>
      </div>

      <aside className="space-y-3 self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="font-semibold text-slate-900">Download</p>
        <p className="text-sm text-slate-500">Use PNG for printing or sharing, SVG for print shops that need vector files.</p>
        <button
          type="button"
          disabled={!svg}
          onClick={downloadPng}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download PNG
        </button>
        <button
          type="button"
          disabled={!svg}
          onClick={() => svg && download(new Blob([svg], { type: 'image/svg+xml' }), 'rts-counter-stand.svg')}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download SVG
        </button>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      </aside>
    </div>
  );
}
