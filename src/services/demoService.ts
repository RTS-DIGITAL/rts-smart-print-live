import type {
  AdminOrder,
  AdminOrderStatus,
  AdminUser,
  CreatedOrder,
  KioskData,
  OrderReceipt,
  PricingRule,
  Printer,
  PrintService,
  PrinterStatus,
  Shop,
  SubmitOrderInput,
} from '@/lib/types';
import { DEFAULT_SHOP_SLUG, calculateTotal, findRule } from '@/lib/pricing';

interface DemoOrder extends AdminOrder {
  updatedAt: string;
}

const PRINT_START_MS = 4000;
const PRINT_DONE_MS = 12000;

const demoShop: Shop = {
  id: 'demo-shop',
  slug: DEFAULT_SHOP_SLUG,
  name: 'RTS Digital Seva',
  tagline: 'Scan • Upload • Pay • Print',
  phone: '7025916338',
  email: 'info@rtsdigitalseva.online',
  isActive: true,
  retentionHours: 24,
  address: 'Cheruthazham / Payyanur, Kannur, Kerala',
  counterNotice: 'Collect your prints at Counter 1',
  isAcceptingOrders: true,
  razorpayEnabled: false,
  razorpayKeyId: null,
  targetPrinterName: 'Brother DCP-T730DW series',
  defaultPaperTray: 'A4',
};

const demoPricing = (): PricingRule[] => [
  { id: 'demo-rule-bw-simplex', paperSize: 'A4', isColor: false, isDoubleSided: false, pricePerPage: 2 },
  { id: 'demo-rule-color-simplex', paperSize: 'A4', isColor: true, isDoubleSided: false, pricePerPage: 10 },
  { id: 'demo-rule-bw-duplex', paperSize: 'A4', isColor: false, isDoubleSided: true, pricePerPage: 3 },
  { id: 'demo-rule-color-duplex', paperSize: 'A4', isColor: true, isDoubleSided: true, pricePerPage: 18 },
];

// In-memory store used when the database is not connected. Data resets on reload.
const store = {
  shop: demoShop,
  printers: [
    {
      id: 'demo-printer',
      shopId: demoShop.id,
      systemName: 'RTS-COUNTER-01',
      displayName: 'Front Counter Printer',
      status: 'online' as PrinterStatus,
      supportedSizes: ['A4', 'Letter', 'Legal'],
      supportsColor: true,
      supportsDuplex: true,
      lastHeartbeatAt: new Date().toISOString(),
    },
  ] as Printer[],
  pricing: demoPricing(),
  orders: [] as DemoOrder[],
  user: null as AdminUser | null,
  listeners: new Set<(user: AdminUser | null) => void>(),
};

function advanceOrder(order: DemoOrder): DemoOrder {
  if (order.status !== 'paid' && order.status !== 'printing') return order;
  if (!order.paidAt) return order;
  const elapsed = Date.now() - Date.parse(order.paidAt);
  if (elapsed >= PRINT_DONE_MS) {
    return { ...order, status: 'completed', jobStatus: 'completed', updatedAt: new Date().toISOString() };
  }
  if (elapsed >= PRINT_START_MS && order.status === 'paid') {
    return { ...order, status: 'printing', jobStatus: 'printing', updatedAt: new Date().toISOString() };
  }
  return order;
}

function advanceAll(): void {
  store.orders = store.orders.map(advanceOrder);
}

function toReceipt(order: DemoOrder): OrderReceipt {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    shopName: store.shop.name,
    shopSlug: store.shop.slug,
    counterNotice: store.shop.counterNotice,
    shopPhone: store.shop.phone,
    paperSize: order.paperSize,
    isColor: order.isColor,
    isDoubleSided: order.isDoubleSided,
    copies: order.copies,
    totalPages: order.totalPages,
    totalAmount: order.totalAmount,
    fileName: order.fileName,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function notifyAuth(): void {
  store.listeners.forEach((listener) => listener(store.user));
}

function findOrder(orderId: string): DemoOrder {
  const order = store.orders.find((item) => item.id === orderId);
  if (!order) throw new Error('order_not_found');
  return order;
}

export const demoService: PrintService = {
  mode: 'demo',

  async getKioskData(slug): Promise<KioskData | null> {
    if (slug !== store.shop.slug) return null;
    return { shop: store.shop, printers: store.printers, pricing: store.pricing };
  },

  async createOrder(input: SubmitOrderInput): Promise<CreatedOrder> {
    const rule = findRule(store.pricing, input.selection);
    if (!rule) throw new Error('pricing_unavailable');
    const orderId = crypto.randomUUID();
    const orderNumber = `RTS-${orderId.slice(0, 8).toUpperCase()}`;
    const totalAmount = calculateTotal(input.totalPages, input.selection.copies, rule.pricePerPage);
    const now = new Date().toISOString();
    const order: DemoOrder = {
      id: orderId,
      orderNumber,
      customerPhone: input.customerPhone,
      status: 'pending',
      paperSize: input.selection.paperSize,
      isColor: input.selection.isColor,
      isDoubleSided: input.selection.isDoubleSided,
      copies: input.selection.copies,
      totalPages: input.totalPages,
      totalAmount,
      jobStatus: null,
      fileName: input.file.name,
      storagePath: `${orderId}/${input.file.name}`,
      createdAt: now,
      paidAt: null,
      updatedAt: now,
    };
    store.orders = [order, ...store.orders];
    return { orderId, orderNumber, storagePath: `${orderId}/${input.file.name}`, totalAmount };
  },

  async uploadOrderFile() {
    // Files are not kept in demo mode.
  },

  async confirmPayment(orderId, amount) {
    const order = findOrder(orderId);
    if (order.status !== 'pending') return;
    if (Math.abs(order.totalAmount - amount) > 0.001) throw new Error('amount_mismatch');
    const now = new Date().toISOString();
    Object.assign(order, { status: 'paid', jobStatus: 'queued', paidAt: now, updatedAt: now });
  },

  async getReceipt(orderId) {
    advanceAll();
    const order = store.orders.find((item) => item.id === orderId);
    return order ? toReceipt(order) : null;
  },

  async getUser() {
    return store.user;
  },

  subscribeAuth(listener) {
    store.listeners.add(listener);
    return () => {
      store.listeners.delete(listener);
    };
  },

  async signIn(email) {
    store.user = { id: 'demo-admin', email };
    notifyAuth();
  },

  async signUp(email) {
    store.user = { id: 'demo-admin', email };
    notifyAuth();
  },

  async signOut() {
    store.user = null;
    notifyAuth();
  },

  async getOwnedShop() {
    return store.shop;
  },

  async claimShop() {
    return true;
  },

  async registerShop() {
    throw new Error('Shop registration needs the live database. It is not available in preview mode.');
  },

  async getPairingCode() {
    return '842913';
  },

  async getAgentLastSeen() {
    return null;
  },

  async listQueue() {
    advanceAll();
    return [...store.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async updateOrderStatus(orderId, status: AdminOrderStatus) {
    const order = findOrder(orderId);
    if (order.status === 'pending') throw new Error('order_not_paid');
    Object.assign(order, {
      status,
      jobStatus: status === 'paid' ? 'queued' : status,
      updatedAt: new Date().toISOString(),
    });
  },

  async getFileUrl() {
    throw new Error('File preview is only available when the shop database is connected.');
  },

  async listPricing() {
    return store.pricing;
  },

  async updatePrice(ruleId, pricePerPage) {
    store.pricing = store.pricing.map((rule) =>
      rule.id === ruleId ? { ...rule, pricePerPage } : rule,
    );
  },

  async listPrinters() {
    return store.printers;
  },

  async setPrinterStatus(printerId, status) {
    store.printers = store.printers.map((printer) =>
      printer.id === printerId
        ? { ...printer, status, lastHeartbeatAt: new Date().toISOString() }
        : printer,
    );
  },

  async updateShopSettings(_shopId, input) {
    store.shop = { ...store.shop, ...input };
  },

  async saveRazorpaySecret() {
    // Demo mode keeps no secrets.
  },

  async updatePrinterTarget(_shopId, targetPrinterName, defaultPaperTray) {
    store.shop = { ...store.shop, targetPrinterName, defaultPaperTray };
  },

  subscribeOrders() {
    return () => undefined;
  },
};
