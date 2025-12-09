import React, { memo, useState, useCallback } from 'react';
import LazyImage from './LazyImage';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OptimizedImageDisplayProps {
  images: string[];
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
  showNavigation?: boolean;
  maxImages?: number;
}

export const OptimizedImageDisplay: React.FC<OptimizedImageDisplayProps> = memo(({
  images,
  alt,
  className,
  aspectRatio = 'landscape',
  showNavigation = true,
  maxImages = 3
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Accept both http URLs and local assets (starting with /)
  const validImages = images.slice(0, maxImages).filter(img => 
    img && (img.startsWith('http') || img.startsWith('/') || img.startsWith('data:'))
  );
  
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  };

  const optimizeImageUrl = useCallback((url: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    if (!url) return '';
    
    // Size mapping for bandwidth optimization
    const sizeMap = {
      small: 'w=400',
      medium: 'w=800', 
      large: 'w=1200'
    };
    
    // Replace existing width parameter or add it
    if (url.includes('w=')) {
      return url.replace(/w=\d+/, sizeMap[size]);
    }
    
    // Add width parameter
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${sizeMap[size]}`;
  }, []);

  const handleImageError = useCallback((index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  }, []);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  if (validImages.length === 0) {
    return (
      <div className={cn(
        'relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center',
        aspectClasses[aspectRatio],
        className
      )}>
        <div className="text-center text-muted-foreground/70">
          <ImageIcon className="h-10 w-10 mx-auto mb-2 text-primary/40" />
          <p className="text-xs font-medium">No Image</p>
        </div>
      </div>
    );
  }

  const currentImage = validImages[currentIndex];
  const hasError = imageErrors.has(currentIndex);

  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl group',
      aspectClasses[aspectRatio],
      className
    )}>
      {!hasError ? (
        <LazyImage
          src={optimizeImageUrl(currentImage, 'medium')}
          alt={`${alt} - Image ${currentIndex + 1}`}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          onError={() => handleImageError(currentIndex)}
          placeholder="/placeholder.svg"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">Image unavailable</p>
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      {showNavigation && validImages.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={prevImage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={nextImage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Image Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
            {validImages.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentIndex === index 
                    ? "bg-white" 
                    : "bg-white/50 hover:bg-white/75"
                )}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </>
      )}

      {/* Image Count Badge */}
      {validImages.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1}/{validImages.length}
        </div>
      )}
    </div>
  );
});

OptimizedImageDisplay.displayName = 'OptimizedImageDisplay';

export default OptimizedImageDisplay;