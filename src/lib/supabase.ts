import { createClient } from '@supabase/supabase-js';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type ShopRow = {
  id: string;
  owner_id: string | null;
  slug: string;
  name: string;
  tagline: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  retention_hours: number;
  address: string | null;
  counter_notice: string | null;
  agent_last_seen: string | null;
  is_accepting_orders: boolean;
  razorpay_key_id: string | null;
  razorpay_enabled: boolean;
  target_printer_name: string;
  default_paper_tray: string;
  created_at: string;
};

export type PrinterRow = {
  id: string;
  shop_id: string;
  system_name: string;
  display_name: string;
  status: 'online' | 'offline';
  supported_sizes: string[];
  supports_color: boolean;
  supports_duplex: boolean;
  last_heartbeat_at: string | null;
  created_at: string;
}

export type PricingRuleRow = {
  id: string;
  shop_id: string;
  paper_size: string;
  is_color: boolean;
  is_double_sided: boolean;
  price_per_page: number;
}

export type PrintOrderRow = {
  id: string;
  shop_id: string;
  order_number: string;
  customer_phone: string | null;
  paper_size: string;
  is_color: boolean;
  is_double_sided: boolean;
  total_pages: number;
  copies: number;
  total_amount: number;
  status: string;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export type UploadedFileRow = {
  id: string;
  shop_id: string;
  order_id: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  page_count: number;
  file_size_bytes: number;
  created_at: string;
}

export type PrintJobRow = {
  id: string;
  shop_id: string;
  order_id: string;
  file_id: string;
  printer_id: string | null;
  status: string;
  copies: number;
  created_at: string;
  updated_at: string;
}

export type ShopConnectorKeyRow = {
  shop_id: string;
  pairing_code: string;
  created_at: string;
}

type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      shops: TableDef<ShopRow>;
      printers: TableDef<PrinterRow>;
      pricing_rules: TableDef<PricingRuleRow>;
      print_orders: TableDef<PrintOrderRow>;
      uploaded_files: TableDef<UploadedFileRow>;
      print_jobs: TableDef<PrintJobRow>;
      shop_connector_keys: TableDef<ShopConnectorKeyRow>;
    };
    Views: Record<string, never>;
    Functions: {
      create_print_order: {
        Args: {
          p_shop_slug: string;
          p_paper_size: string;
          p_is_color: boolean;
          p_is_double_sided: boolean;
          p_copies: number;
          p_total_pages: number;
          p_customer_phone: string | null;
          p_file_name: string;
          p_mime_type: string;
          p_file_size: number;
        };
        Returns: Json;
      };
      mark_order_paid: {
        Args: { p_order_id: string; p_amount: number; p_payment_reference: string };
        Returns: undefined;
      };
      get_order_public: {
        Args: { p_order_id: string };
        Returns: Json;
      };
      claim_shop: {
        Args: { p_slug: string };
        Returns: boolean;
      };
      save_razorpay_secret: {
        Args: { p_shop_id: string; p_key_secret: string };
        Returns: undefined;
      };
      register_shop: {
        Args: {
          p_owner_name: string;
          p_business_name: string;
          p_slug: string;
          p_phone: string;
          p_address: string;
          p_printer_brand: string;
        };
        Returns: string;
      };
      admin_update_order_status: {
        Args: { p_order_id: string; p_status: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient<Database>(supabaseUrl, supabaseAnonKey) : null;
