/**
 * Authentication Utilities
 * 
 * Helper functions for role-based access control and authentication checks
 */

import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/types/roles';
import { logger } from '@/utils/logger';

/**
 * Fetch user roles from the database
 * Uses caching to minimize database queries
 */
const roleCache = new Map<string, { roles: string[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getUserRoles(userId: string): Promise<string[]> {
  try {
    // Check cache first
    const cached = roleCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.debug('Role cache hit for user:', userId);
      return cached.roles;
    }

    logger.debug('Role cache miss, fetching from database for user:', userId);

    // First try to get role from profiles table (faster, single role)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!profileError && profileData?.role) {
      const roles = [profileData.role];
      roleCache.set(userId, { roles, timestamp: Date.now() });
      return roles;
    }

    // Fallback to user_roles table (supports multiple roles)
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (error) {
      logger.error('Error fetching user roles:', error);
      return ['authenticated']; // Default fallback
    }
    
    const roles = data?.map(item => item.role) || ['authenticated'];
    roleCache.set(userId, { roles, timestamp: Date.now() });
    
    return roles;
  } catch (error) {
    logger.error('Error in getUserRoles:', error);
    return ['authenticated']; // Default fallback
  }
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(requiredRole: AppRole | AppRole[]): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  const userRoles = await getUserRoles(user.id);
  
  // Admin has access to everything
  if (userRoles.includes('admin')) {
    return true;
  }

  // Check if user has any of the required roles
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/**
 * Get the current user's primary role
 */
export async function getPrimaryRole(): Promise<AppRole> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return 'authenticated';
  }

  const roles = await getUserRoles(user.id);
  
  // Return the highest priority role
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('property_manager')) return 'property_manager';
  if (roles.includes('vendor')) return 'vendor';
  if (roles.includes('tenant')) return 'tenant';
  
  return 'authenticated';
}

/**
 * Clear the role cache for a specific user
 */
export function clearRoleCache(userId?: string): void {
  if (userId) {
    roleCache.delete(userId);
  } else {
    roleCache.clear();
  }
}

/**
 * Check if user can access a specific room (for realtime messaging)
 */
export async function canAccessRoom(roomId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    // Check if user can access the room
    const { data: roomAccess, error } = await (supabase as any)
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logger.error('Error checking room access:', error);
      return false;
    }

    return !!roomAccess;
  } catch (error) {
    logger.error('Error in canAccessRoom:', error);
    return false;
  }
}

/**
 * Validate room topic format
 * All topics should follow the pattern: room:<uuid>
 */
export function isValidRoomTopic(topic: string): boolean {
  const roomTopicPattern = /^room:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return roomTopicPattern.test(topic);
}

/**
 * Extract room ID from topic
 */
export function getRoomIdFromTopic(topic: string): string | null {
  if (!isValidRoomTopic(topic)) {
    return null;
  }
  return topic.replace('room:', '');
}

/**
 * Create a room topic from a room ID
 */
export function createRoomTopic(roomId: string): string {
  return `room:${roomId}`;
}

