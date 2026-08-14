import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Cpu, HardDrive, Activity, AlertTriangle, CheckCircle, Clock,
  RefreshCw, Zap, Users,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Performance monitoring dashboard.
 *
 * All values shown here are measured, never simulated:
 * - Response time: real round-trip latency of a lightweight, bounded
 *   Supabase count query executed from this browser.
 * - Memory: real JS heap usage via performance.memory (Chromium only).
 * - Service status: real probes against the database, storage and the
 *   `health-check` edge function.
 * Metrics we cannot measure from the client (server CPU, concurrent users)
 * are reported as "not instrumented" instead of being faked.
 */

interface PerformanceSample {
  timestamp: number;
  responseTime: number;
  memory: number | null;
}

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'unknown';
  responseTime: number | null;
  detail: string;
  lastCheck: string;
}

const MAX_SAMPLES = 20;
const POLL_INTERVAL_MS = 30000;
const DEGRADED_MS = 800;

function readHeapUsage(): number | null {
  const mem = (performance as Performance & {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
  }).memory;
  if (!mem || !mem.jsHeapSizeLimit) return null;
  return (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; ok: boolean; error?: string }> {
  const start = performance.now();
  try {
    await fn();
    return { ms: performance.now() - start, ok: true };
  } catch (error) {
    return {
      ms: performance.now() - start,
      ok: false,
      error: error instanceof Error ? error.message : 'Probe failed',
    };
  }
}

function classify(ms: number, ok: boolean): ServiceStatus['status'] {
  if (!ok) return 'outage';
  return ms > DEGRADED_MS ? 'degraded' : 'operational';
}

export const PerformanceMonitoringDashboard: React.FC = () => {
  const [samples, setSamples] = useState<PerformanceSample[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  const probe = useCallback(async () => {
    const now = new Date().toISOString();

    // Database probe — bounded, head-only count (no row egress)
    const db = await timed(async () => {
      const { error } = await supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .limit(1);
      if (error) throw error;
    });

    // Storage probe
    const storage = await timed(async () => {
      const { error } = await supabase.storage.from('property-images').list('', { limit: 1 });
      if (error) throw error;
    });

    // Edge function probe
    const edge = await timed(async () => {
      const { error } = await supabase.functions.invoke('health-check', { body: {} });
      if (error) throw error;
    });

    // Auth probe
    const auth = await timed(async () => {
      const { error } = await supabase.auth.getSession();
      if (error) throw error;
    });

    setServices([
      {
        name: 'Database (Postgres)',
        status: classify(db.ms, db.ok),
        responseTime: db.ms,
        detail: db.ok ? 'Bounded count query succeeded' : db.error ?? 'Unavailable',
        lastCheck: now,
      },
      {
        name: 'Auth',
        status: classify(auth.ms, auth.ok),
        responseTime: auth.ms,
        detail: auth.ok ? 'Session endpoint reachable' : auth.error ?? 'Unavailable',
        lastCheck: now,
      },
      {
        name: 'File Storage',
        status: classify(storage.ms, storage.ok),
        responseTime: storage.ms,
        detail: storage.ok ? 'Bucket listing succeeded' : storage.error ?? 'Unavailable',
        lastCheck: now,
      },
      {
        name: 'Edge Functions',
        status: classify(edge.ms, edge.ok),
        responseTime: edge.ms,
        detail: edge.ok ? 'health-check responded' : edge.error ?? 'Unavailable',
        lastCheck: now,
      },
    ]);

    setSamples(prev => {
      const next = [...prev, {
        timestamp: Date.now(),
        responseTime: db.ms,
        memory: readHeapUsage(),
      }];
      return next.slice(-MAX_SAMPLES);
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    probe().catch(error => {
      logger.error('Performance probe failed', error);
      setLoading(false);
    });
  }, [probe]);

  useEffect(() => {
    if (!realTimeEnabled) return;
    const interval = setInterval(() => {
      probe().catch(error => logger.error('Performance probe failed', error));
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [realTimeEnabled, probe]);

  const latest = samples[samples.length - 1];
  const heapSupported = latest?.memory !== null && latest?.memory !== undefined;

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'outage':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'text-success bg-success/10 border-success/20';
      case 'degraded':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'outage':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
  };

  // Score is derived only from measured signals.
  const getPerformanceScore = () => {
    if (!latest || services.length === 0) return 0;
    const latencyScore = Math.max(0, Math.min(100, 100 - (latest.responseTime - 100) / 10));
    const healthyRatio = services.filter(s => s.status === 'operational').length / services.length;
    const availabilityScore = healthyRatio * 100;
    const parts = [latencyScore, availabilityScore];
    if (heapSupported && latest.memory !== null) parts.push(Math.max(0, 100 - latest.memory));
    return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
  };

  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Measuring live performance…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const performanceScore = getPerformanceScore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
          <p className="text-muted-foreground">
            Live, measured client-to-backend performance — no simulated values
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={realTimeEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
            aria-pressed={realTimeEnabled}
          >
            <Activity className="h-4 w-4 mr-2" />
            {realTimeEnabled ? 'Live' : 'Paused'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => probe().catch(error => logger.error('Performance probe failed', error))}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Measured Performance Score</h3>
              <div className="flex items-center space-x-4">
                <div className="text-3xl font-bold text-primary">{performanceScore}</div>
                <div className="flex-1">
                  <Progress value={performanceScore} className="h-3" />
                </div>
                <Badge variant={performanceScore > 80 ? 'default' : performanceScore > 60 ? 'secondary' : 'destructive'}>
                  {performanceScore > 80 ? 'Excellent' : performanceScore > 60 ? 'Good' : 'Needs Attention'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Last measured</div>
              <div className="text-sm font-medium">{formatTime(latest?.timestamp || Date.now())}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">DB Round Trip</p>
                <p className="text-2xl font-bold">{Math.round(latest?.responseTime || 0)}ms</p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <Progress value={Math.max(0, 100 - (latest?.responseTime || 0) / 10)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">JS Heap Usage</p>
                <p className="text-2xl font-bold">
                  {heapSupported ? `${Math.round(latest!.memory as number)}%` : 'N/A'}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-success" />
            </div>
            <div className="mt-2">
              {heapSupported ? (
                <Progress value={latest!.memory as number} className="h-2" />
              ) : (
                <p className="text-xs text-muted-foreground">Not exposed by this browser</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Server CPU</p>
                <p className="text-2xl font-bold">N/A</p>
              </div>
              <Cpu className="h-8 w-8 text-warning" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">Not instrumented — requires an APM provider</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concurrent Users</p>
                <p className="text-2xl font-bold">N/A</p>
              </div>
              <Users className="h-8 w-8 text-accent-foreground" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">Not instrumented — requires analytics ingestion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Database Round-Trip Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={samples}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTime}
                  domain={['dataMin', 'dataMax']}
                  className="text-muted-foreground"
                />
                <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} className="text-muted-foreground" />
                <Tooltip
                  labelFormatter={(value) => formatTime(value as number)}
                  formatter={(value) => [`${Math.round(value as number)}ms`, 'Round trip']}
                />
                <Line type="monotone" dataKey="responseTime" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Memory Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {heapSupported ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={samples}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTime}
                    domain={['dataMin', 'dataMax']}
                    className="text-muted-foreground"
                  />
                  <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} className="text-muted-foreground" />
                  <Tooltip
                    labelFormatter={(value) => formatTime(value as number)}
                    formatter={(value) => [`${Math.round(value as number)}%`, 'JS heap']}
                  />
                  <Line type="monotone" dataKey="memory" stroke="hsl(var(--chart-2))" strokeWidth={2} name="JS heap" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-center text-sm text-muted-foreground">
                Heap metrics are not available in this browser.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Probes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.name} className="flex flex-wrap items-center justify-between gap-3 p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <h4 className="font-medium">{service.name}</h4>
                    <p className="text-sm text-muted-foreground">{service.detail}</p>
                    <p className="text-xs text-muted-foreground">
                      Last checked: {new Date(service.lastCheck).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {service.responseTime !== null ? `${Math.round(service.responseTime)}ms` : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">round trip</div>
                  </div>
                  <Badge className={getStatusColor(service.status)}>{service.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {performanceScore < 70 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Performance Alert:</strong> Measured latency or service availability is below target.
            Check the failing probe above and the Supabase logs.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PerformanceMonitoringDashboard;
