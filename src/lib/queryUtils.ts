/**
 * RLS-Friendly Query Utilities
 * 
 * Helper functions for building queries that work with Row Level Security
 * Ensures proper column selection and filtering for different user roles
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { AppRole } from '@/types/roles';

/**
 * Safe column selections for different tables
 * Avoids SELECT * to prevent exposing sensitive data
 */
export const SafeColumns = {
  profiles: 'id, full_name, phone, role, avatar_url, created_at, updated_at',
  
  projects: 'id, name, description, status, property_id, start_date, end_date, budget, created_at, updated_at, created_by',
  
  vendor_profiles: 'id, user_id, company_name, is_verified, rating, subscription_plan, avatar_url, created_at, updated_at',
  
  vendor_bids: 'id, project_id, vendor_id, amount, status, notes, created_at, updated_at',
  
  properties: 'id, name, address, city, state, zip_code, property_type, units, created_at, updated_at',
  
  leases: 'id, property_id, unit_id, tenant_id, start_date, end_date, rent_amount, status, created_at, updated_at',
  
  tickets: 'id, property_id, unit_id, tenant_id, title, description, status, priority, created_at, updated_at',
  
  payments: 'id, lease_id, amount, payment_date, status, payment_method, created_at, updated_at',
  
  realtime_messages: 'id, room_id, topic, user_id, content, created_at, metadata',
  
  audit_logs: 'id, user_id, action, table_name, record_id, changes, created_at',
  
  security_events: 'id, event_type, severity, user_id, ip_address, user_agent, details, created_at'
} as const;

/**
 * Build a safe query for a table with proper column selection
 * @deprecated Use direct supabase.from(table).select(columns) for better type safety
 */
export function buildSafeQuery(table: string) {
  const columns = (SafeColumns as any)[table] || '*';
  return (supabase as any).from(table).select(columns);
}

/**
 * Vendor-specific queries with proper filtering
 */
export const VendorQueries = {
  /**
   * Get vendor's own projects
   */
  async getMyProjects(vendorId: string) {
    try {
      const { data, error } = await supabase
        .from('vendor_bids')
        .select(`
          id,
          project_id,
          amount,
          status,
          created_at,
          projects:project_id (
            ${SafeColumns.projects}
          )
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching vendor projects:', error);
      return { data: null, error };
    }
  },

  /**
   * Get vendor's own bids
   */
  async getMyBids(vendorId: string, status?: string) {
    try {
      let query = buildSafeQuery('vendor_bids')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching vendor bids:', error);
      return { data: null, error };
    }
  },

  /**
   * Get vendor profile
   */
  async getMyProfile(userId: string) {
    try {
      const { data, error } = await buildSafeQuery('vendor_profiles')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching vendor profile:', error);
      return { data: null, error };
    }
  }
};

/**
 * Tenant-specific queries with proper filtering
 */
export const TenantQueries = {
  /**
   * Get tenant's own leases
   */
  async getMyLeases(tenantId: string, status?: string) {
    try {
      let query = buildSafeQuery('leases')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching tenant leases:', error);
      return { data: null, error };
    }
  },

  /**
   * Get tenant's own tickets
   */
  async getMyTickets(tenantId: string, status?: string) {
    try {
      let query = buildSafeQuery('tickets')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching tenant tickets:', error);
      return { data: null, error };
    }
  },

  /**
   * Get tenant's own payments
   */
  async getMyPayments(tenantId: string) {
    try {
      const { data, error } = await (supabase as any)
        .from('payments')
        .select(`
          ${SafeColumns.payments},
          leases:lease_id (
            ${SafeColumns.leases}
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching tenant payments:', error);
      return { data: null, error };
    }
  }
};

/**
 * Property Manager queries with proper filtering
 */
export const PropertyManagerQueries = {
  /**
   * Get all projects (property managers can see all)
   */
  async getAllProjects(filters?: { status?: string; property_id?: string }) {
    try {
      let query = buildSafeQuery('projects')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.property_id) {
        query = query.eq('property_id', filters.property_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching projects:', error);
      return { data: null, error };
    }
  },

  /**
   * Get all properties
   */
  async getAllProperties() {
    try {
      const { data, error } = await buildSafeQuery('properties')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching properties:', error);
      return { data: null, error };
    }
  },

  /**
   * Get all tenants
   */
  async getAllTenants() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(SafeColumns.profiles)
        .eq('role', 'tenant')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching tenants:', error);
      return { data: null, error };
    }
  }
};

/**
 * Admin queries (full access with service role would be needed for some)
 */
export const AdminQueries = {
  /**
   * Get audit logs (admin only)
   */
  async getAuditLogs(limit: number = 100, filters?: { user_id?: string; action?: string }) {
    try {
      let query = buildSafeQuery('audit_logs')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      return { data: null, error };
    }
  },

  /**
   * Get security events (admin only)
   */
  async getSecurityEvents(limit: number = 100, filters?: { severity?: string; event_type?: string }) {
    try {
      let query = buildSafeQuery('security_events')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching security events:', error);
      return { data: null, error };
    }
  },

  /**
   * Get all users with roles
   */
  async getAllUsers() {
    try {
      const { data, error } = await buildSafeQuery('profiles')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('Error fetching users:', error);
      return { data: null, error };
    }
  }
};

/**
 * Handle 403 (RLS policy blocked) responses gracefully
 */
export function handleRLSError(error: any): { isBlocked: boolean; message: string } {
  if (error?.code === 'PGRST301' || error?.message?.includes('policy')) {
    return {
      isBlocked: true,
      message: 'You do not have permission to access this data.'
    };
  }

  return {
    isBlocked: false,
    message: error?.message || 'An error occurred while fetching data.'
  };
}

