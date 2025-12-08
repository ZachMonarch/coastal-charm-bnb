import React, { memo } from 'react';
import { LazyImage } from './LazyImage';
import { cn } from '@/lib/utils';

interface ImageOptimizerProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
}

const ImageOptimizer: React.FC<ImageOptimizerProps> = memo(({
  src,
  alt,
  className,
  sizes,
  priority = false,
  aspectRatio = 'landscape'
}) => {
  // Convert image paths to WebP if available
  const getWebpSrc = (originalSrc: string) => {
    if (originalSrc.includes('/assets/cdn/')) {
      return originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    return originalSrc.endsWith('.webp') ? originalSrc : undefined;
  };

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  };

  const webpSrc = getWebpSrc(src);

  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl',
      aspectClasses[aspectRatio],
      className
    )}>
      <LazyImage
        src={src}
        webpSrc={webpSrc}
        alt={alt}
        className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
        sizes={sizes}
        placeholder="/placeholder.svg"
      />
    </div>
  );
});

ImageOptimizer.displayName = 'ImageOptimizer';

export default ImageOptimizer;