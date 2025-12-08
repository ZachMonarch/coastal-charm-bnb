/**
 * Authentication Flow Testing Script
 * 
 * Tests authentication flows with different key types to ensure:
 * 1. Anon key works for public/authenticated queries
 * 2. Service role key is never exposed to client
 * 3. RLS policies are properly enforced
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yhegaaqxmuhszesbjtdo.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface TestResult {
  role: string;
  test: string;
  success: boolean;
  error?: string;
  data?: any;
  rowCount?: number;
}

const results: TestResult[] = [];

/**
 * Test anon key access
 */
async function testAnonAccess() {
  console.log('\n🔍 Testing Anon Key Access...');
  
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  
  // Test 1: Public read access (should work if RLS allows)
  try {
    const { data, error } = await anonClient
      .from('profiles')
      .select('id, full_name, role')
      .limit(1);
    
    results.push({
      role: 'anon',
      test: 'profiles_read',
      success: !error,
      error: error?.message,
      rowCount: data?.length || 0
    });
    
    console.log(`✓ Profiles read: ${!error ? 'SUCCESS' : 'BLOCKED'}`);
  } catch (err: any) {
    results.push({
      role: 'anon',
      test: 'profiles_read',
      success: false,
      error: err.message
    });
    console.log(`✗ Profiles read: ERROR - ${err.message}`);
  }
  
  // Test 2: Realtime messages view (should be blocked without auth)
  try {
    const { data, error } = await anonClient
      .from('realtime_messages_view')
      .select('topic')
      .limit(1);
    
    results.push({
      role: 'anon',
      test: 'realtime_messages_view_read',
      success: !error,
      error: error?.message,
      rowCount: data?.length || 0
    });
    
    console.log(`✓ Realtime messages view: ${!error ? 'ACCESSIBLE' : 'BLOCKED (expected)'}`);
  } catch (err: any) {
    results.push({
      role: 'anon',
      test: 'realtime_messages_view_read',
      success: false,
      error: err.message
    });
    console.log(`✗ Realtime messages view: ERROR - ${err.message}`);
  }
  
  // Test 3: Test connection RPC (if available)
  try {
    const { data, error } = await anonClient.rpc('test_connection');
    
    results.push({
      role: 'anon',
      test: 'test_connection_rpc',
      success: !error,
      error: error?.message,
      data: data
    });
    
    console.log(`✓ Test connection RPC: ${!error ? 'SUCCESS' : 'BLOCKED'}`);
    if (data) {
      console.log(`  Response: ${data}`);
    }
  } catch (err: any) {
    results.push({
      role: 'anon',
      test: 'test_connection_rpc',
      success: false,
      error: err.message
    });
    console.log(`✗ Test connection RPC: ERROR - ${err.message}`);
  }
}

/**
 * Test service role access (should only work server-side)
 */
async function testServiceRoleAccess() {
  console.log('\n🔐 Testing Service Role Access...');
  
  if (!SERVICE_KEY) {
    console.log('⚠️  Service role key not configured (this is OK for client-only apps)');
    results.push({
      role: 'service',
      test: 'service_key_configured',
      success: false,
      error: 'Service key not set'
    });
    return;
  }
  
  const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY);
  
  // Test 1: Read with service role (bypasses RLS)
  try {
    const { data, error } = await serviceClient
      .from('profiles')
      .select('id, full_name, role')
      .limit(5);
    
    results.push({
      role: 'service',
      test: 'profiles_read',
      success: !error,
      error: error?.message,
      rowCount: data?.length || 0
    });
    
    console.log(`✓ Profiles read: ${!error ? 'SUCCESS' : 'FAILED'} (${data?.length || 0} rows)`);
  } catch (err: any) {
    results.push({
      role: 'service',
      test: 'profiles_read',
      success: false,
      error: err.message
    });
    console.log(`✗ Profiles read: ERROR - ${err.message}`);
  }
  
  // Test 2: Test connection RPC
  try {
    const { data, error } = await serviceClient.rpc('test_connection');
    
    results.push({
      role: 'service',
      test: 'test_connection_rpc',
      success: !error,
      error: error?.message,
      data: data
    });
    
    console.log(`✓ Test connection RPC: ${!error ? 'SUCCESS' : 'FAILED'}`);
    if (data) {
      console.log(`  Response: ${data}`);
    }
  } catch (err: any) {
    results.push({
      role: 'service',
      test: 'test_connection_rpc',
      success: false,
      error: err.message
    });
    console.log(`✗ Test connection RPC: ERROR - ${err.message}`);
  }
}

/**
 * Test client bundle safety
 */
function testClientBundleSafety() {
  console.log('\n🔒 Testing Client Bundle Safety...');
  
  // Check if service key appears in client code
  const clientFilePath = path.join(__dirname, '../src/integrations/supabase/client.ts');
  
  try {
    const clientCode = fs.readFileSync(clientFilePath, 'utf-8');
    const hasServiceKey = clientCode.includes('SERVICE_ROLE') || clientCode.includes('service_role');
    
    results.push({
      role: 'security',
      test: 'client_bundle_safety',
      success: !hasServiceKey,
      error: hasServiceKey ? 'Service role key reference found in client code' : undefined
    });
    
    console.log(`✓ Client bundle safety: ${!hasServiceKey ? 'SAFE' : 'UNSAFE - Service key reference found!'}`);
  } catch (err: any) {
    results.push({
      role: 'security',
      test: 'client_bundle_safety',
      success: false,
      error: err.message
    });
    console.log(`✗ Client bundle safety check: ERROR - ${err.message}`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Starting Authentication Flow Tests');
  console.log('=====================================');
  
  await testAnonAccess();
  await testServiceRoleAccess();
  testClientBundleSafety();
  
  // Generate report
  const timestamp = Date.now();
  const reportPath = path.join(__dirname, '../reports', `auth_flows_${timestamp}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    supabase_url: SUPABASE_URL,
    tests_run: results.length,
    tests_passed: results.filter(r => r.success).length,
    tests_failed: results.filter(r => !r.success).length,
    results
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 Test Summary');
  console.log('=====================================');
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${report.tests_passed}`);
  console.log(`Failed: ${report.tests_failed}`);
  console.log(`\n📄 Report saved to: ${reportPath}`);
  
  // Exit with error code if any tests failed
  if (report.tests_failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});

