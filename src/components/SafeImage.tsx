import { useState, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackClassName?: string;
}

/**
 * SafeImage - Image component with automatic fallback handling
 * Prevents broken image icons by falling back to placeholder on error
 */
export default function SafeImage({
  src,
  alt = '',
  fallbackSrc = '/placeholder.svg',
  className,
  fallbackClassName,
  onError,
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
    }
    onError?.(e);
  };

  // Reset error state when src changes
  if (src !== currentSrc && !hasError) {
    setCurrentSrc(src);
  }

  return (
    <img
      src={currentSrc || fallbackSrc}
      alt={alt}
      className={cn(className, hasError && fallbackClassName)}
      onError={handleError}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}

/**
 * PropertyImage - Specialized SafeImage for property listings
 */
export function PropertyImage({
  src,
  alt = 'Property image',
  className,
  ...props
}: SafeImageProps) {
  return (
    <SafeImage
      src={src}
      alt={alt}
      fallbackSrc="/placeholder-property.webp"
      className={cn('object-cover', className)}
      fallbackClassName="opacity-75"
      {...props}
    />
  );
}

/**
 * AvatarImage - Specialized SafeImage for user avatars
 */
export function AvatarImage({
  src,
  alt = 'User avatar',
  className,
  ...props
}: SafeImageProps) {
  return (
    <SafeImage
      src={src}
      alt={alt}
      fallbackSrc="/placeholder.svg"
      className={cn('rounded-full object-cover', className)}
      {...props}
    />
  );
}
