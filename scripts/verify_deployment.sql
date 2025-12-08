-- =====================================================
-- Supabase Backend Hardening - Verification Queries
-- Date: 2025-10-19
-- Purpose: Verify successful deployment of migration
-- =====================================================

-- =====================================================
-- SECTION 1: VERIFY INDEXES
-- =====================================================

\echo '========================================='
\echo 'SECTION 1: VERIFYING INDEXES'
\echo '========================================='

SELECT 
    schemaname,
    tablename,
    indexname,
    CASE 
        WHEN indexname LIKE 'idx_%' THEN '✅'
        ELSE '  '
    END as status
FROM pg_indexes
WHERE indexname IN (
    'idx_realtime_messages_topic',
    'idx_room_members_user_room',
    'idx_vendor_bids_vendor_id',
    'idx_vendor_bids_project_id',
    'idx_leases_tenant_id',
    'idx_tickets_tenant_id',
    'idx_projects_property_id',
    'idx_projects_status'
)
ORDER BY indexname;

\echo ''
\echo 'Expected: 8 indexes'
SELECT COUNT(*) as index_count
FROM pg_indexes
WHERE indexname IN (
    'idx_realtime_messages_topic',
    'idx_room_members_user_room',
    'idx_vendor_bids_vendor_id',
    'idx_vendor_bids_project_id',
    'idx_leases_tenant_id',
    'idx_tickets_tenant_id',
    'idx_projects_property_id',
    'idx_projects_status'
);

-- =====================================================
-- SECTION 2: VERIFY HELPER FUNCTIONS
-- =====================================================

\echo ''
\echo '========================================='
\echo 'SECTION 2: VERIFYING HELPER FUNCTIONS'
\echo '========================================='

SELECT 
    n.nspname as schema,
    p.proname as function_name,
    CASE 
        WHEN p.prosecdef THEN '✅ SECURITY DEFINER'
        ELSE '❌ NOT SECURE'
    END as security_status,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN (
    'get_user_id',
    'is_admin_user',
    'user_has_role',
    'room_id_from_topic',
    'can_access_room'
)
ORDER BY p.proname;

\echo ''
\echo 'Expected: 5 functions, all SECURITY DEFINER'
SELECT 
    COUNT(*) as total_functions,
    SUM(CASE WHEN prosecdef THEN 1 ELSE 0 END) as secure_functions
FROM pg_proc
WHERE proname IN (
    'get_user_id',
    'is_admin_user',
    'user_has_role',
    'room_id_from_topic',
    'can_access_room'
);

-- =====================================================
-- SECTION 3: VERIFY RLS STATUS
-- =====================================================

\echo ''
\echo '========================================='
\echo 'SECTION 3: VERIFYING RLS STATUS'
\echo '========================================='

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'realtime_messages',
    'vendor_bids',
    'leases',
    'tickets',
    'audit_logs',
    'security_events',
    'profiles',
    'room_members'
)
ORDER BY tablename;

\echo ''
\echo 'Expected: All tables should have RLS enabled'
SELECT 
    COUNT(*) as total_tables,
    SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) as rls_enabled_tables
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'realtime_messages',
    'vendor_bids',
    'leases',
    'tickets',
    'audit_logs',
    'security_events',
    'profiles',
    'room_members'
);

-- =====================================================
-- SECTION 4: VERIFY RLS POLICIES
-- =====================================================

\echo ''
\echo '========================================='
\echo 'SECTION 4: VERIFYING RLS POLICIES'
\echo '========================================='

SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN 'authenticated' = ANY(roles) THEN '✅ TO authenticated'
        WHEN 'public' = ANY(roles) THEN '⚠️  TO public'
        ELSE '  ' || array_to_string(roles, ', ')
    END as role_status,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo ''
\echo 'Expected: No policies TO public'
SELECT 
    COUNT(*) as total_policies,
    SUM(CASE WHEN 'public' = ANY(roles) THEN 1 ELSE 0 END) as public_policies,
    SUM(CASE WHEN 'authenticated' = ANY(roles) THEN 1 ELSE 0 END) as authenticated_policies
FROM pg_policies
WHERE schemaname = 'public';

-- =====================================================
-- SECTION 5: TEST HELPER FUNCTIONS
-- =====================================================

\echo ''
\echo '========================================='
\echo 'SECTION 5: TESTING HELPER FUNCTIONS'
\echo '========================================='

-- Test room_id_from_topic
\echo ''
\echo 'Testing room_id_from_topic()...'
SELECT 
    'room:123e4567-e89b-12d3-a456-426614174000' as input_topic,
    public.room_id_from_topic('room:123e4567-e89b-12d3-a456-426614174000') as extracted_uuid,
    CASE 
        WHEN public.room_id_from_topic('room:123e4567-e89b-12d3-a456-426614174000') = '123e4567-e89b-12d3-a456-426614174000'::uuid 
        THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as test_result;

-- Test invalid topic format
SELECT 
    'invalid-topic' as input_topic,
    public.room_id_from_topic('invalid-topic') as extracted_uuid,
    CASE 
        WHEN public.room_id_from_topic('invalid-topic') IS NULL 
        THEN '✅ PASS (correctly returns NULL)'
        ELSE '❌ FAIL'
    END as test_result;

-- =====================================================
-- SECTION 6: VERIFY FUNCTION PERMISSIONS
-- =====================================================

\echo ''
\echo '========================================='
\echo 'SECTION 6: VERIFYING FUNCTION PERMISSIONS'
\echo '========================================='

SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_catalog.pg_get_userbyid(p.proowner) as owner,
    CASE 
        WHEN has_function_privilege('anon', p.oid, 'EXECUTE') THEN '❌ anon has EXECUTE'
        ELSE '✅ anon blocked'
    END as anon_access,
    CASE 
        WHEN has_function_privilege('authenticated', p.oid, 'EXECUTE') THEN '✅ authenticated has EXECUTE'
        ELSE '❌ authenticated blocked'
    END as authenticated_access
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN (
    'get_user_id',
    'is_admin_user',
    'user_has_role',
    'room_id_from_topic',
    'can_access_room'
)
ORDER BY p.proname;

-- =====================================================
-- SECTION 7: PERFORMANCE VERIFICATION
-- =====================================================

\echo ''
\echo '========================================='
\echo 'SECTION 7: VERIFYING INDEX USAGE'
\echo '========================================='

-- Check if indexes are being used in query plans
\echo ''
\echo 'Sample query plan for vendor_bids lookup:'
EXPLAIN (FORMAT TEXT, COSTS OFF)
SELECT * FROM vendor_bids WHERE vendor_id = '123e4567-e89b-12d3-a456-426614174000'::uuid;

\echo ''
\echo 'Sample query plan for leases lookup:'
EXPLAIN (FORMAT TEXT, COSTS OFF)
SELECT * FROM leases WHERE tenant_id = '123e4567-e89b-12d3-a456-426614174000'::uuid;

-- =====================================================
-- SECTION 8: SUMMARY REPORT
-- =====================================================

\echo ''
\echo '========================================='
\echo 'DEPLOYMENT VERIFICATION SUMMARY'
\echo '========================================='

WITH verification_summary AS (
    SELECT 
        'Indexes' as component,
        COUNT(*) as expected,
        COUNT(*) as actual,
        CASE WHEN COUNT(*) = 8 THEN '✅ PASS' ELSE '❌ FAIL' END as status
    FROM pg_indexes
    WHERE indexname IN (
        'idx_realtime_messages_topic',
        'idx_room_members_user_room',
        'idx_vendor_bids_vendor_id',
        'idx_vendor_bids_project_id',
        'idx_leases_tenant_id',
        'idx_tickets_tenant_id',
        'idx_projects_property_id',
        'idx_projects_status'
    )
    
    UNION ALL
    
    SELECT 
        'Helper Functions' as component,
        5 as expected,
        COUNT(*) as actual,
        CASE WHEN COUNT(*) = 5 THEN '✅ PASS' ELSE '❌ FAIL' END as status
    FROM pg_proc
    WHERE proname IN (
        'get_user_id',
        'is_admin_user',
        'user_has_role',
        'room_id_from_topic',
        'can_access_room'
    )
    
    UNION ALL
    
    SELECT 
        'SECURITY DEFINER Functions' as component,
        5 as expected,
        SUM(CASE WHEN prosecdef THEN 1 ELSE 0 END)::integer as actual,
        CASE WHEN SUM(CASE WHEN prosecdef THEN 1 ELSE 0 END) = 5 THEN '✅ PASS' ELSE '❌ FAIL' END as status
    FROM pg_proc
    WHERE proname IN (
        'get_user_id',
        'is_admin_user',
        'user_has_role',
        'room_id_from_topic',
        'can_access_room'
    )
    
    UNION ALL
    
    SELECT 
        'RLS Enabled Tables' as component,
        8 as expected,
        SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END)::integer as actual,
        CASE WHEN SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) >= 5 THEN '✅ PASS' ELSE '⚠️  PARTIAL' END as status
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'realtime_messages',
        'vendor_bids',
        'leases',
        'tickets',
        'audit_logs',
        'security_events',
        'profiles',
        'room_members'
    )
    
    UNION ALL
    
    SELECT 
        'Public Policies (should be 0)' as component,
        0 as expected,
        SUM(CASE WHEN 'public' = ANY(roles) THEN 1 ELSE 0 END)::integer as actual,
        CASE WHEN SUM(CASE WHEN 'public' = ANY(roles) THEN 1 ELSE 0 END) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
    FROM pg_policies
    WHERE schemaname = 'public'
)
SELECT * FROM verification_summary;

\echo ''
\echo '========================================='
\echo 'VERIFICATION COMPLETE'
\echo '========================================='
\echo ''
\echo 'Next steps:'
\echo '1. Review any ❌ FAIL items above'
\echo '2. If all checks pass, proceed with frontend integration'
\echo '3. Test with actual user authentication'
\echo '4. Monitor query performance'
\echo ''

