// Common types used across the application
export type ErrorResponse = {
  message: string;
  code: string;
  details?: Record<string, unknown>;
};

export type ApiResponse<T> = {
  data: T | null;
  error: ErrorResponse | null;
  metadata?: {
    count?: number;
    page?: number;
    totalPages?: number;
  };
};

export type AuditEvent = {
  id: string;
  timestamp: string;
  actorId: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
};

export type HealthCheckResult = {
  status: 'healthy' | 'degraded' | 'down';
  message?: string;
  timestamp: string;
  metrics?: {
    responseTime: number;
    memory?: number;
    cpu?: number;
  };
};

export type SecurityEvent = {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  message: string;
  timestamp: string;
  metadata: Record<string, unknown>;
};

export type CacheConfig = {
  ttl: number;
  prefix?: string;
  invalidationPatterns?: string[];
};

export type CacheEntry<T> = {
  data: T;
  expires: number;
  metadata?: Record<string, unknown>;
};

export type MonitoringMetric = {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
};

export type BackupMetadata = {
  id: string;
  timestamp: string;
  size: number;
  type: 'full' | 'incremental';
  status: 'pending' | 'complete' | 'failed';
  details: Record<string, unknown>;
};