import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAccessRequest } from '@/hooks/useAccessRequest';
import { Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

interface LimitedAccessBannerProps {
  className?: string;
}

export function LimitedAccessBanner({ className }: LimitedAccessBannerProps) {
  const { 
    existingRequest, 
    hasPendingRequest, 
    hasRejectedRequest, 
    isLoading 
  } = useAccessRequest();

  if (isLoading) return null;

  // If user has a pending request
  if (hasPendingRequest) {
    return (
      <Alert className={className} variant="default">
        <Clock className="h-4 w-4" />
        <AlertTitle>Access Request Pending</AlertTitle>
        <AlertDescription>
          Your request for <strong>{existingRequest?.role_requested === 'vendor' ? 'Vendor' : 'Property Manager'}</strong> access is being reviewed.
          You'll receive a notification once it's processed.
        </AlertDescription>
      </Alert>
    );
  }

  // If user has a rejected request
  if (hasRejectedRequest) {
    return (
      <Alert className={className} variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Request Not Approved</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <span>{existingRequest?.admin_notes || 'Your previous access request was not approved.'}</span>
          <Link to="/contact">
            <Button variant="outline" size="sm">Contact Support</Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // If user has no request, show prompt to request access
  if (!existingRequest) {
    return (
      <Alert className={className}>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Limited Access</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <span>You currently have basic account access. Request vendor or property manager access to unlock full features.</span>
          <Link to="/dashboard?request-access=true">
            <Button variant="default" size="sm">Request Access</Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
