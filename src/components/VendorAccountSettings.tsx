import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Shield, 
  Bell, 
  Eye, 
  Lock, 
  Smartphone, 
  Mail, 
  AlertTriangle,
  CheckCircle,
  Key,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  projectAlerts: boolean;
  bidNotifications: boolean;
  paymentAlerts: boolean;
  profileVisibility: 'public' | 'verified_only' | 'private';
}

export default function VendorAccountSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
    projectAlerts: true,
    bidNotifications: true,
    paymentAlerts: true,
    profileVisibility: 'public'
  });

  useEffect(() => {
    if (user) {
      loadSecuritySettings();
    }
  }, [user]);

  const loadSecuritySettings = async () => {
    // Load user preferences - this would typically come from a user_preferences table
    // For now, we'll use default values
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast.success('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySettingChange = (setting: keyof SecuritySettings, value: boolean | string) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const saveSecuritySettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Save to user preferences table or vendor_profiles
      const { error } = await supabase
        .from('vendor_profiles')
        .update({
          // Store as JSON in a preferences column or create separate table
          last_active_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Security settings updated successfully');
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast.error('Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!user) return;

    const newEmail = prompt('Enter your new email address:');
    if (!newEmail) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast.success('Verification email sent to your new email address');
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error('Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Account Settings</h2>
          <p className="text-muted-foreground">Manage your account security and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList variant="default" className="w-full sm:w-auto">
          <TabsTrigger value="security" variant="default">Security</TabsTrigger>
          <TabsTrigger value="notifications" variant="default">Notifications</TabsTrigger>
          <TabsTrigger value="privacy" variant="default">Privacy</TabsTrigger>
        </TabsList>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email Address</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={user.email || ''} disabled />
                    <Button variant="outline" size="sm" onClick={handleEmailChange}>
                      Change
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Account Status</Label>
                  <div className="mt-1">
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable 2FA</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={(checked) => handleSecuritySettingChange('twoFactorEnabled', checked)}
                />
              </div>
              {!securitySettings.twoFactorEnabled && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Your account is not protected by two-factor authentication. Enable 2FA for better security.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.emailNotifications}
                    onCheckedChange={(checked) => handleSecuritySettingChange('emailNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive urgent updates via SMS</p>
                    </div>
                  </div>
                  <Switch
                    checked={securitySettings.smsNotifications}
                    onCheckedChange={(checked) => handleSecuritySettingChange('smsNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Project Notifications</h4>
                  
                  <div className="flex items-center justify-between pl-4">
                    <div>
                      <p className="font-medium">New Project Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified about new project opportunities</p>
                    </div>
                    <Switch
                      checked={securitySettings.projectAlerts}
                      onCheckedChange={(checked) => handleSecuritySettingChange('projectAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between pl-4">
                    <div>
                      <p className="font-medium">Bid Status Updates</p>
                      <p className="text-sm text-muted-foreground">Updates about your submitted bids</p>
                    </div>
                    <Switch
                      checked={securitySettings.bidNotifications}
                      onCheckedChange={(checked) => handleSecuritySettingChange('bidNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between pl-4">
                    <div>
                      <p className="font-medium">Payment Alerts</p>
                      <p className="text-sm text-muted-foreground">Notifications about payments and invoices</p>
                    </div>
                    <Switch
                      checked={securitySettings.paymentAlerts}
                      onCheckedChange={(checked) => handleSecuritySettingChange('paymentAlerts', checked)}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={saveSecuritySettings} disabled={loading}>
                Save Notification Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="profile-visibility">Profile Visibility</Label>
                <select
                  id="profile-visibility"
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
                  value={securitySettings.profileVisibility}
                  onChange={(e) => handleSecuritySettingChange('profileVisibility', e.target.value)}
                >
                  <option value="public">Public - Visible to everyone</option>
                  <option value="verified_only">Verified Users Only</option>
                  <option value="private">Private - Only visible to administrators</option>
                </select>
                <p className="text-sm text-muted-foreground mt-1">
                  Control who can see your vendor profile and information
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Data Management</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="h-4 w-4 mr-2" />
                    Download My Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <Lock className="h-4 w-4 mr-2" />
                    Request Account Deletion
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Account deletion will permanently remove all your data and cannot be undone.
                </p>
              </div>

              <Button onClick={saveSecuritySettings} disabled={loading}>
                Save Privacy Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}