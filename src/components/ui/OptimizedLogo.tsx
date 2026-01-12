import { Crown } from 'lucide-react';
import { useState, memo } from 'react';

interface OptimizedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

/**
 * Optimized logo component with proper image sizing and fallback.
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
    sm: { container: 'w-8 h-8', image: 28, icon: 'h-4 w-4' },
    md: { container: 'w-10 h-10', image: 40, icon: 'h-5 w-5' },
    lg: { container: 'w-14 h-14', image: 56, icon: 'h-7 w-7' },
    xl: { container: 'w-16 h-16', image: 64, icon: 'h-8 w-8' },
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
      src="/lovable-uploads/318cdd13-7256-4cfe-99e0-948e43902b7b.png"
      alt="Monarch Property Management Logo"
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
