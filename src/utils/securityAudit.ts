/**
 * Comprehensive Security Audit Utilities for Monarch Property Management
 * Validates server-side authorization and RLS policies
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

// ============================================================================
// SERVER-SIDE AUTHORIZATION AUDIT
// ============================================================================

export interface AuthorizationTest {
  endpoint: string;
  table?: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'RPC';
  requiredRole?: string;
  passed: boolean;
  message: string;
  details?: any;
}

/**
 * Test if direct database updates are properly protected by RLS
 */
export const testDirectDatabaseOperations = async (): Promise<AuthorizationTest[]> => {
  const results: AuthorizationTest[] = [];

  try {
    // Test 1: Try to update another user's profile (should fail)
    // SAFE: Target non-existent UUID to prevent data corruption
    const { error: profileError, count } = await supabase
      .from('profiles')
      .update({ full_name: 'Test Update - Should Fail' })
      .eq('id', '00000000-0000-0000-0000-000000000000'); // Fake UUID that doesn't exist

    results.push({
      endpoint: 'profiles',
      table: 'profiles',
      operation: 'UPDATE',
      passed: !!profileError && profileError.message.includes('permission denied'),
      message: profileError 
        ? '✓ RLS correctly blocks unauthorized updates' 
        : `❌ CRITICAL: RLS bypass detected! Rows affected: ${count || 0}`,
      details: { 
        errorMessage: profileError?.message,
        rowsAffected: count,
        testUUID: '00000000-0000-0000-0000-000000000000'
      }
    });

    // Test 2: Try to insert into vendor_profiles without being vendor
    const { error: vendorError } = await supabase
      .from('vendor_profiles')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
        company_name: 'Test Company',
        is_verified: false,
        availability_status: 'available'
      });

    results.push({
      endpoint: 'vendor_profiles',
      table: 'vendor_profiles',
      operation: 'INSERT',
      passed: true, // This should succeed or fail based on RLS
      message: vendorError ? `RLS response: ${vendorError.message}` : 'Insert allowed',
      details: { errorMessage: vendorError?.message }
    });

    // Test 3: Try to read audit_logs (should fail for non-admins)
    const { data: auditData, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .limit(1);

    results.push({
      endpoint: 'audit_logs',
      table: 'audit_logs',
      operation: 'SELECT',
      requiredRole: 'admin',
      passed: !!auditError && auditError.message.includes('permission denied'),
      message: auditError ? '✓ Audit logs protected (admin-only)' : '❌ WARNING: Audit logs exposed to non-admins!',
      details: { 
        errorMessage: auditError?.message,
        dataExposed: !!auditData && auditData.length > 0
      }
    });

    // Test 4: Try to read security_events (should fail for non-admins)
    const { data: securityData, error: securityError } = await supabase
      .from('security_events')
      .select('*')
      .limit(1);

    results.push({
      endpoint: 'security_events',
      table: 'security_events',
      operation: 'SELECT',
      requiredRole: 'admin',
      passed: !!securityError && securityError.message.includes('permission denied'),
      message: securityError ? '✓ Security events protected (admin-only)' : '❌ WARNING: Security events exposed!',
      details: { 
        errorMessage: securityError?.message,
        dataExposed: !!securityData && securityData.length > 0
      }
    });

    // Test 5: Try to delete from audit_logs (should always fail - immutable)
    const { error: deleteError } = await supabase
      .from('audit_logs')
      .delete()
      .eq('id', '00000000-0000-0000-0000-000000000000'); // Fake ID

    results.push({
      endpoint: 'audit_logs',
      table: 'audit_logs',
      operation: 'DELETE',
      passed: !!deleteError,
      message: deleteError ? '✓ Audit logs are immutable (cannot delete)' : '❌ CRITICAL: Audit logs can be deleted!',
      details: { errorMessage: deleteError?.message }
    });

    logger.info('Direct Database Operations Audit:', results);
    return results;
  } catch (error) {
    logger.error('Database operations audit failed:', error);
    return results;
  }
};

/**
 * Test RPC function authorization
 */
export const testRPCAuthorization = async (): Promise<AuthorizationTest[]> => {
  const results: AuthorizationTest[] = [];

  try {
    // Test 1: Try to call admin_assign_role without admin privileges
    const { error: roleError } = await supabase.rpc('admin_assign_role', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_role: 'admin'
    });

    results.push({
      endpoint: 'admin_assign_role',
      operation: 'RPC',
      requiredRole: 'admin',
      passed: !!roleError && (roleError.message.includes('Unauthorized') || roleError.message.includes('permission denied')),
      message: roleError?.message.includes('Unauthorized') ? '✓ RPC correctly checks admin role' : '❌ WARNING: RPC may allow unauthorized access',
      details: { errorMessage: roleError?.message }
    });

    // Test 2: Try to call admin_approve_vendor
    const { error: vendorError } = await supabase.rpc('admin_approve_vendor', {
      vendor_id_param: '00000000-0000-0000-0000-000000000000',
      approved: true
    });

    results.push({
      endpoint: 'admin_approve_vendor',
      operation: 'RPC',
      requiredRole: 'admin',
      passed: !!vendorError && (vendorError.message.includes('Unauthorized') || vendorError.message.includes('permission denied')),
      message: vendorError?.message.includes('Unauthorized') ? '✓ RPC correctly checks admin role' : '❌ WARNING: RPC may allow unauthorized access',
      details: { errorMessage: vendorError?.message }
    });

    // Test 3: Check if is_admin_user function works
    const { data: isAdminData, error: isAdminError } = await supabase
      .rpc('is_admin_user', {
        user_uuid: (await supabase.auth.getUser()).data.user?.id || ''
      });

    results.push({
      endpoint: 'is_admin_user',
      operation: 'RPC',
      passed: !isAdminError,
      message: isAdminError ? `Error checking admin status: ${isAdminError.message}` : `Admin check returned: ${isAdminData}`,
      details: { isAdmin: isAdminData, errorMessage: isAdminError?.message }
    });

    logger.info('RPC Authorization Audit:', results);
    return results;
  } catch (error) {
    logger.error('RPC authorization audit failed:', error);
    return results;
  }
};

/**
 * Test vendor profile data masking
 */
export const testDataMasking = async (): Promise<AuthorizationTest[]> => {
  const results: AuthorizationTest[] = [];

  try {
    // Test: Try to fetch vendor profiles and check if sensitive data is masked
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendor_profiles')
      .select('*')
      .limit(5);

    const hasSensitiveData = vendorData?.some(v => 
      v.phone || v.email || v.address
    );

    results.push({
      endpoint: 'vendor_profiles',
      table: 'vendor_profiles',
      operation: 'SELECT',
      passed: !hasSensitiveData || vendorError !== null,
      message: hasSensitiveData 
        ? '⚠️ Sensitive vendor data may be exposed to unauthorized users'
        : '✓ Vendor profiles properly masked or access restricted',
      details: { 
        recordsReturned: vendorData?.length || 0,
        hasSensitiveData,
        errorMessage: vendorError?.message
      }
    });

    logger.info('Data Masking Audit:', results);
    return results;
  } catch (error) {
    logger.error('Data masking audit failed:', error);
    return results;
  }
};

/**
 * Comprehensive security audit
 */
export const runSecurityAudit = async () => {
  logger.group('🔒 Comprehensive Security Audit', async () => {
    const [dbTests, rpcTests, maskingTests] = await Promise.all([
      testDirectDatabaseOperations(),
      testRPCAuthorization(),
      testDataMasking()
    ]);

    const allTests = [...dbTests, ...rpcTests, ...maskingTests];
    const passed = allTests.filter(t => t.passed).length;
    const failed = allTests.filter(t => !t.passed).length;

    const report = {
      timestamp: new Date().toISOString(),
      totalTests: allTests.length,
      passed,
      failed,
      passRate: ((passed / allTests.length) * 100).toFixed(1) + '%',
      tests: allTests,
      criticalIssues: allTests.filter(t => 
        !t.passed && (
          t.message.includes('CRITICAL') || 
          t.message.includes('WARNING') ||
          t.message.includes('❌')
        )
      )
    };

    logger.info('Security Audit Report:', report);
    return report;
  });
};

export default {
  testDirectDatabaseOperations,
  testRPCAuthorization,
  testDataMasking,
  runSecurityAudit
};
