/*
# Partner shop registration and connector pairing codes

1. Plain-English summary
- Lets a new photocopy shop or cyber cafe register itself from the public partner page.
- Each new shop gets standard A4 pricing (B&W 2 rupees, Colour 10 rupees per page) and a 6-digit pairing code for the Windows print connector.

2. Changes
- `shops`: adds `owner_name` and `printer_brand` (both optional).
- New table `shop_connector_keys`: one pairing code per shop. Readable only by that shop's owner.
- New function `register_shop(...)`: creates the shop for the signed-in user, its pricing rules and its pairing code. Refuses a slug already in use or a user who already owns a shop.
- Backfills a pairing code for every existing shop.

3. Security
- RLS is enabled on `shop_connector_keys`. Only SELECT is granted to `authenticated`, and only for shops the caller owns (`is_shop_owner`).
- Nobody can write to `shop_connector_keys` directly; rows come from the security-definer functions only.
- `register_shop` and `generate_pairing_code` are not callable by `anon` or `PUBLIC`. `register_shop` is granted to `authenticated` only.

4. Notes
- The slug is validated against `^[a-z0-9-]{3,40}$`.
- Idempotent: safe to re-run.
*/

ALTER TABLE shops ADD COLUMN IF NOT EXISTS owner_name text;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS printer_brand text;

CREATE TABLE IF NOT EXISTS shop_connector_keys (
  shop_id uuid PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  pairing_code text NOT NULL CHECK (pairing_code ~ '^[0-9]{6}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shop_connector_keys ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON shop_connector_keys TO authenticated;

DROP POLICY IF EXISTS "select_own_connector_key" ON shop_connector_keys;
CREATE POLICY "select_own_connector_key" ON shop_connector_keys FOR SELECT
  TO authenticated USING (public.is_shop_owner(shop_id));

CREATE OR REPLACE FUNCTION public.generate_pairing_code()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT lpad(
    ((('x' || substr(gen_random_uuid()::text, 1, 8))::bit(32)::bigint) % 1000000)::text,
    6, '0'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.generate_pairing_code() FROM PUBLIC, anon, authenticated;

INSERT INTO shop_connector_keys (shop_id, pairing_code)
SELECT s.id, public.generate_pairing_code() FROM shops s
ON CONFLICT (shop_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.register_shop(
  p_owner_name text,
  p_business_name text,
  p_slug text,
  p_phone text,
  p_address text,
  p_printer_brand text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shop_id uuid;
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_slug IS NULL OR p_slug !~ '^[a-z0-9-]{3,40}$' THEN RAISE EXCEPTION 'invalid_slug'; END IF;
  IF p_business_name IS NULL OR length(trim(p_business_name)) < 2 THEN RAISE EXCEPTION 'invalid_name'; END IF;
  IF EXISTS (SELECT 1 FROM shops WHERE owner_id = auth.uid()) THEN RAISE EXCEPTION 'already_registered'; END IF;
  IF EXISTS (SELECT 1 FROM shops WHERE slug = p_slug) THEN RAISE EXCEPTION 'slug_taken'; END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  INSERT INTO shops (owner_id, slug, name, phone, email, address, owner_name, printer_brand)
  VALUES (auth.uid(), p_slug, trim(p_business_name), nullif(trim(p_phone), ''), v_email,
          nullif(trim(p_address), ''), nullif(trim(p_owner_name), ''), nullif(trim(p_printer_brand), ''))
  RETURNING id INTO v_shop_id;

  INSERT INTO pricing_rules (shop_id, paper_size, is_color, is_double_sided, price_per_page)
  VALUES
    (v_shop_id, 'A4', false, false, 2),
    (v_shop_id, 'A4', false, true, 2),
    (v_shop_id, 'A4', true, false, 10),
    (v_shop_id, 'A4', true, true, 10);

  INSERT INTO shop_connector_keys (shop_id, pairing_code)
  VALUES (v_shop_id, public.generate_pairing_code());

  RETURN p_slug;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.register_shop(text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_shop(text, text, text, text, text, text) TO authenticated;
