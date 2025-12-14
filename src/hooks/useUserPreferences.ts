import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';

export interface UserPreferences {
  id?: string;
  user_id: string;
  two_factor_enabled: boolean;
  two_factor_verified_at: string | null;
  email_notifications: boolean;
  sms_notifications: boolean;
  project_alerts: boolean;
  bid_notifications: boolean;
  payment_alerts: boolean;
  profile_visibility: 'public' | 'verified_only' | 'private';
  phone_number: string | null;
}

const defaultPreferences: Omit<UserPreferences, 'user_id'> = {
  two_factor_enabled: false,
  two_factor_verified_at: null,
  email_notifications: true,
  sms_notifications: false,
  project_alerts: true,
  bid_notifications: true,
  payment_alerts: true,
  profile_visibility: 'public',
  phone_number: null,
};

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    } else {
      setPreferences(null);
      setLoading(false);
    }
  }, [user?.id]);

  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('id, user_id, two_factor_enabled, two_factor_verified_at, email_notifications, sms_notifications, project_alerts, bid_notifications, payment_alerts, profile_visibility, phone_number')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setPreferences(data as UserPreferences);
      } else {
        // Create default preferences for new user
        const newPrefs: UserPreferences = {
          user_id: user.id,
          ...defaultPreferences,
        };
        
        const { data: insertedData, error: insertError } = await supabase
          .from('user_preferences')
          .insert(newPrefs)
          .select('id, user_id, two_factor_enabled, two_factor_verified_at, email_notifications, sms_notifications, project_alerts, bid_notifications, payment_alerts, profile_visibility, phone_number')
          .single();

        if (insertError) {
          throw insertError;
        }

        setPreferences(insertedData as UserPreferences);
      }
    } catch (err: any) {
      console.error('Error loading preferences:', err);
      setError(err.message || 'Failed to load preferences');
      // Set defaults locally even if DB fails
      if (user?.id) {
        setPreferences({
          user_id: user.id,
          ...defaultPreferences,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const updatePreference = useCallback(async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): Promise<boolean> => {
    if (!user?.id || !preferences) return false;

    // Optimistic update
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);

    try {
      const { error: updateError } = await supabase
        .from('user_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (err: any) {
      console.error('Error updating preference:', err);
      // Revert optimistic update
      await loadPreferences();
      toast.error('Failed to save setting');
      return false;
    }
  }, [user?.id, preferences, loadPreferences]);

  const savePreferences = useCallback(async (
    updates: Partial<Omit<UserPreferences, 'id' | 'user_id'>>
  ): Promise<boolean> => {
    if (!user?.id) return false;

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Settings saved successfully');
      return true;
    } catch (err: any) {
      console.error('Error saving preferences:', err);
      setError(err.message || 'Failed to save preferences');
      toast.error('Failed to save settings');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user?.id]);

  const checkMfaStatus = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        console.error('Error checking MFA status:', error);
        return false;
      }

      // Check if there are any verified TOTP factors
      const hasVerifiedTotp = data.totp.some(factor => factor.status === 'verified');
      
      // Update preference if MFA status changed
      if (preferences && preferences.two_factor_enabled !== hasVerifiedTotp) {
        await updatePreference('two_factor_enabled', hasVerifiedTotp);
        if (hasVerifiedTotp) {
          await updatePreference('two_factor_verified_at', new Date().toISOString());
        }
      }

      return hasVerifiedTotp;
    } catch (err) {
      console.error('Error checking MFA:', err);
      return false;
    }
  }, [preferences, updatePreference]);

  const disableMfa = useCallback(async (): Promise<boolean> => {
    try {
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      
      if (listError) {
        throw listError;
      }

      // Unenroll all TOTP factors
      for (const factor of factors.totp) {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({
          factorId: factor.id
        });
        
        if (unenrollError) {
          throw unenrollError;
        }
      }

      // Update preferences
      await savePreferences({
        two_factor_enabled: false,
        two_factor_verified_at: null
      });

      toast.success('Two-factor authentication disabled');
      return true;
    } catch (err: any) {
      console.error('Error disabling MFA:', err);
      toast.error('Failed to disable two-factor authentication');
      return false;
    }
  }, [savePreferences]);

  return {
    preferences,
    loading,
    saving,
    error,
    updatePreference,
    savePreferences,
    loadPreferences,
    checkMfaStatus,
    disableMfa,
  };
}