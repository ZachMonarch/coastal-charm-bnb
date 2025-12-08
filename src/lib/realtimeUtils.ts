/**
 * Realtime Messaging Utilities
 * 
 * Standardized utilities for realtime messaging using room-based topics
 * All topics follow the pattern: room:<uuid>
 */

import { supabase } from '@/integrations/supabase/client';
import { canAccessRoom, isValidRoomTopic, getRoomIdFromTopic, createRoomTopic } from './authUtils';
import { logger } from '@/utils/logger';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface RoomSubscriptionOptions {
  roomId: string;
  onMessage?: (message: RoomMessage) => void;
  onPresenceSync?: (state: Record<string, any>) => void;
  onPresenceJoin?: (key: string, presence: any) => void;
  onPresenceLeave?: (key: string, presence: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Subscribe to a room for realtime messaging
 * Validates room access before subscribing
 */
export async function subscribeToRoom(options: RoomSubscriptionOptions): Promise<RealtimeChannel | null> {
  const { roomId, onMessage, onPresenceSync, onPresenceJoin, onPresenceLeave, onError } = options;

  try {
    // Validate room access
    const hasAccess = await canAccessRoom(roomId);
    if (!hasAccess) {
      const error = new Error(`Access denied to room: ${roomId}`);
      logger.error('Room access denied:', error);
      onError?.(error);
      return null;
    }

    // Create room topic
    const topic = createRoomTopic(roomId);
    
    if (!isValidRoomTopic(topic)) {
      const error = new Error(`Invalid room topic format: ${topic}`);
      logger.error('Invalid room topic:', error);
      onError?.(error);
      return null;
    }

    logger.info('Subscribing to room:', { roomId, topic });

    // Create channel with room topic
    const channel = supabase.channel(topic);

    // Subscribe to postgres changes for messages
    if (onMessage) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'realtime_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          logger.debug('New message received:', payload);
          onMessage(payload.new as RoomMessage);
        }
      );
    }

    // Subscribe to presence if handlers are provided
    if (onPresenceSync || onPresenceJoin || onPresenceLeave) {
      if (onPresenceSync) {
        channel.on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          onPresenceSync(state);
        });
      }

      if (onPresenceJoin) {
        channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
          onPresenceJoin(key, newPresences);
        });
      }

      if (onPresenceLeave) {
        channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          onPresenceLeave(key, leftPresences);
        });
      }
    }

    // Subscribe to the channel
    await channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logger.info('Successfully subscribed to room:', roomId);
      } else if (status === 'CHANNEL_ERROR') {
        const error = new Error(`Channel error for room: ${roomId}`);
        logger.error('Channel subscription error:', error);
        onError?.(error);
      }
    });

    return channel;
  } catch (error) {
    logger.error('Error subscribing to room:', error);
    onError?.(error as Error);
    return null;
  }
}

/**
 * Unsubscribe from a room
 */
export async function unsubscribeFromRoom(channel: RealtimeChannel): Promise<void> {
  try {
    await supabase.removeChannel(channel);
    logger.info('Unsubscribed from room channel');
  } catch (error) {
    logger.error('Error unsubscribing from room:', error);
  }
}

/**
 * Send a message to a room
 */
export async function sendRoomMessage(
  roomId: string,
  content: string,
  metadata?: Record<string, any>
): Promise<{ data: RoomMessage | null; error: any }> {
  try {
    // Validate room access
    const hasAccess = await canAccessRoom(roomId);
    if (!hasAccess) {
      return {
        data: null,
        error: new Error('Access denied to room')
      };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        data: null,
        error: new Error('User not authenticated')
      };
    }

    const topic = createRoomTopic(roomId);

    const { data, error } = await (supabase as any)
      .from('realtime_messages')
      .insert({
        room_id: roomId,
        topic,
        user_id: user.id,
        content,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      logger.error('Error sending message:', error);
      return { data: null, error };
    }

    logger.info('Message sent successfully:', { roomId, messageId: data?.id });
    return { data: data as any as RoomMessage, error: null };
  } catch (error) {
    logger.error('Error in sendRoomMessage:', error);
    return { data: null, error };
  }
}

/**
 * Get room message history
 * Uses RLS-protected view for safe access
 */
export async function getRoomMessages(
  roomId: string,
  limit: number = 50,
  before?: string
): Promise<{ data: RoomMessage[] | null; error: any }> {
  try {
    // Validate room access
    const hasAccess = await canAccessRoom(roomId);
    if (!hasAccess) {
      return {
        data: null,
        error: new Error('Access denied to room')
      };
    }

    let query = (supabase as any)
      .from('realtime_messages_view')
      .select('id, user_id, title, message, type, read, action_url, created_at, category, priority')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching room messages:', error);
      return { data: null, error };
    }

    return { data: (data as any as RoomMessage[]) || [], error: null };
  } catch (error) {
    logger.error('Error in getRoomMessages:', error);
    return { data: null, error };
  }
}

/**
 * Track user presence in a room
 */
export async function trackPresence(
  channel: RealtimeChannel,
  userInfo: Record<string, any>
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      logger.error('Cannot track presence: user not authenticated');
      return false;
    }

    const status = await channel.track({
      user_id: user.id,
      online_at: new Date().toISOString(),
      ...userInfo
    });

    return status === 'ok';
  } catch (error) {
    logger.error('Error tracking presence:', error);
    return false;
  }
}

/**
 * Stop tracking user presence in a room
 */
export async function untrackPresence(channel: RealtimeChannel): Promise<void> {
  try {
    await channel.untrack();
    logger.info('Stopped tracking presence');
  } catch (error) {
    logger.error('Error untracking presence:', error);
  }
}

