import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export interface UseBookingsOptions {
  autoFetch?: boolean;
  filters?: Partial<BookingFilters>;
}

export const useBookings = (options: UseBookingsOptions = {}) => {
  const { autoFetch = false, filters = {} } = options;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('bookings')
        .select('id, user_id, property_id, check_in_date, check_out_date, guests, total_amount, guest_details, status, payment_status, special_requests, created_at, updated_at')
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

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setBookings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchBookings();
    }
  }, [autoFetch, JSON.stringify(filters)]);

  const createBooking = async (bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (error) throw error;

      await fetchBookings(); // Refresh the list
      return data;
    } catch (error) {
      throw new Error(`Failed to create booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
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

      await fetchBookings(); // Refresh the list
      return data;
    } catch (error) {
      throw new Error(`Failed to update booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    createBooking,
    updateBooking
  };
};