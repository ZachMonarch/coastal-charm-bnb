import { useState, useCallback, useMemo } from 'react';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Booking {
  id: string;
  user_id: string;
  property_id: number;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  total_amount: number;
  guest_details: any;
  status: string;
  payment_status: string;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingFilters {
  status?: string;
  payment_status?: string;
  property_id?: number;
  user_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface UseOptimizedBookingsOptions {
  autoFetch?: boolean;
  filters?: Partial<BookingFilters>;
}

export const useOptimizedBookings = (options: UseOptimizedBookingsOptions = {}) => {
  const { autoFetch = false, filters = {} } = options;
  
  // Create stable query key with proper serialization
  const queryKey = useMemo(() => ['bookings', JSON.stringify(filters)], [filters]);
  
  // Memoized query function
  const queryFn = useCallback(async () => {
    let query = supabase
      .from('bookings')
      .select('id, user_id, property_id, check_in_date, check_out_date, guests, total_amount, status, payment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }

    if (filters.property_id) {
      query = query.eq('property_id', filters.property_id);
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.date_range) {
      query = query
        .gte('check_in_date', filters.date_range.start)
        .lte('check_out_date', filters.date_range.end);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }, [filters]);

  // Use optimized query with longer cache times and smart retries
  // Only fetch if autoFetch is enabled
  const {
    data: bookings = [],
    isLoading: loading,
    error,
    refetch
  } = useOptimizedQuery(
    queryKey,
    queryFn,
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      enabled: autoFetch, // Only fetch when autoFetch is true
    }
  );

  const createBooking = useCallback(async (bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (error) throw error;

      // Invalidate cache to refresh data
      refetch();
      toast.success('Booking created successfully');
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create booking';
      toast.error(message);
      throw new Error(message);
    }
  }, [refetch]);

  const updateBooking = useCallback(async (id: string, updates: Partial<Booking>) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      refetch();
      toast.success('Booking updated successfully');
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update booking';
      toast.error(message);
      throw new Error(message);
    }
  }, [refetch]);

  return {
    bookings,
    loading,
    error: error?.message || null,
    refetch,
    createBooking,
    updateBooking
  };
};