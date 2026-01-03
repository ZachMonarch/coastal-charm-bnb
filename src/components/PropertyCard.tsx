import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Square, DollarSign, Calendar, Eye, Heart, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Property } from '@/hooks/useProperties';
import OptimizedImageDisplay from '@/components/OptimizedImageDisplay';
import useOptimizedImages from '@/hooks/useOptimizedImages';
import { usePropertyAccess } from '@/hooks/usePropertyAccess';
import luxuryDowntown from '@/assets/cdn/properties/luxury-downtown.webp';
import familyTownhouse from '@/assets/cdn/properties/family-townhouse.webp';
import studioLoft from '@/assets/cdn/properties/studio-loft.webp';
import { getStatusColor } from '@/utils/themeColors';

interface ExtendedProperty extends Property {
  location_display?: string;
  price_range?: string;
}

interface PropertyCardProps {
  property: ExtendedProperty;
  className?: string;
}

export default function PropertyCard({ property, className }: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { isAuthenticated, canViewFullAddress, canViewExactPrice } = usePropertyAccess();

  // Get optimized images using the hook
  const { images: qualityImages } = useOptimizedImages({ 
    imageUrls: property.image_urls,
    maxImages: 5,
    quality: 'medium'
  });

  const getPropertyImage = () => {
    // Priority: Use optimized images first
    if (qualityImages && qualityImages.length > 0) {
      return qualityImages[0];
    }
    
    // Secondary: Try to parse image_urls directly
    if (property.image_urls) {
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
            ? imageUrl.replace('w=1080', 'w=800')
            : imageUrl;
        }
      } catch (error) {
        // Silently handle parsing errors in production
      }
      
      // Fallback to local images if parsing fails
      if (property.image_urls.includes('luxury-downtown')) return luxuryDowntown;
      if (property.image_urls.includes('family-townhouse')) return familyTownhouse;
      if (property.image_urls.includes('studio-loft')) return studioLoft;
    }
    
    // Final fallback based on property type
    switch (property.property_type?.toLowerCase()) {
      case 'apartment':
      case 'penthouse':
        return luxuryDowntown;
      case 'townhouse':
      case 'house':
        return familyTownhouse;
      case 'loft':
      case 'condo':
      case 'condominium':
        return studioLoft;
      default:
        return luxuryDowntown;
    }
  };

  const primaryImage = getPropertyImage();
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(property.price || 0);

  return (
    <Card 
      className={cn(
        "group neumorphic-card overflow-hidden transition-all duration-500 hover:floating-card fast-refresh",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <OptimizedImageDisplay
          images={qualityImages || []}
          alt={property.title}
          aspectRatio="landscape"
          className={cn(
            "w-full h-full transition-all duration-700",
            isHovered ? "scale-110" : "scale-100"
          )}
          showNavigation={qualityImages && qualityImages.length > 1}
          maxImages={5}
        />
        
        {/* Overlay Elements */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <Badge 
            className={cn(
              "glass-card border-0 font-medium",
              getStatusColor(property.status)
            )}
          >
            {property.status?.charAt(0).toUpperCase() + property.status?.slice(1)}
          </Badge>
        </div>

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 glass-card text-white hover:text-destructive"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={cn("h-5 w-5", isFavorite && "fill-current text-destructive")} />
        </Button>

        {/* Price Overlay - Tiered display */}
        <div className="absolute bottom-4 left-4">
          <div className="glass-card px-3 py-2 rounded-xl">
            <div className="flex items-center text-white">
              <DollarSign className="h-4 w-4 mr-1 text-primary" />
              {canViewExactPrice ? (
                <>
                  <span className="text-lg font-bold">{formattedPrice}</span>
                  {property.property_type?.toLowerCase().includes('rent') && (
                    <span className="text-sm text-white/80 ml-1">/mo</span>
                  )}
                </>
              ) : (
                <span className="text-lg font-bold">{property.price_range || '$$$'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Image Count Indicator */}
        {qualityImages && qualityImages.length > 1 && (
          <div className="absolute bottom-4 right-4">
            <div className="glass-card px-2 py-1 rounded-lg text-white text-xs">
              +{qualityImages.length - 1} photos
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {property.title}
          </h3>
          
          {/* Address - Tiered display */}
          <div className="flex items-center text-muted-foreground text-sm">
            <MapPin className="h-4 w-4 mr-1 text-primary flex-shrink-0" />
            <span className="line-clamp-1">
              {canViewFullAddress 
                ? `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`
                : property.location_display || `${property.city}, ${property.state}`
              }
            </span>
          </div>

          {/* Sign in prompt for anonymous users */}
          {!isAuthenticated && (
            <Link 
              to="/auth" 
              className="inline-flex items-center text-xs text-primary hover:underline mt-1"
            >
              <LogIn className="h-3 w-3 mr-1" />
              Sign in to view full details
            </Link>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Property Details - Mobile Optimized */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="flex items-center justify-center neumorphic-inset p-2 sm:p-3 rounded-xl">
            <Bed className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-primary flex-shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{property.bedrooms || 0}</span>
          </div>
          <div className="flex items-center justify-center neumorphic-inset p-2 sm:p-3 rounded-xl">
            <Bath className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-primary flex-shrink-0" />
            <span className="font-medium text-xs sm:text-sm">{property.bathrooms || 0}</span>
          </div>
          <div className="flex items-center justify-center neumorphic-inset p-2 sm:p-3 rounded-xl">
            <Square className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-primary flex-shrink-0" />
            <span className="font-medium text-xs leading-tight text-center">
              {property.square_feet ? `${property.square_feet}` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Description */}
        {property.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {property.description}
          </p>
        )}

        {/* Property Type & Available Date - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
          <span className="neumorphic-inset px-2 sm:px-3 py-1 rounded-full text-center text-xs">
            {property.property_type}
          </span>
          {property.available_date && (
            <div className="flex items-center justify-center sm:justify-start">
              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="text-xs">Available {new Date(property.available_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link to={`/properties/${property.id}`} className="flex-1">
            <Button 
              variant="outline" 
              className="w-full group"
              aria-label={`View details for ${property.title}`}
            >
              <Eye className="mr-2 h-4 w-4 group-hover:animate-pulse" aria-hidden="true" />
              Details
            </Button>
          </Link>
          {property.status === 'available' && (
            <Link to={`/booking/${property.id}`} className="flex-1">
              <Button 
                className="w-full btn-primary tech-glow group"
                aria-label={`Book now for ${property.title}`}
              >
                <Calendar className="mr-2 h-4 w-4 group-hover:animate-pulse" aria-hidden="true" />
                Book Now
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}