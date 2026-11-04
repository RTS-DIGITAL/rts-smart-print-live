export type PaperSize = 'A4' | 'Letter' | 'Legal';
export type PrinterStatus = 'online' | 'offline';
export type OrderStatus = 'pending' | 'paid' | 'printing' | 'completed' | 'failed';
export type AdminOrderStatus = Exclude<OrderStatus, 'pending'>;
export type JobStatus = 'queued' | 'printing' | 'completed' | 'failed';
export type UploadMimeType = 'application/pdf' | 'image/jpeg' | 'image/png';

export interface Shop {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  retentionHours: number;
  address: string | null;
  counterNotice: string | null;
  isAcceptingOrders: boolean;
  razorpayEnabled: boolean;
  razorpayKeyId: string | null;
  targetPrinterName: string;
  defaultPaperTray: PaperSize;
}

export interface ShopSettingsInput {
  name: string;
  tagline: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  counterNotice: string | null;
  isAcceptingOrders: boolean;
  retentionHours: number;
  razorpayEnabled: boolean;
  razorpayKeyId: string | null;
  targetPrinterName: string;
  defaultPaperTray: PaperSize;
}

export interface Printer {
  id: string;
  shopId: string;
  systemName: string;
  displayName: string;
  status: PrinterStatus;
  supportedSizes: string[];
  supportsColor: boolean;
  supportsDuplex: boolean;
  lastHeartbeatAt: string | null;
}

export interface PricingRule {
  id: string;
  paperSize: PaperSize;
  isColor: boolean;
  isDoubleSided: boolean;
  pricePerPage: number;
}

export interface PrintSelection {
  paperSize: PaperSize;
  isColor: boolean;
  isDoubleSided: boolean;
  copies: number;
}

export interface KioskData {
  shop: Shop;
  printers: Printer[];
  pricing: PricingRule[];
}

export interface SubmitOrderInput {
  shopSlug: string;
  selection: PrintSelection;
  totalPages: number;
  customerPhone: string | null;
  file: File;
}

export interface CreatedOrder {
  orderId: string;
  orderNumber: string;
  storagePath: string;
  totalAmount: number;
}

export interface OrderReceipt {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  shopName: string;
  shopSlug: string;
  counterNotice: string | null;
  shopPhone: string | null;
  paperSize: PaperSize;
  isColor: boolean;
  isDoubleSided: boolean;
  copies: number;
  totalPages: number;
  totalAmount: number;
  fileName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerPhone: string | null;
  status: OrderStatus;
  paperSize: PaperSize;
  isColor: boolean;
  isDoubleSided: boolean;
  copies: number;
  totalPages: number;
  totalAmount: number;
  jobStatus: JobStatus | null;
  fileName: string | null;
  storagePath: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
}

export interface PartnerRegistrationInput {
  ownerName: string;
  businessName: string;
  slug: string;
  phone: string;
  address: string;
  printerBrand: string;
}

export interface PrintService {
  readonly mode: 'live' | 'demo';
  getKioskData(slug: string): Promise<KioskData | null>;
  createOrder(input: SubmitOrderInput): Promise<CreatedOrder>;
  uploadOrderFile(storagePath: string, file: File): Promise<void>;
  confirmPayment(orderId: string, amount: number, paymentReference: string): Promise<void>;
  getReceipt(orderId: string): Promise<OrderReceipt | null>;
  getUser(): Promise<AdminUser | null>;
  subscribeAuth(listener: (user: AdminUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  getOwnedShop(): Promise<Shop | null>;
  getAgentLastSeen(shopId: string): Promise<string | null>;
  registerShop(input: PartnerRegistrationInput): Promise<void>;
  getPairingCode(shopId: string): Promise<string | null>;
  claimShop(slug: string): Promise<boolean>;
  listQueue(shopId: string): Promise<AdminOrder[]>;
  updateOrderStatus(orderId: string, status: AdminOrderStatus): Promise<void>;
  getFileUrl(storagePath: string, downloadName?: string): Promise<string>;
  listPricing(shopId: string): Promise<PricingRule[]>;
  updatePrice(ruleId: string, pricePerPage: number): Promise<void>;
  listPrinters(shopId: string): Promise<Printer[]>;
  setPrinterStatus(printerId: string, status: PrinterStatus): Promise<void>;
  updateShopSettings(shopId: string, input: ShopSettingsInput): Promise<void>;
  saveRazorpaySecret(shopId: string, keySecret: string): Promise<void>;
  updatePrinterTarget(shopId: string, targetPrinterName: string, defaultPaperTray: PaperSize): Promise<void>;
  subscribeOrders(shopId: string, onChange: () => void): () => void;
}
