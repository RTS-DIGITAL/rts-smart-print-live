import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SHOP_SLUG } from '@/lib/pricing';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Trash2,
  Plus,
  Minus,
  Printer,
  Banknote,
  Smartphone,
  AlertCircle,
  Copy,
  Check,
  Lock,
  KeyRound,
  ShieldCheck,
  ExternalLink,
  EyeOff,
  Clock,
  Download,
  Zap,
  Scissors,
  RotateCw,
  RotateCcw,
  Sun,
  Layers,
  X,
  CheckCircle2,
  Languages,
  UserSquare,
  Camera,
  ArrowLeft
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const CROPPER_CSS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css';
const CROPPER_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js';
const PDFLIB_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

interface ShopConfig {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  upi_id: string | null;
  upi_name?: string | null;
  require_payment: boolean;
  is_accepting_orders: boolean;
  counter_notice: string | null;
  subscription_status: string;
  is_pin_protected: boolean;
  counter_pin: string;
  auto_print_enabled: boolean;
  auto_delete_hours?: number | null;
  gateway_enabled?: boolean;
  gateway_provider?: string | null;
  gateway_key_id?: string | null;
  split_payment_enabled?: boolean;
  duplex_supported?: boolean;
  id_card_bw_price?: number | null;
  id_card_color_price?: number | null;
  created_at?: string;
  approved_at?: string | null;
  subscription_days?: number | null;
  id_card_enabled?: boolean;
  passport_enabled?: boolean;
  scan_pdf_enabled?: boolean;
}

type ImageLayoutType = 'fit_a4' | 'id_card' | 'half_a4' | 'grid_4' | 'actual_size' | 'passport_8';
type ServiceCategory = 'document' | 'id_card' | 'photo' | 'scanner' | null;

interface UploadedItem {
  id: string;
  file: File;
  originalFile: File;
  backOriginalFile?: File | null;
  croppedFrontBlob?: Blob | null;
  croppedBackBlob?: Blob | null;
  fileKind: 'pdf' | 'image';
  name: string;
  size: number;
  totalPdfPages: number;
  pages: number;
  copies: number;
  isColor: boolean;
  isDoubleSided: boolean;
  paperSize: string;
  layoutMode: ImageLayoutType;
  pageRangeText: string;
  hasBackImage?: boolean;
  serviceCategory?: ServiceCategory;
}

interface PricingRule {
  paper_size: string;
  is_color: boolean;
  is_double_sided: boolean;
  price_per_page: number;
}

const KIOSK_TEXTS = {
  en: {
    backBtn: 'Back',
    subtitle: 'Self-Service Document Print Kiosk',
    paymentMode: 'Payment Mode',
    onlineUpi: 'Online UPI',
    cashAtCounter: 'Cash at Counter',
    pinRequiredTitle: 'Counter PIN Required',
    pinRequiredDesc: 'Please enter the 4-digit PIN displayed on the counter standee to unlock printing.',
    unlockBtn: 'Unlock Print Station',
    incorrectPin: 'Incorrect PIN. Please check the counter standee.',
    servicesTitle: 'What would you like to print?',
    docPrintTitle: 'Document Print',
    docPrintSub: 'PDF / Photos / Files',
    idPrintTitle: 'ID Card Print',
    idPrintSub: 'Aadhaar / PAN / Voter ID',
    photoPrintTitle: 'Passport Photo',
    photoPrintSub: '8 Photos on 1 A4 Sheet',
    scanPdfTitle: 'Scan & PDF Tools',
    scanPdfSub: 'Camera Scan / PDF Upload',
    uploadTitle: 'Tap to Select Files (PDF or ID/Document Photos)',
    uploadReading: 'Reading & Verifying Files...',
    uploadSub: 'Supports PDF, JPG, PNG (Max 10 MB) • Images Convert to A4 PDF',
    aadhaarSafetyNote:
      '🔒 Privacy Notice: Please upload only the document needed. You may hide the first 8 digits of your ID number before uploading. Files are auto-deleted on schedule.',
    uploadedFiles: 'Uploaded Files',
    addMoreBtn: 'Add More PDF / Image',
    copies: 'Copies:',
    singleSided: '1-Sided',
    doubleSided: '2-Sided',
    totalDocPages: 'Total Document Pages:',
    actualSheetsNeeded: 'Actual A4 Paper Sheets Needed:',
    totalBill: 'Total Bill:',
    proceedPayBtn: 'Proceed to Pay & Print',
    sendCashBtn: 'Send to Print (Pay Cash at Counter)',
    submitStaffBtn: 'Submit to Counter (Staff Will Release)',
    cropGuidance: '📌 Photo is locked steady! Drag the blue corners to crop your document.',
    useThisCrop: 'Save & Update',
    resetCrop: 'Reset',
    manualVerifyNote: 'Note: In Manual Mode, the shop verifies your UPI payment before releasing the print.',
    invalidFileMsg:
      'Invalid file format! Only authentic PDF, JPEG, and PNG files are accepted.\n\nഅസാധുവായ ഫയൽ! PDF, JPEG, PNG ഫയലുകൾ മാത്രമേ സ്വീകരിക്കുകയുള്ളൂ.',
    fileTooLargeMsg:
      'File exceeds the 10 MB limit! Please select a smaller file.\n\nഫയൽ വലിപ്പം 10 MB-ൽ കൂടുതലാണ്! ചെറിയ ഫയൽ തിരഞ്ഞെടുക്കുക.'
  },
  ml: {
    backBtn: 'പിന്നിലേക്ക്',
    subtitle: 'സെൽഫ് സർവീസ് പ്രിന്റ് കിയോസ്ക്',
    paymentMode: 'പേയ്‌മെന്റ് രീതി',
    onlineUpi: 'ഓൺലൈൻ UPI',
    cashAtCounter: 'കൗണ്ടറിൽ ക്യാഷ്',
    pinRequiredTitle: 'കൗണ്ടർ PIN ആവശ്യമാണ്',
    pinRequiredDesc: 'പ്രിന്റിംഗ് തുടങ്ങാൻ കൗണ്ടറിലെ സ്റ്റാൻഡിയിൽ കാണുന്ന 4-അക്ക PIN നൽകുക.',
    unlockBtn: 'പ്രിന്റ് സ്റ്റേഷൻ തുറക്കുക',
    incorrectPin: 'തെറ്റായ PIN. ദയവായി കൗണ്ടറിൽ പരിശോധിക്കുക.',
    servicesTitle: 'നിങ്ങൾക്ക് എന്താണ് പ്രിന്റ് ചെയ്യേണ്ടത്?',
    docPrintTitle: 'ഡോക്യുമെന്റ് പ്രിന്റ്',
    docPrintSub: 'PDF / ഫോട്ടോകൾ / ഫയലുകൾ',
    idPrintTitle: 'ഐഡി കാർഡ് പ്രിന്റ്',
    idPrintSub: 'ആധാർ / പാൻ / വോട്ടർ ഐഡി',
    photoPrintTitle: 'പാസ്‌പോർട്ട് ഫോട്ടോ',
    photoPrintSub: '8 ഫോട്ടോകൾ 1 A4 ഷീറ്റിൽ',
    scanPdfTitle: 'സ്കാൻ & PDF ടൂളുകൾ',
    scanPdfSub: 'ക്യാമറ സ്കാൻ / ഫയലുകൾ',
    uploadTitle: 'ഫയലുകൾ തിരഞ്ഞെടുക്കാൻ ഇവിടെ തൊടുക (PDF / ഫോട്ടോകൾ)',
    uploadReading: 'ഫയലുകൾ പരിശോധിക്കുന്നു...',
    uploadSub: 'PDF, JPG, PNG (പരമാവധി 10 MB) • ഫോട്ടോകൾ A4 PDF ആകുന്നു',
    aadhaarSafetyNote:
      '🔒 സുരക്ഷാ അറിയിപ്പ്: ആവശ്യമുള്ള രേഖകൾ മാത്രം അപ്‌ലോഡ് ചെയ്യുക. തിരിച്ചറിയൽ കാർഡിന്റെ ആദ്യ 8 അക്കങ്ങൾ മറച്ചുവെക്കാവുന്നതാണ്. പ്രിന്റിംഗിന് ശേഷം ഫയലുകൾ തനിയെ ഡിലീറ്റ് ആകും.',
    uploadedFiles: 'തിരഞ്ഞെടുത്ത ഫയലുകൾ',
    addMoreBtn: 'കൂടുതൽ ഫയലുകൾ ചേർക്കുക',
    copies: 'കോപ്പികൾ:',
    singleSided: 'ഒരു വശം (1-Sided)',
    doubleSided: 'രണ്ട് വശം (2-Sided)',
    totalDocPages: 'മൊത്തം പേജുകൾ:',
    actualSheetsNeeded: 'ആവശ്യമായ A4 പേപ്പർ ഷീറ്റുകൾ:',
    totalBill: 'മൊത്തം തുക:',
    proceedPayBtn: 'പണമടച്ച് പ്രിന്റ് ചെയ്യുക',
    sendCashBtn: 'പ്രിന്റ് നൽകുക (കൗണ്ടറിൽ പണം നൽകാം)',
    submitStaffBtn: 'കൗണ്ടറിലേക്ക് അയക്കുക (സ്റ്റാഫ് പ്രിന്റ് നൽകും)',
    cropGuidance: '📌 ഫോട്ടോ തെന്നിമാറില്ല! നീല ബോക്സിന്റെ മൂലകൾ വലിച്ച് ആവശ്യമുള്ള ഭാഗം മാത്രം സെലക്ട് ചെയ്യുക.',
    useThisCrop: 'ക്രോപ്പ് ഉറപ്പിക്കുക',
    resetCrop: 'റീസെറ്റ്',
    manualVerifyNote: 'ശ്രദ്ധിക്കുക: മാനുവൽ മോഡിൽ കടയുടമ പേയ്‌മെന്റ് പരിശോധിച്ച ശേഷമാണ് പ്രിന്റ് നൽകുന്നത്.',
    invalidFileMsg:
      'അസാധുവായ ഫയൽ! യഥാർത്ഥ PDF, JPEG, PNG ഫയലുകൾ മാത്രമേ സ്വീകരിക്കുകയുള്ളൂ.\n\nInvalid file! Only authentic PDF, JPEG, and PNG files are accepted.',
    fileTooLargeMsg:
      'ഫയൽ വലിപ്പം 10 MB-ൽ കൂടുതലാണ്! ദയവായി ചെറിയ ഫയൽ തിരഞ്ഞെടുക്കുക.\n\nFile exceeds 10 MB limit!'
  }
};

function cleanVpa(input: string | null | undefined): string {
  return (input || '').trim().replace(/\s+/g, '').toLowerCase();
}

function fitInside(srcW: number, srcH: number, boxW: number, boxH: number) {
  const safeSrcW = Math.max(1, srcW);
  const safeSrcH = Math.max(1, srcH);
  const s = Math.min(boxW / safeSrcW, boxH / safeSrcH);
  const w = safeSrcW * s;
  const h = safeSrcH * s;
  return { w, h, dx: (boxW - w) / 2, dy: (boxH - h) / 2 };
}

function isValidPdfBytes(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

function loadPdfLibAsset(): Promise<any> {
  return new Promise((resolve) => {
    if ((window as any).PDFLib) {
      resolve((window as any).PDFLib);
      return;
    }
    const existingScript = document.querySelector(`script[src="${PDFLIB_JS_URL}"]`) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve((window as any).PDFLib));
      existingScript.addEventListener('error', () => resolve(null));
      return;
    }
    const script = document.createElement('script');
    script.src = PDFLIB_JS_URL;
    script.onload = () => resolve((window as any).PDFLib);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
}

async function convertJpegBlobToA4PdfBlob(jpegBlob: Blob): Promise<Blob> {
  const PDFLib = await loadPdfLibAsset();
  if (!PDFLib || !PDFLib.PDFDocument) {
    throw new Error('PDF library failed to load.');
  }
  const jpgBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const pdf = await PDFLib.PDFDocument.create();
  const page = pdf.addPage(PDFLib.PageSizes ? PDFLib.PageSizes.A4 : [595.28, 841.89]);
  const img = await pdf.embedJpg(jpgBytes);
  const [pw, ph] = page.getSize();
  page.drawImage(img, { x: 0, y: 0, width: pw, height: ph });
  const pdfBytes = await pdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

async function rotateImageFilePhysically(sourceFile: File | Blob, deg: number, fileName: string): Promise<File> {
  const img = await loadImageElement(sourceFile);
  const canvas = document.createElement('canvas');
  const rad = ((deg % 360) * Math.PI) / 180;
  const isNinety = Math.abs(deg) % 180 === 90;

  canvas.width = isNinety ? img.height : img.width;
  canvas.height = isNinety ? img.width : img.height;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
  }

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Rotate blob failed'))), 'image/jpeg', 0.94);
  });
  return new File([blob], fileName, { type: 'image/jpeg' });
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function loadCropperAssets(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!document.querySelector(`link[href="${CROPPER_CSS_URL}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = CROPPER_CSS_URL;
      document.head.appendChild(link);
    }
    const existingStyle = document.getElementById('rts-cropper-touch-styles');
    const cssText = `
      .cropper-point { width: 12px !important; height: 12px !important; background-color: #38bdf8 !important; opacity: 0.95 !important; border-radius: 50% !important; border: 2px solid #ffffff !important; }
      .cropper-point.point-se { width: 14px !important; height: 14px !important; }
      .cropper-line { background-color: #38bdf8 !important; opacity: 0.7 !important; }
      .cropper-view-box { outline: 2px solid #38bdf8 !important; }
    `;
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'rts-cropper-touch-styles';
      style.innerHTML = cssText;
      document.head.appendChild(style);
    } else {
      existingStyle.innerHTML = cssText;
    }

    if ((window as any).Cropper) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector(`script[src="${CROPPER_JS_URL}"]`) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = CROPPER_JS_URL;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

async function detectTrueFileKind(file: File): Promise<'pdf' | 'image' | 'invalid'> {
  try {
    const buffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return 'pdf';
    }
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'image';
    }
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return 'image';
    }
    return 'invalid';
  } catch {
    return 'invalid';
  }
}

async function compressLargeImageInBrowser(file: File): Promise<File> {
  if (file.size <= 1.5 * 1024 * 1024) return file;
  try {
    const img = await loadImageElement(file);
    const maxDim = 2200;
    let targetW = img.width;
    let targetH = img.height;
    if (targetW > maxDim || targetH > maxDim) {
      const ratio = Math.min(maxDim / targetW, maxDim / targetH);
      targetW = Math.round(targetW * ratio);
      targetH = Math.round(targetH * ratio);
    }
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), 'image/jpeg', 0.9));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

function countSelectedPages(rangeStr: string, maxPages: number): number {
  const cleaned = rangeStr.trim();
  if (!cleaned) return maxPages;
  const pagesSet = new Set<number>();
  const parts = cleaned.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let p = Math.max(1, start); p <= Math.min(maxPages, end); p++) {
          pagesSet.add(p);
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPages) {
        pagesSet.add(num);
      }
    }
  }
  return pagesSet.size > 0 ? pagesSet.size : maxPages;
}

function calculateSheetsForItem(item: UploadedItem): number {
  if (item.fileKind === 'image') {
    return Math.max(1, item.copies);
  }
  const perSide =
    item.layoutMode === 'grid_4' || item.layoutMode === 'passport_8'
      ? 4
      : item.layoutMode === 'id_card' || item.layoutMode === 'half_a4'
      ? 2
      : 1;
  const sidesNeeded = Math.ceil(item.pages / perSide);
  const sheetsPerCopy = item.isDoubleSided ? Math.ceil(sidesNeeded / 2) : sidesNeeded;
  return Math.max(1, sheetsPerCopy) * item.copies;
}

function loadImageElement(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

export default function KioskPage() {
  const { shopSlug } = useParams<{ shopSlug: string }>();
  const activeSlug = shopSlug || DEFAULT_SHOP_SLUG;
  const navigate = useNavigate();

  const [lang, setLang] = useState<'en' | 'ml'>('ml');
  const t = KIOSK_TEXTS[lang];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const studioFrontInputRef = useRef<HTMLInputElement>(null);
  const studioBackInputRef = useRef<HTMLInputElement>(null);

  const [shop, setShop] = useState<ShopConfig | null>(null);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loadingShop, setLoadingShop] = useState(true);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const [selectedServiceCategory, setSelectedServiceCategory] = useState<ServiceCategory>(null);
  const [items, setItems] = useState<UploadedItem[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [uploadErrorBanner, setUploadErrorBanner] = useState<string | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [launchingGateway, setLaunchingGateway] = useState(false);

  const [showCheckout, setShowCheckout] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [savingQr, setSavingQr] = useState(false);

  const [editingItem, setEditingItem] = useState<UploadedItem | null>(null);
  const [studioLayout, setStudioLayout] = useState<ImageLayoutType>('id_card');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontRotation, setFrontRotation] = useState<number>(0);
  const [frontCropPct, setFrontCropPct] = useState<number>(0);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backRotation, setBackRotation] = useState<number>(0);
  const [backCropPct, setBackCropPct] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(105);
  const [contrast, setContrast] = useState<number>(110);
  const [applyingStudio, setApplyingStudio] = useState<boolean>(false);
  const [isRotatingFile, setIsRotatingFile] = useState<boolean>(false);

  const isFreshUploadRef = useRef<boolean>(false);

  const [activeCropSide, setActiveCropSide] = useState<'front' | 'back'>('front');
  const [cropperSourceUrl, setCropperSourceUrl] = useState<string | null>(null);
  const [croppedFrontBlob, setCroppedFrontBlob] = useState<Blob | null>(null);
  const [croppedBackBlob, setCroppedBackBlob] = useState<Blob | null>(null);
  const [cropAppliedToast, setCropAppliedToast] = useState<string | null>(null);
  const [isCropperReady, setIsCropperReady] = useState<boolean>(false);
  const cropperImageRef = useRef<HTMLImageElement>(null);
  const cropperInstanceRef = useRef<any>(null);

  const [showEditConfirmPopup, setShowEditConfirmPopup] = useState<boolean>(false);
  const [lastEditedItemId, setLastEditedItemId] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadCropperAssets();
    loadPdfLibAsset();
  }, []);

  useEffect(() => {
    async function init() {
      setLoadingShop(true);
      try {
        const { data: shopData } = await supabase.from('shops').select('*').eq('slug', activeSlug).single();

        if (shopData) {
          const approvalDate = shopData.approved_at
            ? new Date(shopData.approved_at).getTime()
            : new Date(shopData.created_at || Date.now()).getTime();
          const elapsedDays = Math.floor((Date.now() - approvalDate) / (1000 * 60 * 60 * 24));
          const remainingDays = Math.max(0, (shopData.subscription_days || 7) - elapsedDays);

          if (remainingDays <= 0 && shopData.subscription_status !== 'suspended') {
            await supabase.from('shops').update({ is_accepting_orders: false }).eq('id', shopData.id);
            shopData.is_accepting_orders = false;
          }

          setShop(shopData);
          if (!shopData.is_pin_protected) {
            setIsUnlocked(true);
          }

          const { data: pricingData } = await supabase.from('pricing_rules').select('*').eq('shop_id', shopData.id);
          if (pricingData) setPricingRules(pricingData);
        }
      } catch (err) {
        console.error('Failed to load shop kiosk:', err);
      } finally {
        setLoadingShop(false);
      }
    }
    init();
  }, [activeSlug]);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    if (enteredPin.trim() === (shop.counter_pin || '1234').trim()) {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setEnteredPin('');
    }
  };

  const getPageCount = async (file: File): Promise<number> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      return pdf.numPages || 1;
    } catch {
      return 1;
    }
  };

  const handleCategoryClick = (category: ServiceCategory) => {
    setSelectedServiceCategory(category);
    setTimeout(() => {
      if (fileInputRef.current) fileInputRef.current.click();
    }, 60);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsProcessingFiles(true);
    setUploadErrorBanner(null);
    const newPdfItems: UploadedItem[] = [];
    const newImageItems: UploadedItem[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const rawFile = selectedFiles[i];

      if (rawFile.size > MAX_FILE_SIZE_BYTES) {
        setUploadErrorBanner(`"${rawFile.name}": ${t.fileTooLargeMsg}`);
        alert(`"${rawFile.name}"\n\n${t.fileTooLargeMsg}`);
        continue;
      }

      const fileKind = await detectTrueFileKind(rawFile);
      if (fileKind === 'invalid') {
        setUploadErrorBanner(`"${rawFile.name}": ${t.invalidFileMsg}`);
        alert(`"${rawFile.name}"\n\n${t.invalidFileMsg}`);
        continue;
      }

      const file = fileKind === 'image' ? await compressLargeImageInBrowser(rawFile) : rawFile;
      const pages = fileKind === 'pdf' ? await getPageCount(file) : 1;

      let initialLayout: ImageLayoutType = 'fit_a4';
      if (fileKind === 'image') {
        if (selectedServiceCategory === 'id_card') initialLayout = 'id_card';
        if (selectedServiceCategory === 'photo') initialLayout = 'passport_8';
      }

      const newItem: UploadedItem = {
        id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        originalFile: file,
        backOriginalFile: null,
        croppedFrontBlob: null,
        croppedBackBlob: null,
        fileKind,
        name: rawFile.name,
        size: file.size,
        totalPdfPages: pages,
        pages,
        copies: 1,
        isColor: selectedServiceCategory === 'photo' ? true : false,
        isDoubleSided: false,
        paperSize: 'A4',
        layoutMode: initialLayout,
        pageRangeText: '',
        hasBackImage: false,
        serviceCategory: selectedServiceCategory
      };

      if (fileKind === 'pdf') {
        newPdfItems.push(newItem);
      } else {
        newImageItems.push(newItem);
      }
    }

    if (newImageItems.length >= 2 && selectedServiceCategory === 'id_card') {
      const primaryImageItem: UploadedItem = {
        ...newImageItems[0],
        backOriginalFile: newImageItems[1].originalFile,
        hasBackImage: true,
        layoutMode: 'id_card'
      };
      const extraImages = newImageItems.slice(2);
      setItems((prev) => [...prev, ...newPdfItems, primaryImageItem, ...extraImages]);
      isFreshUploadRef.current = true;
      openImageStudio(primaryImageItem, newImageItems[1].originalFile);
    } else if (newImageItems.length > 0) {
      if (newImageItems.length === 2 && selectedServiceCategory === 'document') {
        const pairedHalfA4: UploadedItem = {
          ...newImageItems[0],
          backOriginalFile: newImageItems[1].originalFile,
          hasBackImage: true,
          layoutMode: 'half_a4'
        };
        setItems((prev) => [...prev, ...newPdfItems, pairedHalfA4]);
        isFreshUploadRef.current = true;
        openImageStudio(pairedHalfA4, newImageItems[1].originalFile);
      } else {
        setItems((prev) => [...prev, ...newPdfItems, ...newImageItems]);
        isFreshUploadRef.current = true;
        openImageStudio(newImageItems[0]);
      }
    } else if (newPdfItems.length > 0) {
      setItems((prev) => [...prev, ...newPdfItems]);
    }

    setIsProcessingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openImageStudio = (item: UploadedItem, preloadedBackFile?: File | null) => {
    setEditingItem(item);
    setFrontFile(item.originalFile);
    const initialLayout = item.layoutMode === 'fit_a4' && item.serviceCategory === 'id_card' ? 'id_card' : item.layoutMode;
    setStudioLayout(initialLayout);
    setActiveCropSide('front');
    setFrontRotation(0);
    setFrontCropPct(0);
    setBackFile(preloadedBackFile !== undefined ? preloadedBackFile : item.backOriginalFile || null);
    setBackRotation(0);
    setBackCropPct(0);
    setCroppedFrontBlob(item.croppedFrontBlob || null);
    setCroppedBackBlob(item.croppedBackBlob || null);
    setBrightness(105);
    setContrast(110);
  };

  useEffect(() => {
    if (!editingItem) {
      if (cropperInstanceRef.current) {
        cropperInstanceRef.current.destroy();
        cropperInstanceRef.current = null;
      }
      setIsCropperReady(false);
      setCropperSourceUrl(null);
      return;
    }
    const targetFile = activeCropSide === 'front' ? frontFile : backFile;
    if (!targetFile) {
      setIsCropperReady(false);
      setCropperSourceUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(targetFile);
    setCropperSourceUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [editingItem, activeCropSide, frontFile, backFile]);

  useEffect(() => {
    let mounted = true;
    async function initCropper() {
      if (!cropperSourceUrl || !cropperImageRef.current) return;
      const loaded = await loadCropperAssets();
      if (!loaded || !mounted || !cropperImageRef.current) return;

      if (cropperInstanceRef.current) {
        cropperInstanceRef.current.destroy();
        cropperInstanceRef.current = null;
      }
      setIsCropperReady(false);

      const CropperClass = (window as any).Cropper;
      if (!CropperClass) return;

      cropperInstanceRef.current = new CropperClass(cropperImageRef.current, {
        aspectRatio: NaN,
        viewMode: 1,
        dragMode: 'none',
        movable: false,
        zoomOnTouch: false,
        zoomOnWheel: false,
        autoCropArea: 0.96,
        responsive: true,
        restore: false,
        checkOrientation: true,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        ready() {
          if (mounted) {
            setIsCropperReady(true);
          }
        }
      });
    }
    initCropper();

    return () => {
      mounted = false;
      setIsCropperReady(false);
      if (cropperInstanceRef.current) {
        cropperInstanceRef.current.destroy();
        cropperInstanceRef.current = null;
      }
    };
  }, [cropperSourceUrl]);

  const extractCurrentCropperBlob = async (): Promise<Blob | null> => {
    if (!cropperInstanceRef.current || !isCropperReady) return null;
    const croppedCanvas = cropperInstanceRef.current.getCroppedCanvas({
      maxWidth: 2000,
      maxHeight: 2000,
      fillColor: '#ffffff',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });
    if (!croppedCanvas || croppedCanvas.width === 0 || croppedCanvas.height === 0) return null;

    const blob: Blob | null = await new Promise((res) =>
      croppedCanvas.toBlob((b: Blob | null) => res(b), 'image/jpeg', 0.92)
    );
    return blob;
  };

  const handleUseThisCrop = async () => {
    const blob = await extractCurrentCropperBlob();
    if (!blob) return;

    if (activeCropSide === 'front') {
      setCroppedFrontBlob(blob);
      setFrontRotation(0);
      setFrontCropPct(0);
      setCropAppliedToast(
        lang === 'en' ? '✅ Front crop updated on A4 preview!' : '✅ മുൻവശം ക്രോപ്പ് അപ്‌ഡേറ്റ് ചെയ്തു!'
      );
      if ((studioLayout === 'id_card' || studioLayout === 'half_a4') && backFile && !croppedBackBlob) {
        setTimeout(() => setActiveCropSide('back'), 400);
      }
    } else {
      setCroppedBackBlob(blob);
      setBackRotation(0);
      setBackCropPct(0);
      setCropAppliedToast(
        lang === 'en' ? '✅ Back crop updated on A4 preview!' : '✅ പിൻവശം ക്രോപ്പ് അപ്‌ഡേറ്റ് ചെയ്തു!'
      );
    }
    setTimeout(() => setCropAppliedToast(null), 2200);
  };

  const handleResetCropper = () => {
    if (cropperInstanceRef.current && isCropperReady) {
      cropperInstanceRef.current.reset();
    }
    if (activeCropSide === 'front') {
      setCroppedFrontBlob(null);
      setFrontRotation(0);
      setFrontCropPct(0);
    } else {
      setCroppedBackBlob(null);
      setBackRotation(0);
      setBackCropPct(0);
    }
  };

  const handleRotateCropper = async (deg: number) => {
    if (isRotatingFile) return;
    const targetFile = activeCropSide === 'front' ? frontFile : backFile;
    if (!targetFile) return;

    setIsRotatingFile(true);
    try {
      const rotatedFile = await rotateImageFilePhysically(targetFile, deg, targetFile.name);
      if (activeCropSide === 'front') {
        setFrontFile(rotatedFile);
        setCroppedFrontBlob(null);
        setFrontRotation(0);
      } else {
        setBackFile(rotatedFile);
        setCroppedBackBlob(null);
        setBackRotation(0);
      }
    } catch (err) {
      console.error('Physical rotation error:', err);
    } finally {
      setIsRotatingFile(false);
    }
  };

  const handleSwitchCropSideTab = async (targetSide: 'front' | 'back') => {
    if (targetSide === activeCropSide) return;
    const currentBlob = await extractCurrentCropperBlob();
    if (currentBlob) {
      if (activeCropSide === 'front') {
        setCroppedFrontBlob(currentBlob);
      } else {
        setCroppedBackBlob(currentBlob);
      }
    }
    if (targetSide === 'back' && !backFile) {
      studioBackInputRef.current?.click();
    }
    setActiveCropSide(targetSide);
  };

  const handleRemoveFrontInStudio = () => {
    if (backFile) {
      setFrontFile(backFile);
      setCroppedFrontBlob(croppedBackBlob);
      setFrontRotation(backRotation);
      setFrontCropPct(backCropPct);
      setBackFile(null);
      setCroppedBackBlob(null);
      setBackRotation(0);
      setBackCropPct(0);
      setActiveCropSide('front');
    } else {
      setFrontFile(null);
      setCroppedFrontBlob(null);
      setFrontRotation(0);
      setFrontCropPct(0);
    }
  };

  const handleCloseStudio = () => {
    if (isFreshUploadRef.current && editingItem) {
      removeItem(editingItem.id);
    }
    isFreshUploadRef.current = false;
    setEditingItem(null);
  };

  const handleDeleteItemFromStudio = () => {
    if (!editingItem) return;
    removeItem(editingItem.id);
    isFreshUploadRef.current = false;
    setEditingItem(null);
  };

  const drawProcessedImage = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    rotationDeg: number,
    cropPct: number,
    targetX: number,
    targetY: number,
    targetW: number,
    targetH: number,
    drawCutBorder: boolean,
    autoLandscapeForIdCard: boolean = false
  ) => {
    const offCanvas = document.createElement('canvas');

    let effectiveRotation = rotationDeg;
    if (autoLandscapeForIdCard && img.height > img.width * 1.15 && rotationDeg % 180 === 0) {
      effectiveRotation = (rotationDeg + 90) % 360;
    }

    const rad = ((effectiveRotation % 360) * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));

    const trimX = (img.width * cropPct) / 200;
    const trimY = (img.height * cropPct) / 200;
    const srcW = Math.max(10, img.width - trimX * 2);
    const srcH = Math.max(10, img.height - trimY * 2);

    const outW = Math.max(1, Math.round(srcW * cos + srcH * sin));
    const outH = Math.max(1, Math.round(srcW * sin + srcH * cos));
    offCanvas.width = outW;
    offCanvas.height = outH;

    const offCtx = offCanvas.getContext('2d');
    if (offCtx) {
      offCtx.fillStyle = '#ffffff';
      offCtx.fillRect(0, 0, outW, outH);
      offCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      offCtx.translate(outW / 2, outH / 2);
      offCtx.rotate(rad);
      offCtx.drawImage(img, trimX, trimY, srcW, srcH, -srcW / 2, -srcH / 2, srcW, srcH);
    }

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(targetX, targetY, targetW, targetH);

    const { w, h, dx, dy } = fitInside(outW, outH, targetW, targetH);
    ctx.drawImage(offCanvas, 0, 0, outW, outH, targetX + dx, targetY + dy, w, h);

    if (drawCutBorder) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = Math.max(1, targetW * 0.004);
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(targetX - 4, targetY - 4, targetW + 8, targetH + 8);
    }
    ctx.restore();
  };

  useEffect(() => {
    let active = true;
    async function renderPreview() {
      if (!editingItem || !previewCanvasRef.current) return;
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 420;
      canvas.height = 594;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!frontFile) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No Image Selected — Tap "+ Add Image" below', canvas.width / 2, canvas.height / 2);
        return;
      }

      try {
        const frontSource: File | Blob = croppedFrontBlob || frontFile;
        const frontImg = await loadImageElement(frontSource);
        if (!active) return;

        if (studioLayout === 'id_card') {
          const cardW = 190;
          const cardH = 120;
          const topMargin = 32;

          if (backFile) {
            const backSource: File | Blob = croppedBackBlob || backFile;
            const backImg = await loadImageElement(backSource);
            if (!active) return;
            drawProcessedImage(ctx, frontImg, croppedFrontBlob ? 0 : frontRotation, frontCropPct, 15, topMargin, cardW, cardH, true, true);
            drawProcessedImage(ctx, backImg, croppedBackBlob ? 0 : backRotation, backCropPct, 215, topMargin, cardW, cardH, true, true);
          } else {
            drawProcessedImage(
              ctx,
              frontImg,
              croppedFrontBlob ? 0 : frontRotation,
              frontCropPct,
              (canvas.width - cardW) / 2,
              topMargin,
              cardW,
              cardH,
              true,
              true
            );
          }
        } else if (studioLayout === 'passport_8') {
          const pW = 70;
          const pH = 90;
          const spacingX = 15;
          const spacingY = 20;
          const startX = (canvas.width - (pW * 4 + spacingX * 3)) / 2;
          const startY = 40;
          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
              drawProcessedImage(
                ctx,
                frontImg,
                croppedFrontBlob ? 0 : frontRotation,
                frontCropPct,
                startX + col * (pW + spacingX),
                startY + row * (pH + spacingY),
                pW,
                pH,
                true,
                false
              );
            }
          }
        } else if (studioLayout === 'half_a4') {
          const boxW = 360;
          const boxH = 250;
          drawProcessedImage(ctx, frontImg, croppedFrontBlob ? 0 : frontRotation, frontCropPct, 30, 25, boxW, boxH, false);
          if (backFile) {
            const backSource: File | Blob = croppedBackBlob || backFile;
            const backImg = await loadImageElement(backSource);
            if (!active) return;
            drawProcessedImage(ctx, backImg, croppedBackBlob ? 0 : backRotation, backCropPct, 30, 305, boxW, boxH, false);
          }
        } else if (studioLayout === 'grid_4') {
          const cellW = 175;
          const cellH = 240;
          drawProcessedImage(ctx, frontImg, croppedFrontBlob ? 0 : frontRotation, frontCropPct, 25, 30, cellW, cellH, true);
          drawProcessedImage(ctx, frontImg, croppedFrontBlob ? 0 : frontRotation, frontCropPct, 220, 30, cellW, cellH, true);
          if (backFile) {
            const backSource: File | Blob = croppedBackBlob || backFile;
            const backImg = await loadImageElement(backSource);
            if (!active) return;
            drawProcessedImage(ctx, backImg, croppedBackBlob ? 0 : backRotation, backCropPct, 25, 300, cellW, cellH, true);
            drawProcessedImage(ctx, backImg, croppedBackBlob ? 0 : backRotation, backCropPct, 220, 300, cellW, cellH, true);
          } else {
            drawProcessedImage(ctx, frontImg, croppedFrontBlob ? 0 : frontRotation, frontCropPct, 25, 300, cellW, cellH, true);
            drawProcessedImage(ctx, frontImg, croppedFrontBlob ? 0 : frontRotation, frontCropPct, 220, 300, cellW, cellH, true);
          }
        } else if (studioLayout === 'actual_size') {
          const w = Math.min(360, frontImg.width * 0.35);
          const h = Math.min(520, frontImg.height * 0.35);
          drawProcessedImage(
            ctx,
            frontImg,
            croppedFrontBlob ? 0 : frontRotation,
            frontCropPct,
            (canvas.width - w) / 2,
            40,
            w,
            h,
            false
          );
        } else {
          drawProcessedImage(ctx, frontImg, croppedFrontBlob ? 0 : frontRotation, frontCropPct, 20, 20, 380, 554, false);
        }
      } catch (err) {
        console.error('Preview render error:', err);
      }
    }
    renderPreview();
    return () => {
      active = false;
    };
  }, [
    editingItem,
    frontFile,
    croppedFrontBlob,
    studioLayout,
    frontRotation,
    frontCropPct,
    backFile,
    croppedBackBlob,
    backRotation,
    backCropPct,
    brightness,
    contrast
  ]);

  const handleApplyImageStudio = async () => {
    if (!editingItem) return;
    if (!frontFile) {
      alert('Please select or upload at least 1 image from your gallery before applying.');
      return;
    }

    setApplyingStudio(true);

    try {
      let finalFrontBlob = croppedFrontBlob;
      let finalBackBlob = croppedBackBlob;

      const latestActiveBlob = await extractCurrentCropperBlob();
      if (latestActiveBlob) {
        if (activeCropSide === 'front') {
          finalFrontBlob = latestActiveBlob;
          setCroppedFrontBlob(latestActiveBlob);
        } else if (activeCropSide === 'back') {
          finalBackBlob = latestActiveBlob;
          setCroppedBackBlob(latestActiveBlob);
        }
      }

      const hiCanvas = document.createElement('canvas');
      const a4W = 1240;
      const a4H = 1754;
      hiCanvas.width = a4W;
      hiCanvas.height = a4H;
      const ctx = hiCanvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, a4W, a4H);

      const frontImg = await loadImageElement(finalFrontBlob || frontFile);

      if (studioLayout === 'id_card') {
        const cardW = 560;
        const cardH = 354;
        const topY = 95;

        if (backFile) {
          const backImg = await loadImageElement(finalBackBlob || backFile);
          drawProcessedImage(ctx, frontImg, finalFrontBlob ? 0 : frontRotation, frontCropPct, 45, topY, cardW, cardH, true, true);
          drawProcessedImage(ctx, backImg, finalBackBlob ? 0 : backRotation, backCropPct, 635, topY, cardW, cardH, true, true);
        } else {
          drawProcessedImage(
            ctx,
            frontImg,
            finalFrontBlob ? 0 : frontRotation,
            frontCropPct,
            (a4W - cardW) / 2,
            topY,
            cardW,
            cardH,
            true,
            true
          );
        }
      } else if (studioLayout === 'passport_8') {
        const pW = 206;
        const pH = 265;
        const spacingX = 45;
        const spacingY = 60;
        const startX = (a4W - (pW * 4 + spacingX * 3)) / 2;
        const startY = 120;
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 4; col++) {
            drawProcessedImage(
              ctx,
              frontImg,
              finalFrontBlob ? 0 : frontRotation,
              frontCropPct,
              startX + col * (pW + spacingX),
              startY + row * (pH + spacingY),
              pW,
              pH,
              true,
              false
            );
          }
        }
      } else if (studioLayout === 'half_a4') {
        const boxW = 1080;
        const boxH = 760;
        drawProcessedImage(ctx, frontImg, finalFrontBlob ? 0 : frontRotation, frontCropPct, 80, 70, boxW, boxH, false);
        if (backFile) {
          const backImg = await loadImageElement(finalBackBlob || backFile);
          drawProcessedImage(ctx, backImg, finalBackBlob ? 0 : backRotation, backCropPct, 80, 910, boxW, boxH, false);
        }
      } else if (studioLayout === 'grid_4') {
        const cellW = 520;
        const cellH = 740;
        drawProcessedImage(ctx, frontImg, finalFrontBlob ? 0 : frontRotation, frontCropPct, 75, 90, cellW, cellH, true);
        drawProcessedImage(ctx, frontImg, finalFrontBlob ? 0 : frontRotation, frontCropPct, 645, 90, cellW, cellH, true);
        if (backFile) {
          const backImg = await loadImageElement(finalBackBlob || backFile);
          drawProcessedImage(ctx, backImg, finalBackBlob ? 0 : backRotation, backCropPct, 75, 900, cellW, cellH, true);
          drawProcessedImage(ctx, backImg, finalBackBlob ? 0 : backRotation, backCropPct, 645, 900, cellW, cellH, true);
        } else {
          drawProcessedImage(ctx, frontImg, finalFrontBlob ? 0 : frontRotation, frontCropPct, 75, 900, cellW, cellH, true);
          drawProcessedImage(ctx, frontImg, finalFrontBlob ? 0 : frontRotation, frontCropPct, 645, 900, cellW, cellH, true);
        }
      } else if (studioLayout === 'actual_size') {
        const w = Math.min(1080, frontImg.width);
        const h = Math.min(1550, frontImg.height);
        drawProcessedImage(
          ctx,
          frontImg,
          finalFrontBlob ? 0 : frontRotation,
          frontCropPct,
          (a4W - w) / 2,
          100,
          w,
          h,
          false
        );
      } else {
        drawProcessedImage(ctx, frontImg, finalFrontBlob ? 0 : frontRotation, frontCropPct, 60, 60, 1120, 1634, false);
      }

      const jpegBlob: Blob = await new Promise((resolve, reject) => {
        hiCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Blob failed'))), 'image/jpeg', 0.94);
      });

      const pdfBlob = await convertJpegBlobToA4PdfBlob(jpegBlob);
      const baseName = frontFile.name.replace(/\.[^/.]+$/, '');
      const layoutTag = studioLayout === 'id_card' ? 'ID_Card_2in1_A4' : `${studioLayout}_A4`;
      const composedPdfFile = new File([pdfBlob], `${baseName}_${layoutTag}.pdf`, {
        type: 'application/pdf'
      });

      updateItem(editingItem.id, {
        file: composedPdfFile,
        originalFile: frontFile,
        backOriginalFile: backFile,
        croppedFrontBlob: finalFrontBlob,
        croppedBackBlob: finalBackBlob,
        name: frontFile.name,
        size: composedPdfFile.size,
        layoutMode: studioLayout,
        pages: 1,
        hasBackImage: Boolean(backFile)
      });

      isFreshUploadRef.current = false;
      setLastEditedItemId(editingItem.id);
      setEditingItem(null);
      setShowEditConfirmPopup(true);
    } catch (err: any) {
      alert('Failed to apply layout: ' + err.message);
    } finally {
      setApplyingStudio(false);
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<UploadedItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const calculateItemPrice = (item: UploadedItem): number => {
    const rule = pricingRules.find(
      (r) =>
        r.paper_size === item.paperSize &&
        r.is_color === item.isColor &&
        r.is_double_sided === item.isDoubleSided
    );
    const standardPerPageRate = rule ? Number(rule.price_per_page) : item.isColor ? 10.0 : 2.0;

    if (
      item.fileKind === 'image' &&
      (item.layoutMode === 'id_card' ||
        (item.layoutMode === 'half_a4' && item.hasBackImage) ||
        item.layoutMode === 'grid_4')
    ) {
      const customIdRate = item.isColor
        ? Number(shop?.id_card_color_price || standardPerPageRate * 2)
        : Number(shop?.id_card_bw_price || standardPerPageRate * 2);
      return customIdRate * item.copies;
    }

    const sheetsUsed = calculateSheetsForItem(item);
    return item.isDoubleSided ? sheetsUsed * standardPerPageRate * 2 : sheetsUsed * standardPerPageRate;
  };

  const totalAmount = items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
  const totalPages = items.reduce((sum, item) => sum + item.pages * item.copies, 0);
  const totalSheetsNeeded = items.reduce((sum, item) => sum + calculateSheetsForItem(item), 0);

  const cleanUpiId = cleanVpa(shop?.upi_id);
  const payeeName =
    shop?.upi_name && shop.upi_name.trim() !== ''
      ? shop.upi_name.trim()
      : (shop?.name || 'RTS Smart Print').trim();
  const formattedAmount = Number(totalAmount || 0).toFixed(2);

  const hasActiveShopGateway = Boolean(
    shop?.gateway_enabled && shop?.gateway_key_id && shop.gateway_key_id.trim() !== ''
  );
  const activeGatewayProvider = (shop?.gateway_provider || 'razorpay').toLowerCase();
  const isDuplexSupported = shop?.duplex_supported ?? true;

  const upiDeepLink = cleanUpiId
    ? `upi://pay?pa=${encodeURIComponent(cleanUpiId)}&pn=${encodeURIComponent(payeeName)}&am=${formattedAmount}&cu=INR`
    : '';

  const qrCodeImageUrl = cleanUpiId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(upiDeepLink)}`
    : '';

  const handleDownloadQrForGallery = async () => {
    if (!qrCodeImageUrl) return;
    setSavingQr(true);
    try {
      const response = await fetch(qrCodeImageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `RTS-Pay-Rs${formattedAmount}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(qrCodeImageUrl, '_blank');
    } finally {
      setSavingQr(false);
    }
  };

  const handleProceedOrder = async (verifiedGatewayPaymentId?: string) => {
    if (!shop || items.length === 0) return;
    setSubmittingOrder(true);

    try {
      const { data: latestShop } = await supabase
        .from('shops')
        .select('auto_print_enabled, require_payment, split_payment_enabled')
        .eq('id', shop.id)
        .maybeSingle();

      const isAutoPilot = latestShop ? Boolean(latestShop.auto_print_enabled) : Boolean(shop.auto_print_enabled);
      const isCashMode = !(latestShop ? latestShop.require_payment : shop.require_payment);
      const isGatewayVerified = Boolean(verifiedGatewayPaymentId);

      const targetStatus = isAutoPilot ? 'paid' : 'pending';

      const orderNumber = `RTS-${Math.floor(100000 + Math.random() * 900000)}`;
      const finalPaymentRef = isGatewayVerified
        ? `${activeGatewayProvider.toUpperCase()}_${verifiedGatewayPaymentId}`
        : isCashMode
        ? 'CASH_AT_COUNTER'
        : utrNumber || 'UPI_SUBMITTED';

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];

        let fileToUpload = item.file;
        if (item.fileKind === 'image' || fileToUpload.type !== 'application/pdf') {
          const fImg = await loadImageElement(item.croppedFrontBlob || item.originalFile);
          const c = document.createElement('canvas');
          c.width = 1240;
          c.height = 1754;
          const cCtx = c.getContext('2d');
          if (cCtx) {
            cCtx.fillStyle = '#ffffff';
            cCtx.fillRect(0, 0, c.width, c.height);
            if (item.layoutMode === 'id_card') {
              const cardW = 560;
              const cardH = 354;
              const topY = 95;
              if (item.backOriginalFile) {
                const bImg = await loadImageElement(item.croppedBackBlob || item.backOriginalFile);
                drawProcessedImage(cCtx, fImg, 0, 0, 45, topY, cardW, cardH, true, true);
                drawProcessedImage(cCtx, bImg, 0, 0, 635, topY, cardW, cardH, true, true);
              } else {
                drawProcessedImage(cCtx, fImg, 0, 0, (c.width - cardW) / 2, topY, cardW, cardH, true, true);
              }
            } else if (item.layoutMode === 'passport_8') {
              const pW = 206;
              const pH = 265;
              const spacingX = 45;
              const spacingY = 60;
              const startX = (c.width - (pW * 4 + spacingX * 3)) / 2;
              const startY = 120;
              for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 4; col++) {
                  drawProcessedImage(
                    cCtx,
                    fImg,
                    0,
                    0,
                    startX + col * (pW + spacingX),
                    startY + row * (pH + spacingY),
                    pW,
                    pH,
                    true,
                    false
                  );
                }
              }
            } else if (item.layoutMode === 'half_a4') {
              const boxW = 1080;
              const boxH = 760;
              drawProcessedImage(cCtx, fImg, 0, 0, 80, 70, boxW, boxH, false);
              if (item.backOriginalFile) {
                const bImg = await loadImageElement(item.croppedBackBlob || item.backOriginalFile);
                drawProcessedImage(cCtx, bImg, 0, 0, 80, 910, boxW, boxH, false);
              }
            } else {
              drawProcessedImage(cCtx, fImg, 0, 0, 60, 60, 1120, 1634, false);
            }

            const jBlob: Blob | null = await new Promise((res) =>
              c.toBlob((b) => res(b), 'image/jpeg', 0.94)
            );
            if (jBlob) {
              const pBlob = await convertJpegBlobToA4PdfBlob(jBlob);
              fileToUpload = new File(
                [pBlob],
                `${item.name.replace(/\.[^/.]+$/, '')}_A4.pdf`,
                { type: 'application/pdf' }
              );
            }
          }
        }

        const pdfCheckBytes = new Uint8Array(await fileToUpload.slice(0, 4).arrayBuffer());
        if (!isValidPdfBytes(pdfCheckBytes)) {
          throw new Error('Generated file is not a valid PDF. Please try again.');
        }

        const storagePath = `${shop.id}/${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 6)}.pdf`;

        const { error: uploadError } = await supabase.storage
          .from('print-files')
          .upload(storagePath, fileToUpload, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const itemTotal = Number(calculateItemPrice(item).toFixed(2));
        const displayDocName =
          item.fileKind === 'image' && item.layoutMode === 'id_card'
            ? `[ID-2in1] ${item.name}`
            : item.fileKind === 'image' && item.layoutMode === 'passport_8'
            ? `[Passport-8] ${item.name}`
            : item.fileKind === 'image' && item.layoutMode === 'grid_4'
            ? `[4-Per-Page] ${item.name}`
            : item.pageRangeText
            ? `[Pages ${item.pageRangeText}] ${item.name}`
            : item.name;

        const { error: orderError } = await supabase.from('print_orders').insert([
          {
            shop_id: shop.id,
            order_number: orderNumber,
            file_name: displayDocName,
            file_url: storagePath,
            page_count: calculateSheetsForItem(item),
            copies: item.copies,
            is_color: item.isColor,
            is_double_sided: item.isDoubleSided,
            paper_size: item.paperSize,
            total_amount: itemTotal,
            status: targetStatus,
            payment_ref: finalPaymentRef
          }
        ]);

        if (orderError) throw orderError;
      }

      try {
        await supabase.from('shop_transactions').insert([
          {
            shop_id: shop.id,
            order_number: orderNumber,
            amount: Number(formattedAmount),
            payment_mode: isGatewayVerified
              ? activeGatewayProvider.toUpperCase()
              : isCashMode
              ? 'CASH'
              : 'UPI',
            collection_type: shop.split_payment_enabled ? 'SPLIT_SETTLEMENT' : 'DIRECT_SHOP',
            payment_ref: finalPaymentRef,
            status: targetStatus
          }
        ]);
      } catch {
        // Ignore if table not created
      }

      navigate(`/shop/${shop.slug}/order/${orderNumber}`);
    } catch (err: any) {
      alert('Error creating print job: ' + (err.message || 'Please check with counter staff'));
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handlePayWithShopGateway = async () => {
    if (!shop || !hasActiveShopGateway) return;
    const keyId = (shop.gateway_key_id || '').trim();

    if (activeGatewayProvider === 'razorpay') {
      setLaunchingGateway(true);
      const loaded = await loadRazorpayScript();
      setLaunchingGateway(false);

      if (!loaded || !(window as any).Razorpay) {
        alert('Failed to load Razorpay Checkout. Please check your internet connection.');
        return;
      }

      const amountInPaise = Math.round(Number(totalAmount || 0) * 100);
      const options = {
        key: keyId,
        amount: amountInPaise,
        currency: 'INR',
        name: shop.name,
        description: `Print Job (${totalSheetsNeeded} sheets)`,
        prefill: {
          contact: shop.phone || ''
        },
        theme: {
          color: '#059669'
        },
        handler: function (response: any) {
          const paymentId = response?.razorpay_payment_id || `RZP_${Date.now()}`;
          handleProceedOrder(paymentId);
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } else {
      if (keyId.startsWith('http://') || keyId.startsWith('https://')) {
        window.open(keyId, '_blank');
      } else {
        alert(`Opening ${activeGatewayProvider.toUpperCase()} checkout for ₹${formattedAmount}...`);
      }
    }
  };

  if (loadingShop) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-xs font-bold text-slate-400 animate-pulse">Connecting to Print Counter...</p>
      </div>
    );
  }

  const shopApprovalTimestamp = shop?.approved_at
    ? new Date(shop.approved_at).getTime()
    : new Date(shop?.created_at || Date.now()).getTime();
  const shopElapsedDays = Math.floor((Date.now() - shopApprovalTimestamp) / (1000 * 60 * 60 * 24));
  const shopRemainingDays = Math.max(0, (shop?.subscription_days || 7) - shopElapsedDays);
  const isShopExpired =
    !shop ||
    !shop.is_accepting_orders ||
    shop.subscription_status === 'suspended' ||
    shopRemainingDays <= 0;

  if (isShopExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-sm space-y-3 shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-black text-slate-900">{shop?.name || 'Counter Offline'}</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {shopRemainingDays <= 0
              ? 'This print counter subscription has expired. Please ask the shop operator to renew their RTS Smart Print plan.'
              : 'This print counter is currently paused or offline. Please contact the shop operator.'}
          </p>
        </div>
      </div>
    );
  }

  const isIdCardEnabled = shop?.id_card_enabled !== false;
  const isPassportEnabled = shop?.passport_enabled !== false;
  const isScanPdfEnabled = shop?.scan_pdf_enabled !== false;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between relative overflow-x-hidden">
      <div>
        <header className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-6 sticky top-0 z-40 shadow-sm flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            {(items.length > 0 || selectedServiceCategory !== null) && (
              <button
                type="button"
                onClick={() => {
                  setItems([]);
                  setSelectedServiceCategory(null);
                  setShowCheckout(false);
                }}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-extrabold text-slate-700 flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.backBtn}</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h1 className="font-black text-slate-900 text-sm sm:text-base">{shop.name}</h1>
              </div>
              <p className="text-[11px] text-slate-400">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'ml' : 'en')}
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-extrabold text-slate-700 flex items-center gap-1.5 transition"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'en' ? 'മലയാളം' : 'English'}</span>
            </button>

            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {t.paymentMode}
              </span>
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                  shop.require_payment ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {shop.require_payment ? <Smartphone className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                {shop.require_payment
                  ? hasActiveShopGateway
                    ? `${activeGatewayProvider.toUpperCase()}`
                    : t.onlineUpi
                  : t.cashAtCounter}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 pt-6 space-y-5 relative z-10">
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={
              selectedServiceCategory === 'id_card' || selectedServiceCategory === 'photo'
                ? '.png,.jpg,.jpeg'
                : '.pdf,.png,.jpg,.jpeg'
            }
            className="hidden"
          />

          {shop.counter_notice && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{shop.counter_notice}</span>
            </div>
          )}

          {uploadErrorBanner && (
            <div className="bg-rose-50 border-2 border-rose-200 text-rose-900 px-4 py-3 rounded-2xl text-xs flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="whitespace-pre-line font-semibold leading-relaxed">{uploadErrorBanner}</p>
              </div>
              <button
                type="button"
                onClick={() => setUploadErrorBanner(null)}
                className="p-1 text-rose-500 hover:text-rose-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {!isUnlocked && shop.is_pin_protected ? (
            <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-base font-black text-slate-900">{t.pinRequiredTitle}</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{t.pinRequiredDesc}</p>
              </div>

              <form onSubmit={handleVerifyPin} className="max-w-xs mx-auto space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter PIN"
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value)}
                    className="w-full min-h-[46px] py-3 px-4 border border-slate-200 rounded-2xl text-center font-mono font-black text-lg tracking-widest text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>

                {pinError && <p className="text-xs font-bold text-rose-600">{t.incorrectPin}</p>}

                <button
                  type="submit"
                  className="w-full min-h-[46px] py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs shadow transition flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {t.unlockBtn}
                </button>
              </form>
            </div>
          ) : (
            <>
              {items.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      {isProcessingFiles ? t.uploadReading : t.servicesTitle}
                    </h2>
                    <p className="text-[11px] text-slate-500">{t.uploadSub}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleCategoryClick('document')}
                      className="bg-white border-2 border-slate-200 hover:border-emerald-500 hover:shadow-md rounded-3xl p-4 flex flex-col items-center justify-center gap-2.5 transition text-center min-h-[135px]"
                    >
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">{t.docPrintTitle}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">{t.docPrintSub}</p>
                      </div>
                    </button>

                    {isIdCardEnabled && (
                      <button
                        type="button"
                        onClick={() => handleCategoryClick('id_card')}
                        className="bg-white border-2 border-slate-200 hover:border-indigo-500 hover:shadow-md rounded-3xl p-4 flex flex-col items-center justify-center gap-2.5 transition text-center min-h-[135px]"
                      >
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                          <UserSquare className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">{t.idPrintTitle}</h3>
                          <p className="text-[10px] text-slate-500 mt-0.5">{t.idPrintSub}</p>
                        </div>
                      </button>
                    )}

                    {isPassportEnabled && (
                      <button
                        type="button"
                        onClick={() => handleCategoryClick('photo')}
                        className="bg-white border-2 border-slate-200 hover:border-pink-500 hover:shadow-md rounded-3xl p-4 flex flex-col items-center justify-center gap-2.5 transition text-center min-h-[135px]"
                      >
                        <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center shadow-sm">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">{t.photoPrintTitle}</h3>
                          <p className="text-[10px] text-slate-500 mt-0.5">{t.photoPrintSub}</p>
                        </div>
                      </button>
                    )}

                    {isScanPdfEnabled && (
                      <button
                        type="button"
                        onClick={() => handleCategoryClick('scanner')}
                        className="bg-white border-2 border-slate-200 hover:border-amber-500 hover:shadow-md rounded-3xl p-4 flex flex-col items-center justify-center gap-2.5 transition text-center min-h-[135px]"
                      >
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">{t.scanPdfTitle}</h3>
                          <p className="text-[10px] text-slate-500 mt-0.5">{t.scanPdfSub}</p>
                        </div>
                      </button>
                    )}
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-500/60 bg-emerald-50/40 hover:bg-emerald-50/70 p-5 rounded-3xl text-center cursor-pointer transition space-y-2"
                  >
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      {isProcessingFiles ? t.uploadReading : t.uploadTitle}
                    </h3>
                    <div className="bg-white/90 border border-emerald-200/80 rounded-2xl p-2.5 text-[11px] text-slate-600 leading-relaxed max-w-md mx-auto">
                      {t.aadhaarSafetyNote}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setItems([]);
                        setSelectedServiceCategory(null);
                      }}
                      className="min-h-[38px] px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{t.backBtn}</span>
                    </button>

                    <span className="text-xs font-bold text-slate-700">
                      {t.uploadedFiles} ({items.length})
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedServiceCategory(null);
                        fileInputRef.current?.click();
                      }}
                      className="min-h-[40px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t.addMoreBtn}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => {
                      const itemTotal = calculateItemPrice(item);
                      const sheetsCount = calculateSheetsForItem(item);
                      const isPdf = item.fileKind === 'pdf';

                      return (
                        <div
                          key={item.id}
                          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2.5">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                                {isPdf ? (
                                  <FileText className="w-4 h-4 text-rose-500" />
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-blue-500" />
                                )}
                              </div>
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                      isPdf ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                                    }`}
                                  >
                                    {isPdf ? 'PDF' : 'A4 PDF READY'}
                                  </span>
                                  <p className="font-bold text-xs text-slate-900 truncate">{item.name}</p>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {item.pages} {item.pages === 1 ? 'Page' : 'Pages'} • Uses{' '}
                                  <strong className="text-emerald-700">
                                    {sheetsCount} A4 {sheetsCount === 1 ? 'Sheet' : 'Sheets'}
                                  </strong>
                                  {item.layoutMode === 'id_card' && (
                                    <span className="ml-1.5 text-indigo-600 font-bold">
                                      • 🪪 ID Card (2-in-1) {item.hasBackImage ? 'Front+Back' : ''}
                                    </span>
                                  )}
                                  {item.layoutMode === 'passport_8' && (
                                    <span className="ml-1.5 text-pink-600 font-bold">
                                      • 📸 Passport (8 Pics)
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                              {!isPdf && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    isFreshUploadRef.current = false;
                                    openImageStudio(item);
                                  }}
                                  className="min-h-[38px] px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-extrabold text-[11px] transition flex items-center gap-1"
                                >
                                  <Scissors className="w-3.5 h-3.5" />
                                  <span>{item.layoutMode === 'id_card' ? 'Edit ID 2-in-1' : 'Crop / Layout'}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="min-h-[38px] px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-bold transition flex items-center gap-1"
                                title="Remove File"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>

                          {isPdf && (
                            <div className="bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              {item.totalPdfPages > 1 && (
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-slate-600">
                                    Pages (1-{item.totalPdfPages}):
                                  </span>
                                  <input
                                    type="text"
                                    placeholder={`All or e.g. 1-2`}
                                    value={item.pageRangeText}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const newCount = countSelectedPages(val, item.totalPdfPages);
                                      updateItem(item.id, { pageRangeText: val, pages: newCount });
                                    }}
                                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono w-32 outline-none focus:border-emerald-500"
                                  />
                                </div>
                              )}
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-slate-600">Layout:</span>
                                <select
                                  value={item.layoutMode}
                                  onChange={(e) =>
                                    updateItem(item.id, { layoutMode: e.target.value as ImageLayoutType })
                                  }
                                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none"
                                >
                                  <option value="fit_a4">1 Per Page (Fit A4)</option>
                                  <option value="half_a4">2 Per Page (2-Up)</option>
                                  <option value="grid_4">4 Per Page (4-Up)</option>
                                </select>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-500">{t.copies}</span>
                              <div className="flex items-center bg-slate-100 rounded-xl p-1">
                                <button
                                  type="button"
                                  onClick={() => updateItem(item.id, { copies: Math.max(1, item.copies - 1) })}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition"
                                >
                                  <Minus className="w-3.5 h-3.5 text-slate-700" />
                                </button>
                                <span className="px-2.5 font-black text-xs text-slate-900">{item.copies}</span>
                                <button
                                  type="button"
                                  onClick={() => updateItem(item.id, { copies: item.copies + 1 })}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition"
                                >
                                  <Plus className="w-3.5 h-3.5 text-slate-700" />
                                </button>
                              </div>
                            </div>

                            <select
                              value={item.paperSize}
                              onChange={(e) => updateItem(item.id, { paperSize: e.target.value })}
                              className="min-h-[36px] px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-extrabold text-slate-800 outline-none"
                            >
                              <option value="A4">A4</option>
                              <option value="A5">A5</option>
                              <option value="Legal">Legal</option>
                            </select>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, { isColor: false })}
                                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                                  !item.isColor ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                B&W
                              </button>
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, { isColor: true })}
                                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                                  item.isColor ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                Color
                              </button>
                            </div>

                            {isDuplexSupported && (item.pages > 1 || item.fileKind === 'pdf') && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => updateItem(item.id, { isDoubleSided: false })}
                                  className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition ${
                                    !item.isDoubleSided ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {t.singleSided}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateItem(item.id, { isDoubleSided: true })}
                                  className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition ${
                                    item.isDoubleSided ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {t.doubleSided}
                                </button>
                              </div>
                            )}

                            <div className="font-extrabold text-slate-900 text-sm ml-auto">
                              ₹{itemTotal.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl space-y-2.5">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>{t.totalDocPages}</span>
                      <span className="font-bold text-white">
                        {totalPages} {totalPages === 1 ? 'page' : 'pages'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-emerald-300">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{t.actualSheetsNeeded}</span>
                      </span>
                      <span className="font-black text-white font-mono">
                        {totalSheetsNeeded} A4 {totalSheetsNeeded === 1 ? 'Sheet' : 'Sheets'}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline border-t border-slate-800 pt-2">
                      <span className="text-sm font-bold">{t.totalBill}</span>
                      <span className="text-2xl font-black text-emerald-400">₹{formattedAmount}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!shop.require_payment) {
                          handleProceedOrder();
                        } else if (hasActiveShopGateway && activeGatewayProvider === 'razorpay') {
                          handlePayWithShopGateway();
                        } else {
                          setShowCheckout(true);
                        }
                      }}
                      disabled={submittingOrder || launchingGateway}
                      className="w-full min-h-[48px] py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                      <Printer className="w-4 h-4" />
                      {submittingOrder
                        ? 'Sending to Printer...'
                        : launchingGateway
                        ? `Opening ${activeGatewayProvider.toUpperCase()}...`
                        : shop.require_payment
                        ? hasActiveShopGateway
                          ? `Pay ₹${formattedAmount} via ${activeGatewayProvider.toUpperCase()} & Print`
                          : t.proceedPayBtn
                        : shop.auto_print_enabled
                        ? t.sendCashBtn
                        : t.submitStaffBtn}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Bottom Promotional Link + Security Shield & Privacy Icons Section */}
      <div className="mt-10 relative pt-6 bg-gradient-to-b from-transparent via-sky-50/70 to-blue-100/60">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="border-t border-slate-200/80 pt-5 mb-6">
            <p className="text-xs text-slate-500">
              Own a printing or digital service shop?{' '}
              <a
                href="/for-business"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 font-extrabold hover:underline inline-flex items-center gap-1"
              >
                Get RTS Smart Print for your shop →
              </a>
            </p>
          </div>

          <div className="relative mx-auto w-28 h-28 flex items-center justify-center mb-5">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-emerald-400/30 rounded-full blur-xl"></div>
            <div className="absolute w-28 h-12 border-2 border-emerald-400/60 rounded-full -rotate-12 shadow-[0_0_12px_rgba(16,185,129,0.3)]"></div>
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full absolute right-0 top-7 shadow-md"></div>

            <div className="relative z-10 w-20 h-24 bg-gradient-to-b from-sky-400 via-blue-600 to-blue-900 rounded-t-2xl rounded-b-[40px] p-1 shadow-xl shadow-blue-900/20 flex items-center justify-center border-2 border-white/80">
              <div className="w-full h-full rounded-t-xl rounded-b-[36px] bg-gradient-to-br from-sky-400/40 via-blue-600 to-indigo-950 flex items-center justify-center">
                <div className="bg-white text-blue-700 p-2.5 rounded-xl shadow-md">
                  <Lock className="w-7 h-7 stroke-[2.5]" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 max-w-md mx-auto pb-8 px-2">
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-white/90 border border-emerald-100 shadow-sm flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-slate-600 leading-tight">100% Safe</span>
            </div>

            <div className="flex flex-col items-center space-y-1.5 border-l border-slate-200/70 pl-1">
              <div className="w-12 h-12 rounded-2xl bg-white/90 border border-blue-100 shadow-sm flex items-center justify-center text-blue-600">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-slate-600 leading-tight">SSL Locked</span>
            </div>

            <div className="flex flex-col items-center space-y-1.5 border-l border-slate-200/70 pl-1">
              <div className="w-12 h-12 rounded-2xl bg-white/90 border border-emerald-100 shadow-sm flex items-center justify-center text-emerald-600">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-slate-600 leading-tight">Auto-Delete</span>
            </div>

            <div className="flex flex-col items-center space-y-1.5 border-l border-slate-200/70 pl-1">
              <div className="w-12 h-12 rounded-2xl bg-white/90 border border-blue-100 shadow-sm flex items-center justify-center text-blue-700">
                <EyeOff className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-slate-600 leading-tight">Zero Leak</span>
            </div>
          </div>
        </div>

        <div className="w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1440 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-14 sm:h-20 preserve-3d">
            <path d="M0 50C320 120 1120 -20 1440 40V110H0V50Z" fill="#10b981" />
            <path d="M0 65C400 125 1040 5 1440 60V110H0V65Z" fill="#0f296b" />
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SIMPLE, COMMON-MAN FRIENDLY CROP & A4 LAYOUT STUDIO MODAL                 */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-5 space-y-3.5 shadow-2xl my-auto max-h-[96vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseStudio}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 text-xs font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t.backBtn}</span>
                </button>
                <div>
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-indigo-600" />
                    <span>Easy A4 Print & ID Card 2-in-1 Studio</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Drag blue corners to crop, or tap "Apply to 1 A4 Sheet" directly
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseStudio}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setStudioLayout('id_card')}
                className={`p-2.5 rounded-2xl border text-left transition ${
                  studioLayout === 'id_card'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-extrabold block text-[11px]">🪪 ID Card (2-in-1)</span>
                <span className="text-[10px] opacity-85 block">Front + Back on 1 A4 Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => setStudioLayout('passport_8')}
                className={`p-2.5 rounded-2xl border text-left transition ${
                  studioLayout === 'passport_8'
                    ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-extrabold block text-[11px]">📸 Passport (8 Pics)</span>
                <span className="text-[10px] opacity-85 block">8 Copies on 1 A4 Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => setStudioLayout('fit_a4')}
                className={`p-2.5 rounded-2xl border text-left transition ${
                  studioLayout === 'fit_a4'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-extrabold block text-[11px]">📄 Full A4 Page</span>
                <span className="text-[10px] opacity-85 block">Fit document to full A4</span>
              </button>

              <button
                type="button"
                onClick={() => setStudioLayout('half_a4')}
                className={`p-2.5 rounded-2xl border text-left transition ${
                  studioLayout === 'half_a4'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-extrabold block text-[11px]">🖼️ 2 Per Page (Half A4)</span>
                <span className="text-[10px] opacity-85 block">Top & bottom on 1 A4</span>
              </button>
            </div>

            <div className="bg-slate-900 text-white p-3.5 rounded-2xl space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleSwitchCropSideTab('front')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                      activeCropSide === 'front'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    1. Front Side {croppedFrontBlob ? '✓' : ''}
                  </button>
                  {(studioLayout === 'id_card' || studioLayout === 'half_a4' || studioLayout === 'grid_4') && (
                    <button
                      type="button"
                      onClick={() => handleSwitchCropSideTab('back')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                        activeCropSide === 'back'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      2. Back Side {croppedBackBlob ? '✓' : backFile ? '' : '(+ Add Back)'}
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-emerald-400 font-bold">
                  ✨ Free Crop (Drag any side)
                </span>
              </div>

              {cropperSourceUrl ? (
                <div className="w-full h-72 sm:h-80 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center relative">
                  {isRotatingFile && (
                    <div className="absolute inset-0 bg-slate-950/70 z-20 flex items-center justify-center text-xs font-bold text-emerald-400">
                      Rotating Photo...
                    </div>
                  )}
                  <img
                    ref={cropperImageRef}
                    src={cropperSourceUrl}
                    alt="Crop Target"
                    className="max-h-full max-w-full block"
                  />
                </div>
              ) : (
                <div className="w-full h-56 bg-slate-950 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <p className="text-xs text-slate-400">
                    {activeCropSide === 'back'
                      ? 'No Back Side image selected yet.'
                      : 'No Front Side image selected.'}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      activeCropSide === 'back'
                        ? studioBackInputRef.current?.click()
                        : studioFrontInputRef.current?.click()
                    }
                    className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {activeCropSide === 'back' ? 'Upload Back Side Image' : 'Upload Front Side Image'}
                    </span>
                  </button>
                </div>
              )}

              {cropperSourceUrl && (
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isRotatingFile}
                      onClick={() => handleRotateCropper(-90)}
                      className="min-h-[42px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Rotate Left</span>
                    </button>
                    <button
                      type="button"
                      disabled={isRotatingFile}
                      onClick={() => handleRotateCropper(90)}
                      className="min-h-[42px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-1"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Rotate Right</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetCropper}
                      className="min-h-[42px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                    >
                      {t.resetCrop}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleUseThisCrop}
                    className="min-h-[42px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.useThisCrop}</span>
                  </button>
                </div>
              )}

              {cropAppliedToast && (
                <p className="text-center text-xs font-extrabold text-[#78C900] animate-pulse">
                  {cropAppliedToast}
                </p>
              )}
            </div>

            <div className="bg-slate-200/80 p-3 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Live 1-Sheet A4 Paper Preview (Auto-Converts to A4 PDF)
              </span>
              <canvas
                ref={previewCanvasRef}
                className="w-40 aspect-[210/297] bg-white shadow-md rounded border border-slate-300"
              />
            </div>

            <input
              type="file"
              ref={studioFrontInputRef}
              accept=".png,.jpg,.jpeg"
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  const f = await compressLargeImageInBrowser(e.target.files[0]);
                  setFrontFile(f);
                  setCroppedFrontBlob(null);
                  setFrontRotation(0);
                  setFrontCropPct(0);
                  setActiveCropSide('front');
                }
                e.target.value = '';
              }}
              className="hidden"
            />
            <input
              type="file"
              ref={studioBackInputRef}
              accept=".png,.jpg,.jpeg"
              onChange={async (e) => {
                if (e.target.files && e.target.files[0]) {
                  const f = await compressLargeImageInBrowser(e.target.files[0]);
                  setBackFile(f);
                  setCroppedBackBlob(null);
                  setBackRotation(0);
                  setBackCropPct(0);
                  setActiveCropSide('back');
                }
                e.target.value = '';
              }}
              className="hidden"
            />

            <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between gap-1">
                <span className="font-extrabold text-slate-800 truncate max-w-[160px]">
                  1. Front: {frontFile ? frontFile.name : 'None'}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => studioFrontInputRef.current?.click()}
                    className="min-h-[34px] px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[10px] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Change</span>
                  </button>
                  {frontFile && (
                    <button
                      type="button"
                      onClick={handleRemoveFrontInStudio}
                      className="min-h-[34px] px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-bold text-[10px]"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {(studioLayout === 'id_card' || studioLayout === 'half_a4' || studioLayout === 'grid_4') && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-1">
                  <span className="font-extrabold text-indigo-950 truncate max-w-[160px]">
                    2. Back: {backFile ? backFile.name : 'Optional'}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        if (activeCropSide === 'front') {
                          const fBlob = await extractCurrentCropperBlob();
                          if (fBlob) setCroppedFrontBlob(fBlob);
                        }
                        studioBackInputRef.current?.click();
                      }}
                      className="min-h-[34px] px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{backFile ? 'Change Back' : 'Add Back Image'}</span>
                    </button>
                    {backFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setBackFile(null);
                          setCroppedBackBlob(null);
                          setActiveCropSide('front');
                        }}
                        className="min-h-[34px] px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-bold text-[10px]"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-[11px] text-slate-500 w-20 shrink-0">Brightness:</span>
                <input
                  type="range"
                  min={80}
                  max={140}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="flex-1 accent-emerald-600"
                />
                <span className="text-[10px] font-mono font-bold text-slate-700 w-8">{brightness}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleDeleteItemFromStudio}
                className="min-h-[44px] px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold rounded-xl text-xs text-rose-700 flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Discard</span>
              </button>
              <button
                type="button"
                onClick={handleCloseStudio}
                className="min-h-[44px] px-3 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-xs text-slate-700"
              >
                {t.backBtn}
              </button>
              <button
                type="button"
                disabled={applyingStudio || !frontFile}
                onClick={handleApplyImageStudio}
                className="col-span-2 sm:flex-1 min-h-[46px] py-2.5 bg-[#003399] hover:bg-blue-800 disabled:bg-slate-300 text-white font-black rounded-xl text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 text-[#78C900]" />
                <span>{applyingStudio ? 'Saving A4 PDF...' : 'Done • Apply to 1 A4 Sheet →'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditConfirmPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-emerald-100">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-slate-900 text-base">Ready on 1 A4 Sheet!</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your document has been converted into a <strong>1-Page A4 PDF</strong>. Proceed to print or add more files.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowEditConfirmPopup(false)}
                className="w-full min-h-[44px] py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Continue to Print →</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowEditConfirmPopup(false);
                  const target = items.find((i) => i.id === lastEditedItemId);
                  if (target) openImageStudio(target);
                }}
                className="w-full min-h-[44px] py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition"
              >
                ← Go Back & Edit More
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckout && shop.require_payment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 text-center space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="min-h-[36px] px-2.5 py-1 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-600 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.backBtn}</span>
              </button>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-0.5">
                Banking Name: {payeeName}
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Payment for {shop.name}</h3>
            </div>

            {hasActiveShopGateway ? (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 border-2 border-indigo-500/40 rounded-2xl space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">
                    ⚡ Verified Merchant Gateway ({activeGatewayProvider.toUpperCase()})
                  </span>
                  <button
                    type="button"
                    disabled={launchingGateway || submittingOrder}
                    onClick={handlePayWithShopGateway}
                    className="w-full min-h-[46px] py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>
                      {launchingGateway
                        ? 'Opening Secure Gateway...'
                        : `Pay ₹${formattedAmount} via ${activeGatewayProvider.toUpperCase()} (Auto-Print)`}
                    </span>
                  </button>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    1-Click GPay / PhonePe / Paytm without bank limit blocks. Your document prints automatically as soon as payment succeeds!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="w-full min-h-[44px] py-2.5 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-600"
                >
                  {t.backBtn}
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {cleanUpiId && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <img
                      src={qrCodeImageUrl}
                      alt="UPI QR Code"
                      className="w-40 h-40 mx-auto rounded-xl border border-slate-200 bg-white p-1.5"
                    />

                    <a
                      href={upiDeepLink}
                      className="w-full min-h-[44px] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Pay ₹{formattedAmount} via UPI App</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={handleDownloadQrForGallery}
                      disabled={savingQr}
                      className="w-full min-h-[42px] py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{savingQr ? 'Saving QR...' : 'Save QR & Pay via GPay/PhonePe Gallery'}</span>
                    </button>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Scan with another phone OR tap <strong>Save QR</strong> → Open GPay/PhonePe → <strong>Scan QR</strong> → <strong>Upload from Gallery</strong>.
                    </p>
                  </div>
                )}

                {cleanUpiId && (
                  <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-700 truncate">{cleanUpiId}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(cleanUpiId);
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 2000);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-bold text-[10px] text-slate-700 flex items-center gap-1 shrink-0"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copy UPI ID</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1 text-left">
                    Enter Last 4 Digits of UPI Ref / UTR (Optional):
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="e.g. 8492"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-center font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {!shop.auto_print_enabled && (
                  <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2 leading-tight">
                    {t.manualVerifyNote}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    className="w-1/2 min-h-[44px] py-2.5 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-600"
                  >
                    {t.backBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProceedOrder()}
                    disabled={submittingOrder}
                    className="w-1/2 min-h-[44px] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition"
                  >
                    {submittingOrder ? 'Submitting...' : 'I Have Paid'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
