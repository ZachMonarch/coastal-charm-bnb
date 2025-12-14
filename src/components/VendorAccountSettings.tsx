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
import { Skeleton } from '@/components/ui/skeleton';
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
  User,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import TwoFactorSetup from './TwoFactorSetup';

export default function VendorAccountSettings() {
  const { user } = useAuth();
  const { 
    preferences, 
    loading: preferencesLoading, 
    saving,
    updatePreference, 
    savePreferences,
    checkMfaStatus,
    disableMfa 
  } = useUserPreferences();
  
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Check MFA status on mount
  useEffect(() => {
    const checkMfa = async () => {
      const enabled = await checkMfaStatus();
      setMfaEnabled(enabled);
    };
    if (user) {
      checkMfa();
    }
  }, [user, checkMfaStatus]);

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

    setPasswordLoading(true);
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
      setPasswordLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    if (mfaEnabled) {
      // Disable 2FA
      const confirmed = window.confirm(
        'Are you sure you want to disable two-factor authentication? This will make your account less secure.'
      );
      if (confirmed) {
        const success = await disableMfa();
        if (success) {
          setMfaEnabled(false);
        }
      }
    } else {
      // Show 2FA setup dialog
      setShowTwoFactorSetup(true);
    }
  };

  const handleTwoFactorSuccess = async () => {
    setMfaEnabled(true);
    await updatePreference('two_factor_enabled', true);
    await updatePreference('two_factor_verified_at', new Date().toISOString());
  };

  const handleEmailChange = async () => {
    if (!user) return;

    const newEmail = prompt('Enter your new email address:');
    if (!newEmail) return;

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast.success('Verification email sent to your new email address');
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error('Failed to update email');
    }
  };

  const handleSaveNotifications = async () => {
    if (!preferences) return;
    
    await savePreferences({
      email_notifications: preferences.email_notifications,
      sms_notifications: preferences.sms_notifications,
      project_alerts: preferences.project_alerts,
      bid_notifications: preferences.bid_notifications,
      payment_alerts: preferences.payment_alerts,
    });
  };

  const handleSavePrivacy = async () => {
    if (!preferences) return;
    
    await savePreferences({
      profile_visibility: preferences.profile_visibility,
    });
  };

  if (!user) return null;

  if (preferencesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Email Address</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={user.email || ''} disabled className="flex-1" />
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
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
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
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable 2FA</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security using an authenticator app
                  </p>
                </div>
                <Switch
                  checked={mfaEnabled}
                  onCheckedChange={handleToggle2FA}
                />
              </div>
              
              {mfaEnabled ? (
                <Alert className="bg-green-500/10 border-green-500/20">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Your account is protected with two-factor authentication.
                    {preferences?.two_factor_verified_at && (
                      <span className="block text-xs mt-1 opacity-70">
                        Enabled on {new Date(preferences.two_factor_verified_at).toLocaleDateString()}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
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
                    checked={preferences?.email_notifications ?? true}
                    onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
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
                    checked={preferences?.sms_notifications ?? false}
                    onCheckedChange={(checked) => updatePreference('sms_notifications', checked)}
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
                      checked={preferences?.project_alerts ?? true}
                      onCheckedChange={(checked) => updatePreference('project_alerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between pl-4">
                    <div>
                      <p className="font-medium">Bid Status Updates</p>
                      <p className="text-sm text-muted-foreground">Updates about your submitted bids</p>
                    </div>
                    <Switch
                      checked={preferences?.bid_notifications ?? true}
                      onCheckedChange={(checked) => updatePreference('bid_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between pl-4">
                    <div>
                      <p className="font-medium">Payment Alerts</p>
                      <p className="text-sm text-muted-foreground">Notifications about payments and invoices</p>
                    </div>
                    <Switch
                      checked={preferences?.payment_alerts ?? true}
                      onCheckedChange={(checked) => updatePreference('payment_alerts', checked)}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveNotifications} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Notification Preferences'
                )}
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
                  value={preferences?.profile_visibility ?? 'public'}
                  onChange={(e) => updatePreference('profile_visibility', e.target.value as 'public' | 'verified_only' | 'private')}
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

              <Button onClick={handleSavePrivacy} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Privacy Settings'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 2FA Setup Dialog */}
      <TwoFactorSetup
        open={showTwoFactorSetup}
        onOpenChange={setShowTwoFactorSetup}
        onSuccess={handleTwoFactorSuccess}
      />
    </div>
  );
}