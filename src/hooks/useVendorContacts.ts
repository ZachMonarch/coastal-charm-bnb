import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';
import logger from '@/utils/logger';

export type ContactType = 'lead' | 'contact' | 'partner' | 'customer';
export type ContactStatus = 'active' | 'inactive' | 'converted' | 'lost';

export interface VendorContact {
  id: string;
  vendor_id: string;
  contact_type: ContactType;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  source: string | null;
  status: ContactStatus;
  last_contact_date: string | null;
  next_followup_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateContactInput {
  contact_type: ContactType;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  source?: string;
  status?: ContactStatus;
  last_contact_date?: string;
  next_followup_date?: string;
}

export function useVendorContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<VendorContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!user?.id) {
      logger.debug('[VendorContacts] No user ID, skipping fetch');
      setLoading(false);
      return;
    }

    logger.debug('[VendorContacts] Fetching contacts for user:', user.id);
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError, status } = await supabase
        .from('vendor_contacts')
        .select('id, vendor_id, contact_type, name, email, phone, company, notes, source, status, last_contact_date, next_followup_date, created_at, updated_at')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      logger.debug('[VendorContacts] Query result:', { dataCount: data?.length, status });

      if (fetchError) {
        logger.error('[VendorContacts] Fetch error:', fetchError);
        // Check if it's a table not found or RLS issue
        if (fetchError.code === '42P01') {
          setError('Contacts table not available. Please contact support.');
        } else if (fetchError.code === 'PGRST301') {
          setError('Permission denied. Please ensure you have access to contacts.');
        } else {
          throw fetchError;
        }
        return;
      }
      
      setContacts((data as VendorContact[]) || []);
      logger.debug('[VendorContacts] Loaded contacts:', data?.length || 0);
    } catch (err: any) {
      logger.error('[VendorContacts] Error fetching contacts:', err);
      setError(err.message || 'Failed to load contacts');
      toast.error('Failed to load contacts. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const createContact = async (input: CreateContactInput): Promise<VendorContact | null> => {
    if (!user?.id) {
      toast.error('You must be logged in');
      return null;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('vendor_contacts')
        .insert({
          vendor_id: user.id,
          contact_type: input.contact_type,
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          company: input.company || null,
          notes: input.notes || null,
          source: input.source || null,
          status: input.status || 'active',
          last_contact_date: input.last_contact_date || null,
          next_followup_date: input.next_followup_date || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newContact = data as VendorContact;
      setContacts(prev => [newContact, ...prev]);
      toast.success('Contact added successfully');
      return newContact;
    } catch (err: any) {
      logger.error('Error creating contact:', err);
      toast.error(err.message || 'Failed to add contact');
      return null;
    }
  };

  const updateContact = async (id: string, updates: Partial<CreateContactInput>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('vendor_contacts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('vendor_id', user?.id);

      if (updateError) throw updateError;

      setContacts(prev => prev.map(c => 
        c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      ));
      toast.success('Contact updated');
      return true;
    } catch (err: any) {
      logger.error('Error updating contact:', err);
      toast.error(err.message || 'Failed to update contact');
      return false;
    }
  };

  const deleteContact = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('vendor_contacts')
        .delete()
        .eq('id', id)
        .eq('vendor_id', user?.id);

      if (deleteError) throw deleteError;

      setContacts(prev => prev.filter(c => c.id !== id));
      toast.success('Contact deleted');
      return true;
    } catch (err: any) {
      logger.error('Error deleting contact:', err);
      toast.error(err.message || 'Failed to delete contact');
      return false;
    }
  };

  const getContactsByType = (type: ContactType) => {
    return contacts.filter(c => c.contact_type === type);
  };

  const getContactStats = () => {
    return {
      total: contacts.length,
      leads: contacts.filter(c => c.contact_type === 'lead').length,
      contacts: contacts.filter(c => c.contact_type === 'contact').length,
      partners: contacts.filter(c => c.contact_type === 'partner').length,
      customers: contacts.filter(c => c.contact_type === 'customer').length,
      active: contacts.filter(c => c.status === 'active').length,
      converted: contacts.filter(c => c.status === 'converted').length,
    };
  };

  return {
    contacts,
    loading,
    error,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    getContactsByType,
    getContactStats,
  };
}
