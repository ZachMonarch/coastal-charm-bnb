import { Helmet } from 'react-helmet-async';

// Security Headers Component - Client-side only (HTTP headers moved to vercel.json)
export const SecurityHeaders = () => {
  return (
    <Helmet>
      {/* Client-side security preferences */}
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <meta httpEquiv="X-DNS-Prefetch-Control" content="off" />
    </Helmet>
  );
};