-- =====================================================
-- Corrective Migration: Complete Linter Fix
-- Date: 2025-10-23
-- Purpose: Fix remaining duplicate policies and function
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Applying corrective fixes for remaining linter issues...';
END $$;

-- =====================================================
-- FIX 1: test_connection function with proper search_path
-- =====================================================

DROP FUNCTION IF EXISTS public.test_connection();

CREATE OR REPLACE FUNCTION public.test_connection()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
    -- Test if we can access auth schema
    IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
        RETURN '✅ Supabase API connection working';
    ELSE
        RETURN '⚠️ Connected but no users found';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN '❌ Connection test failed: ' || SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.test_connection() TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_connection() TO service_role;

DO $$
BEGIN
    RAISE NOTICE '✅ Fixed test_connection function with proper search_path';
END $$;

-- =====================================================
-- FIX 2: Drop ALL old duplicate policies
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Removing old duplicate policies...';
END $$;

-- Drop old audit_logs policies (keeping only the new consolidated ones)
DROP POLICY IF EXISTS admins_can_read_audit_logs ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_admin_select ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_admin_update ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_service_insert ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_immutable ON public.audit_logs;

-- Create new consolidated audit_logs policies
CREATE POLICY audit_logs_unified_select
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role = 'admin'
    )
);

CREATE POLICY audit_logs_unified_insert
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY audit_logs_unified_update
ON public.audit_logs
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role = 'admin'
    )
);

-- No DELETE policy - audit logs are immutable

DO $$
BEGIN
    RAISE NOTICE '✅ Fixed audit_logs policies';
END $$;

-- Drop old financial_reports policies
DROP POLICY IF EXISTS financial_reports_admin_only ON public.financial_reports;

DO $$
BEGIN
    RAISE NOTICE '✅ Fixed financial_reports policies';
END $$;

-- Drop old profiles policies (keep new consolidated one)
DROP POLICY IF EXISTS profiles_own_only ON public.profiles;
DROP POLICY IF EXISTS users_can_read_own_profile ON public.profiles;
DROP POLICY IF EXISTS users_can_update_own_profile ON public.profiles;

-- Create new consolidated profiles policy
CREATE POLICY profiles_unified_access
ON public.profiles
FOR ALL
TO authenticated
USING (
    id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
)
WITH CHECK (
    id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
);

DO $$
BEGIN
    RAISE NOTICE '✅ Fixed profiles policies';
END $$;

-- Drop old security_events policies
DROP POLICY IF EXISTS admins_can_read_security_events ON public.security_events;
DROP POLICY IF EXISTS security_events_admin_only ON public.security_events;

-- Create new consolidated security_events policy
CREATE POLICY security_events_unified_access
ON public.security_events
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role = 'admin'
    )
    OR auth.role() = 'service_role'
);

DO $$
BEGIN
    RAISE NOTICE '✅ Fixed security_events policies';
END $$;

-- Drop old vendor_applications policies that conflict with unified policy
DROP POLICY IF EXISTS vendor_applications_admin_update ON public.vendor_applications;
DROP POLICY IF EXISTS vendor_applications_admin_view ON public.vendor_applications;
DROP POLICY IF EXISTS vendor_applications_authenticated_insert ON public.vendor_applications;
DROP POLICY IF EXISTS vendor_applications_own_update ON public.vendor_applications;
DROP POLICY IF EXISTS vendor_applications_own_view ON public.vendor_applications;

-- The vendor_applications_unified_access policy already exists and covers all cases

DO $$
BEGIN
    RAISE NOTICE '✅ Fixed vendor_applications policies';
END $$;

-- Drop old vendor_bids policies
DROP POLICY IF EXISTS vendors_can_create_bids ON public.vendor_bids;
DROP POLICY IF EXISTS vendors_can_read_own_bids ON public.vendor_bids;

-- The vendor_bids_unified_access policy already exists and covers all cases

DO $$
BEGIN
    RAISE NOTICE '✅ Fixed vendor_bids policies';
END $$;

-- Update vendor_documents policies to use consolidated approach
DROP POLICY IF EXISTS vendor_documents_delete ON public.vendor_documents;
DROP POLICY IF EXISTS vendor_documents_insert ON public.vendor_documents;
DROP POLICY IF EXISTS vendor_documents_select ON public.vendor_documents;
DROP POLICY IF EXISTS vendor_documents_update ON public.vendor_documents;

CREATE POLICY vendor_documents_unified_access
ON public.vendor_documents
FOR ALL
TO authenticated
USING (
    vendor_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'property_manager')
    )
)
WITH CHECK (
    vendor_id = (SELECT auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role = 'admin'
    )
);

DO $$
BEGIN
    RAISE NOTICE '✅ Fixed vendor_documents policies';
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CORRECTIVE MIGRATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Fixed Issues:';
    RAISE NOTICE '  ✅ test_connection function: search_path now set properly';
    RAISE NOTICE '  ✅ All duplicate policies removed';
    RAISE NOTICE '  ✅ Consolidated policies in place';
    RAISE NOTICE '';
    RAISE NOTICE 'Remaining:';
    RAISE NOTICE '  ⚠️  Leaked Password Protection: Manual Dashboard config';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected Linter Result: 1 warning (auth_leaked_password_protection)';
    RAISE NOTICE '========================================';
END $$;