import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Bed, Bath, Square, Calendar, Phone, Mail, Heart, Share2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PropertyAPI } from '@/lib/api';
import { Property } from '@/hooks/useProperties';
import OptimizedImageDisplay from '@/components/OptimizedImageDisplay';
import useOptimizedImages from '@/hooks/useOptimizedImages';
import { toast } from 'sonner';
import Footer from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';

export default function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const { images, hasMultipleImages } = useOptimizedImages({ 
    imageUrls: property?.image_urls,
    maxImages: 10,
    quality: 'high'
  });

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await PropertyAPI.getPropertyById(Number(id));
        setProperty(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch property';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title || 'Property',
          text: property?.description || '',
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="p-6">
          <div className="container mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded-lg w-1/4"></div>
              <div className="aspect-video bg-muted rounded-xl"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-32 bg-muted rounded-xl"></div>
                  <div className="h-16 bg-muted rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen">
        <div className="p-6">
          <div className="container mx-auto">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
              <p className="text-muted-foreground mb-6">{error || 'The property you are looking for does not exist.'}</p>
              <Link to="/properties">
                <Button>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Properties
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(property.price || 0);

  const propertyFeatures = [
    { icon: Bed, label: 'Bedrooms', value: property.bedrooms || 0 },
    { icon: Bath, label: 'Bathrooms', value: property.bathrooms || 0 },
    { icon: Square, label: 'Sq Ft', value: property.square_feet || 'N/A' },
  ];

  const amenitiesList = property.amenities ? 
    property.amenities.split(',').map(a => a.trim()).filter(Boolean) : [];

  const canonicalUrl = `https://monarchpropertymmgt.online/properties/${property.id}`;
  const heroImage = property.image_urls?.[0] || 'https://monarchpropertymmgt.online/og-image.png';
  const metaDescription = (property.description || `${property.title} located at ${property.address}, ${property.city}, ${property.state}. ${property.bedrooms || 0} bed, ${property.bathrooms || 0} bath.`).slice(0, 158);
  const seoTitle = `${property.title} - ${property.city}, ${property.state}`.slice(0, 58);

  const listingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: metaDescription,
    image: heroImage,
    url: canonicalUrl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: property.city,
      addressRegion: property.state,
      postalCode: property.zip_code,
      addressCountry: 'US',
    },
    numberOfRooms: property.bedrooms || undefined,
    floorSize: property.square_feet ? { '@type': 'QuantitativeValue', value: property.square_feet, unitCode: 'FTK' } : undefined,
    offers: {
      '@type': 'Offer',
      price: property.price || 0,
      priceCurrency: 'USD',
      availability: `https://schema.org/${property.status?.toLowerCase().includes('available') || !property.status ? 'InStock' : 'OutOfStock'}`,
      url: canonicalUrl,
    },
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title={seoTitle}
        description={metaDescription}
        image={heroImage}
        url={canonicalUrl}
        type="product"
        price={{ amount: property.price || 0, currency: 'USD' }}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(listingJsonLd)}</script>
      </Helmet>
      <div className="p-6">
        <div className="container mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link to="/properties" className="flex items-center text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Properties
            </Link>
          </div>

          {/* Property Images */}
          <div className="mb-8">
            <OptimizedImageDisplay
              images={images}
              alt={property.title}
              aspectRatio="video"
              className="rounded-2xl"
              showNavigation={hasMultipleImages}
              maxImages={10}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Property Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                    <div className="flex items-center text-muted-foreground mb-3">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>{property.address}, {property.city}, {property.state} {property.zip_code}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl font-bold text-primary">{formattedPrice}</span>
                      {property.property_type?.toLowerCase().includes('rent') && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                      <Badge variant="secondary">{property.status}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleFavorite}>
                      <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                      {isFavorite ? 'Saved' : 'Save'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
                {/* sr-only intermediate heading to maintain h1→h2→h3 hierarchy */}
                <h2 className="sr-only">Property overview</h2>

                {/* Property Features */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {propertyFeatures.map((feature, index) => (
                    <Card key={index} className="neumorphic-inset">
                      <CardContent className="p-4 text-center">
                        <feature.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <div className="font-semibold">{feature.value}</div>
                        <div className="text-sm text-muted-foreground">{feature.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Description */}
              {property.description && (
                <Card className="neumorphic-card mb-6">
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {property.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Amenities */}
              {amenitiesList.length > 0 && (
                <Card className="neumorphic-card mb-6">
                  <CardHeader>
                    <CardTitle>Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {amenitiesList.map((amenity, index) => (
                        <Badge key={index} variant="outline" className="justify-start">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Property Details */}
              <Card className="neumorphic-card">
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Property Type</span>
                      <p className="font-medium">{property.property_type}</p>
                    </div>
                    {property.available_date && (
                      <div>
                        <span className="text-sm text-muted-foreground">Available Date</span>
                        <p className="font-medium">
                          {new Date(property.available_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card className="neumorphic-card">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>Get in touch to schedule a viewing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full btn-primary">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Separator />
                  <Link to={`/book/${property.id}`}>
                    <Button className="w-full" size="lg">
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Viewing
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Property Summary */}
              <Card className="neumorphic-card">
                <CardHeader>
                  <CardTitle>Property Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-semibold">{formattedPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property Type</span>
                    <span className="font-medium">{property.property_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="secondary">{property.status}</Badge>
                  </div>
                  {property.square_feet && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-medium">{property.square_feet} sq ft</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}