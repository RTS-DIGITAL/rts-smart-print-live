/*
# Shop self-service settings, secure payment secrets and realtime orders

## Summary
Lets each shop owner manage their own profile, store status, payment gateway
keys, printer target and file retention from the admin panel. Adds realtime
order notifications and makes the order endpoint refuse orders while a shop is
closed.

## 1. Modified table: shops
- address (text): shown on the kiosk and counter stand.
- counter_notice (text): pickup instruction shown to customers.
- is_accepting_orders (boolean, default true): store open/closed switch.
- razorpay_key_id (text, nullable): public Razorpay key id used by checkout.
- razorpay_enabled (boolean, default false): turns Razorpay on for the kiosk.
- target_printer_name (text, default 'Brother DCP-T730DW series'): Windows printer name the agent targets.
- default_paper_tray (text, default 'A4'): default paper tray.
- retention_hours (integer, default 24): already present; ensured here.
- Seed row for rts-digital-seva is updated with the RTS Digital Seva details, or inserted if missing.

## 2. New private table: shop_payment_secrets
- Holds the Razorpay key secret per shop.
- RLS is enabled with no policies and no grants to anon or authenticated, so no browser can read it.
- Written only through save_razorpay_secret.

## 3. Functions
- save_razorpay_secret(shop id, secret): SECURITY DEFINER, owner only, executable by authenticated only.
- create_print_order: now rejects orders with 'shop_closed' when is_accepting_orders is false. All other checks are unchanged.

## 4. Security
- Authenticated owners may update the new shop columns; anon still has read-only access.
- Realtime publication includes print_orders so the admin queue receives live changes. Existing owner-only read policies still apply.

## Notes
1. The secret is stored but not used for checkout yet, since checkout needs only the public key id.
2. Retention is stored as a setting. The automatic file deletion job is not yet scheduled.
*/

ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS counter_notice text,
  ADD COLUMN IF NOT EXISTS is_accepting_orders boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS razorpay_key_id text,
  ADD COLUMN IF NOT EXISTS razorpay_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS target_printer_name text NOT NULL DEFAULT 'Brother DCP-T730DW series',
  ADD COLUMN IF NOT EXISTS default_paper_tray text NOT NULL DEFAULT 'A4',
  ADD COLUMN IF NOT EXISTS retention_hours integer NOT NULL DEFAULT 24;

UPDATE shops
SET name = 'RTS Digital Seva',
    email = 'info@rtsdigitalseva.online',
    phone = '7025916338',
    address = 'Cheruthazham / Payyanur, Kannur, Kerala',
    tagline = 'Scan • Upload • Pay • Print',
    counter_notice = 'Collect your prints at Counter 1',
    target_printer_name = 'Brother DCP-T730DW series'
WHERE slug = 'rts-digital-seva';

INSERT INTO shops (slug, name, tagline, email, phone, address, counter_notice, target_printer_name, retention_hours)
SELECT 'rts-digital-seva', 'RTS Digital Seva', 'Scan • Upload • Pay • Print', 'info@rtsdigitalseva.online',
       '7025916338', 'Cheruthazham / Payyanur, Kannur, Kerala', 'Collect your prints at Counter 1',
       'Brother DCP-T730DW series', 24
WHERE NOT EXISTS (SELECT 1 FROM shops WHERE slug = 'rts-digital-seva');

GRANT UPDATE (name, tagline, phone, email, is_active, retention_hours, address, counter_notice,
              is_accepting_orders, razorpay_key_id, razorpay_enabled, target_printer_name, default_paper_tray)
  ON shops TO authenticated;

CREATE TABLE IF NOT EXISTS shop_payment_secrets (
  shop_id uuid PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  razorpay_key_secret text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shop_payment_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON shop_payment_secrets FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.save_razorpay_secret(p_shop_id uuid, p_key_secret text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_shop_owner(p_shop_id) THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF p_key_secret IS NULL OR length(p_key_secret) < 8 OR length(p_key_secret) > 200 THEN
    RAISE EXCEPTION 'invalid_secret';
  END IF;
  INSERT INTO shop_payment_secrets (shop_id, razorpay_key_secret)
  VALUES (p_shop_id, p_key_secret)
  ON CONFLICT (shop_id) DO UPDATE
    SET razorpay_key_secret = excluded.razorpay_key_secret, updated_at = now();
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.save_razorpay_secret(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_razorpay_secret(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_print_order(p_shop_slug text, p_paper_size text, p_is_color boolean, p_is_double_sided boolean, p_copies integer, p_total_pages integer, p_customer_phone text, p_file_name text, p_mime_type text, p_file_size bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
v_shop shops%ROWTYPE;
v_rate numeric(10, 2);
v_total numeric(10, 2);
v_order_id uuid;
v_order_number text;
v_name text;
v_path text;
BEGIN
SELECT * INTO v_shop FROM shops WHERE slug = p_shop_slug AND is_active;
IF NOT FOUND THEN RAISE EXCEPTION 'shop_unavailable'; END IF;
IF NOT v_shop.is_accepting_orders THEN RAISE EXCEPTION 'shop_closed'; END IF;

IF p_copies IS NULL OR p_copies < 1 OR p_copies > 100 THEN RAISE EXCEPTION 'invalid_copies'; END IF;
IF p_total_pages IS NULL OR p_total_pages < 1 OR p_total_pages > 2000 THEN RAISE EXCEPTION 'invalid_page_count'; END IF;
IF p_mime_type NOT IN ('application/pdf', 'image/jpeg', 'image/png') THEN RAISE EXCEPTION 'invalid_file_type'; END IF;
IF p_mime_type <> 'application/pdf' AND p_total_pages <> 1 THEN RAISE EXCEPTION 'invalid_page_count'; END IF;
IF p_file_size IS NULL OR p_file_size < 1 OR p_file_size > 52428800 THEN RAISE EXCEPTION 'invalid_file_size'; END IF;
IF p_customer_phone IS NOT NULL AND p_customer_phone !~ '^\+?[0-9]{10,15}$' THEN RAISE EXCEPTION 'invalid_phone'; END IF;

SELECT price_per_page INTO v_rate FROM pricing_rules
WHERE shop_id = v_shop.id AND paper_size = p_paper_size
AND is_color = p_is_color AND is_double_sided = p_is_double_sided;
IF NOT FOUND THEN RAISE EXCEPTION 'pricing_unavailable'; END IF;

v_total := round(p_total_pages * p_copies * v_rate, 2);

INSERT INTO print_orders (shop_id, customer_phone, paper_size, is_color, is_double_sided,
total_pages, copies, total_amount)
VALUES (v_shop.id, p_customer_phone, p_paper_size, p_is_color, p_is_double_sided,
p_total_pages, p_copies, v_total)
RETURNING id, order_number INTO v_order_id, v_order_number;

v_name := left(regexp_replace(coalesce(nullif(p_file_name, ''), 'document'), '[^A-Za-z0-9._-]', '_', 'g'), 120);
v_path := v_order_id::text || '/' || v_name;

INSERT INTO uploaded_files (shop_id, order_id, storage_path, original_filename, mime_type, page_count, file_size_bytes)
VALUES (v_shop.id, v_order_id, v_path, left(coalesce(nullif(p_file_name, ''), 'document'), 200),
p_mime_type, p_total_pages, p_file_size);

RETURN jsonb_build_object(
'order_id', v_order_id,
'order_number', v_order_number,
'storage_path', v_path,
'total_amount', v_total
);
END;
$function$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'print_orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.print_orders;
  END IF;
END $$;
