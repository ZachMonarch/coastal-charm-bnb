import { memo } from 'react';
import { cn } from '@/lib/utils';
import PropertyCard from './PropertyCard';
import MobileOptimizedPropertyCard from './MobileOptimizedPropertyCard';
import { Property } from '@/hooks/useProperties';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsivePropertyGridProps {
  properties: Property[];
  className?: string;
  onFavoriteToggle?: (propertyId: number, isFavorite: boolean) => void;
  favoriteIds?: Set<number>;
}

const ResponsivePropertyGrid = memo(({ 
  properties, 
  className,
  onFavoriteToggle,
  favoriteIds = new Set()
}: ResponsivePropertyGridProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn("grid-responsive", className)}>
      {properties.map((property, index) => {
        const isFavorite = favoriteIds.has(property.id);
        const animationDelay = `${index * 50}ms`;
        
        return (
          <div 
            key={property.id} 
            className="animate-fade-in fast-refresh" 
            style={{ animationDelay }}
          >
            {isMobile ? (
              <MobileOptimizedPropertyCard 
                property={property}
                isFavorite={isFavorite}
                onFavoriteToggle={onFavoriteToggle}
                className="h-full"
              />
            ) : (
              <PropertyCard 
                property={property} 
                className="h-full"
              />
            )}
          </div>
        );
      })}
    </div>
  );
});

ResponsivePropertyGrid.displayName = 'ResponsivePropertyGrid';

export default ResponsivePropertyGrid;