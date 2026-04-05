import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/OptimizedAuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requireSubscription?: boolean;
}

const OptimizedProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requireSubscription = false,
}) => {
  const { user, isAuthenticated, isLoading, hasRole, isSubscribed } = useAuth();
  const location = useLocation();
  const toastFired = useRef<string | null>(null);

  // Fire toasts via effect to avoid React render-phase side effects
  const redirectReason = !isLoading && (!isAuthenticated || !user)
    ? 'auth'
    : !isLoading && isAuthenticated && user && requiredRole && !hasRole(requiredRole)
      ? 'role'
      : !isLoading && isAuthenticated && user && requireSubscription && !isSubscribed('basic')
        ? 'subscription'
        : null;

  useEffect(() => {
    if (redirectReason && toastFired.current !== redirectReason) {
      toastFired.current = redirectReason;
      if (redirectReason === 'auth') {
        toast.info('Please sign in to access this page');
      } else if (redirectReason === 'role') {
        const roleText = Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole;
        toast.error(`Access denied. Required role: ${roleText}`);
      } else if (redirectReason === 'subscription') {
        toast.error('This feature requires an active subscription');
      }
    }
  }, [redirectReason, requiredRole]);

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check subscription requirements
  if (requireSubscription && !isSubscribed('basic')) {
    return <Navigate to="/dashboard/subscription" replace />;
  }

  return <>{children}</>;
};

export default OptimizedProtectedRoute;