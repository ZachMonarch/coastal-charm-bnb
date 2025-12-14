/**
 * Real-Time Security Monitoring and Alerting System
 * Monitors security events and triggers alerts for suspicious activity
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';
import { toast } from 'sonner';

export interface SecurityAlert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  eventType: string;
  message: string;
  details: any;
  timestamp: string;
  userId?: string;
}

export interface MonitoringConfig {
  enableRealtime: boolean;
  alertThresholds: {
    failedLogins: number;
    unauthorizedAttempts: number;
    suspiciousActivity: number;
  };
  alertChannels: {
    toast: boolean;
    console: boolean;
    database: boolean;
  };
}

const DEFAULT_CONFIG: MonitoringConfig = {
  enableRealtime: true,
  alertThresholds: {
    failedLogins: 5,
    unauthorizedAttempts: 3,
    suspiciousActivity: 10,
  },
  alertChannels: {
    toast: true,
    console: true,
    database: true,
  },
};

class SecurityMonitor {
  private config: MonitoringConfig;
  private alertCache: Map<string, number> = new Map();
  private realtimeChannel: any = null;

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize real-time monitoring
   */
  public async initialize() {
    if (!this.config.enableRealtime) return;

    // Subscribe to security events
    this.realtimeChannel = supabase
      .channel('security-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events',
        },
        (payload) => this.handleSecurityEvent(payload.new)
      )
      .subscribe();

    logger.info('Security monitoring initialized');
  }

  /**
   * Stop real-time monitoring
   */
  public async shutdown() {
    if (this.realtimeChannel) {
      await supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    logger.info('Security monitoring stopped');
  }

  /**
   * Handle incoming security event
   */
  private async handleSecurityEvent(event: any) {
    const alert = this.analyzeEvent(event);
    if (alert) {
      await this.triggerAlert(alert);
    }
  }

  /**
   * Analyze security event and determine if alert is needed
   */
  private analyzeEvent(event: any): SecurityAlert | null {
    const eventType = event.event_type;
    const severity = event.severity;

    // Critical events always trigger alerts
    if (severity === 'critical') {
      return {
        id: event.id,
        severity: 'critical',
        eventType,
        message: this.getAlertMessage(eventType),
        details: event.details,
        timestamp: event.created_at,
        userId: event.user_id,
      };
    }

    // Check for repeated suspicious activity
    const cacheKey = `${event.user_id || 'anonymous'}-${eventType}`;
    const count = (this.alertCache.get(cacheKey) || 0) + 1;
    this.alertCache.set(cacheKey, count);

    // Clear cache after 15 minutes
    setTimeout(() => this.alertCache.delete(cacheKey), 15 * 60 * 1000);

    // Trigger alert if threshold exceeded
    if (this.shouldAlert(eventType, count)) {
      return {
        id: event.id,
        severity: this.calculateSeverity(eventType, count),
        eventType,
        message: this.getAlertMessage(eventType, count),
        details: event.details,
        timestamp: event.created_at,
        userId: event.user_id,
      };
    }

    return null;
  }

  /**
   * Determine if alert should be triggered
   */
  private shouldAlert(eventType: string, count: number): boolean {
    const thresholds = this.config.alertThresholds;

    switch (eventType) {
      case 'AUTH_FAILED':
      case 'AUTH_BRUTE_FORCE_DETECTED':
        return count >= thresholds.failedLogins;
      
      case 'AUTHORIZATION_FAILURE':
      case 'UNAUTHORIZED_ACCESS_ATTEMPT':
        return count >= thresholds.unauthorizedAttempts;
      
      case 'SUSPICIOUS_ACTIVITY':
      case 'RATE_LIMIT_EXCEEDED':
        return count >= thresholds.suspiciousActivity;
      
      default:
        return false;
    }
  }

  /**
   * Calculate severity based on event type and frequency
   */
  private calculateSeverity(
    eventType: string,
    count: number
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (count >= 10) return 'critical';
    
    const highSeverityEvents = [
      'AUTH_BRUTE_FORCE_DETECTED',
      'PRIVILEGE_ESCALATION_ATTEMPT',
      'DATA_BREACH_ATTEMPT',
    ];

    if (highSeverityEvents.includes(eventType)) return 'high';
    if (count >= 5) return 'high';
    if (count >= 3) return 'medium';
    return 'low';
  }

  /**
   * Get human-readable alert message
   */
  private getAlertMessage(eventType: string, count?: number): string {
    const messages: Record<string, string> = {
      AUTH_FAILED: 'Multiple failed login attempts detected',
      AUTH_BRUTE_FORCE_DETECTED: '🚨 Brute force attack detected',
      AUTHORIZATION_FAILURE: 'Unauthorized access attempts detected',
      UNAUTHORIZED_ACCESS_ATTEMPT: 'User attempting to access restricted resources',
      PRIVILEGE_ESCALATION_ATTEMPT: '🚨 Privilege escalation attempt detected',
      SUSPICIOUS_ACTIVITY: 'Suspicious activity pattern detected',
      RATE_LIMIT_EXCEEDED: 'Rate limit exceeded - potential DoS attack',
      DATA_BREACH_ATTEMPT: '🚨 Potential data breach attempt',
      SQL_INJECTION_ATTEMPT: '🚨 SQL injection attack detected',
      XSS_ATTEMPT: '🚨 Cross-site scripting attack detected',
    };

    const baseMessage = messages[eventType] || 'Security event detected';
    return count ? `${baseMessage} (${count} attempts)` : baseMessage;
  }

  /**
   * Trigger alert through configured channels
   */
  private async triggerAlert(alert: SecurityAlert) {
    logger.warn('Security Alert:', alert);

    // Toast notification for critical/high alerts
    if (this.config.alertChannels.toast && ['critical', 'high'].includes(alert.severity)) {
      toast.error(alert.message, {
        description: `Event: ${alert.eventType}`,
        duration: 10000,
      });
    }

    // Console alert
    if (this.config.alertChannels.console) {
      const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
      console.warn(`${emoji} SECURITY ALERT [${alert.severity.toUpperCase()}]:`, {
        message: alert.message,
        eventType: alert.eventType,
        timestamp: alert.timestamp,
        details: alert.details,
      });
    }

    // Store alert in database
    if (this.config.alertChannels.database) {
      await this.storeAlert(alert);
    }

    // For critical alerts, also send to admin dashboard
    if (alert.severity === 'critical') {
      await this.notifyAdmins(alert);
    }
  }

  /**
   * Store alert in database for historical tracking
   */
  private async storeAlert(alert: SecurityAlert) {
    try {
      await supabase.from('security_events').insert({
        event_type: 'SECURITY_ALERT',
        severity: alert.severity,
        user_id: alert.userId,
        details: {
          alert_id: alert.id,
          original_event: alert.eventType,
          message: alert.message,
          alert_details: alert.details,
        },
      });
    } catch (error) {
      console.error('Failed to store security alert:', error);
    }
  }

  /**
   * Notify admin users of critical security events
   */
  private async notifyAdmins(alert: SecurityAlert) {
    try {
      // Get all admin users
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (!adminRoles || adminRoles.length === 0) return;

      // Create notifications for each admin
      const notifications = adminRoles.map((admin) => ({
        user_id: admin.user_id,
        title: '🚨 Critical Security Alert',
        message: alert.message,
        type: 'critical',
        priority: 'high',
        category: 'security',
        action_url: '/admin/security',
      }));

      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Failed to notify admins:', error);
    }
  }

  /**
   * Get recent security alerts
   */
  public async getRecentAlerts(limit: number = 10): Promise<SecurityAlert[]> {
    const { data, error } = await supabase
      .from('security_events')
      .select('id, event_type, severity, details, created_at, user_id')
      .eq('event_type', 'SECURITY_ALERT')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch security alerts:', error);
      return [];
    }

    return (data || []).map((event) => {
      const details = event.details as any || {};
      return {
        id: event.id,
        severity: event.severity as 'critical' | 'high' | 'medium' | 'low',
        eventType: details.original_event || 'UNKNOWN',
        message: details.message || 'Security alert',
        details: details.alert_details || {},
        timestamp: event.created_at,
        userId: event.user_id,
      };
    });
  }

  /**
   * Get security metrics for dashboard
   */
  public async getSecurityMetrics(hoursBack: number = 24) {
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('security_events')
      .select('event_type, severity')
      .gte('created_at', since);

    if (error) {
      logger.error('Failed to fetch security metrics:', error);
      return null;
    }

    const metrics = {
      total: data.length,
      critical: data.filter((e) => e.severity === 'critical').length,
      high: data.filter((e) => e.severity === 'high').length,
      medium: data.filter((e) => e.severity === 'medium').length,
      low: data.filter((e) => e.severity === 'low').length,
      byType: data.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return metrics;
  }
}

// Singleton instance
export const securityMonitor = new SecurityMonitor();

// Auto-initialize for admin users
export const initializeSecurityMonitoring = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Check if user is admin
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single();

  if (roles) {
    await securityMonitor.initialize();
    logger.info('Security monitoring active for admin user');
  }
};

export default SecurityMonitor;
