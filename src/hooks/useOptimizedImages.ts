import { useMemo } from 'react';
import { 
  parseImageUrls, 
  getOptimizedImages, 
  ImageOptimizationConfig,
  DEFAULT_CONFIG 
} from '@/utils/imageOptimizer';

interface UseOptimizedImagesProps extends Partial<ImageOptimizationConfig> {
  imageUrls?: string;
}

interface OptimizedImageResult {
  images: string[];
  primaryImage: string;
  hasMultipleImages: boolean;
}

export const useOptimizedImages = (props: UseOptimizedImagesProps = {}): OptimizedImageResult => {
  const config = { ...DEFAULT_CONFIG, ...props };
  
  const optimizedImages = useMemo(() => {
    if (!props.imageUrls) {
      return {
        images: [],
        primaryImage: '/placeholder.svg',
        hasMultipleImages: false
      };
    }

    // Use the utility function for consistent optimization
    const optimizedUrls = getOptimizedImages(props.imageUrls, config);

    return {
      images: optimizedUrls,
      primaryImage: optimizedUrls[0] || '/placeholder.svg',
      hasMultipleImages: optimizedUrls.length > 1
    };
  }, [props.imageUrls, config.maxImages, config.quality]);

  return optimizedImages;
};

export default useOptimizedImages;