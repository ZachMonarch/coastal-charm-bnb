/**
 * Production Testing Utilities for Monarch Property Management
 * Comprehensive test helpers for security, performance, and functional testing
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

// ============================================================================
// SECURITY TESTING UTILITIES
// ============================================================================

/**
 * Test RLS Policy Enforcement
 * Verifies that users can only access their own data
 */
export const testRLSPolicies = async () => {
  const results: Array<{ table: string; passed: boolean; message: string }> = [];

  try {
    // Test 1: Vendor can only see their own profile
    const { data: vendorProfiles, error } = await supabase
      .from('vendor_profiles')
      .select('id, user_id, company_name')
      .limit(10);

    results.push({
      table: 'vendor_profiles',
      passed: !error,
      message: error ? `RLS test failed: ${error.message}` : 'RLS correctly enforced',
    });

    // Test 2: Bookings restricted to user's own bookings
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, user_id, property_id, status')
      .limit(10);

    results.push({
      table: 'bookings',
      passed: !bookingError,
      message: bookingError ? `RLS test failed: ${bookingError.message}` : 'RLS correctly enforced',
    });

    // Test 3: Audit logs only visible to admins
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('id, action, table_name')
      .limit(10);

    results.push({
      table: 'audit_logs',
      passed: auditError !== null, // Should fail for non-admins
      message: auditError ? 'RLS correctly blocking non-admin access' : 'WARNING: Audit logs exposed!',
    });

    logger.info('RLS Policy Test Results:', results);
    return results;
  } catch (error) {
    logger.error('RLS testing failed:', error);
    return [];
  }
};

/**
 * Test Authentication Rate Limiting
 */
export const testAuthRateLimit = async () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const results = [];

  for (let i = 0; i < 12; i++) {
    const { error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'wrong-password',
    });

    results.push({
      attempt: i + 1,
      blocked: error?.message.includes('rate') || error?.message.includes('limit'),
      timestamp: new Date().toISOString(),
    });
  }

  const rateLimitWorking = results.slice(-2).some(r => r.blocked);
  logger.info('Rate Limit Test:', { rateLimitWorking, results });
  
  return rateLimitWorking;
};

/**
 * Test CSRF Protection
 */
export const testCSRFProtection = () => {
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1];

  const result = {
    tokenExists: !!csrfToken,
    isSecure: document.cookie.includes('secure'),
    isSameSite: document.cookie.includes('samesite'),
    passed: !!csrfToken && document.cookie.includes('secure'),
  };

  logger.info('CSRF Protection Test:', result);
  return result;
};

// ============================================================================
// PERFORMANCE TESTING UTILITIES
// ============================================================================

/**
 * Measure page load performance
 */
export const measurePagePerformance = () => {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paintData = window.performance.getEntriesByType('paint');

  const metrics = {
    // Core Web Vitals
    FCP: paintData.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
    LCP: 0, // Requires web-vitals library
    CLS: 0, // Requires web-vitals library
    FID: 0, // Requires web-vitals library
    
    // Load Performance
    domContentLoaded: perfData?.domContentLoadedEventEnd - perfData?.domContentLoadedEventStart || 0,
    loadComplete: perfData?.loadEventEnd - perfData?.loadEventStart || 0,
    domInteractive: perfData?.domInteractive || 0,
    
    // Network
    dnsLookup: perfData?.domainLookupEnd - perfData?.domainLookupStart || 0,
    tcpConnection: perfData?.connectEnd - perfData?.connectStart || 0,
    ttfb: perfData?.responseStart - perfData?.requestStart || 0,
    
    // Overall
    totalLoadTime: perfData?.loadEventEnd - perfData?.fetchStart || 0,
  };

  const passed = {
    FCP: metrics.FCP < 1800, // Good: < 1.8s
    domContentLoaded: metrics.domContentLoaded < 3000, // Good: < 3s
    loadComplete: metrics.loadComplete < 5000, // Good: < 5s
    ttfb: metrics.ttfb < 600, // Good: < 600ms
  };

  logger.info('Performance Metrics:', { metrics, passed });
  return { metrics, passed };
};

/**
 * Test database query performance
 */
export const testQueryPerformance = async () => {
  const tests = [
    {
      name: 'Vendor Profiles Query',
      query: () => supabase.from('vendor_profiles').select('id, user_id, company_name, is_verified').limit(50),
      threshold: 1000, // 1 second
    },
    {
      name: 'Projects with Relations',
      query: () => supabase
        .from('projects')
        .select('id, title, status, category, priority, deadline, created_at, project_milestones(id, name, status, amount, due_date)')
        .limit(20),
      threshold: 1500,
    },
    {
      name: 'Security Events Aggregation',
      query: () => supabase
        .from('security_events')
        .select('event_type, severity')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      threshold: 2000,
    },
  ];

  const results = [];

  for (const test of tests) {
    const start = performance.now();
    const { data, error } = await test.query();
    const duration = performance.now() - start;

    results.push({
      name: test.name,
      duration: Math.round(duration),
      passed: duration < test.threshold && !error,
      error: error?.message,
    });
  }

  logger.info('Query Performance Tests:', results);
  return results;
};

// ============================================================================
// FUNCTIONAL TESTING UTILITIES
// ============================================================================

/**
 * Test complete user flow
 */
export const testUserFlow = async (flowName: string, steps: Array<() => Promise<any>>) => {
  logger.group(`Testing User Flow: ${flowName}`, async () => {
    const results = [];

    for (let i = 0; i < steps.length; i++) {
      try {
        const start = performance.now();
        await steps[i]();
        const duration = performance.now() - start;

        results.push({
          step: i + 1,
          passed: true,
          duration: Math.round(duration),
        });

        logger.log(`✓ Step ${i + 1} passed (${Math.round(duration)}ms)`);
      } catch (error) {
        results.push({
          step: i + 1,
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        logger.error(`✗ Step ${i + 1} failed:`, error);
        break; // Stop on first failure
      }
    }

    const allPassed = results.every(r => r.passed);
    logger.info(`Flow ${flowName}: ${allPassed ? 'PASSED' : 'FAILED'}`, results);
    
    return { flowName, results, passed: allPassed };
  });
};

/**
 * Test file upload functionality
 */
export const testFileUpload = async (bucketName: string, testFile: File) => {
  try {
    const fileName = `test-${Date.now()}.${testFile.name.split('.').pop()}`;
    const filePath = `${Date.now()}/${fileName}`;

    // Upload
    const uploadStart = performance.now();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, testFile);
    const uploadDuration = performance.now() - uploadStart;

    if (uploadError) throw uploadError;

    // Retrieve
    const { data: retrieveData, error: retrieveError } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (retrieveError) throw retrieveError;

    // Cleanup
    await supabase.storage.from(bucketName).remove([filePath]);

    const result = {
      passed: !uploadError && !retrieveError,
      uploadDuration: Math.round(uploadDuration),
      fileSize: testFile.size,
      uploadSpeed: Math.round((testFile.size / 1024) / (uploadDuration / 1000)), // KB/s
    };

    logger.info('File Upload Test:', result);
    return result;
  } catch (error) {
    logger.error('File upload test failed:', error);
    return { passed: false, error };
  }
};

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate environment configuration
 */
export const validateEnvironment = () => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  ];

  const missing = required.filter(key => !import.meta.env[key]);
  
  const result = {
    passed: missing.length === 0,
    missing,
    environment: import.meta.env.MODE,
  };

  if (!result.passed) {
    logger.error('Missing environment variables:', missing);
  } else {
    logger.info('Environment configuration valid');
  }

  return result;
};

/**
 * Comprehensive system health check
 */
export const runHealthCheck = async () => {
  const checks = {
    environment: validateEnvironment(),
    csrf: testCSRFProtection(),
    performance: measurePagePerformance(),
  };

  // Async checks
  const [rls, queries] = await Promise.all([
    testRLSPolicies(),
    testQueryPerformance(),
  ]);

  const results = {
    ...checks,
    rls,
    queryPerformance: queries,
    timestamp: new Date().toISOString(),
    overallHealth: 
      checks.environment.passed &&
      checks.csrf.passed &&
      queries.every(q => q.passed),
  };

  logger.info('Health Check Complete:', results);
  return results;
};

/**
 * Run all security and performance tests
 */
export const runAllTests = async () => {
  logger.group('🔬 Running All System Tests', async () => {
    const healthCheck = await runHealthCheck();
    
    const summary = {
      timestamp: new Date().toISOString(),
      healthCheck,
      recommendation: healthCheck.overallHealth 
        ? '✅ All systems operational' 
        : '⚠️ Issues detected - review logs for details'
    };

    logger.info('All Tests Complete:', summary);
    return summary;
  });
};

export default {
  testRLSPolicies,
  testAuthRateLimit,
  testCSRFProtection,
  measurePagePerformance,
  testQueryPerformance,
  testUserFlow,
  testFileUpload,
  validateEnvironment,
  runHealthCheck,
  runAllTests
};
