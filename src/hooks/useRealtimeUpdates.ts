import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';

interface RealtimeHookOptions {
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export function useRealtimeUpdates({
  table,
  filter,
  event = '*',
  onInsert,
  onUpdate,
  onDelete
}: RealtimeHookOptions) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const channelName = `${table}-${user.id}`;
    const channel = supabase.channel(channelName);

    // Set up event handlers based on the event type
    if (event === '*' || event === 'INSERT') {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table,
          filter
        },
        (payload) => {
          onInsert?.(payload);
        }
      );
    }

    if (event === '*' || event === 'UPDATE') {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table,
          filter
        },
        (payload) => {
          onUpdate?.(payload);
        }
      );
    }

    if (event === '*' || event === 'DELETE') {
      channel.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table,
          filter
        },
        (payload) => {
          onDelete?.(payload);
        }
      );
    }

    // Subscribe to the channel
    channel.subscribe((status) => {
      setIsConnected(status === 'SUBSCRIBED');
    });

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [user, table, filter, event, onInsert, onUpdate, onDelete]);

  return { isConnected };
}

// Hook for user presence tracking
export function usePresence(roomId: string, userInfo?: Record<string, any>) {
  const { user } = useAuth();
  const [presenceState, setPresenceState] = useState<Record<string, any>>({});
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!user || !roomId) return;

    const room = supabase.channel(roomId);

    // Track user presence
    const userStatus = {
      user_id: user.id,
      user_name: user.name || user.email,
      online_at: new Date().toISOString(),
      ...userInfo
    };

    room
      .on('presence', { event: 'sync' }, () => {
        const newState = room.presenceState();
        setPresenceState(newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // User joined presence
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // User left presence
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const presenceTrackStatus = await room.track(userStatus);
          setIsTracking(presenceTrackStatus === 'ok');
        }
      });

    return () => {
      room.untrack();
      supabase.removeChannel(room);
      setIsTracking(false);
    };
  }, [user, roomId, userInfo]);

  return { presenceState, isTracking };
}

// Hook for project updates
export function useProjectUpdates(onProjectUpdate?: (project: any) => void) {
  return useRealtimeUpdates({
    table: 'projects',
    onUpdate: (payload) => {
      onProjectUpdate?.(payload.new);
    },
    onInsert: (payload) => {
      onProjectUpdate?.(payload.new);
    }
  });
}

// Hook for booking updates  
export function useBookingUpdates(onBookingUpdate?: (booking: any) => void) {
  return useRealtimeUpdates({
    table: 'bookings',
    onUpdate: (payload) => {
      onBookingUpdate?.(payload.new);
    },
    onInsert: (payload) => {
      onBookingUpdate?.(payload.new);
    }
  });
}

// Hook for vendor bid updates
export function useVendorBidUpdates(onBidUpdate?: (bid: any) => void) {
  return useRealtimeUpdates({
    table: 'vendor_bids',
    onUpdate: (payload) => {
      onBidUpdate?.(payload.new);
    },
    onInsert: (payload) => {
      onBidUpdate?.(payload.new);
    }
  });
}