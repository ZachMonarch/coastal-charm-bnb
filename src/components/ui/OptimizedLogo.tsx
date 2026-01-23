import { Crown } from 'lucide-react';
import { useState, memo } from 'react';
// Brand logo - the official Monarch Property Management Group logo
import brandLogo from '@/assets/brand/monarch-logo.png';

interface OptimizedLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showFallback?: boolean;
}

/**
 * Optimized logo component with the official Monarch brand logo.
 * Uses explicit width/height to prevent layout shift and improve LCP.
 */
const OptimizedLogo = memo(function OptimizedLogo({ 
  size = 'md', 
  className = '',
  showFallback = true 
}: OptimizedLogoProps) {
  const [logoError, setLogoError] = useState(false);

  // Size mappings for the logo image
  const sizeMap = {
    xs: { container: 'w-6 h-6', image: 24, icon: 'h-3 w-3' },
    sm: { container: 'w-8 h-8', image: 32, icon: 'h-4 w-4' },
    md: { container: 'w-10 h-10', image: 40, icon: 'h-5 w-5' },
    lg: { container: 'w-14 h-14', image: 56, icon: 'h-7 w-7' },
    xl: { container: 'w-16 h-16', image: 64, icon: 'h-8 w-8' },
    '2xl': { container: 'w-20 h-20', image: 80, icon: 'h-10 w-10' },
  };

  const { container, image, icon } = sizeMap[size];

  if (logoError && showFallback) {
    return (
      <div className={`${container} ${className} flex items-center justify-center`}>
        <Crown className={`${icon} text-primary`} />
      </div>
    );
  }

  return (
    <img
      src={brandLogo}
      alt="Monarch Property Management Group Logo"
      className={`${container} object-contain ${className}`}
      width={image}
      height={image}
      onError={() => setLogoError(true)}
      loading="eager"
      decoding="async"
      fetchPriority="high"
    />
  );
});

export default OptimizedLogo;
