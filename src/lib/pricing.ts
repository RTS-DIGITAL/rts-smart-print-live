import type { PaperSize, PricingRule, PrintSelection, UploadMimeType } from '@/lib/types';

export const DEFAULT_SHOP_SLUG = 'rts-digital-seva';
export const PAPER_SIZES: PaperSize[] = ['A4', 'Letter', 'Legal'];
export const MAX_COPIES = 100;
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const ACCEPTED_MIME_TYPES: UploadMimeType[] = ['application/pdf', 'image/jpeg', 'image/png'];

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
});

export function formatINR(amount: number): string {
  return rupees.format(amount);
}

export function findRule(rules: PricingRule[], selection: PrintSelection): PricingRule | undefined {
  return rules.find(
    (rule) =>
      rule.paperSize === selection.paperSize &&
      rule.isColor === selection.isColor &&
      rule.isDoubleSided === selection.isDoubleSided,
  );
}

export function calculateTotal(totalPages: number, copies: number, pricePerPage: number): number {
  return Math.round(totalPages * copies * pricePerPage * 100) / 100;
}

export function validateUpload(file: File): string | null {
  if (!ACCEPTED_MIME_TYPES.includes(file.type as UploadMimeType)) {
    return 'Please choose a PDF, JPG or PNG file.';
  }
  if (file.size === 0) return 'This file looks empty. Please choose another one.';
  if (file.size > MAX_FILE_BYTES) return 'Files must be 50 MB or smaller.';
  return null;
}
