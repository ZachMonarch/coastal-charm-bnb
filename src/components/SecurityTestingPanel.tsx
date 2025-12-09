import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Play, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { runComprehensiveRLSTests } from '@/utils/enhancedRLSTesting';
import { runSecurityAudit } from '@/utils/securityAudit';
import { runAllTests } from '@/utils/testUtilities';
import { toast } from 'sonner';

export default function SecurityTestingPanel() {
  const [running, setRunning] = useState(false);
  const [rlsResults, setRlsResults] = useState<any>(null);
  const [auditResults, setAuditResults] = useState<any>(null);
  const [performanceResults, setPerformanceResults] = useState<any>(null);

  const runRLSTests = async () => {
    setRunning(true);
    try {
      const results = await runComprehensiveRLSTests();
      setRlsResults(results);
      toast.success('RLS tests completed');
    } catch (error) {
      toast.error('RLS tests failed');
      console.error(error);
    } finally {
      setRunning(false);
    }
  };

  const runSecurityTests = async () => {
    // Confirmation dialog
    const confirmed = window.confirm(
      '⚠️ Run Security Audit?\n\n' +
      'This will test RLS policies and authorization.\n' +
      'Tests use fake UUIDs and will NOT modify production data.\n\n' +
      'All test actions are logged for audit purposes.\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setRunning(true);
    try {
      const results = await runSecurityAudit();
      setAuditResults(results);
      toast.success('Security audit completed');
    } catch (error) {
      toast.error('Security audit failed');
      console.error(error);
    } finally {
      setRunning(false);
    }
  };

  const runPerformanceTests = async () => {
    setRunning(true);
    try {
      const results = await runAllTests();
      setPerformanceResults(results);
      toast.success('Performance tests completed');
    } catch (error) {
      toast.error('Performance tests failed');
      console.error(error);
    } finally {
      setRunning(false);
    }
  };

  const runAllTestSuites = async () => {
    setRunning(true);
    try {
      const [rls, audit, perf] = await Promise.all([
        runComprehensiveRLSTests(),
        runSecurityAudit(),
        runAllTests()
      ]);
      setRlsResults(rls);
      setAuditResults(audit);
      setPerformanceResults(perf);
      toast.success('All tests completed');
    } catch (error) {
      toast.error('Some tests failed');
      console.error(error);
    } finally {
      setRunning(false);
    }
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="h-4 w-4 text-success" />
    ) : (
      <XCircle className="h-4 w-4 text-destructive" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Security Warning Banner */}
      <Alert variant="destructive" className="border-2">
        <AlertTriangle className="h-5 w-5" />
        <AlertDescription>
          <strong className="block mb-2">⚠️ CRITICAL: Security Testing Mode</strong>
          <p className="text-sm">These tests use safe, non-modifying queries with fake UUIDs (00000000-0000-0000-0000-000000000000).</p>
          <p className="text-sm mt-1">No production data will be affected. All tests are logged for audit purposes.</p>
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Security Testing Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive security and performance validation
          </p>
        </div>
        <Button 
          onClick={runAllTestSuites} 
          disabled={running}
          className="gap-2"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run All Tests
        </Button>
      </div>

      {/* Test Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">RLS Policies</CardTitle>
            <CardDescription className="text-xs">Test Row-Level Security</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runRLSTests} disabled={running} className="w-full" variant="outline">
              {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Test RLS
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security Audit</CardTitle>
            <CardDescription className="text-xs">Test authorization & masking</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runSecurityTests} disabled={running} className="w-full" variant="outline">
              {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Run Audit
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance</CardTitle>
            <CardDescription className="text-xs">Test query & page speed</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runPerformanceTests} disabled={running} className="w-full" variant="outline">
              {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Test Performance
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* RLS Results */}
      {rlsResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>RLS Policy Test Results</span>
              <Badge variant={rlsResults.criticalFailures === 0 ? 'default' : 'destructive'}>
                {rlsResults.passRate} Pass Rate
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Tests: {rlsResults.totalTests}</span>
                <span className="text-success">Passed: {rlsResults.passed}</span>
                <span className="text-destructive">Failed: {rlsResults.failed}</span>
              </div>

              {rlsResults.criticalIssues?.length > 0 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {rlsResults.criticalIssues.length} critical security issues detected!
                  </AlertDescription>
                </Alert>
              )}

              <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
                {rlsResults.summary?.map((test: any, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-2 border rounded text-sm">
                    {getStatusIcon(test.passed)}
                    <div className="flex-1">
                      <div className="font-medium">{test.table} - {test.operation}</div>
                      <div className="text-xs text-muted-foreground">{test.scenario}</div>
                      {test.details && (
                        <div className="text-xs text-muted-foreground mt-1">{test.details}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Audit Results */}
      {auditResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Security Audit Results</span>
              <Badge variant={auditResults.criticalIssues?.length === 0 ? 'default' : 'destructive'}>
                {auditResults.passRate} Pass Rate
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Tests: {auditResults.totalTests}</span>
                <span className="text-success">Passed: {auditResults.passed}</span>
                <span className="text-destructive">Failed: {auditResults.failed}</span>
              </div>

              {auditResults.criticalIssues?.length > 0 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {auditResults.criticalIssues.length} critical security vulnerabilities found!
                  </AlertDescription>
                </Alert>
              )}

              <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
                {auditResults.tests?.map((test: any, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-2 border rounded text-sm">
                    {getStatusIcon(test.passed)}
                    <div className="flex-1">
                      <div className="font-medium">{test.endpoint || test.table} - {test.operation}</div>
                      <div className="text-xs">{test.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Results */}
      {performanceResults && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Overall Health</span>
                <Badge variant={performanceResults.healthCheck?.overallHealth ? 'default' : 'destructive'}>
                  {performanceResults.healthCheck?.overallHealth ? 'Healthy' : 'Issues Detected'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{performanceResults.recommendation}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
