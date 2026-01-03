import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { useAccessRequest } from '@/hooks/useAccessRequest';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  User, 
  Settings, 
  LogOut, 
  Crown,
  Mail,
  Building2,
  Briefcase,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function PendingApprovalView() {
  const navigate = useNavigate();
  const { user, signOut, refreshUser } = useAuth();
  const { 
    existingRequest, 
    hasPendingRequest, 
    hasApprovedRequest, 
    hasRejectedRequest,
    fetchExistingRequest 
  } = useAccessRequest();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleRefresh = async () => {
    // Refresh auth context to get latest roles
    await refreshUser();
    await fetchExistingRequest();
    
    // Navigate to appropriate dashboard based on role
    if (existingRequest?.role_requested === 'vendor') {
      navigate('/vendor/dashboard', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  // If approved, show success and redirect option
  if (hasApprovedRequest) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm overflow-auto">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-success/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-success/10 mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-success" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground">
              Access Approved!
            </h1>
          </div>

          <Card className="shadow-xl border-success/20 bg-white dark:bg-card backdrop-blur">
            <CardContent className="pt-8 pb-6 text-center">
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Your <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {existingRequest?.role_requested === 'vendor' ? 'Vendor' : 'Property Manager'}
                </span> access has been approved. Click below to access your dashboard.
              </p>
              <Button 
                onClick={handleRefresh} 
                className="w-full h-11 text-base !text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If rejected, show rejection notice
  if (hasRejectedRequest) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm overflow-auto">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-destructive/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 dark:bg-destructive/10 mb-4">
              <XCircle className="w-8 h-8 text-red-600 dark:text-destructive" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground">
              Request Not Approved
            </h1>
          </div>

          <Card className="shadow-xl border-destructive/20 bg-white dark:bg-card backdrop-blur">
            <CardContent className="pt-8 pb-6">
              <div className="text-center mb-6">
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Unfortunately, your access request was not approved at this time.
                </p>
                {existingRequest?.admin_notes && (
                  <div className="bg-slate-100 dark:bg-slate-800/80 rounded-lg p-4 text-left border border-border/50">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Admin Notes:</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{existingRequest.admin_notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                <Link to="/contact">
                  <Button variant="default" className="w-full !text-white">
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Support
                  </Button>
                </Link>
                <button onClick={handleSignOut} className="w-full">
                  <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pending state (default)
  return (
    <div data-pending-approval className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm overflow-auto">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-warning/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-8">
        {/* Logo / Branding - FIXED: Light mode visibility */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 dark:bg-primary/10 mb-4">
            <Crown className="w-8 h-8 text-amber-700 dark:text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Monarch Property
          </h1>
          <p className="text-muted-foreground mt-1">
            Management Platform
          </p>
        </div>

        <Card className="shadow-xl border-warning/20 bg-white dark:bg-card backdrop-blur">
          <CardContent className="pt-8 pb-6">
            {/* Status Icon */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-warning/10 flex items-center justify-center mb-4 animate-pulse">
                <Clock className="w-8 h-8 text-amber-600 dark:text-warning" />
              </div>
              <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-50 mb-2">
                Access Request Pending
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm max-w-sm mx-auto">
                Your <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {existingRequest?.role_requested === 'vendor' ? 'Vendor' : 'Property Manager'}
                </span> application is being reviewed. You'll receive full access once approved by our team.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
                Note: Your account temporarily shows "Tenant" status until your {existingRequest?.role_requested === 'vendor' ? 'vendor' : 'property manager'} access is approved.
              </p>
            </div>

            {/* Request Details */}
            <div className="bg-slate-100 dark:bg-slate-800/80 rounded-xl p-4 mb-6 space-y-3 border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Request Type:</span>
                <Badge variant="outline" className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                  {existingRequest?.role_requested === 'vendor' ? (
                    <>
                      <Briefcase className="h-3 w-3" />
                      Vendor
                    </>
                  ) : (
                    <>
                      <Building2 className="h-3 w-3" />
                      Property Manager
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-300">Submitted:</span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {existingRequest?.created_at 
                    ? formatDistanceToNow(new Date(existingRequest.created_at), { addSuffix: true })
                    : 'Just now'}
                </span>
              </div>
              {existingRequest?.company_name && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Company:</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{existingRequest.company_name}</span>
                </div>
              )}
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  Estimated review time: <span className="font-medium text-slate-700 dark:text-slate-200">1-2 business days</span>
                </p>
              </div>
            </div>

            {/* Refresh Button */}
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="w-full mb-4 text-foreground"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Request Status
            </Button>

            {/* Footer Links */}
            <div className="flex items-center justify-between text-sm pt-4 border-t border-border">
              <div className="flex gap-4">
                <Link 
                  to="/profile" 
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link 
                  to="/settings" 
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Signed in as */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
          Signed in as <span className="font-medium text-slate-700 dark:text-slate-200">{user?.email}</span>
        </p>
      </div>
    </div>
  );
}