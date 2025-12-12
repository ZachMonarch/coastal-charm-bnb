import { useState, useEffect } from 'react';
import { User, Bell, Shield, CreditCard, Globe, Monitor, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import VendorProfilePanel from '@/components/VendorProfilePanel';
import VendorPaymentForm from '@/components/VendorPaymentForm';
import PrivatePageWrapper from '@/components/PrivatePageWrapper';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export default function UnifiedSettings() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const isVendor = hasRole('vendor');
  
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    project_updates: true,
    payment_alerts: true,
    security_alerts: true,
    invoice_alerts: true
  });

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open subscription management",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load notification settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('id, user_id, email_notifications, push_notifications, project_updates, payment_alerts, security_alerts, invoice_alerts')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading notification settings:', error);
        return;
      }
      
      if (data) {
        setNotificationSettings({
          email_notifications: data.email_notifications,
          push_notifications: data.push_notifications,
          project_updates: data.project_updates,
          payment_alerts: data.payment_alerts,
          security_alerts: data.security_alerts,
          invoice_alerts: data.invoice_alerts
        });
      }
    };
    loadSettings();
  }, [user]);

  const handleSaveNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          ...notificationSettings
        });

      if (error) throw error;

      toast({
        title: "Notification Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PrivatePageWrapper title="Account Settings">
      <div className="space-y-6">
        {/* Enhanced Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl p-6 border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/5 shadow-md">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/10 opacity-50" />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              Account Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your {isVendor ? 'vendor' : ''} account preferences and settings
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList variant="colorful" className="w-full lg:w-auto">
            <TabsTrigger value="profile" variant="colorful">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" variant="colorful">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" variant="colorful">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            {isVendor && (
              <TabsTrigger value="billing" variant="colorful">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Billing</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="preferences" variant="colorful">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" variant="colorful">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {isVendor ? (
              <VendorProfilePanel />
            ) : (
              <Card variant="colorful">
                <CardHeader className="border-b border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/15">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Profile Information</CardTitle>
                      <CardDescription>Your account profile details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <span className="text-sm font-medium text-muted-foreground">Email:</span>
                      <span className="text-sm font-semibold text-foreground">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <span className="text-sm font-medium text-muted-foreground">Role:</span>
                      <span className="text-sm font-semibold capitalize text-primary">{user?.role || 'tenant'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card variant="info">
              <CardHeader className="border-b border-info/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-info/15">
                    <Shield className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Security Settings</CardTitle>
                    <CardDescription>Manage your account security</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-info/5 to-transparent border border-info/20 hover:border-info/40 transition-colors">
                    <div>
                      <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-info/30 hover:bg-info/10 hover:text-info" onClick={() => {
                      toast({
                        title: "MFA Setup",
                        description: "Configure MFA in your Supabase dashboard",
                      });
                    }}>
                      Setup
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-warning/5 to-transparent border border-warning/20 hover:border-warning/40 transition-colors">
                    <div>
                      <h4 className="font-medium text-foreground">Change Password</h4>
                      <p className="text-sm text-muted-foreground">Update your account password</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-warning/30 hover:bg-warning/10 hover:text-warning" onClick={async () => {
                      const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '');
                      if (!error) {
                        toast({
                          title: "Password Reset Email Sent",
                          description: "Check your email to reset your password",
                        });
                      }
                    }}>
                      Reset Password
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card variant="warning">
              <CardHeader className="border-b border-warning/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/15">
                    <Bell className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Notification Preferences</CardTitle>
                    <CardDescription>Choose how you want to be notified</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {[
                  { id: 'email_notifications', label: 'Email Notifications', description: 'Receive email updates about your account', color: 'primary' },
                  { id: 'push_notifications', label: 'Push Notifications', description: 'Receive push notifications on your devices', color: 'info' },
                  { id: 'project_updates', label: 'Project Updates', description: 'Get notified about project status changes', color: 'success' },
                  { id: 'payment_alerts', label: 'Payment Alerts', description: 'Receive alerts about payments and invoices', color: 'warning' },
                  { id: 'security_alerts', label: 'Security Alerts', description: 'Get notified about security-related activities', color: 'destructive' },
                  { id: 'invoice_alerts', label: 'Invoice Alerts', description: 'Receive alerts about new invoices', color: 'secondary' }
                ].map((setting) => (
                  <div key={setting.id} className={`flex items-center justify-between space-x-4 p-4 rounded-lg border transition-all hover:shadow-sm bg-gradient-to-r from-${setting.color}/5 to-transparent border-${setting.color}/20 hover:border-${setting.color}/40`}>
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={setting.id} className="font-medium text-foreground">{setting.label}</Label>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <Switch 
                      id={setting.id} 
                      checked={notificationSettings[setting.id as keyof typeof notificationSettings]}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, [setting.id]: checked }))
                      }
                    />
                  </div>
                ))}
                <Separator />
                <Button onClick={handleSaveNotifications} disabled={isLoading} className="bg-gradient-to-r from-primary to-primary-dark hover:opacity-90">
                  {isLoading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {isVendor && (
            <TabsContent value="billing" className="space-y-6">
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Subscription Management
                  </CardTitle>
                  <CardDescription>Manage your subscription plan and billing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-primary/20 rounded-lg bg-background/50">
                    <div>
                      <h4 className="font-medium text-foreground">Current Plan</h4>
                      <p className="text-sm text-muted-foreground">
                        {user?.subscription?.plan || 'Free'} • {user?.subscription?.status || 'Active'}
                      </p>
                    </div>
                    <Button onClick={handleManageSubscription} disabled={isLoading}>
                      {isLoading ? 'Loading...' : 'Manage Subscription'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Access to Payout Settings */}
              <Card className="border-success/20 bg-gradient-to-br from-success/5 via-background to-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-success" />
                    Payout Settings
                  </CardTitle>
                  <CardDescription>Configure how you receive payments from completed projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="border-success/30 hover:bg-success/10">
                    <Link to="/vendor/payout-settings">Configure Payout Methods</Link>
                  </Button>
                </CardContent>
              </Card>

              <Separator className="my-6" />

              <VendorPaymentForm />
            </TabsContent>
          )}

          <TabsContent value="preferences" className="space-y-6">
            <Card variant="accent-left">
              <CardHeader className="border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/15">
                    <Globe className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Account Preferences</CardTitle>
                    <CardDescription>Customize your account preferences</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Language</Label>
                  <select className="w-full p-3 rounded-lg border border-input bg-background hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Timezone</Label>
                  <select className="w-full p-3 rounded-lg border border-input bg-background hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                    <option value="EST">Eastern Time (EST)</option>
                    <option value="PST">Pacific Time (PST)</option>
                    <option value="CST">Central Time (CST)</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card variant="colorful">
              <CardHeader className="border-b border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/15">
                    <Monitor className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Appearance Settings</CardTitle>
                    <CardDescription>Customize the look and feel of your interface</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                  <Label className="text-foreground font-medium">Theme</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: '☀️' },
                      { value: 'dark', label: 'Dark', icon: '🌙' },
                      { value: 'system', label: 'System', icon: '💻' }
                    ].map((t) => (
                      <Button
                        key={t.value}
                        variant={theme === t.value ? "default" : "outline"}
                        onClick={() => setTheme(t.value)}
                        className={cn(
                          "capitalize h-auto py-4 flex flex-col gap-2",
                          theme === t.value 
                            ? "bg-gradient-to-br from-primary to-primary-dark text-primary-foreground shadow-lg" 
                            : "hover:border-primary/40 hover:bg-primary/5"
                        )}
                      >
                        <span className="text-xl">{t.icon}</span>
                        <span>{t.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PrivatePageWrapper>
  );
}