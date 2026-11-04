import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AdminOrder,
  CreatedOrder,
  JobStatus,
  OrderReceipt,
  OrderStatus,
  PaperSize,
  PricingRule,
  Printer,
  PrintService,
  PrinterStatus,
  Shop,
} from '@/lib/types';
import type {
  Database,
  Json,
  PricingRuleRow,
  PrinterRow,
  PrintJobRow,
  PrintOrderRow,
  ShopRow,
  UploadedFileRow,
} from '@/lib/supabase';

type Client = SupabaseClient<Database>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toShop = (row: ShopRow): Shop => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  tagline: row.tagline,
  phone: row.phone,
  email: row.email,
  isActive: row.is_active,
  retentionHours: row.retention_hours,
  address: row.address,
  counterNotice: row.counter_notice,
  isAcceptingOrders: row.is_accepting_orders,
  razorpayEnabled: row.razorpay_enabled,
  razorpayKeyId: row.razorpay_key_id,
  targetPrinterName: row.target_printer_name,
  defaultPaperTray: row.default_paper_tray as PaperSize,
});

const toPrinter = (row: PrinterRow): Printer => ({
  id: row.id,
  shopId: row.shop_id,
  systemName: row.system_name,
  displayName: row.display_name,
  status: row.status,
  supportedSizes: row.supported_sizes,
  supportsColor: row.supports_color,
  supportsDuplex: row.supports_duplex,
  lastHeartbeatAt: row.last_heartbeat_at,
});

const toPricing = (row: PricingRuleRow): PricingRule => ({
  id: row.id,
  paperSize: row.paper_size as PaperSize,
  isColor: row.is_color,
  isDoubleSided: row.is_double_sided,
  pricePerPage: Number(row.price_per_page),
});

function parseCreatedOrder(data: Json): CreatedOrder {
  if (
    !isRecord(data) ||
    typeof data.order_id !== 'string' ||
    typeof data.order_number !== 'string' ||
    typeof data.storage_path !== 'string' ||
    typeof data.total_amount !== 'number'
  ) {
    throw new Error('Unexpected response from the server.');
  }
  return {
    orderId: data.order_id,
    orderNumber: data.order_number,
    storagePath: data.storage_path,
    totalAmount: data.total_amount,
  };
}

function parseReceipt(data: Json): OrderReceipt | null {
  if (!isRecord(data) || typeof data.order_id !== 'string') return null;
  return {
    orderId: data.order_id,
    orderNumber: String(data.order_number),
    status: data.status as OrderStatus,
    shopName: String(data.shop_name),
    shopSlug: String(data.shop_slug),
    counterNotice: null,
    shopPhone: null,
    paperSize: data.paper_size as PaperSize,
    isColor: Boolean(data.is_color),
    isDoubleSided: Boolean(data.is_double_sided),
    copies: Number(data.copies),
    totalPages: Number(data.total_pages),
    totalAmount: Number(data.total_amount),
    fileName: typeof data.file_name === 'string' ? data.file_name : null,
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  };
}

export function createLiveService(client: Client): PrintService {
  return {
    mode: 'live',

    async getKioskData(slug) {
      const { data: shop, error } = await client
        .from('shops')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      if (!shop) return null;

      const [printers, pricing] = await Promise.all([
        client.from('printers').select('*').eq('shop_id', shop.id),
        client.from('pricing_rules').select('*').eq('shop_id', shop.id),
      ]);
      if (printers.error) throw printers.error;
      if (pricing.error) throw pricing.error;

      return {
        shop: toShop(shop),
        printers: (printers.data ?? []).map(toPrinter),
        pricing: (pricing.data ?? []).map(toPricing),
      };
    },

    async createOrder(input) {
      const { data, error } = await client.rpc('create_print_order', {
        p_shop_slug: input.shopSlug,
        p_paper_size: input.selection.paperSize,
        p_is_color: input.selection.isColor,
        p_is_double_sided: input.selection.isDoubleSided,
        p_copies: input.selection.copies,
        p_total_pages: input.totalPages,
        p_customer_phone: input.customerPhone,
        p_file_name: input.file.name,
        p_mime_type: input.file.type,
        p_file_size: input.file.size,
      });
      if (error) throw error;
      return parseCreatedOrder(data);
    },

    async uploadOrderFile(storagePath, file) {
      const { error } = await client.storage
        .from('print-files')
        .upload(storagePath, file, { contentType: file.type, upsert: false });
      if (error) throw error;
    },

    async confirmPayment(orderId, amount, paymentReference) {
      const { error } = await client.rpc('mark_order_paid', {
        p_order_id: orderId,
        p_amount: amount,
        p_payment_reference: paymentReference,
      });
      if (error) throw error;
    },

    async getReceipt(orderId) {
      const { data, error } = await client.rpc('get_order_public', { p_order_id: orderId });
      if (error) throw error;
      const receipt = data ? parseReceipt(data) : null;
      if (!receipt) return null;
      const { data: shop, error: shopError } = await client
        .from('shops')
        .select('counter_notice, phone')
        .eq('slug', receipt.shopSlug)
        .maybeSingle();
      if (shopError) throw shopError;
      return { ...receipt, counterNotice: shop?.counter_notice ?? null, shopPhone: shop?.phone ?? null };
    },

    async getUser() {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      const user = data.session?.user;
      return user ? { id: user.id, email: user.email ?? '' } : null;
    },

    subscribeAuth(listener) {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        const user = session?.user;
        listener(user ? { id: user.id, email: user.email ?? '' } : null);
      });
      return () => data.subscription.unsubscribe();
    },

    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },

    async signUp(email, password) {
      const { error } = await client.auth.signUp({ email, password });
      if (error) throw error;
    },

    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },

    async registerShop(input) {
      const { error } = await client.rpc('register_shop', {
        p_owner_name: input.ownerName,
        p_business_name: input.businessName,
        p_slug: input.slug,
        p_phone: input.phone,
        p_address: input.address,
        p_printer_brand: input.printerBrand,
      });
      if (error) throw error;
    },

    async getAgentLastSeen(shopId) {
      const { data, error } = await client
        .from('shops')
        .select('agent_last_seen')
        .eq('id', shopId)
        .maybeSingle();
      if (error) throw error;
      return data?.agent_last_seen ?? null;
    },

    async getPairingCode(shopId) {
      const { data, error } = await client
        .from('shop_connector_keys')
        .select('pairing_code')
        .eq('shop_id', shopId)
        .maybeSingle();
      if (error) throw error;
      return data?.pairing_code ?? null;
    },

    async getOwnedShop() {
      const { data: session } = await client.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) return null;
      const { data, error } = await client
        .from('shops')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? toShop(data) : null;
    },

    async claimShop(slug) {
      const { data, error } = await client.rpc('claim_shop', { p_slug: slug });
      if (error) throw error;
      return data === true;
    },

    async listQueue(shopId) {
      const { data: orders, error } = await client
        .from('print_orders')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(150);
      if (error) throw error;
      const rows: PrintOrderRow[] = orders ?? [];
      if (rows.length === 0) return [];
      const orderIds = rows.map((row) => row.id);

      const [files, jobs] = await Promise.all([
        client.from('uploaded_files').select('*').in('order_id', orderIds),
        client.from('print_jobs').select('*').in('order_id', orderIds),
      ]);
      if (files.error) throw files.error;
      if (jobs.error) throw jobs.error;

      const fileByOrder = new Map<string, UploadedFileRow>();
      (files.data ?? []).forEach((file) => fileByOrder.set(file.order_id, file));
      const jobByOrder = new Map<string, PrintJobRow>();
      (jobs.data ?? []).forEach((job) => jobByOrder.set(job.order_id, job));

      return rows.map((row): AdminOrder => {
        const file = fileByOrder.get(row.id);
        const job = jobByOrder.get(row.id);
        return {
          id: row.id,
          orderNumber: row.order_number,
          customerPhone: row.customer_phone,
          status: row.status as OrderStatus,
          paperSize: row.paper_size as PaperSize,
          isColor: row.is_color,
          isDoubleSided: row.is_double_sided,
          copies: row.copies,
          totalPages: row.total_pages,
          totalAmount: Number(row.total_amount),
          jobStatus: (job?.status as JobStatus | undefined) ?? null,
          fileName: file?.original_filename ?? null,
          storagePath: file?.storage_path ?? null,
          createdAt: row.created_at,
          paidAt: row.paid_at,
        };
      });
    },

    async updateOrderStatus(orderId, status) {
      const { error } = await client.rpc('admin_update_order_status', {
        p_order_id: orderId,
        p_status: status,
      });
      if (error) throw error;
    },

    async getFileUrl(storagePath, downloadName) {
      const { data, error } = await client.storage
        .from('print-files')
        .createSignedUrl(storagePath, 300, downloadName ? { download: downloadName } : undefined);
      if (error) throw error;
      return data.signedUrl;
    },

    async listPricing(shopId) {
      const { data, error } = await client.from('pricing_rules').select('*').eq('shop_id', shopId);
      if (error) throw error;
      return (data ?? []).map(toPricing);
    },

    async updatePrice(ruleId, pricePerPage) {
      const { error } = await client
        .from('pricing_rules')
        .update({ price_per_page: pricePerPage })
        .eq('id', ruleId);
      if (error) throw error;
    },

    async listPrinters(shopId) {
      const { data, error } = await client
        .from('printers')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at');
      if (error) throw error;
      return (data ?? []).map(toPrinter);
    },

    async setPrinterStatus(printerId, status: PrinterStatus) {
      const { error } = await client
        .from('printers')
        .update({ status, last_heartbeat_at: new Date().toISOString() })
        .eq('id', printerId);
      if (error) throw error;
    },

    async updateShopSettings(shopId, input) {
      const { error } = await client
        .from('shops')
        .update({
          name: input.name,
          tagline: input.tagline,
          phone: input.phone,
          email: input.email,
          address: input.address,
          counter_notice: input.counterNotice,
          is_accepting_orders: input.isAcceptingOrders,
          retention_hours: input.retentionHours,
          razorpay_enabled: input.razorpayEnabled,
          razorpay_key_id: input.razorpayKeyId,
          target_printer_name: input.targetPrinterName,
          default_paper_tray: input.defaultPaperTray,
        })
        .eq('id', shopId);
      if (error) throw error;
    },

    async saveRazorpaySecret(shopId, keySecret) {
      const { error } = await client.rpc('save_razorpay_secret', {
        p_shop_id: shopId,
        p_key_secret: keySecret,
      });
      if (error) throw error;
    },

    async updatePrinterTarget(shopId, targetPrinterName, defaultPaperTray) {
      const { error } = await client
        .from('shops')
        .update({ target_printer_name: targetPrinterName, default_paper_tray: defaultPaperTray })
        .eq('id', shopId);
      if (error) throw error;
    },

    subscribeOrders(shopId, onChange) {
      const channel = client
        .channel(`print_orders:${shopId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'print_orders', filter: `shop_id=eq.${shopId}` },
          () => onChange(),
        )
        .subscribe();
      return () => {
        void client.removeChannel(channel);
      };
    },
  };
}
