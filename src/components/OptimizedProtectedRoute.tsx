import React from 'react';
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
    toast.info('Please sign in to access this page');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole && !hasRole(requiredRole)) {
    const roleText = Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole;
    toast.error(`Access denied. Required role: ${roleText}`);
    return <Navigate to="/dashboard" replace />;
  }

  // Check subscription requirements
  if (requireSubscription && !isSubscribed('basic')) {
    toast.error('This feature requires an active subscription');
    return <Navigate to="/dashboard/subscription" replace />;
  }

  return <>{children}</>;
};

export default OptimizedProtectedRoute;