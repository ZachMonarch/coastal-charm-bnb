import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  blurDataURL?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
  fill?: boolean;
}

export const LazyImageOptimized: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder = '/placeholder.svg',
  blurDataURL,
  priority = false,
  quality = 75,
  sizes,
  onLoad,
  onError,
  className = '',
  fill = false,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    skip: priority, // Skip intersection observer for priority images
  });

  // Combine refs
  const setRefs = useCallback((node: HTMLImageElement | null) => {
    imgRef.current = node;
    inViewRef(node);
    setImageRef(node);
  }, [inViewRef]);

  // Generate optimized image URL
  const getOptimizedImageUrl = useCallback((originalSrc: string, width?: number) => {
    // If using a CDN like Cloudinary, ImageKit, or similar
    // return optimized URL. For now, return original.
    
    // Example for ImageKit:
    // return `https://ik.imagekit.io/your-id/tr:w-${width},q-${quality},f-auto/${originalSrc}`;
    
    // Example for Cloudinary:
    // return `https://res.cloudinary.com/your-cloud/image/fetch/w_${width},q_${quality},f_auto/${encodeURIComponent(originalSrc)}`;
    
    return originalSrc;
  }, [quality]);

  // Detect image dimensions and generate sizes
  const generateSizes = useCallback(() => {
    if (sizes) return sizes;
    
    // Default responsive sizes
    return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw';
  }, [sizes]);

  // Load image when in view or priority
  useEffect(() => {
    if (!inView && !priority) return;
    if (isLoaded || isLoading) return;

    setIsLoading(true);
    
    const image = new Image();
    
    // Use ResizeObserver to avoid forced reflow (fixes Lighthouse warning)
    const observer = new ResizeObserver((entries) => {
      const containerWidth = entries[0]?.contentRect.width || 800;
      const optimizedSrc = getOptimizedImageUrl(src, containerWidth * 2); // 2x for retina
      
      image.onload = () => {
        setImageSrc(optimizedSrc);
        setIsLoaded(true);
        setIsLoading(false);
        onLoad?.();
      };
      
      image.onerror = () => {
        setIsError(true);
        setIsLoading(false);
        setImageSrc(placeholder);
        onError?.();
      };
      
      image.src = optimizedSrc;
      
      // Preload hint for priority images
      if (priority) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = optimizedSrc;
        document.head.appendChild(link);
      }
    });
    
    if (imageRef) {
      observer.observe(imageRef);
    }
    
    return () => observer.disconnect();
  }, [inView, priority, src, isLoaded, isLoading, imageRef, getOptimizedImageUrl, placeholder, onLoad, onError]);

  // Generate optimized responsive srcSet with fewer breakpoints
  const generateSrcSet = useCallback(() => {
    const breakpoints = [400, 600, 800]; // Reduced breakpoints for performance
    return breakpoints
      .map(width => `${getOptimizedImageUrl(src, width)} ${width}w`)
      .join(', ');
  }, [src, getOptimizedImageUrl]);

  const imageClasses = [
    'transition-all duration-300 ease-in-out',
    isLoaded ? 'opacity-100' : 'opacity-0',
    isLoading ? 'animate-pulse' : '',
    fill ? 'absolute inset-0 w-full h-full object-cover' : '',
    className
  ].filter(Boolean).join(' ');

  const placeholderClasses = [
    'absolute inset-0 transition-all duration-300 ease-in-out',
    isLoaded ? 'opacity-0' : 'opacity-100',
    'bg-gradient-to-br from-muted to-muted/80 dark:from-muted/50 dark:to-muted/30'
  ].filter(Boolean).join(' ');

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''}`}>
      {/* Blur placeholder */}
      {blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className={`${placeholderClasses} filter blur-sm scale-110`}
          aria-hidden="true"
        />
      )}
      
      {/* Loading placeholder */}
      {!blurDataURL && !isLoaded && (
        <div className={placeholderClasses}>
          <div className="flex items-center justify-center w-full h-full">
            <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
          </div>
        </div>
      )}
      
      {/* Main image */}
      <img
        ref={setRefs}
        src={imageSrc}
        alt={alt}
        className={imageClasses}
        sizes={generateSizes()}
        srcSet={!isError ? generateSrcSet() : undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        {...props}
      />
      
      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 opacity-50">⚠️</div>
            <p className="text-xs">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Higher-order component for automatic image optimization
export const withImageOptimization = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => {
    useEffect(() => {
      // Preload critical images
      const criticalImages = document.querySelectorAll('img[data-priority="true"]');
      criticalImages.forEach((img) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = (img as HTMLImageElement).src;
        document.head.appendChild(link);
      });
      
      // Implement image format detection and optimization
      const supportsWebP = () => {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      };
      
      const supportsAVIF = () => {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
      };
      
      // Store format support in sessionStorage for performance
      sessionStorage.setItem('supportsWebP', supportsWebP().toString());
      sessionStorage.setItem('supportsAVIF', supportsAVIF().toString());
      
    }, []);
    
    return <Component {...props} />;
  };
};

// Image compression utility
export const compressImage = (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
};