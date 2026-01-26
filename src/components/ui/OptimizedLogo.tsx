import { Crown } from 'lucide-react';
import { useState, memo } from 'react';
// Brand logos - optimized for different display sizes
import brandLogo from '@/assets/brand/monarch-logo.png';
import brandLogoSm from '@/assets/brand/monarch-logo-sm.png';

interface OptimizedLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showFallback?: boolean;
}

/**
 * Optimized logo component with the official Monarch brand logo.
 * Uses responsive images: small logo (<= 80px) vs full logo (> 80px).
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
    xs: { container: 'w-6 h-6', image: 24, icon: 'h-3 w-3', useSmall: true },
    sm: { container: 'w-8 h-8', image: 32, icon: 'h-4 w-4', useSmall: true },
    md: { container: 'w-10 h-10', image: 40, icon: 'h-5 w-5', useSmall: true },
    lg: { container: 'w-14 h-14', image: 56, icon: 'h-7 w-7', useSmall: true },
    xl: { container: 'w-16 h-16', image: 64, icon: 'h-8 w-8', useSmall: true },
    '2xl': { container: 'w-20 h-20', image: 80, icon: 'h-10 w-10', useSmall: false },
  };

  const { container, image, icon, useSmall } = sizeMap[size];
  
  // Use smaller optimized logo for sizes <= 80px display
  const logoSrc = useSmall ? brandLogoSm : brandLogo;

  if (logoError && showFallback) {
    return (
      <div className={`${container} ${className} flex items-center justify-center`}>
        <Crown className={`${icon} text-primary`} />
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt="Monarch Property Management Group Logo"
      className={`${container} object-contain ${className}`}
      width={image}
      height={image}
      onError={() => setLogoError(true)}
      loading="eager"
      decoding="async"
    />
  );
});

export default OptimizedLogo;
