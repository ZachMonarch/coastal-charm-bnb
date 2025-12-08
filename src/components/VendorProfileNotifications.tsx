import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Bell, Mail, MessageSquare, DollarSign, FileText, Megaphone } from 'lucide-react';

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  project_alerts: boolean;
  bid_notifications: boolean;
  payment_alerts: boolean;
  system_updates: boolean;
  newsletter: boolean;
  marketing: boolean;
}

export default function VendorProfileNotifications() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    project_alerts: true,
    bid_notifications: true,
    payment_alerts: true,
    system_updates: true,
    newsletter: true,
    marketing: false,
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('vendor_notification_settings')
        .select('id, user_id, email_notifications, push_notifications, sms_notifications, project_alerts, bid_notifications, payment_alerts, system_updates, newsletter, marketing, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          email_notifications: data.email_notifications,
          push_notifications: data.push_notifications,
          sms_notifications: data.sms_notifications,
          project_alerts: data.project_alerts,
          bid_notifications: data.bid_notifications,
          payment_alerts: data.payment_alerts,
          system_updates: data.system_updates,
          newsletter: data.newsletter,
          marketing: data.marketing,
        });
      }
    } catch (error: any) {
      console.error('Error loading notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('vendor_notification_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Notification preferences saved successfully');
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Channels */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Notification Channels</CardTitle>
          </div>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.email_notifications}
              onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications" className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive in-app notifications
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={settings.push_notifications}
              onCheckedChange={(checked) => updateSetting('push_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-notifications" className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                SMS Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive important alerts via SMS
              </p>
            </div>
            <Switch
              id="sms-notifications"
              checked={settings.sms_notifications}
              onCheckedChange={(checked) => updateSetting('sms_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Activity Alerts */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Activity Alerts</CardTitle>
          </div>
          <CardDescription>
            Manage alerts for vendor activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="project-alerts" className="text-base">
                New Project Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified about new projects matching your skills
              </p>
            </div>
            <Switch
              id="project-alerts"
              checked={settings.project_alerts}
              onCheckedChange={(checked) => updateSetting('project_alerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="bid-notifications" className="text-base">
                Bid Status Updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive updates on your bid submissions
              </p>
            </div>
            <Switch
              id="bid-notifications"
              checked={settings.bid_notifications}
              onCheckedChange={(checked) => updateSetting('bid_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="payment-alerts" className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Payment Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified about invoices and payments
              </p>
            </div>
            <Switch
              id="payment-alerts"
              checked={settings.payment_alerts}
              onCheckedChange={(checked) => updateSetting('payment_alerts', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* System & Marketing */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <CardTitle>System & Marketing</CardTitle>
          </div>
          <CardDescription>
            Platform updates and promotional content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="system-updates" className="text-base">
                System Updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Important platform updates and announcements
              </p>
            </div>
            <Switch
              id="system-updates"
              checked={settings.system_updates}
              onCheckedChange={(checked) => updateSetting('system_updates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="newsletter" className="text-base">
                Newsletter
              </Label>
              <p className="text-sm text-muted-foreground">
                Monthly newsletter with tips and industry news
              </p>
            </div>
            <Switch
              id="newsletter"
              checked={settings.newsletter}
              onCheckedChange={(checked) => updateSetting('newsletter', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing" className="text-base">
                Marketing & Promotions
              </Label>
              <p className="text-sm text-muted-foreground">
                Special offers and promotional content
              </p>
            </div>
            <Switch
              id="marketing"
              checked={settings.marketing}
              onCheckedChange={(checked) => updateSetting('marketing', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-primary hover:bg-primary/90"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </div>
    </div>
  );
}
