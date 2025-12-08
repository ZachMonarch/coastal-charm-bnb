-- =====================================================
-- PHASE 9 FINAL SECURITY HARDENING
-- Adds SET search_path to Phase 9 RPC functions
-- Safe to run: Uses CREATE OR REPLACE
-- =====================================================

-- Fix: app.submit_bid
CREATE OR REPLACE FUNCTION app.submit_bid(
  p_rfq_id uuid,
  p_bid_amount numeric,
  p_bid_lines jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'app'
AS $function$
DECLARE
  v_bid_id uuid;
  v_vendor_id uuid;
  v_tenant_id uuid;
  v_lot record;
BEGIN
  v_vendor_id := app.user_id();
  v_tenant_id := app.current_tenant();
  
  -- Verify vendor is invited
  IF NOT EXISTS (
    SELECT 1 FROM rfq_invites 
    WHERE rfq_id = p_rfq_id 
      AND vendor_id = v_vendor_id 
      AND status = 'invited'
  ) THEN
    RAISE EXCEPTION 'Not invited to this RFQ';
  END IF;
  
  -- Insert bid
  INSERT INTO bids (rfq_id, vendor_id, tenant_id, bid_amount, status)
  VALUES (p_rfq_id, v_vendor_id, v_tenant_id, p_bid_amount, 'submitted')
  RETURNING id INTO v_bid_id;
  
  -- Insert bid line items
  FOR v_lot IN SELECT * FROM jsonb_to_recordset(p_bid_lines) 
    AS x(rfq_lot_id uuid, unit_price numeric)
  LOOP
    INSERT INTO bid_lines (bid_id, rfq_lot_id, unit_price, tenant_id)
    VALUES (v_bid_id, v_lot.rfq_lot_id, v_lot.unit_price, v_tenant_id);
  END LOOP;
  
  -- Update invite status
  UPDATE rfq_invites 
  SET status = 'bid_submitted', responded_at = now()
  WHERE rfq_id = p_rfq_id AND vendor_id = v_vendor_id;
  
  RETURN v_bid_id;
END;
$function$;

-- Fix: app.create_rfq
CREATE OR REPLACE FUNCTION app.create_rfq(
  p_property_id bigint,
  p_title text,
  p_description text,
  p_deadline timestamptz,
  p_lots jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'app'
AS $function$
DECLARE
  v_rfq_id uuid;
  v_tenant_id uuid;
  v_lot record;
BEGIN
  v_tenant_id := app.current_tenant();
  
  -- Insert RFQ
  INSERT INTO rfqs (property_id, title, description, deadline, tenant_id, status)
  VALUES (p_property_id, p_title, p_description, p_deadline, v_tenant_id, 'draft')
  RETURNING id INTO v_rfq_id;
  
  -- Insert lot line items
  FOR v_lot IN SELECT * FROM jsonb_to_recordset(p_lots) 
    AS x(name text, uom text, qty numeric)
  LOOP
    INSERT INTO rfq_lots (rfq_id, name, uom, qty, tenant_id)
    VALUES (v_rfq_id, v_lot.name, v_lot.uom, v_lot.qty, v_tenant_id);
  END LOOP;
  
  RETURN v_rfq_id;
END;
$function$;

-- Fix: app.invite_vendors_to_rfq
CREATE OR REPLACE FUNCTION app.invite_vendors_to_rfq(
  p_rfq_id uuid,
  p_vendor_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'app'
AS $function$
DECLARE
  v_vendor_id uuid;
  v_tenant_id uuid;
BEGIN
  v_tenant_id := app.current_tenant();
  
  -- Only admin/property_manager can invite
  IF NOT app.has_role('admin') AND NOT app.has_role('property_manager') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  FOREACH v_vendor_id IN ARRAY p_vendor_ids
  LOOP
    INSERT INTO rfq_invites (rfq_id, vendor_id, tenant_id, status)
    VALUES (p_rfq_id, v_vendor_id, v_tenant_id, 'invited')
    ON CONFLICT (rfq_id, vendor_id) DO NOTHING;
  END LOOP;
  
  -- Update RFQ status to 'open'
  UPDATE rfqs SET status = 'open' WHERE id = p_rfq_id;
END;
$function$;

-- Fix: app.award_contract
CREATE OR REPLACE FUNCTION app.award_contract(
  p_rfq_id uuid,
  p_vendor_id uuid,
  p_contract_amount numeric,
  p_start_date date,
  p_end_date date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'app'
AS $function$
DECLARE
  v_contract_id uuid;
  v_tenant_id uuid;
  v_contract_number text;
BEGIN
  v_tenant_id := app.current_tenant();
  
  -- Only admin/property_manager can award
  IF NOT app.has_role('admin') AND NOT app.has_role('property_manager') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Generate contract number
  v_contract_number := 'CNT-' || to_char(now(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6);
  
  -- Insert contract
  INSERT INTO contracts (
    rfq_id, vendor_id, tenant_id, contract_number, 
    total_amount, start_date, end_date, status
  )
  VALUES (
    p_rfq_id, p_vendor_id, v_tenant_id, v_contract_number,
    p_contract_amount, p_start_date, p_end_date, 'active'
  )
  RETURNING id INTO v_contract_id;
  
  -- Update RFQ status
  UPDATE rfqs SET status = 'awarded' WHERE id = p_rfq_id;
  
  -- Update winning bid status
  UPDATE bids SET status = 'accepted' 
  WHERE rfq_id = p_rfq_id AND vendor_id = p_vendor_id;
  
  -- Reject other bids
  UPDATE bids SET status = 'rejected'
  WHERE rfq_id = p_rfq_id AND vendor_id != p_vendor_id;
  
  RETURN v_contract_id;
END;
$function$;

-- Verification: Check all functions now have search_path
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  CASE WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path%' THEN '✅' ELSE '❌' END as has_search_path
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'app'
  AND p.prosecdef = true
ORDER BY p.proname;
