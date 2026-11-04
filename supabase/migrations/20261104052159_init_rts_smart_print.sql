/*
# RTS Smart Print - initial schema, security and seed data

Plain-English summary
This migration creates everything the self-service printing kiosk and the shop admin dashboard need: shops, printers, per-page pricing, print orders, uploaded files, print jobs and payment records. It also creates the file storage buckets for customer documents and shop assets, and the server-side functions that create orders, confirm payments and let shop owners manage their queue.

1. New Tables
- `shops`: one row per print shop (slug, name, tagline, UPI details, QR image, file retention hours, accepting-orders switch). `owner_id` links the shop to its admin account.
- `printers`: printers registered to a shop, with an enabled flag and a last heartbeat timestamp used to show online or offline status.
- `pricing_rules`: price per printed sheet for each paper size, colour mode and sides combination.
- `print_orders`: a customer order (phone, print options, copies, page count, sheet count, total, status, payment status).
- `uploaded_files`: the customer document attached to an order and where it is stored.
- `print_jobs`: the printing lifecycle record for each paid order (status, attempts, timestamps).
- `payment_transactions`: a record of each payment captured for an order.

2. Modified Tables
- None (all tables are new).

3. Storage
- `print-files` bucket (private, 50 MB, PDF/JPEG/PNG) for customer documents.
- `shop-assets` bucket (public read, 5 MB, images) for shop QR images.

4. Functions
- `is_shop_owner`, `is_pending_print_upload`, `can_read_print_file`, `owns_shop_asset`: access helpers used by policies.
- `create_print_order`: validates the request, prices it from the shop's rules and creates the order and file record.
- `mark_order_paid`: confirms payment against the order total and queues the print job.
- `get_order_public`: returns the status of a single order by its id for the receipt page.
- `claim_shop`: lets a signed-in admin claim an unowned shop.
- `admin_set_order_status` and `admin_requeue_order`: shop owners move orders through the printing lifecycle.

5. Security
- RLS is enabled on every table.
- Anonymous kiosk visitors can read shops, printers and pricing only. They cannot read orders, files or payments directly.
- Shop owners can read and manage only their own shop's data.
- Customers create orders only through `create_print_order`, which computes prices on the server.
- Uploads are only accepted for a freshly created, unpaid order, and files cannot be overwritten.

6. Important Notes
- 6.1 Prices are per printed sheet. A duplex sheet carries two pages, so a 4-page duplex order uses 2 sheets.
- 6.2 `mark_order_paid` trusts the payment confirmation sent by the kiosk. Before accepting real Razorpay payments, it must be replaced with a server-verified payment webhook or edge function.
- 6.3 Seed data creates the `rts-digital-seva` shop with four pricing rules per paper size and one printer. The shop is unowned until an admin claims it.
*/

CREATE TABLE IF NOT EXISTS shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  name text NOT NULL,
  tagline text NOT NULL DEFAULT 'Scan • Upload • Pay • Print',
  upi_id text,
  upi_qr_url text,
  file_retention_hours integer NOT NULL DEFAULT 24 CHECK (file_retention_hours BETWEEN 1 AND 720),
  is_accepting_orders boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS printers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name text NOT NULL,
  model text,
  is_enabled boolean NOT NULL DEFAULT true,
  last_heartbeat_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS printers_shop_id_idx ON printers (shop_id);

CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  paper_size text NOT NULL CHECK (paper_size IN ('A4', 'Letter', 'Legal')),
  color_mode text NOT NULL CHECK (color_mode IN ('bw', 'color')),
  sides text NOT NULL CHECK (sides IN ('simplex', 'duplex')),
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  UNIQUE (shop_id, paper_size, color_mode, sides)
);

CREATE TABLE IF NOT EXISTS print_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_phone text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'queued', 'spooling', 'printing', 'completed', 'failed')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed')),
  paper_size text NOT NULL CHECK (paper_size IN ('A4', 'Letter', 'Legal')),
  color_mode text NOT NULL CHECK (color_mode IN ('bw', 'color')),
  sides text NOT NULL CHECK (sides IN ('simplex', 'duplex')),
  copies integer NOT NULL CHECK (copies BETWEEN 1 AND 100),
  page_count integer NOT NULL CHECK (page_count BETWEEN 1 AND 2000),
  sheet_count integer NOT NULL CHECK (sheet_count >= 1),
  rate_per_sheet numeric(10, 2) NOT NULL CHECK (rate_per_sheet >= 0),
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS print_orders_shop_created_idx ON print_orders (shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS print_orders_status_idx ON print_orders (status);

CREATE TABLE IF NOT EXISTS uploaded_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES print_orders(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  page_count integer NOT NULL CHECK (page_count >= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS uploaded_files_order_idx ON uploaded_files (order_id);

CREATE TABLE IF NOT EXISTS print_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES print_orders(id) ON DELETE CASCADE,
  printer_id uuid REFERENCES printers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'spooling', 'printing', 'completed', 'failed')),
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts >= 1),
  queued_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES print_orders(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'razorpay',
  mode text NOT NULL CHECK (mode IN ('live', 'mock')),
  provider_order_id text,
  provider_payment_id text,
  amount numeric(10, 2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'captured' CHECK (status IN ('captured', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payment_transactions_order_idx ON payment_transactions (order_id);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_shop_owner(p_shop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM shops s WHERE s.id = p_shop_id AND s.owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_pending_print_upload(p_path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM uploaded_files uf
    JOIN print_orders o ON o.id = uf.order_id
    WHERE uf.storage_path = p_path
      AND o.status = 'pending'
      AND o.payment_status = 'unpaid'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_read_print_file(p_path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM uploaded_files uf
    JOIN print_orders o ON o.id = uf.order_id
    WHERE uf.storage_path = p_path
      AND public.is_shop_owner(o.shop_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_shop_asset(p_path text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM shops s
    WHERE s.id::text = split_part(p_path, '/', 1)
      AND s.owner_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_shop_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_shop_owner(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_pending_print_upload(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_pending_print_upload(text) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_read_print_file(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_print_file(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.owns_shop_asset(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_shop_asset(text) TO authenticated;

GRANT SELECT ON shops TO anon, authenticated;
GRANT UPDATE (name, tagline, upi_id, upi_qr_url, file_retention_hours, is_accepting_orders, updated_at) ON shops TO authenticated;

GRANT SELECT ON printers TO anon, authenticated;
GRANT INSERT (shop_id, name, model, is_enabled, last_heartbeat_at), UPDATE (name, model, is_enabled, last_heartbeat_at), DELETE ON printers TO authenticated;

GRANT SELECT ON pricing_rules TO anon, authenticated;
GRANT UPDATE (price) ON pricing_rules TO authenticated;

GRANT SELECT ON print_orders TO authenticated;
GRANT SELECT ON uploaded_files TO authenticated;
GRANT SELECT ON print_jobs TO authenticated;
GRANT SELECT ON payment_transactions TO authenticated;

DROP POLICY IF EXISTS "anyone_read_shops" ON shops;
CREATE POLICY "anyone_read_shops" ON shops FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owners_update_shop" ON shops;
CREATE POLICY "owners_update_shop" ON shops FOR UPDATE
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "anyone_read_printers" ON printers;
CREATE POLICY "anyone_read_printers" ON printers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owners_insert_printers" ON printers;
CREATE POLICY "owners_insert_printers" ON printers FOR INSERT
  TO authenticated WITH CHECK (public.is_shop_owner(shop_id));

DROP POLICY IF EXISTS "owners_update_printers" ON printers;
CREATE POLICY "owners_update_printers" ON printers FOR UPDATE
  TO authenticated USING (public.is_shop_owner(shop_id)) WITH CHECK (public.is_shop_owner(shop_id));

DROP POLICY IF EXISTS "owners_delete_printers" ON printers;
CREATE POLICY "owners_delete_printers" ON printers FOR DELETE
  TO authenticated USING (public.is_shop_owner(shop_id));

DROP POLICY IF EXISTS "anyone_read_pricing" ON pricing_rules;
CREATE POLICY "anyone_read_pricing" ON pricing_rules FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owners_update_pricing" ON pricing_rules;
CREATE POLICY "owners_update_pricing" ON pricing_rules FOR UPDATE
  TO authenticated USING (public.is_shop_owner(shop_id)) WITH CHECK (public.is_shop_owner(shop_id));

DROP POLICY IF EXISTS "owners_read_orders" ON print_orders;
CREATE POLICY "owners_read_orders" ON print_orders FOR SELECT
  TO authenticated USING (public.is_shop_owner(shop_id));

DROP POLICY IF EXISTS "owners_read_uploaded_files" ON uploaded_files;
CREATE POLICY "owners_read_uploaded_files" ON uploaded_files FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM print_orders o WHERE o.id = uploaded_files.order_id AND public.is_shop_owner(o.shop_id))
  );

DROP POLICY IF EXISTS "owners_read_print_jobs" ON print_jobs;
CREATE POLICY "owners_read_print_jobs" ON print_jobs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM print_orders o WHERE o.id = print_jobs.order_id AND public.is_shop_owner(o.shop_id))
  );

DROP POLICY IF EXISTS "owners_read_payments" ON payment_transactions;
CREATE POLICY "owners_read_payments" ON payment_transactions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM print_orders o WHERE o.id = payment_transactions.order_id AND public.is_shop_owner(o.shop_id))
  );

CREATE OR REPLACE FUNCTION public.create_print_order(
  p_shop_slug text,
  p_paper_size text,
  p_color_mode text,
  p_sides text,
  p_copies integer,
  p_page_count integer,
  p_customer_phone text,
  p_file_name text,
  p_mime_type text,
  p_size_bytes bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop shops%ROWTYPE;
  v_rate numeric(10, 2);
  v_sheets integer;
  v_total numeric(10, 2);
  v_order_id uuid;
  v_name text;
  v_path text;
BEGIN
  SELECT * INTO v_shop FROM shops WHERE slug = p_shop_slug AND is_accepting_orders;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'shop_unavailable';
  END IF;

  IF p_copies IS NULL OR p_copies < 1 OR p_copies > 100 THEN
    RAISE EXCEPTION 'invalid_copies';
  END IF;

  IF p_page_count IS NULL OR p_page_count < 1 OR p_page_count > 2000 THEN
    RAISE EXCEPTION 'invalid_page_count';
  END IF;

  IF p_mime_type NOT IN ('application/pdf', 'image/jpeg', 'image/png') THEN
    RAISE EXCEPTION 'invalid_file_type';
  END IF;

  IF p_mime_type <> 'application/pdf' AND p_page_count <> 1 THEN
    RAISE EXCEPTION 'invalid_page_count';
  END IF;

  IF p_size_bytes IS NULL OR p_size_bytes < 1 OR p_size_bytes > 52428800 THEN
    RAISE EXCEPTION 'invalid_file_size';
  END IF;

  IF p_customer_phone IS NOT NULL AND p_customer_phone !~ '^\+?[0-9]{10,15}$' THEN
    RAISE EXCEPTION 'invalid_phone';
  END IF;

  SELECT price INTO v_rate
  FROM pricing_rules
  WHERE shop_id = v_shop.id
    AND paper_size = p_paper_size
    AND color_mode = p_color_mode
    AND sides = p_sides;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pricing_unavailable';
  END IF;

  v_sheets := CASE WHEN p_sides = 'duplex' THEN ceil(p_page_count / 2.0)::integer ELSE p_page_count END;
  v_total := round(v_sheets * p_copies * v_rate, 2);

  INSERT INTO print_orders (
    shop_id, customer_phone, paper_size, color_mode, sides, copies,
    page_count, sheet_count, rate_per_sheet, total_amount
  )
  VALUES (
    v_shop.id, p_customer_phone, p_paper_size, p_color_mode, p_sides, p_copies,
    p_page_count, v_sheets, v_rate, v_total
  )
  RETURNING id INTO v_order_id;

  v_name := regexp_replace(coalesce(nullif(p_file_name, ''), 'document'), '[^A-Za-z0-9._-]', '_', 'g');
  v_name := left(v_name, 120);
  v_path := v_order_id::text || '/' || v_name;

  INSERT INTO uploaded_files (order_id, storage_path, file_name, mime_type, size_bytes, page_count)
  VALUES (v_order_id, v_path, left(coalesce(nullif(p_file_name, ''), 'document'), 200), p_mime_type, p_size_bytes, p_page_count);

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'storage_path', v_path,
    'total_amount', v_total
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_order_paid(
  p_order_id uuid,
  p_amount numeric,
  p_mode text,
  p_provider_order_id text,
  p_provider_payment_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order print_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM print_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF v_order.payment_status = 'paid' THEN
    RETURN;
  END IF;

  IF p_amount IS DISTINCT FROM v_order.total_amount THEN
    RAISE EXCEPTION 'amount_mismatch';
  END IF;

  UPDATE print_orders
  SET status = 'paid', payment_status = 'paid', updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO payment_transactions (order_id, mode, provider_order_id, provider_payment_id, amount, status)
  VALUES (p_order_id, p_mode, p_provider_order_id, p_provider_payment_id, p_amount, 'captured');

  INSERT INTO print_jobs (order_id, status, attempts, queued_at)
  VALUES (p_order_id, 'queued', 1, now());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_order_public(p_order_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'order_id', o.id,
    'status', o.status,
    'payment_status', o.payment_status,
    'shop_name', s.name,
    'shop_slug', s.slug,
    'paper_size', o.paper_size,
    'color_mode', o.color_mode,
    'sides', o.sides,
    'copies', o.copies,
    'page_count', o.page_count,
    'sheet_count', o.sheet_count,
    'total_amount', o.total_amount,
    'file_name', (SELECT uf.file_name FROM uploaded_files uf WHERE uf.order_id = o.id LIMIT 1),
    'created_at', o.created_at,
    'updated_at', o.updated_at
  )
  FROM print_orders o
  JOIN shops s ON s.id = o.shop_id
  WHERE o.id = p_order_id;
$$;

CREATE OR REPLACE FUNCTION public.claim_shop(p_slug text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  UPDATE shops
  SET owner_id = auth.uid(), updated_at = now()
  WHERE slug = p_slug AND owner_id IS NULL;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_order_status(p_order_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order print_orders%ROWTYPE;
BEGIN
  IF p_status NOT IN ('queued', 'spooling', 'printing', 'completed', 'failed') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  SELECT * INTO v_order FROM print_orders WHERE id = p_order_id;
  IF NOT FOUND OR NOT public.is_shop_owner(v_order.shop_id) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF v_order.payment_status <> 'paid' THEN
    RAISE EXCEPTION 'order_not_paid';
  END IF;

  UPDATE print_orders SET status = p_status, updated_at = now() WHERE id = p_order_id;

  UPDATE print_jobs
  SET status = p_status,
      started_at = CASE WHEN p_status IN ('spooling', 'printing') THEN coalesce(started_at, now()) ELSE started_at END,
      completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN now() ELSE NULL END
  WHERE order_id = p_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_requeue_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order print_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM print_orders WHERE id = p_order_id;
  IF NOT FOUND OR NOT public.is_shop_owner(v_order.shop_id) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF v_order.payment_status <> 'paid' THEN
    RAISE EXCEPTION 'order_not_paid';
  END IF;

  UPDATE print_orders SET status = 'queued', updated_at = now() WHERE id = p_order_id;

  UPDATE print_jobs
  SET status = 'queued',
      attempts = attempts + 1,
      queued_at = now(),
      started_at = NULL,
      completed_at = NULL
  WHERE order_id = p_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_print_order(text, text, text, text, integer, integer, text, text, text, bigint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_order_paid(uuid, numeric, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_order_public(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_shop(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_order_status(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_requeue_order(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_print_order(text, text, text, text, integer, integer, text, text, text, bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_order_paid(uuid, numeric, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_public(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_shop(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_order_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_requeue_order(uuid) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('print-files', 'print-files', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('shop-assets', 'shop-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "customers_upload_print_files" ON storage.objects;
CREATE POLICY "customers_upload_print_files" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'print-files' AND public.is_pending_print_upload(name));

DROP POLICY IF EXISTS "owners_read_print_files" ON storage.objects;
CREATE POLICY "owners_read_print_files" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'print-files' AND public.can_read_print_file(name));

DROP POLICY IF EXISTS "owners_upload_shop_assets" ON storage.objects;
CREATE POLICY "owners_upload_shop_assets" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'shop-assets' AND public.owns_shop_asset(name));

DROP POLICY IF EXISTS "owners_delete_shop_assets" ON storage.objects;
CREATE POLICY "owners_delete_shop_assets" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'shop-assets' AND public.owns_shop_asset(name));

INSERT INTO shops (slug, name, tagline, upi_id, file_retention_hours)
VALUES ('rts-digital-seva', 'RTS Digital Seva', 'Scan • Upload • Pay • Print', 'rtsdigitalseva@upi', 24)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pricing_rules (shop_id, paper_size, color_mode, sides, price)
SELECT s.id, p.paper_size, p.color_mode, p.sides, p.price
FROM shops s
CROSS JOIN (VALUES
  ('A4', 'bw', 'simplex', 2.00::numeric),
  ('A4', 'bw', 'duplex', 3.00::numeric),
  ('A4', 'color', 'simplex', 10.00::numeric),
  ('A4', 'color', 'duplex', 18.00::numeric),
  ('Letter', 'bw', 'simplex', 2.00::numeric),
  ('Letter', 'bw', 'duplex', 3.00::numeric),
  ('Letter', 'color', 'simplex', 10.00::numeric),
  ('Letter', 'color', 'duplex', 18.00::numeric),
  ('Legal', 'bw', 'simplex', 2.50::numeric),
  ('Legal', 'bw', 'duplex', 3.50::numeric),
  ('Legal', 'color', 'simplex', 12.00::numeric),
  ('Legal', 'color', 'duplex', 20.00::numeric)
) AS p(paper_size, color_mode, sides, price)
WHERE s.slug = 'rts-digital-seva'
ON CONFLICT (shop_id, paper_size, color_mode, sides) DO NOTHING;

INSERT INTO printers (shop_id, name, model, is_enabled, last_heartbeat_at)
SELECT s.id, 'Front Counter Printer', 'Laser MFP', true, now()
FROM shops s
WHERE s.slug = 'rts-digital-seva'
  AND NOT EXISTS (SELECT 1 FROM printers p WHERE p.shop_id = s.id);
