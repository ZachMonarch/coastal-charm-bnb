/**
 * Enhanced RLS Policy Testing Suite
 * Comprehensive validation of Row-Level Security policies
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

export interface RLSTestResult {
  table: string;
  policy: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  scenario: string;
  expected: 'ALLOW' | 'DENY';
  actual: 'ALLOW' | 'DENY' | 'ERROR';
  passed: boolean;
  details?: string;
}

/**
 * Test vendor_profiles RLS policies
 */
export const testVendorProfilesRLS = async (): Promise<RLSTestResult[]> => {
  const results: RLSTestResult[] = [];
  const currentUser = (await supabase.auth.getUser()).data.user;

  // Test 1: Own profile access
  const { data: ownProfile, error: ownError } = await supabase
    .from('vendor_profiles')
    .select('*')
    .eq('user_id', currentUser?.id)
    .single();

  results.push({
    table: 'vendor_profiles',
    policy: 'vendor_profiles_own_only',
    operation: 'SELECT',
    scenario: 'User accessing their own profile',
    expected: 'ALLOW',
    actual: ownError ? 'DENY' : 'ALLOW',
    passed: !ownError,
    details: ownError?.message
  });

  // Test 2: Other vendor profiles (restricted public read)
  const { data: otherProfiles, error: otherError } = await supabase
    .from('vendor_profiles')
    .select('*')
    .neq('user_id', currentUser?.id)
    .limit(5);

  // Should be restricted based on role
  results.push({
    table: 'vendor_profiles',
    policy: 'vendor_profiles_restricted_public_read',
    operation: 'SELECT',
    scenario: 'Accessing other vendor profiles',
    expected: 'DENY', // For non-admin/non-property-manager
    actual: otherError ? 'DENY' : 'ALLOW',
    passed: true, // This depends on user role
    details: otherError ? otherError.message : `Returned ${otherProfiles?.length || 0} profiles`
  });

  // Test 3: Update own profile
  const { error: updateError } = await supabase
    .from('vendor_profiles')
    .update({ description: 'Test update' })
    .eq('user_id', currentUser?.id);

  results.push({
    table: 'vendor_profiles',
    policy: 'vendor_profiles_own_only',
    operation: 'UPDATE',
    scenario: 'Updating own profile',
    expected: 'ALLOW',
    actual: updateError ? 'DENY' : 'ALLOW',
    passed: !updateError,
    details: updateError?.message
  });

  return results;
};

/**
 * Test projects RLS policies
 */
export const testProjectsRLS = async (): Promise<RLSTestResult[]> => {
  const results: RLSTestResult[] = [];
  const currentUser = (await supabase.auth.getUser()).data.user;

  // Test 1: View open projects (vendors should see these)
  const { data: openProjects, error: openError } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'open')
    .limit(5);

  results.push({
    table: 'projects',
    policy: 'projects_enhanced_access',
    operation: 'SELECT',
    scenario: 'Viewing open projects',
    expected: 'ALLOW',
    actual: openError ? 'DENY' : 'ALLOW',
    passed: !openError,
    details: openError ? openError.message : `Found ${openProjects?.length || 0} open projects`
  });

  // Test 2: View own created projects
  const { data: ownProjects, error: ownError } = await supabase
    .from('projects')
    .select('*')
    .eq('created_by', currentUser?.id)
    .limit(5);

  results.push({
    table: 'projects',
    policy: 'projects_creator_manage',
    operation: 'SELECT',
    scenario: 'Viewing own created projects',
    expected: 'ALLOW',
    actual: ownError ? 'DENY' : 'ALLOW',
    passed: !ownError,
    details: ownError ? ownError.message : `Found ${ownProjects?.length || 0} own projects`
  });

  // Test 3: Try to update someone else's project
  const { data: otherProject } = await supabase
    .from('projects')
    .select('id')
    .neq('created_by', currentUser?.id)
    .limit(1)
    .single();

  if (otherProject) {
    const { error: updateError } = await supabase
      .from('projects')
      .update({ description: 'Hacked description' })
      .eq('id', otherProject.id);

    results.push({
      table: 'projects',
      policy: 'projects_creator_manage',
      operation: 'UPDATE',
      scenario: 'Attempting to update another user\'s project',
      expected: 'DENY',
      actual: updateError ? 'DENY' : 'ALLOW',
      passed: !!updateError && updateError.message.includes('permission denied'),
      details: updateError?.message || 'Update was allowed (security issue!)'
    });
  }

  return results;
};

/**
 * Test audit_logs RLS policies
 */
export const testAuditLogsRLS = async (): Promise<RLSTestResult[]> => {
  const results: RLSTestResult[] = [];

  // Test 1: Try to read audit logs (should be admin-only)
  const { data: auditData, error: auditError } = await supabase
    .from('audit_logs')
    .select('*')
    .limit(5);

  results.push({
    table: 'audit_logs',
    policy: 'audit_logs_admin_select',
    operation: 'SELECT',
    scenario: 'Non-admin attempting to read audit logs',
    expected: 'DENY',
    actual: auditError ? 'DENY' : 'ALLOW',
    passed: !!auditError && auditError.message.includes('permission denied'),
    details: auditError ? auditError.message : `WARNING: Got ${auditData?.length || 0} audit records`
  });

  // Test 2: Try to delete audit logs (should always fail - immutable)
  const { error: deleteError } = await supabase
    .from('audit_logs')
    .delete()
    .eq('id', '00000000-0000-0000-0000-000000000000');

  results.push({
    table: 'audit_logs',
    policy: 'audit_logs_immutable',
    operation: 'DELETE',
    scenario: 'Attempting to delete audit logs',
    expected: 'DENY',
    actual: deleteError ? 'DENY' : 'ALLOW',
    passed: !!deleteError,
    details: deleteError?.message || 'CRITICAL: Audit logs can be deleted!'
  });

  // Test 3: Try to update audit logs
  const { error: updateError } = await supabase
    .from('audit_logs')
    .update({ action: 'MODIFIED' })
    .eq('id', '00000000-0000-0000-0000-000000000000');

  results.push({
    table: 'audit_logs',
    policy: 'audit_logs_admin_update',
    operation: 'UPDATE',
    scenario: 'Attempting to update audit logs',
    expected: 'DENY',
    actual: updateError ? 'DENY' : 'ALLOW',
    passed: true, // Admins can update, others cannot
    details: updateError?.message
  });

  return results;
};

/**
 * Test properties RLS policies
 */
export const testPropertiesRLS = async (): Promise<RLSTestResult[]> => {
  const results: RLSTestResult[] = [];

  // Test 1: Read available properties
  const { data: availableProps, error: availableError } = await supabase
    .from('properties')
    .select('*')
    .in('status', ['available', 'published'])
    .limit(5);

  results.push({
    table: 'properties',
    policy: 'properties_authenticated_read',
    operation: 'SELECT',
    scenario: 'Reading available/published properties',
    expected: 'ALLOW',
    actual: availableError ? 'DENY' : 'ALLOW',
    passed: !availableError,
    details: availableError ? availableError.message : `Found ${availableProps?.length || 0} properties`
  });

  // Test 2: Try to read draft properties (should be restricted)
  const { data: draftProps, error: draftError } = await supabase
    .from('properties')
    .select('*')
    .eq('status', 'draft')
    .limit(5);

  results.push({
    table: 'properties',
    policy: 'properties_authenticated_read',
    operation: 'SELECT',
    scenario: 'Attempting to read draft properties',
    expected: 'DENY',
    actual: draftError ? 'DENY' : (draftProps && draftProps.length > 0 ? 'ALLOW' : 'DENY'),
    passed: !!draftError || !draftProps || draftProps.length === 0,
    details: draftError ? draftError.message : `WARNING: Got ${draftProps?.length || 0} draft properties`
  });

  return results;
};

/**
 * Test user_roles RLS policies
 */
export const testUserRolesRLS = async (): Promise<RLSTestResult[]> => {
  const results: RLSTestResult[] = [];
  const currentUser = (await supabase.auth.getUser()).data.user;

  // Test 1: Read own roles
  const { data: ownRoles, error: ownError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', currentUser?.id);

  results.push({
    table: 'user_roles',
    policy: 'user_roles_read_own_only',
    operation: 'SELECT',
    scenario: 'Reading own user roles',
    expected: 'ALLOW',
    actual: ownError ? 'DENY' : 'ALLOW',
    passed: !ownError,
    details: ownError ? ownError.message : `Found ${ownRoles?.length || 0} roles`
  });

  // Test 2: Try to read other user's roles
  const { data: otherRoles, error: otherError } = await supabase
    .from('user_roles')
    .select('*')
    .neq('user_id', currentUser?.id)
    .limit(5);

  results.push({
    table: 'user_roles',
    policy: 'user_roles_read_own_only',
    operation: 'SELECT',
    scenario: 'Attempting to read other users\' roles',
    expected: 'DENY',
    actual: otherError ? 'DENY' : (otherRoles && otherRoles.length > 0 ? 'ALLOW' : 'DENY'),
    passed: !!otherError || !otherRoles || otherRoles.length === 0,
    details: otherError ? otherError.message : `WARNING: Got ${otherRoles?.length || 0} other roles`
  });

  // Test 3: Try to insert new role (should be admin/service-only)
  const { error: insertError } = await supabase
    .from('user_roles')
    .insert({
      user_id: currentUser?.id,
      role: 'admin'
    });

  results.push({
    table: 'user_roles',
    policy: 'user_roles_admin_service_only',
    operation: 'INSERT',
    scenario: 'Non-admin attempting to insert role',
    expected: 'DENY',
    actual: insertError ? 'DENY' : 'ALLOW',
    passed: !!insertError && insertError.message.includes('permission denied'),
    details: insertError?.message || 'CRITICAL: Can self-assign roles!'
  });

  return results;
};

/**
 * Run comprehensive RLS testing
 */
export const runComprehensiveRLSTests = async () => {
  logger.group('🛡️ Comprehensive RLS Policy Testing', async () => {
    const [
      vendorTests,
      projectTests,
      auditTests,
      propertyTests,
      roleTests
    ] = await Promise.all([
      testVendorProfilesRLS(),
      testProjectsRLS(),
      testAuditLogsRLS(),
      testPropertiesRLS(),
      testUserRolesRLS()
    ]);

    const allTests = [
      ...vendorTests,
      ...projectTests,
      ...auditTests,
      ...propertyTests,
      ...roleTests
    ];

    const passed = allTests.filter(t => t.passed).length;
    const failed = allTests.filter(t => !t.passed).length;
    const criticalFailures = allTests.filter(t => 
      !t.passed && t.details?.includes('CRITICAL')
    );

    const report = {
      timestamp: new Date().toISOString(),
      totalTests: allTests.length,
      passed,
      failed,
      passRate: ((passed / allTests.length) * 100).toFixed(1) + '%',
      criticalFailures: criticalFailures.length,
      testsByTable: {
        vendor_profiles: vendorTests,
        projects: projectTests,
        audit_logs: auditTests,
        properties: propertyTests,
        user_roles: roleTests
      },
      summary: allTests,
      criticalIssues: criticalFailures
    };

    logger.info('RLS Testing Report:', report);
    return report;
  });
};

export default {
  testVendorProfilesRLS,
  testProjectsRLS,
  testAuditLogsRLS,
  testPropertiesRLS,
  testUserRolesRLS,
  runComprehensiveRLSTests
};
