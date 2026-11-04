/*
# Windows print agent heartbeat on shops

1. Plain-English summary
- Adds a "last seen" timestamp to each shop. The Windows print agent updates it every few seconds, so the admin dashboard can show whether the counter computer is connected.
- The agent identifies itself with the shop's 6-digit pairing code. No login is needed.

2. Changes
- `shops`: new column `agent_last_seen` (timestamp, optional).
- New function `agent_heartbeat(p_pairing_code)`: stamps `agent_last_seen = now()` for the matching shop and returns that time. Raises `invalid_pairing_code` for an unknown code.

3. Security
- The function runs with definer rights so the agent never needs direct write access to `shops`.
- Only the pairing code authorises the call; the function changes just the one timestamp.
- Callable by `anon` and `authenticated`, not `PUBLIC`.

4. Notes
- Idempotent: safe to re-run.
- The agent should call this about every 5 seconds. The dashboard treats the agent as connected when the stamp is within the last 15 seconds.
*/

ALTER TABLE shops ADD COLUMN IF NOT EXISTS agent_last_seen timestamptz;

CREATE OR REPLACE FUNCTION public.agent_heartbeat(p_pairing_code text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seen timestamptz;
BEGIN
  UPDATE shops s
  SET agent_last_seen = now()
  FROM shop_connector_keys k
  WHERE k.shop_id = s.id AND k.pairing_code = p_pairing_code
  RETURNING s.agent_last_seen INTO v_seen;

  IF v_seen IS NULL THEN RAISE EXCEPTION 'invalid_pairing_code'; END IF;
  RETURN v_seen;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.agent_heartbeat(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.agent_heartbeat(text) TO anon, authenticated;
