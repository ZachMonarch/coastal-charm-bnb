import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Phase 5.1: Comprehensive Breadcrumb Navigation
 * Provides contextual navigation across all authenticated routes
 */
export const Breadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Comprehensive breadcrumb mapping for all routes
  const breadcrumbMap: Record<string, string> = {
    // Admin routes
    'admin': 'Admin Dashboard',
    'dashboard': 'Dashboard',
    'properties': 'Properties',
    'projects': 'Projects',
    'vendors': 'Vendors',
    'verification': 'Vendor Verification',
    'testing': 'Testing Center',
    'users': 'User Management',
    'audit': 'Audit Logs',
    'monitoring': 'System Monitoring',
    'settings': 'Settings',
    'analytics': 'Analytics',
    'security': 'Security',
    'rfq': 'RFQ Management',
    'contracts': 'Contracts',
    'payments': 'Payments',
    
    // Vendor routes
    'vendor': 'Vendor Portal',
    'onboarding': 'Onboarding',
    'profile': 'Profile',
    'documents': 'Documents',
    'compliance': 'Compliance',
    'complete': 'Completion',
    'bids': 'My Bids',
    
    // Project routes
    'project': 'Projects',
    'details': 'Details',
    'milestones': 'Milestones',
    
    // General
    'account': 'Account',
    'profile-settings': 'Profile Settings',
    'notifications': 'Notifications',
  };

  // Don't show breadcrumbs on root or auth pages
  if (pathSegments.length === 0 || pathSegments[0] === 'auth') {
    return null;
  }

  return (
    <nav 
      className="flex items-center space-x-2 text-sm text-muted-foreground mb-6 px-1" 
      aria-label="Breadcrumb"
    >
      <Link 
        to="/" 
        className="hover:text-foreground transition-colors flex items-center"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {pathSegments.map((segment, index) => {
        const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const label = breadcrumbMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        const isLast = index === pathSegments.length - 1;

        return (
          <div key={path} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {isLast ? (
              <span 
                className="text-foreground font-medium truncate" 
                aria-current="page"
              >
                {label}
              </span>
            ) : (
              <Link 
                to={path} 
                className="hover:text-foreground transition-colors hover:underline truncate"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};
