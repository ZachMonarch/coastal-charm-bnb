// Image optimization utilities for bandwidth management and egress reduction

export interface ImageOptimizationConfig {
  quality: 'low' | 'medium' | 'high';
  maxImages: number;
  targetWidth: number;
  format: 'webp' | 'original';
}

export const DEFAULT_CONFIG: ImageOptimizationConfig = {
  quality: 'low', // Reduce quality for performance
  maxImages: 2, // Further limit to reduce egress costs
  targetWidth: 600, // Reduce size for faster loading
  format: 'webp'
};

export const QUALITY_SETTINGS = {
  low: { width: 400, quality: 50 }, // Lower quality for faster loading
  medium: { width: 600, quality: 65 }, // Reduced size and quality
  high: { width: 800, quality: 75 } // Smaller max size
};

export const FALLBACK_IMAGES = {
  apartment: '/assets/cdn/properties/luxury-downtown.webp',
  townhouse: '/assets/cdn/properties/family-townhouse.webp',
  house: '/assets/cdn/properties/family-townhouse.webp',
  condo: '/assets/cdn/properties/studio-loft.webp',
  loft: '/assets/cdn/properties/studio-loft.webp',
  penthouse: '/assets/cdn/properties/luxury-downtown.webp',
  default: '/assets/cdn/properties/luxury-downtown.webp'
};

/**
 * Optimize image URL for bandwidth efficiency with WebP support
 */
export function optimizeImageUrl(
  url: string, 
  width?: number,
  quality: number = 75
): string {
  if (!url) return '';
  
  // Force WebP for modern browsers with compression
  const params = new URLSearchParams();
  if (width) params.set('w', Math.min(width, 1920).toString());
  params.set('q', quality.toString());
  params.set('f', 'webp');
  params.set('fit', 'cover');
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
}

/**
 * Generate responsive srcset for different screen sizes
 */
export function generateSrcSet(url: string): string {
  if (!url) return '';
  
  return [
    `${optimizeImageUrl(url, 640, 70)} 640w`,
    `${optimizeImageUrl(url, 1280, 75)} 1280w`,
    `${optimizeImageUrl(url, 1920, 80)} 1920w`
  ].join(', ');
}

/**
 * Legacy function for backward compatibility
 */
export function optimizeImageUrlLegacy(
  url: string, 
  config: Partial<ImageOptimizationConfig> = {}
): string {
  const { quality, targetWidth } = { ...DEFAULT_CONFIG, ...config };
  
  if (!url) {
    return url;
  }

  // Handle local uploaded images - optimize size for display
  if (url.startsWith('/lovable-uploads/') || url.includes('lovable-uploads')) {
    return url; // Keep original path, but we'll use picture element with WebP
  }

  // Handle external URLs
  if (!url.startsWith('http')) {
    return url;
  }

  const settings = QUALITY_SETTINGS[quality];
  
  // Handle existing width parameters
  if (url.includes('w=')) {
    return url.replace(/w=\d+/, `w=${settings.width}`);
  }
  
  // Add width parameter for external images
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w=${settings.width}&q=${settings.quality}&fm=webp`;
}

/**
 * Parse image URLs from various formats (PostgreSQL array, JSON array, single URL)
 */
export function parseImageUrls(imageUrls: string | null | undefined): string[] {
  if (!imageUrls) return [];
  
  try {
    // PostgreSQL array format: {"url1", "url2", ...}
    if (imageUrls.startsWith('{') && imageUrls.endsWith('}')) {
      const cleanedString = imageUrls.slice(1, -1);
      return cleanedString
        .split(',')
        .map(url => url.trim().replace(/^"/, '').replace(/"$/, ''))
        .filter(url => url.length > 0 && url.startsWith('http'));
    }
    
    // JSON array format: ["url1", "url2", ...]
    if (imageUrls.startsWith('[') && imageUrls.endsWith(']')) {
      const parsed = JSON.parse(imageUrls);
      return Array.isArray(parsed) ? parsed.filter(url => url && url.startsWith('http')) : [];
    }
    
    // Single URL or comma-separated URLs
    if (imageUrls.startsWith('http')) {
      return [imageUrls];
    }
    
    // Comma-separated URLs
    return imageUrls
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0 && url.startsWith('http'));
      
  } catch (error) {
    console.warn('Error parsing image URLs:', error, imageUrls);
    return [];
  }
}

/**
 * Filter out low-quality images (with text overlays, watermarks, etc.)
 */
export function filterHighQualityImages(urls: string[]): string[] {
  const lowQualityIndicators = [
    'text', 'overlay', 'watermark', 'logo', 'banner',
    'listing', 'sold', 'price', 'contact', 'realtor',
    'mls', 'pending', 'reduced', 'new', 'coming', 'sale'
  ];
  
  return urls.filter(url => {
    const urlLower = url.toLowerCase();
    return !lowQualityIndicators.some(indicator => urlLower.includes(indicator));
  });
}

/**
 * Get optimized images with bandwidth considerations
 */
export function getOptimizedImages(
  imageUrls: string | null | undefined,
  config: Partial<ImageOptimizationConfig> = {}
): string[] {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Parse URLs
  const parsedUrls = parseImageUrls(imageUrls);
  
  // Filter for quality
  const qualityUrls = filterHighQualityImages(parsedUrls);
  
  // Limit number of images to reduce egress costs
  const limitedUrls = qualityUrls.slice(0, fullConfig.maxImages);
  
  // Optimize each URL using legacy function
  return limitedUrls.map(url => optimizeImageUrlLegacy(url, fullConfig));
}

/**
 * Get fallback image based on property type
 */
export function getFallbackImage(propertyType?: string): string {
  if (!propertyType) return FALLBACK_IMAGES.default;
  
  const type = propertyType.toLowerCase();
  
  for (const [key, image] of Object.entries(FALLBACK_IMAGES)) {
    if (type.includes(key)) {
      return image;
    }
  }
  
  return FALLBACK_IMAGES.default;
}

/**
 * Create responsive image sizes attribute
 */
export function createSizesAttribute(breakpoints: Record<string, string> = {}): string {
  const defaultBreakpoints = {
    '(max-width: 640px)': '100vw',
    '(max-width: 768px)': '50vw',
    '(max-width: 1024px)': '33vw',
    ...breakpoints
  };
  
  const sizes = Object.entries(defaultBreakpoints)
    .map(([query, size]) => `${query} ${size}`)
    .join(', ');
    
  return `${sizes}, 25vw`;
}

/**
 * Get optimized logo URL for different display sizes
 */
export function getOptimizedLogoUrl(
  src: string,
  displaySize: 'small' | 'medium' | 'large' = 'medium'
): string {
  const sizeMap = {
    small: { width: 32, height: 32 },
    medium: { width: 48, height: 48 }, 
    large: { width: 64, height: 64 }
  };
  
  const { width, height } = sizeMap[displaySize];
  
  // For local uploads, create optimized versions
  if (src.includes('lovable-uploads')) {
    return `${src}?w=${width}&h=${height}&q=85`;
  }
  
  return src;
}