/*
# RTS Smart Print - schema rebuild, security and seed data

Plain-English summary
The earlier test tables are replaced with the requested layout. The only data they held was the test shop and its default prices, created during setup. This migration recreates the full printing workflow: shops, printers, pricing, orders, uploaded files and print jobs, with row level security and the server functions that place orders and confirm payments.

1. New Tables
- shops: slug, name, tagline, phone, email, is_active, retention_hours, plus owner_id linking the shop to its admin login.
- printers: system_name, display_name, status (online/offline), supported_sizes, supports_color, supports_duplex, last_heartbeat_at.
- pricing_rules: paper_size, is_color, is_double_sided, price_per_page (one rule per combination).
- print_orders: order_number, customer_phone, total_pages, copies, total_amount, status (pending, paid, printing, completed, failed), plus paper/colour/sides and the payment reference.
- uploaded_files: storage path, original filename, page count, file size, mime type.
- print_jobs: one printing job per paid order with its file, copies, printer and status (queued, printing, completed, failed).

2. Security
- RLS is enabled on every table.
- Anyone can read shops, printers and pricing (needed by the kiosk).
- Orders, files and jobs are readable only by the shop owner.
- Customers place orders only through create_print_order, which prices orders on the server.
- Customer files can be uploaded only while their order is still pending, and files cannot be overwritten.
- Shop owners change order status only through admin_update_order_status.

3. Important Notes
- 3.1 Prices are per page: total = pages x copies x price per page.
- 3.2 mark_order_paid checks the amount against the order total. Real Razorpay payments should be verified by a server webhook before go-live.
- 3.3 Seed data: shop rts-digital-seva, one online printer, and four A4 rules (B&W 2, Color 10, plus duplex B&W 3 and Color 18 from the original brief).
*/

DROP TABLE IF EXISTS print_jobs, uploaded_files, print_orders, payment_transactions, pricing_rules, printers, shops CASCADE;

DROP FUNCTION IF EXISTS public.is_shop_owner(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_pending_print_upload(text) CASCADE;
DROP FUNCTION IF EXISTS public.can_read_print_file(text) CASCADE;
DROP FUNCTION IF EXISTS public.owns_shop_asset(text) CASCADE;
DROP FUNCTION IF EXISTS public.create_print_order(text, text, text, text, integer, integer, text, text, text, bigint) CASCADE;
DROP FUNCTION IF EXISTS public.mark_order_paid(uuid, numeric, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_order_public(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.claim_shop(text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_set_order_status(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_requeue_order(uuid) CASCADE;

CREATE TABLE shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  name text NOT NULL,
  tagline text NOT NULL DEFAULT 'Scan • Upload • Pay • Print',
  phone text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  retention_hours integer NOT NULL DEFAULT 24 CHECK (retention_hours BETWEEN 1 AND 720),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE printers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  system_name text NOT NULL,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
  supported_sizes text[] NOT NULL DEFAULT ARRAY['A4']::text[],
  supports_color boolean NOT NULL DEFAULT false,
  supports_duplex boolean NOT NULL DEFAULT false,
  last_heartbeat_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX printers_shop_idx ON printers (shop_id);

CREATE TABLE pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  paper_size text NOT NULL CHECK (paper_size IN ('A4', 'Letter', 'Legal')),
  is_color boolean NOT NULL,
  is_double_sided boolean NOT NULL,
  price_per_page numeric(10, 2) NOT NULL CHECK (price_per_page >= 0),
  UNIQUE (shop_id, paper_size, is_color, is_double_sided)
);

CREATE TABLE print_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  order_number text NOT NULL UNIQUE DEFAULT ('RTS-' || upper(substr(md5(gen_random_uuid()::text), 1, 8))),
  customer_phone text,
  paper_size text NOT NULL CHECK (paper_size IN ('A4', 'Letter', 'Legal')),
  is_color boolean NOT NULL,
  is_double_sided boolean NOT NULL,
  total_pages integer NOT NULL CHECK (total_pages BETWEEN 1 AND 2000),
  copies integer NOT NULL CHECK (copies BETWEEN 1 AND 100),
  total_amount numeric(10, 2) NOT NULL CHECK (total_amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'printing', 'completed', 'failed')),
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX print_orders_shop_created_idx ON print_orders (shop_id, created_at DESC);

CREATE TABLE uploaded_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES print_orders(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  page_count integer NOT NULL CHECK (page_count >= 1),
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes BETWEEN 1 AND 52428800),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX uploaded_files_order_idx ON uploaded_files (order_id);

CREATE TABLE print_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  order_id uuid NOT NULL UNIQUE REFERENCES print_orders(id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
  printer_id uuid REFERENCES printers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'printing', 'completed', 'failed')),
  copies integer NOT NULL CHECK (copies BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX print_jobs_shop_status_idx ON print_jobs (shop_id, status);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_shop_owner(p_shop_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM shops s WHERE s.id = p_shop_id AND s.owner_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_pending_print_upload(p_path text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM uploaded_files uf JOIN print_orders o ON o.id = uf.order_id
    WHERE uf.storage_path = p_path AND o.status = 'pending'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_read_print_file(p_path text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM uploaded_files uf WHERE uf.storage_path = p_path AND public.is_shop_owner(uf.shop_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_shop_asset(p_path text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM shops s WHERE s.id::text = split_part(p_path, '/', 1) AND s.owner_id = auth.uid()
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

GRANT SELECT ON shops, printers, pricing_rules TO anon, authenticated;
GRANT UPDATE (name, tagline, phone, email, is_active, retention_hours) ON shops TO authenticated;
GRANT UPDATE (status, last_heartbeat_at) ON printers TO authenticated;
GRANT UPDATE (price_per_page) ON pricing_rules TO authenticated;
GRANT SELECT ON print_orders, uploaded_files, print_jobs TO authenticated;

DROP POLICY IF EXISTS "anyone_read_shops" ON shops;
CREATE POLICY "anyone_read_shops" ON shops FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "owners_update_shop" ON shops;
CREATE POLICY "owners_update_shop" ON shops FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "anyone_read_printers" ON printers;
CREATE POLICY "anyone_read_printers" ON printers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "owners_update_printers" ON printers;
CREATE POLICY "owners_update_printers" ON printers FOR UPDATE TO authenticated
  USING (public.is_shop_owner(shop_id)) WITH CHECK (public.is_shop_owner(shop_id));

DROP POLICY IF EXISTS "anyone_read_pricing" ON pricing_rules;
CREATE POLICY "anyone_read_pricing" ON pricing_rules FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "owners_update_pricing" ON pricing_rules;
CREATE POLICY "owners_update_pricing" ON pricing_rules FOR UPDATE TO authenticated
  USING (public.is_shop_owner(shop_id)) WITH CHECK (public.is_shop_owner(shop_id));

DROP POLICY IF EXISTS "owners_read_orders" ON print_orders;
CREATE POLICY "owners_read_orders" ON print_orders FOR SELECT TO authenticated
  USING (public.is_shop_owner(shop_id));

DROP POLICY IF EXISTS "owners_read_files" ON uploaded_files;
CREATE POLICY "owners_read_files" ON uploaded_files FOR SELECT TO authenticated
  USING (public.is_shop_owner(shop_id));

DROP POLICY IF EXISTS "owners_read_jobs" ON print_jobs;
CREATE POLICY "owners_read_jobs" ON print_jobs FOR SELECT TO authenticated
  USING (public.is_shop_owner(shop_id));

CREATE OR REPLACE FUNCTION public.create_print_order(
  p_shop_slug text,
  p_paper_size text,
  p_is_color boolean,
  p_is_double_sided boolean,
  p_copies integer,
  p_total_pages integer,
  p_customer_phone text,
  p_file_name text,
  p_mime_type text,
  p_file_size bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.mark_order_paid(p_order_id uuid, p_amount numeric, p_payment_reference text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order print_orders%ROWTYPE;
  v_file_id uuid;
BEGIN
  SELECT * INTO v_order FROM print_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_order.status <> 'pending' THEN RETURN; END IF;
  IF p_amount IS DISTINCT FROM v_order.total_amount THEN RAISE EXCEPTION 'amount_mismatch'; END IF;

  UPDATE print_orders
  SET status = 'paid', payment_reference = p_payment_reference, paid_at = now(), updated_at = now()
  WHERE id = p_order_id;

  SELECT id INTO v_file_id FROM uploaded_files WHERE order_id = p_order_id LIMIT 1;

  INSERT INTO print_jobs (shop_id, order_id, file_id, status, copies)
  VALUES (v_order.shop_id, p_order_id, v_file_id, 'queued', v_order.copies);
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
    'order_number', o.order_number,
    'status', o.status,
    'shop_name', s.name,
    'shop_slug', s.slug,
    'paper_size', o.paper_size,
    'is_color', o.is_color,
    'is_double_sided', o.is_double_sided,
    'copies', o.copies,
    'total_pages', o.total_pages,
    'total_amount', o.total_amount,
    'file_name', (SELECT uf.original_filename FROM uploaded_files uf WHERE uf.order_id = o.id LIMIT 1),
    'created_at', o.created_at,
    'updated_at', o.updated_at
  )
  FROM print_orders o JOIN shops s ON s.id = o.shop_id
  WHERE o.id = p_order_id;
$$;

CREATE OR REPLACE FUNCTION public.claim_shop(p_slug text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  UPDATE shops SET owner_id = auth.uid() WHERE slug = p_slug AND owner_id IS NULL;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_order_status(p_order_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order print_orders%ROWTYPE;
  v_job_status text;
BEGIN
  IF p_status NOT IN ('paid', 'printing', 'completed', 'failed') THEN RAISE EXCEPTION 'invalid_status'; END IF;

  SELECT * INTO v_order FROM print_orders WHERE id = p_order_id;
  IF NOT FOUND OR NOT public.is_shop_owner(v_order.shop_id) THEN RAISE EXCEPTION 'not_authorized'; END IF;
  IF v_order.status = 'pending' THEN RAISE EXCEPTION 'order_not_paid'; END IF;

  v_job_status := CASE p_status WHEN 'paid' THEN 'queued' ELSE p_status END;

  UPDATE print_orders SET status = p_status, updated_at = now() WHERE id = p_order_id;
  UPDATE print_jobs SET status = v_job_status, updated_at = now() WHERE order_id = p_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_print_order(text, text, boolean, boolean, integer, integer, text, text, text, bigint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_order_paid(uuid, numeric, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_order_public(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_shop(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_order_status(uuid, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_print_order(text, text, boolean, boolean, integer, integer, text, text, text, bigint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_order_paid(uuid, numeric, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_public(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_shop(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, text) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('print-files', 'print-files', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('shop-assets', 'shop-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "customers_upload_print_files" ON storage.objects;
CREATE POLICY "customers_upload_print_files" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'print-files' AND public.is_pending_print_upload(name));

DROP POLICY IF EXISTS "owners_read_print_files" ON storage.objects;
CREATE POLICY "owners_read_print_files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'print-files' AND public.can_read_print_file(name));

DROP POLICY IF EXISTS "owners_upload_shop_assets" ON storage.objects;
CREATE POLICY "owners_upload_shop_assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'shop-assets' AND public.owns_shop_asset(name));

INSERT INTO shops (slug, name, tagline, is_active, retention_hours)
VALUES ('rts-digital-seva', 'RTS Digital Seva', 'Scan • Upload • Pay • Print', true, 24)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO printers (shop_id, system_name, display_name, status, supported_sizes, supports_color, supports_duplex, last_heartbeat_at)
SELECT s.id, 'RTS-COUNTER-01', 'Front Counter Printer', 'online', ARRAY['A4', 'Letter', 'Legal']::text[], true, true, now()
FROM shops s
WHERE s.slug = 'rts-digital-seva'
  AND NOT EXISTS (SELECT 1 FROM printers p WHERE p.shop_id = s.id);

INSERT INTO pricing_rules (shop_id, paper_size, is_color, is_double_sided, price_per_page)
SELECT s.id, 'A4', r.is_color, r.is_double_sided, r.price
FROM shops s
CROSS JOIN (VALUES
  (false, false, 2.00::numeric),
  (true, false, 10.00::numeric),
  (false, true, 3.00::numeric),
  (true, true, 18.00::numeric)
) AS r(is_color, is_double_sided, price)
WHERE s.slug = 'rts-digital-seva'
ON CONFLICT (shop_id, paper_size, is_color, is_double_sided) DO NOTHING;
