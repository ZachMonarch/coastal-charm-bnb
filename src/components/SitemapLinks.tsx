import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/OptimizedAuthContext';

interface SitemapLinksProps {
  className?: string;
  variant?: 'grid' | 'list' | 'compact';
}

export default function SitemapLinks({ className, variant = 'grid' }: SitemapLinksProps) {
  const { user, hasRole } = useAuth();
  
  const siteLinks = [
    { path: '/', label: 'Home', category: 'Main', public: true },
    { path: '/properties', label: 'Properties', category: 'Main', public: true },
    { path: '/services', label: 'Services', category: 'Main', public: true },
    { path: '/amenities', label: 'Amenities', category: 'Main', public: true },
    { path: '/gallery', label: 'Gallery', category: 'Main', public: true },
    { path: '/contact', label: 'Contact', category: 'Main', public: true },
    { path: '/auth', label: 'Login / Register', category: 'Account', public: !user },
    { path: '/dashboard', label: 'Dashboard', category: 'Account', public: false, requiresAuth: true },
    { path: '/user-profile', label: 'Profile', category: 'Account', public: false, requiresAuth: true },
    { path: '/settings', label: 'Settings', category: 'Account', public: false, requiresAuth: true },
    { path: '/privacy', label: 'Privacy Policy', category: 'Legal', public: true },
    { path: '/terms', label: 'Terms of Service', category: 'Legal', public: true },
    { path: '/sitemap', label: 'Sitemap', category: 'Legal', public: true },
    // Admin-only routes
    ...(hasRole('admin') ? [
      { path: '/admin', label: 'Admin Dashboard', category: 'Management', public: false, adminOnly: true },
      { path: '/admin?tab=users', label: 'User Management', category: 'Management', public: false, adminOnly: true },
      { path: '/admin?tab=vendors', label: 'Vendor Management', category: 'Management', public: false, adminOnly: true },
      { path: '/admin?tab=projects', label: 'Project Management', category: 'Management', public: false, adminOnly: true },
      { path: '/admin?tab=testing', label: 'Security', category: 'Management', public: false, adminOnly: true },
      { path: '/admin?tab=testing', label: 'Monitoring', category: 'Management', public: false, adminOnly: true },
    ] : []),
    // Vendor-only routes
    ...(hasRole('vendor') ? [
      { path: '/vendor/subscription', label: 'Subscriptions', category: 'Business', public: false, vendorOnly: true },
      { path: '/rfq-system', label: 'RFQ System', category: 'Business', public: false, vendorOnly: true },
    ] : []),
    // Authenticated user routes
    ...(user ? [
      { path: '/booking', label: 'Booking', category: 'Business', public: false, requiresAuth: true },
    ] : [])
  ];

  // Filter links based on user access
  const filteredLinks = siteLinks.filter(link => {
    if (link.public) return true;
    if (link.adminOnly) return hasRole('admin');
    if (link.vendorOnly) return hasRole('vendor');
    if (link.requiresAuth) return !!user;
    return false;
  });

  const categories = [...new Set(filteredLinks.map(link => link.category))];

  if (variant === 'compact') {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {filteredLinks.slice(0, 8).map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn("space-y-2", className)}>
        {filteredLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="block text-sm text-muted-foreground hover:text-primary transition-colors py-1"
          >
            {link.label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8", className)}>
      {categories.map((category) => (
        <div key={category} className="space-y-4">
          <h4 className="font-semibold text-foreground">{category}</h4>
          <div className="space-y-2">
            {filteredLinks
              .filter(link => link.category === category)
              .map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}