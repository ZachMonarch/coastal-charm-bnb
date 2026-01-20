import { Crown } from 'lucide-react';
import { useState, memo } from 'react';
// Optimized WebP logos for faster FCP/LCP
import logo32 from '@/assets/cdn/ui/monarch-logo-32.webp';
import logo48 from '@/assets/cdn/ui/monarch-logo-48.webp';

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

  // Size mappings for the logo image - use optimized WebP sources
  const sizeMap = {
    sm: { container: 'w-8 h-8', image: 28, icon: 'h-4 w-4', src: logo32 },
    md: { container: 'w-10 h-10', image: 40, icon: 'h-5 w-5', src: logo48 },
    lg: { container: 'w-14 h-14', image: 56, icon: 'h-7 w-7', src: logo48 },
    xl: { container: 'w-16 h-16', image: 64, icon: 'h-8 w-8', src: logo48 },
  };

  const { container, image, icon, src } = sizeMap[size];

  if (logoError && showFallback) {
    return (
      <div className={`${container} ${className} flex items-center justify-center`}>
        <Crown className={`${icon} text-primary`} />
      </div>
    );
  }

  return (
    <img
      src={src}
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
