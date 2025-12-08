import { memo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapPin, Bed, Bath, Square, Star, Heart } from "lucide-react";
import { logger } from '@/utils/logger';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LazyImage from "@/components/LazyImage";

interface Property {
  id: number;
  title?: string;
  description?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: string;
  address?: string;
  city?: string;
  state?: string;
  image_urls?: string;
  property_type?: string;
  amenities?: string;
  available_date?: string;
  status?: string;
}

interface OptimizedPropertyCardProps {
  property: Property;
  priority?: boolean;
  onFavoriteToggle?: (propertyId: number, isFavorite: boolean) => void;
  isFavorite?: boolean;
}

const OptimizedPropertyCard = memo(({ 
  property, 
  priority = false,
  onFavoriteToggle,
  isFavorite = false
}: OptimizedPropertyCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFavoriteToggle?.(property.id, !isFavorite);
  }, [property.id, isFavorite, onFavoriteToggle]);

  const formatPrice = useCallback((price?: number) => {
    if (!price) return 'Price on request';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  const getImageUrl = useCallback(() => {
    if (imageError) {
      return '/placeholder.svg';
    }
    
    if (!property.image_urls) {
      return '/placeholder.svg';
    }
    
    try {
      let imageUrl = '';
      
      if (property.image_urls.startsWith('{') && property.image_urls.endsWith('}')) {
        // Handle PostgreSQL array format
        const cleanedString = property.image_urls.slice(1, -1);
        const firstUrl = cleanedString.split(',')[0]?.trim().replace(/^"/, '').replace(/"$/, '');
        imageUrl = firstUrl || '';
      } else if (property.image_urls.startsWith('[') && property.image_urls.endsWith(']')) {
        // Handle JSON array format
        const urls = JSON.parse(property.image_urls);
        imageUrl = urls[0] || '';
      } else if (property.image_urls.startsWith('http')) {
        // Single URL
        imageUrl = property.image_urls;
      }
      
      if (imageUrl && imageUrl.startsWith('http')) {
        // Optimize for bandwidth
        return imageUrl.includes('w=1080') 
          ? imageUrl.replace('w=1080', 'w=600') // Smaller size for cards
          : imageUrl;
      }
    } catch (error) {
      logger.warn('Error parsing property image URL:', error);
    }
    
    return '/placeholder.svg';
  }, [property.image_urls, imageError]);

  const propertyDetails = [
    { icon: Bed, value: property.bedrooms, label: 'beds' },
    { icon: Bath, value: property.bathrooms, label: 'baths' },
    { icon: Square, value: property.square_feet, label: 'sq ft' },
  ].filter(detail => detail.value);

  return (
    <Card className="group neumorphic-card hover:neumorphic-inset transition-all duration-300 overflow-hidden h-full">
      <Link to={`/properties/${property.id}`} className="block h-full">
        <div className="relative aspect-video overflow-hidden">
          <LazyImage
            src={getImageUrl()}
            alt={property.title || "Property"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            onLoad={() => setIsImageLoading(false)}
          />
          
          {/* Loading skeleton */}
          {isImageLoading && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}

          {/* Property type badge */}
          {property.property_type && (
            <Badge 
              className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm"
              variant="secondary"
            >
              {property.property_type}
            </Badge>
          )}

          {/* Status badge */}
          {property.status && property.status !== 'available' && (
            <Badge 
              className="absolute top-3 right-3 bg-primary text-primary-foreground"
            >
              {property.status}
            </Badge>
          )}

          {/* Favorite button */}
          {onFavoriteToggle && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm hover:bg-background"
              onClick={handleFavoriteClick}
            >
              <Heart 
                className={`h-4 w-4 ${
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                }`} 
              />
            </Button>
          )}

          {/* Price overlay */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-lg">
              <span className="text-lg font-bold text-primary">
                {formatPrice(property.price)}
              </span>
              {property.property_type?.includes('rent') && (
                <span className="text-sm text-muted-foreground">/month</span>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="space-y-3 flex-1">
            <div>
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {property.title || 'Untitled Property'}
              </h3>
              {(property.address || property.city || property.state) && (
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="line-clamp-1">
                    {[property.address, property.city, property.state]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>

            {property.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {property.description}
              </p>
            )}

            {/* Property details */}
            {propertyDetails.length > 0 && (
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                {propertyDetails.map((detail, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    <detail.icon className="h-4 w-4" />
                    <span>
                      {detail.value} {detail.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Amenities preview */}
            {property.amenities && (
              <div className="flex flex-wrap gap-1">
                {property.amenities.split(',').slice(0, 3).map((amenity, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {amenity.trim()}
                  </Badge>
                ))}
                {property.amenities.split(',').length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{property.amenities.split(',').length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Available date */}
          {property.available_date && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                Available: {new Date(property.available_date).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
});

OptimizedPropertyCard.displayName = 'OptimizedPropertyCard';

export default OptimizedPropertyCard;