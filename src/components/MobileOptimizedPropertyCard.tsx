import { memo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapPin, Bed, Bath, Square, Star, Heart, Eye, DollarSign, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import OptimizedImageDisplay from '@/components/OptimizedImageDisplay';
import useOptimizedImages from '@/hooks/useOptimizedImages';

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

interface MobileOptimizedPropertyCardProps {
  property: Property;
  priority?: boolean;
  onFavoriteToggle?: (propertyId: number, isFavorite: boolean) => void;
  isFavorite?: boolean;
  className?: string;
}

const MobileOptimizedPropertyCard = memo(({ 
  property, 
  priority = false,
  onFavoriteToggle,
  isFavorite = false,
  className
}: MobileOptimizedPropertyCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  // Get optimized images - limit to 3 for egress efficiency
  const { images: optimizedImages } = useOptimizedImages({ 
    imageUrls: property.image_urls,
    maxImages: 3,
    quality: 'medium'
  });

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

  const getStatusColor = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': 
        return 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40';
      case 'pending': 
        return 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40';
      case 'sold': 
        return 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40';
      case 'rented':
        return 'bg-info/10 text-info dark:text-info border-info/30 dark:border-info/40';
      default: 
        return 'bg-muted text-muted-foreground border-border';
    }
  }, []);

  const propertyDetails = [
    { icon: Bed, value: property.bedrooms, label: 'bed' },
    { icon: Bath, value: property.bathrooms, label: 'bath' },
    { icon: Square, value: property.square_feet, label: 'sqft' },
  ].filter(detail => detail.value);

  return (
    <Card className={cn(
      "group neumorphic-card hover:floating-card transition-all duration-300 overflow-hidden h-full flex flex-col",
      className
    )}>
      <Link to={`/properties/${property.id}`} className="block h-full">
        {/* Mobile-First Image Container */}
        <div className="relative aspect-[16/10] sm:aspect-video overflow-hidden">
          <OptimizedImageDisplay
            images={optimizedImages}
            alt={property.title || "Property"}
            aspectRatio="landscape"
            className="w-full h-full"
            showNavigation={optimizedImages.length > 1}
            maxImages={3}
          />
          
          {/* Status Badge - Mobile Positioned */}
          {property.status && (
            <Badge 
              className={cn(
                "absolute top-2 left-2 text-xs font-medium backdrop-blur-sm",
                getStatusColor(property.status)
              )}
            >
              {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
            </Badge>
          )}

          {/* Favorite Button - Mobile Friendly */}
          {onFavoriteToggle && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-background"
              onClick={handleFavoriteClick}
            >
              <Heart 
                className={cn(
                  "h-4 w-4",
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                )} 
              />
            </Button>
          )}

          {/* Price Overlay - Mobile Optimized */}
          <div className="absolute bottom-2 left-2">
            <div className="bg-background/95 backdrop-blur-sm px-2 py-1 rounded-lg">
              <div className="flex items-center">
                <DollarSign className="h-3 w-3 mr-1 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  {formatPrice(property.price)}
                </span>
                {property.property_type?.includes('rent') && (
                  <span className="text-xs text-muted-foreground ml-1">/mo</span>
                )}
              </div>
            </div>
          </div>

          {/* Image Count - Mobile */}
          {optimizedImages.length > 1 && (
            <div className="absolute bottom-2 right-2">
              <div className="bg-background/95 backdrop-blur-sm px-2 py-1 rounded-lg text-xs">
                +{optimizedImages.length - 1}
              </div>
            </div>
          )}
        </div>

        {/* Content - Mobile Optimized */}
        <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
          <div className="space-y-3 flex-1">
            {/* Title and Location */}
            <div>
              <h3 className="font-semibold text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                {property.title || 'Untitled Property'}
              </h3>
              {(property.address || property.city || property.state) && (
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="line-clamp-1 text-xs">
                    {[property.address, property.city, property.state]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Property Details - Compact Mobile Layout */}
            {propertyDetails.length > 0 && (
              <div className="flex items-center justify-between sm:justify-start sm:space-x-4">
                {propertyDetails.map((detail, index) => (
                  <div key={index} className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <detail.icon className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="font-medium">
                      {detail.value}
                    </span>
                    <span className="hidden sm:inline">
                      {detail.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Description - Mobile Truncated */}
            {property.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {property.description}
              </p>
            )}

            {/* Property Type & Date - Mobile Stacked */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <Badge variant="outline" className="self-start text-xs">
                {property.property_type}
              </Badge>
              {property.available_date && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>Available {new Date(property.available_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Button - Mobile Optimized */}
          <Button className="w-full btn-primary mt-3 text-sm py-2 group-hover:tech-glow">
            <Eye className="mr-2 h-3 w-3" />
            View Details
          </Button>
        </CardContent>
      </Link>
    </Card>
  );
});

MobileOptimizedPropertyCard.displayName = 'MobileOptimizedPropertyCard';

export default MobileOptimizedPropertyCard;