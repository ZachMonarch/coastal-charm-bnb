-- Move Phase 9 RPC Functions from app schema to public schema
-- This ensures Supabase CLI generates TypeScript types automatically

-- Move create_rfq function
DROP FUNCTION IF EXISTS public.create_rfq(bigint, text, text, timestamptz, jsonb);
CREATE OR REPLACE FUNCTION public.create_rfq(
  p_property_id bigint,
  p_title text,
  p_description text,
  p_deadline timestamptz,
  p_lots jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rfq_id uuid;
  v_tenant_id uuid;
  v_user_id uuid;
  v_lot record;
BEGIN
  v_tenant_id := app.current_tenant();
  v_user_id := app.user_id();
  
  IF NOT app.has_role('admin') AND NOT app.has_role('property_manager') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  INSERT INTO rfqs (property_id, title, description, deadline, tenant_id, created_by, status)
  VALUES (p_property_id, p_title, p_description, p_deadline, v_tenant_id, v_user_id, 'draft')
  RETURNING id INTO v_rfq_id;
  
  FOR v_lot IN SELECT * FROM jsonb_to_recordset(p_lots) 
    AS x(title text, description text, quantity numeric, unit text)
  LOOP
    INSERT INTO rfq_lots (rfq_id, lot_name, specifications, quantity, unit_of_measure)
    VALUES (v_rfq_id, v_lot.title, jsonb_build_object('description', v_lot.description), v_lot.quantity, v_lot.unit);
  END LOOP;
  
  RETURN v_rfq_id;
END;
$$;

-- Move invite_vendors_to_rfq function
DROP FUNCTION IF EXISTS public.invite_vendors_to_rfq(uuid, uuid[]);
CREATE OR REPLACE FUNCTION public.invite_vendors_to_rfq(
  p_rfq_id uuid,
  p_vendor_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_id uuid;
  v_tenant_id uuid;
  v_user_id uuid;
  v_count int := 0;
BEGIN
  v_tenant_id := app.current_tenant();
  v_user_id := app.user_id();
  
  IF NOT app.has_role('admin') AND NOT app.has_role('property_manager') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM rfqs WHERE id = p_rfq_id AND tenant_id = v_tenant_id) THEN
    RAISE EXCEPTION 'RFQ not found';
  END IF;
  
  FOREACH v_vendor_id IN ARRAY p_vendor_ids
  LOOP
    INSERT INTO rfq_invites (rfq_id, vendor_id, invited_by)
    VALUES (p_rfq_id, v_vendor_id, v_user_id)
    ON CONFLICT (rfq_id, vendor_id) DO NOTHING;
    v_count := v_count + 1;
  END LOOP;
  
  UPDATE rfqs SET status = 'open' WHERE id = p_rfq_id AND status = 'draft';
  
  RETURN jsonb_build_object('count', v_count, 'rfq_id', p_rfq_id);
END;
$$;

-- Move submit_bid function
DROP FUNCTION IF EXISTS public.submit_bid(uuid, uuid, jsonb, text);
CREATE OR REPLACE FUNCTION public.submit_bid(
  p_rfq_id uuid,
  p_vendor_id uuid,
  p_bid_lines jsonb,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_id uuid;
  v_line record;
  v_bid_line_id uuid;
BEGIN
  v_vendor_id := app.user_id();
  
  IF NOT EXISTS (
    SELECT 1 FROM rfq_invites 
    WHERE rfq_id = p_rfq_id 
      AND vendor_id = v_vendor_id 
      AND status = 'invited'
  ) THEN
    RAISE EXCEPTION 'Not invited';
  END IF;
  
  IF p_vendor_id != v_vendor_id THEN
    RAISE EXCEPTION 'Cannot submit bid for another vendor';
  END IF;
  
  FOR v_line IN SELECT * FROM jsonb_to_recordset(p_bid_lines) 
    AS x(rfq_lot_id uuid, unit_price numeric, notes text)
  LOOP
    INSERT INTO bid_lines (rfq_lot_id, vendor_id, unit_price, notes)
    VALUES (v_line.rfq_lot_id, v_vendor_id, v_line.unit_price, v_line.notes)
    RETURNING id INTO v_bid_line_id;
  END LOOP;
  
  UPDATE rfq_invites 
  SET status = 'submitted'
  WHERE rfq_id = p_rfq_id AND vendor_id = v_vendor_id;
  
  RETURN v_bid_line_id;
END;
$$;

-- Move award_contract function
DROP FUNCTION IF EXISTS public.award_contract(uuid, uuid, numeric, date, date);
CREATE OR REPLACE FUNCTION public.award_contract(
  p_rfq_id uuid,
  p_vendor_id uuid,
  p_contract_value numeric,
  p_start_date date,
  p_end_date date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract_id uuid;
  v_tenant_id uuid;
  v_user_id uuid;
  v_contract_number text;
  v_rfq_title text;
BEGIN
  v_tenant_id := app.current_tenant();
  v_user_id := app.user_id();
  
  IF NOT app.has_role('admin') AND NOT app.has_role('property_manager') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  SELECT title INTO v_rfq_title FROM rfqs WHERE id = p_rfq_id AND tenant_id = v_tenant_id;
  IF v_rfq_title IS NULL THEN
    RAISE EXCEPTION 'RFQ not found';
  END IF;
  
  v_contract_number := 'CNT-' || to_char(now(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6);
  
  INSERT INTO contracts (
    rfq_id, vendor_id, tenant_id, contract_number, 
    contract_value, start_date, end_date, status, created_by, title, description
  )
  VALUES (
    p_rfq_id, p_vendor_id, v_tenant_id, v_contract_number,
    p_contract_value, p_start_date, p_end_date, 'active', v_user_id,
    'Contract for ' || v_rfq_title, 'Contract awarded via RFQ'
  )
  RETURNING id INTO v_contract_id;
  
  UPDATE rfqs SET status = 'awarded', updated_at = now() WHERE id = p_rfq_id;
  UPDATE rfq_invites SET status = 'awarded' WHERE rfq_id = p_rfq_id AND vendor_id = p_vendor_id;
  
  RETURN v_contract_id;
END;
$$;

-- Verify migration
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  CASE WHEN p.prosecdef THEN '✅ DEFINER' ELSE '❌ INVOKER' END as security
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('create_rfq', 'invite_vendors_to_rfq', 'submit_bid', 'award_contract')
  AND n.nspname = 'public'
ORDER BY p.proname;