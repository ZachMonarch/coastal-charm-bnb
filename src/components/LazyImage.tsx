import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  webpSrc?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  fallback = '/placeholder.svg',
  webpSrc,
  placeholder,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const imageSrc = hasError ? fallback : (webpSrc && isInView ? webpSrc : src);

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden', className)}>
      {/* Placeholder */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-muted to-muted/80 animate-pulse"
          style={{
            backgroundImage: placeholder ? `url(${placeholder})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}

      {/* Actual Image */}
      {isInView && (
        <picture>
          {webpSrc && (
            <source srcSet={webpSrc} type="image/webp" />
          )}
          <img
            src={imageSrc}
            alt={alt}
            className={cn(
              'transition-opacity duration-300 object-cover w-full h-full',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            decoding="async"
            {...props}
          />
        </picture>
      )}
    </div>
  );
};

export default LazyImage;