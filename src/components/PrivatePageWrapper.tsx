import { ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import DashboardFooter from './layout/DashboardFooter';

interface PrivatePageWrapperProps {
  children: ReactNode;
  title?: string;
  showFooter?: boolean;
}

/**
 * Wrapper for private pages (vendor/admin routes) that adds noindex meta tags
 * to prevent search engine indexing of sensitive content
 */
export default function PrivatePageWrapper({ 
  children, 
  title,
  showFooter = true 
}: PrivatePageWrapperProps) {
  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
        {title && <title>{title} - Monarch Property Management</title>}
      </Helmet>
      {children}
      {showFooter && <DashboardFooter />}
    </>
  );
}
