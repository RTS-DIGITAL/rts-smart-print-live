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
  CreditCard,
  Zap,
  Scissors,
  RotateCw,
  Sun,
  Layers,
  X
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  // New Duplex & ID Card 2-in-1 Pricing Fields
  duplex_supported?: boolean;
  id_card_bw_price?: number | null;
  id_card_color_price?: number | null;
}

type ImageLayoutType = 'fit_a4' | 'id_card' | 'half_a4' | 'actual_size';

interface UploadedItem {
  id: string;
  file: File;
  originalFile: File;
  fileKind: 'pdf' | 'image';
  name: string;
  size: number;
  totalPdfPages: number;
  pages: number;
  copies: number;
  isColor: boolean;
  isDoubleSided: boolean;
  paperSize: string;
  // Image Layout & PDF Page Range Options
  layoutMode: ImageLayoutType;
  pageRangeText: string;
  hasBackImage?: boolean;
}

interface PricingRule {
  paper_size: string;
  is_color: boolean;
  is_double_sided: boolean;
  price_per_page: number;
}

function cleanVpa(input: string | null | undefined): string {
  return (input || '').trim().replace(/\s+/g, '').toLowerCase();
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

// Verify real file signature bytes (%PDF, JPEG FF D8 FF, PNG 89 50 4E 47)
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
      bytes.length >= 4 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return 'image';
    }
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    return 'invalid';
  } catch {
    return file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
  }
}

// Parse custom PDF page range like "1-2" or "1,3,5" and return count of selected pages
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

// Calculate physical A4 paper sheets needed for an item
function calculateSheetsForItem(item: UploadedItem): number {
  const perSide = item.layoutMode === 'id_card' ? 2 : 1;
  const sidesNeeded = Math.ceil(item.pages / perSide);
  const sheetsPerCopy = item.isDoubleSided ? Math.ceil(sidesNeeded / 2) : sidesNeeded;
  return Math.max(1, sheetsPerCopy) * item.copies;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shop, setShop] = useState<ShopConfig | null>(null);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loadingShop, setLoadingShop] = useState(true);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const [items, setItems] = useState<UploadedItem[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [launchingGateway, setLaunchingGateway] = useState(false);

  const [showCheckout, setShowCheckout] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [savingQr, setSavingQr] = useState(false);

  // Image Crop, Rotate & ID Card 2-in-1 A4 Layout Studio Modal States
  const [editingItem, setEditingItem] = useState<UploadedItem | null>(null);
  const [studioLayout, setStudioLayout] = useState<ImageLayoutType>('id_card');
  const [frontRotation, setFrontRotation] = useState<number>(0);
  const [frontCropPct, setFrontCropPct] = useState<number>(0);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backRotation, setBackRotation] = useState<number>(0);
  const [backCropPct, setBackCropPct] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(105);
  const [contrast, setContrast] = useState<number>(110);
  const [applyingStudio, setApplyingStudio] = useState<boolean>(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function init() {
      setLoadingShop(true);
      try {
        const { data: shopData } = await supabase
          .from('shops')
          .select('*')
          .eq('slug', activeSlug)
          .single();

        if (shopData) {
          setShop(shopData);
          if (!shopData.is_pin_protected) {
            setIsUnlocked(true);
          }

          const { data: pricingData } = await supabase
            .from('pricing_rules')
            .select('*')
            .eq('shop_id', shopData.id);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsProcessingFiles(true);
    const newItems: UploadedItem[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const fileKind = await detectTrueFileKind(file);

      if (fileKind === 'invalid') {
        alert(`"${file.name}" is not a valid PDF, JPG, or PNG file.`);
        continue;
      }

      const pages = fileKind === 'pdf' ? await getPageCount(file) : 1;
      const newItem: UploadedItem = {
        id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        originalFile: file,
        fileKind,
        name: file.name,
        size: file.size,
        totalPdfPages: pages,
        pages,
        copies: 1,
        isColor: false,
        isDoubleSided: false,
        paperSize: 'A4',
        layoutMode: 'fit_a4',
        pageRangeText: ''
      };
      newItems.push(newItem);
    }

    // If customer selected exactly 2 images at once (e.g. Front & Back of ID Card), offer to open 2-in-1 ID Card Studio automatically
    if (newItems.length === 2 && newItems[0].fileKind === 'image' && newItems[1].fileKind === 'image') {
      const firstItem = newItems[0];
      const secondFile = newItems[1].originalFile;
      setItems((prev) => [...prev, firstItem]);
      openImageStudio(firstItem, secondFile);
    } else {
      setItems((prev) => [...prev, ...newItems]);
      // If single image uploaded, allow quick access or auto-open if desired
    }

    setIsProcessingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openImageStudio = (item: UploadedItem, preloadedBackFile?: File) => {
    setEditingItem(item);
    setStudioLayout(item.layoutMode === 'fit_a4' ? 'id_card' : item.layoutMode);
    setFrontRotation(0);
    setFrontCropPct(0);
    setBackFile(preloadedBackFile || null);
    setBackRotation(0);
    setBackCropPct(0);
    setBrightness(105);
    setContrast(110);
  };

  // Helper to draw a rotated & cropped image onto an A4 canvas region
  const drawProcessedImage = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    rotationDeg: number,
    cropPct: number,
    targetX: number,
    targetY: number,
    targetW: number,
    targetH: number,
    drawCutBorder: boolean
  ) => {
    const offCanvas = document.createElement('canvas');
    const rad = ((rotationDeg % 360) * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));

    const trimX = (img.width * cropPct) / 200;
    const trimY = (img.height * cropPct) / 200;
    const srcW = Math.max(10, img.width - trimX * 2);
    const srcH = Math.max(10, img.height - trimY * 2);

    offCanvas.width = Math.round(srcW * cos + srcH * sin);
    offCanvas.height = Math.round(srcW * sin + srcH * cos);

    const offCtx = offCanvas.getContext('2d');
    if (offCtx) {
      offCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      offCtx.translate(offCanvas.width / 2, offCanvas.height / 2);
      offCtx.rotate(rad);
      offCtx.drawImage(img, trimX, trimY, srcW, srcH, -srcW / 2, -srcH / 2, srcW, srcH);
    }

    ctx.drawImage(offCanvas, targetX, targetY, targetW, targetH);

    if (drawCutBorder) {
      ctx.save();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = Math.max(1, targetW * 0.004);
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(targetX - 4, targetY - 4, targetW + 8, targetH + 8);
      ctx.restore();
    }
  };

  // Render Live A4 Sheet Preview inside the Studio Modal
  useEffect(() => {
    let active = true;
    async function renderPreview() {
      if (!editingItem || !previewCanvasRef.current) return;
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Preview scale of A4 (210mm x 297mm -> 420px x 594px)
      canvas.width = 420;
      canvas.height = 594;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      try {
        const frontImg = await loadImageElement(editingItem.originalFile);
        if (!active) return;

        if (studioLayout === 'id_card') {
          // Exact ID-1 Card Size on A4 (85.6mm x 54mm -> 171px x 108px on 420x594 canvas)
          const cardW = 171;
          const cardH = 108;
          const topMargin = 36;

          if (backFile) {
            const backImg = await loadImageElement(backFile);
            if (!active) return;
            // Place Front (Left) and Back (Right) side-by-side at top of 1 A4 sheet
            drawProcessedImage(ctx, frontImg, frontRotation, frontCropPct, 26, topMargin, cardW, cardH, true);
            drawProcessedImage(ctx, backImg, backRotation, backCropPct, 223, topMargin, cardW, cardH, true);
          } else {
            // Single ID card centered at top of A4 sheet
            drawProcessedImage(
              ctx,
              frontImg,
              frontRotation,
              frontCropPct,
              (canvas.width - cardW) / 2,
              topMargin,
              cardW,
              cardH,
              true
            );
          }
        } else if (studioLayout === 'half_a4') {
          // 2 Photos on 1 A4 Sheet (Top half & Bottom half)
          const boxW = 360;
          const boxH = 250;
          drawProcessedImage(ctx, frontImg, frontRotation, frontCropPct, 30, 25, boxW, boxH, false);
          if (backFile) {
            const backImg = await loadImageElement(backFile);
            if (!active) return;
            drawProcessedImage(ctx, backImg, backRotation, backCropPct, 30, 305, boxW, boxH, false);
          }
        } else if (studioLayout === 'actual_size') {
          const w = Math.min(360, frontImg.width * 0.35);
          const h = Math.min(520, frontImg.height * 0.35);
          drawProcessedImage(
            ctx,
            frontImg,
            frontRotation,
            frontCropPct,
            (canvas.width - w) / 2,
            40,
            w,
            h,
            false
          );
        } else {
          // Fit to Full A4 Page with clean margin
          drawProcessedImage(ctx, frontImg, frontRotation, frontCropPct, 20, 20, 380, 554, false);
        }
      } catch (err) {
        console.error('Preview render error:', err);
      }
    }
    renderPreview();
    return () => {
      active = false;
    };
  }, [editingItem, studioLayout, frontRotation, frontCropPct, backFile, backRotation, backCropPct, brightness, contrast]);

  // Generate High-Resolution 300-DPI A4 Sheet (1240 x 1754 px) so PC Print Agent prints exact real size on 1 sheet!
  const handleApplyImageStudio = async () => {
    if (!editingItem) return;
    setApplyingStudio(true);

    try {
      const hiCanvas = document.createElement('canvas');
      // Standard A4 @ 150-200 DPI (1240 x 1754 px) for crisp printing & fast upload
      hiCanvas.width = 1240;
      hiCanvas.height = 1754;
      const ctx = hiCanvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, hiCanvas.width, hiCanvas.height);

      const frontImg = await loadImageElement(editingItem.originalFile);

      if (studioLayout === 'id_card') {
        // Exact ID-1 Standard Size (85.6mm x 54mm on 210mm x 297mm A4 -> 505px x 319px)
        const cardW = 505;
        const cardH = 319;
        const topY = 110;

        if (backFile) {
          const backImg = await loadImageElement(backFile);
          drawProcessedImage(ctx, frontImg, frontRotation, frontCropPct, 80, topY, cardW, cardH, true);
          drawProcessedImage(ctx, backImg, backRotation, backCropPct, 655, topY, cardW, cardH, true);
        } else {
          drawProcessedImage(
            ctx,
            frontImg,
            frontRotation,
            frontCropPct,
            (hiCanvas.width - cardW) / 2,
            topY,
            cardW,
            cardH,
            true
          );
        }
      } else if (studioLayout === 'half_a4') {
        const boxW = 1080;
        const boxH = 760;
        drawProcessedImage(ctx, frontImg, frontRotation, frontCropPct, 80, 70, boxW, boxH, false);
        if (backFile) {
          const backImg = await loadImageElement(backFile);
          drawProcessedImage(ctx, backImg, backRotation, backCropPct, 80, 910, boxW, boxH, false);
        }
      } else if (studioLayout === 'actual_size') {
        const w = Math.min(1080, frontImg.width);
        const h = Math.min(1550, frontImg.height);
        drawProcessedImage(
          ctx,
          frontImg,
          frontRotation,
          frontCropPct,
          (hiCanvas.width - w) / 2,
          100,
          w,
          h,
          false
        );
      } else {
        drawProcessedImage(ctx, frontImg, frontRotation, frontCropPct, 60, 60, 1120, 1634, false);
      }

      const blob: Blob = await new Promise((resolve, reject) => {
        hiCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Blob failed'))), 'image/jpeg', 0.92);
      });

      const baseName = editingItem.originalFile.name.replace(/\.[^/.]+$/, '');
      const layoutTag = studioLayout === 'id_card' ? 'ID_Card_2in1_A4' : studioLayout;
      const composedFile = new File([blob], `${baseName}_${layoutTag}.jpg`, { type: 'image/jpeg' });

      updateItem(editingItem.id, {
        file: composedFile,
        size: composedFile.size,
        layoutMode: studioLayout,
        pages: 1,
        hasBackImage: Boolean(backFile)
      });

      setEditingItem(null);
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

  // Price Calculation: Supports Shopkeeper's Custom "ID Card 2-in-1 / Cropping" Rate + Single/Double-Sided Rules
  const calculateItemPrice = (item: UploadedItem): number => {
    const rule = pricingRules.find(
      (r) =>
        r.paper_size === item.paperSize &&
        r.is_color === item.isColor &&
        r.is_double_sided === item.isDoubleSided
    );
    const standardPerPageRate = rule ? Number(rule.price_per_page) : item.isColor ? 10.0 : 2.0;

    // If customer selected ID Card 2-in-1 or Half-Page 2-in-1 layout, apply shop's ID Card 2-in-1 rate
    if (item.fileKind === 'image' && (item.layoutMode === 'id_card' || (item.layoutMode === 'half_a4' && item.hasBackImage))) {
      const customIdRate = item.isColor
        ? Number(shop?.id_card_color_price || standardPerPageRate * 2)
        : Number(shop?.id_card_bw_price || standardPerPageRate * 2);
      return customIdRate * item.copies;
    }

    return item.pages * item.copies * standardPerPageRate;
  };

  const totalAmount = items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
  const totalPages = items.reduce((sum, item) => sum + item.pages * item.copies, 0);
  const totalSheetsNeeded = items.reduce((sum, item) => sum + calculateSheetsForItem(item), 0);

  const cleanUpiId = cleanVpa(shop?.upi_id);
  const payeeName = (shop?.upi_name && shop.upi_name.trim() !== '')
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

  // RESTORED ORIGINAL WORKING ORDER STATUS LOGIC FOR PC AGENT & MANUAL APPROVAL
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

      for (const item of items) {
        const fileExt = item.file.name.split('.').pop() || 'pdf';
        const storagePath = `${shop.id}/${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('print-files')
          .upload(storagePath, item.file, {
            contentType: item.file.type,
            upsert: false
          });

        if (uploadError) throw uploadError;

        const itemTotal = Number(calculateItemPrice(item).toFixed(2));
        const displayDocName =
          item.fileKind === 'image' && item.layoutMode === 'id_card'
            ? `[ID-2in1] ${item.name}`
            : item.pageRangeText
            ? `[Pages ${item.pageRangeText}] ${item.name}`
            : item.name;

        const { error: orderError } = await supabase.from('print_orders').insert([
          {
            shop_id: shop.id,
            order_number: orderNumber,
            file_name: displayDocName,
            file_url: storagePath,
            page_count: item.pages,
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

  if (!shop || !shop.is_accepting_orders) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-sm space-y-3 shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-black text-slate-900">{shop?.name || 'Counter Offline'}</h2>
          <p className="text-xs text-slate-500">
            This print counter is currently paused or offline. Please contact the shop operator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between relative overflow-x-hidden">
      <div>
        <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-40 shadow-sm flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h1 className="font-black text-slate-900 text-base">{shop.name}</h1>
            </div>
            <p className="text-[11px] text-slate-400">Self-Service Document Print Kiosk</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Payment Mode</span>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
              shop.require_payment ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {shop.require_payment ? <Smartphone className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
              {shop.require_payment
                ? hasActiveShopGateway
                  ? `${activeGatewayProvider.toUpperCase()}`
                  : 'Online UPI'
                : 'Cash at Counter'}
            </span>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 pt-6 space-y-5 relative z-10">
          {shop.counter_notice && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2">
              <Printer className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{shop.counter_notice}</span>
            </div>
          )}

          {!isUnlocked && shop.is_pin_protected ? (
            <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-base font-black text-slate-900">Counter PIN Required</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Please enter the 4-digit PIN displayed on the counter standee to unlock printing.
                </p>
              </div>

              <form onSubmit={handleVerifyPin} className="max-w-xs mx-auto space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter PIN"
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value)}
                    className="w-full py-3 px-4 border border-slate-200 rounded-2xl text-center font-mono font-black text-lg tracking-widest text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>

                {pinError && (
                  <p className="text-xs font-bold text-rose-600">Incorrect PIN. Please check the counter standee.</p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl text-xs shadow transition flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Unlock Print Station
                </button>
              </form>
            </div>
          ) : (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-500/60 bg-emerald-50/40 hover:bg-emerald-50/70 p-8 rounded-3xl text-center cursor-pointer transition space-y-2"
              >
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                />
                <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {isProcessingFiles ? 'Reading Documents...' : 'Tap to Select Files (PDF or ID/Document Photos)'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Supports PDF, JPG, PNG • Includes <strong>ID Card 2-in-1 (Front + Back on 1 Sheet)</strong> & Crop tool
                </p>
                <p className="text-[10px] text-slate-400 pt-1">
                  🔒 Privacy Tip: Upload only required pages. Files are auto-deleted after printing.
                </p>
              </div>

              {items.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-slate-700">
                      Uploaded Files ({items.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add More
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
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                                {isPdf ? <FileText className="w-4 h-4 text-rose-500" /> : <ImageIcon className="w-4 h-4 text-blue-500" />}
                              </div>
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                    isPdf ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {isPdf ? 'PDF' : 'IMAGE'}
                                  </span>
                                  <p className="font-bold text-xs text-slate-900 truncate">{item.name}</p>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {item.pages} {item.pages === 1 ? 'Page' : 'Pages'} • Uses <strong>{sheetsCount} A4 {sheetsCount === 1 ? 'Sheet' : 'Sheets'}</strong>
                                  {item.layoutMode === 'id_card' && (
                                    <span className="ml-1.5 text-indigo-600 font-bold">
                                      • 🪪 ID Card 2-in-1 {item.hasBackImage ? '(Front+Back)' : ''}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {!isPdf && (
                                <button
                                  type="button"
                                  onClick={() => openImageStudio(item)}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-extrabold text-[10px] transition flex items-center gap-1"
                                >
                                  <Scissors className="w-3 h-3" />
                                  <span>{item.layoutMode === 'id_card' ? 'Edit ID 2-in-1' : 'Crop / ID 2-in-1'}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* PDF Page Selection Row (Only if PDF has > 1 page) */}
                          {isPdf && item.totalPdfPages > 1 && (
                            <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                              <span className="font-semibold text-slate-600">
                                PDF Pages (Total {item.totalPdfPages}):
                              </span>
                              <input
                                type="text"
                                placeholder={`All (1-${item.totalPdfPages}) or e.g. 1-2`}
                                value={item.pageRangeText}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newCount = countSelectedPages(val, item.totalPdfPages);
                                  updateItem(item.id, { pageRangeText: val, pages: newCount });
                                }}
                                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono w-44 outline-none focus:border-emerald-500"
                              />
                            </div>
                          )}

                          {/* Copies, B&W / Color, Single / Double-Sided Controls */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-500">Copies:</span>
                              <div className="flex items-center bg-slate-100 rounded-xl p-0.5">
                                <button
                                  type="button"
                                  onClick={() => updateItem(item.id, { copies: Math.max(1, item.copies - 1) })}
                                  className="p-1 hover:bg-white rounded-lg transition"
                                >
                                  <Minus className="w-3 h-3 text-slate-600" />
                                </button>
                                <span className="px-2 font-black text-xs text-slate-800">{item.copies}</span>
                                <button
                                  type="button"
                                  onClick={() => updateItem(item.id, { copies: item.copies + 1 })}
                                  className="p-1 hover:bg-white rounded-lg transition"
                                >
                                  <Plus className="w-3 h-3 text-slate-600" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, { isColor: false })}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${
                                  !item.isColor ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                B&W
                              </button>
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, { isColor: true })}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${
                                  item.isColor ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                Color
                              </button>
                            </div>

                            {/* Single-Sided vs Double-Sided (Duplex) Toggle */}
                            {isDuplexSupported && (item.pages > 1 || item.fileKind === 'pdf') && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => updateItem(item.id, { isDoubleSided: false })}
                                  className={`px-2 py-1 rounded-xl text-[10px] font-bold transition ${
                                    !item.isDoubleSided ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  1-Sided
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateItem(item.id, { isDoubleSided: true })}
                                  className={`px-2 py-1 rounded-xl text-[10px] font-bold transition ${
                                    item.isDoubleSided ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  2-Sided
                                </button>
                              </div>
                            )}

                            <div className="font-extrabold text-slate-900 text-xs">
                              ₹{itemTotal.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Bill & Real Paper Sheet Count Card */}
                  <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl space-y-2.5">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Total Document Pages:</span>
                      <span className="font-bold text-white">{totalPages} {totalPages === 1 ? 'page' : 'pages'}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-emerald-300">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Actual A4 Paper Sheets Needed:</span>
                      </span>
                      <span className="font-black text-white font-mono">
                        {totalSheetsNeeded} A4 {totalSheetsNeeded === 1 ? 'Sheet' : 'Sheets'}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline border-t border-slate-800 pt-2">
                      <span className="text-sm font-bold">Total Bill:</span>
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
                      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-xs"
                    >
                      <Printer className="w-4 h-4" />
                      {submittingOrder
                        ? 'Sending to Printer...'
                        : launchingGateway
                        ? `Opening ${activeGatewayProvider.toUpperCase()}...`
                        : shop.require_payment
                        ? hasActiveShopGateway
                          ? `Pay ₹${formattedAmount} via ${activeGatewayProvider.toUpperCase()} & Print`
                          : 'Proceed to Pay & Print'
                        : shop.auto_print_enabled
                        ? 'Send to Print (Pay Cash at Counter)'
                        : 'Submit to Counter (Staff Will Release)'}
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
      {/* IMAGE CROP, ROTATE & ID CARD 2-IN-1 (FRONT + BACK ON 1 A4 SHEET) MODAL    */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl my-auto max-h-[94vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-indigo-600" />
                  <span>A4 Page Layout & ID Card 2-in-1 Studio</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Place Front & Back on 1 A4 sheet without wasting paper
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Layout Mode Buttons */}
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
                onClick={() => setStudioLayout('fit_a4')}
                className={`p-2.5 rounded-2xl border text-left transition ${
                  studioLayout === 'fit_a4'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-extrabold block text-[11px]">📄 Full A4 Page</span>
                <span className="text-[10px] opacity-85 block">Fit document to full sheet</span>
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
                <span className="text-[10px] opacity-85 block">Top & bottom on 1 sheet</span>
              </button>

              <button
                type="button"
                onClick={() => setStudioLayout('actual_size')}
                className={`p-2.5 rounded-2xl border text-left transition ${
                  studioLayout === 'actual_size'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-extrabold block text-[11px]">📏 Original Size</span>
                <span className="text-[10px] opacity-85 block">No stretching on A4</span>
              </button>
            </div>

            {/* Live A4 Sheet Preview Box */}
            <div className="bg-slate-200/80 p-3 rounded-2xl flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                Live A4 Paper Sheet Preview (1 Sheet Only)
              </span>
              <canvas
                ref={previewCanvasRef}
                className="w-40 aspect-[210/297] bg-white shadow-md rounded border border-slate-300"
              />
            </div>

            {/* Front Image Controls + Optional Back Side Image Upload (for ID Card / 2-per-page) */}
            <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800">1. Front Side Image:</span>
                <button
                  type="button"
                  onClick={() => setFrontRotation((r) => (r + 90) % 360)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-xl font-bold text-[11px] flex items-center gap-1 hover:bg-slate-100"
                >
                  <RotateCw className="w-3 h-3 text-indigo-600" />
                  <span>Rotate 90°</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 w-24 shrink-0">Trim Edges:</span>
                <input
                  type="range"
                  min={0}
                  max={35}
                  value={frontCropPct}
                  onChange={(e) => setFrontCropPct(Number(e.target.value))}
                  className="flex-1 accent-indigo-600"
                />
                <span className="text-[10px] font-mono font-bold text-slate-700 w-8">{frontCropPct}%</span>
              </div>

              {(studioLayout === 'id_card' || studioLayout === 'half_a4') && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950">2. Back Side Image (Same Sheet):</span>
                    {backFile && (
                      <button
                        type="button"
                        onClick={() => setBackRotation((r) => (r + 90) % 360)}
                        className="px-2.5 py-1 bg-white border border-slate-300 rounded-xl font-bold text-[11px] flex items-center gap-1"
                      >
                        <RotateCw className="w-3 h-3 text-indigo-600" />
                        <span>Rotate Back</span>
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setBackFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-[11px] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-bold"
                  />

                  {backFile && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 w-24 shrink-0">Trim Back:</span>
                      <input
                        type="range"
                        min={0}
                        max={35}
                        value={backCropPct}
                        onChange={(e) => setBackCropPct(Number(e.target.value))}
                        className="flex-1 accent-indigo-600"
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-700 w-8">{backCropPct}%</span>
                    </div>
                  )}
                </div>
              )}

              {/* Xerox Clarity / Brightness Control */}
              <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-[11px] text-slate-500 w-20 shrink-0">Clarity:</span>
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

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-1/3 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={applyingStudio}
                onClick={handleApplyImageStudio}
                className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{applyingStudio ? 'Creating A4 Sheet...' : 'Apply to 1 A4 Sheet'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONLINE PAYMENT MODAL (Shows ONLY Gateway if ON, OR ONLY QR Scanner if OFF) */}
      {/* ========================================================================= */}
      {showCheckout && shop.require_payment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 text-center space-y-4 shadow-2xl my-auto">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Payment for {shop.name}</h3>
              <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-0.5 inline-block mt-1">
                Banking Name: {payeeName}
              </p>
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
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
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
                  className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-600"
                >
                  Cancel & Go Back
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

                    <button
                      type="button"
                      onClick={handleDownloadQrForGallery}
                      disabled={savingQr}
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
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

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-600"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProceedOrder()}
                    disabled={submittingOrder}
                    className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition"
                  >
                    {submittingOrder ? 'Verifying...' : 'I Have Paid'}
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
