import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Users, Star, Wifi, Car, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { PropertyAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please sign in to make a booking");
      navigate("/auth");
      return;
    }

    const fetchProperty = async () => {
      if (!id) return;
      
      try {
        const propertyData = await PropertyAPI.getPropertyById(parseInt(id));
        setProperty(propertyData);
      } catch (error) {
        console.error("Error fetching property:", error);
        toast.error("Failed to load property details");
        navigate("/properties");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, isAuthenticated, navigate]);

  const getPropertyImages = (imageUrls: string) => {
    if (!imageUrls) return [];
    
    try {
      let urls: string[] = [];
      
      if (imageUrls.startsWith('{') && imageUrls.endsWith('}')) {
        const cleanedString = imageUrls.slice(1, -1);
        urls = cleanedString
          .split(',')
          .map(url => url.trim().replace(/^"/, '').replace(/"$/, ''))
          .filter(url => url.length > 0);
      } else if (imageUrls.startsWith('[') && imageUrls.endsWith(']')) {
        urls = JSON.parse(imageUrls);
      } else {
        urls = imageUrls.split(',').map(url => url.trim());
      }
      
      return urls.slice(0, 5); // Limit to 5 images
    } catch (error) {
      console.warn('Error parsing image URLs:', error);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="neumorphic-card p-8 rounded-3xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-center">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="neumorphic-card p-12 rounded-3xl text-center">
          <h2 className="text-2xl font-bold mb-4">Property Not Found</h2>
          <p className="text-muted-foreground mb-6">The property you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/properties")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  const images = getPropertyImages(property.image_urls || '');
  const amenities = property.amenities ? property.amenities.split(',').map((a: string) => a.trim()) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header with Back Button */}
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => navigate("/properties")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                <div className="flex items-center text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{property.address}, {property.city}, {property.state}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{property.property_type}</Badge>
                  <Badge variant={property.status === 'available' ? 'default' : 'outline'}>
                    {property.status}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">${property.price}</div>
                <div className="text-sm text-muted-foreground">per month</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Property Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              {images.length > 0 && (
                <Card className="neumorphic-card">
                  <CardContent className="p-0">
                    <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      <img
                        src={images[selectedImageIndex]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {images.length > 1 && (
                      <div className="p-4">
                        <div className="flex gap-2 overflow-x-auto">
                          {images.map((image, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImageIndex(index)}
                              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                                selectedImageIndex === index 
                                  ? 'border-primary' 
                                  : 'border-transparent hover:border-border'
                              }`}
                            >
                              <img
                                src={image}
                                alt={`${property.title} ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Property Information */}
              <Card className="neumorphic-card">
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 neumorphic-inset rounded-xl">
                      <div className="text-2xl font-bold text-primary">{property.bedrooms}</div>
                      <div className="text-sm text-muted-foreground">Bedrooms</div>
                    </div>
                    <div className="text-center p-4 neumorphic-inset rounded-xl">
                      <div className="text-2xl font-bold text-primary">{property.bathrooms}</div>
                      <div className="text-sm text-muted-foreground">Bathrooms</div>
                    </div>
                    <div className="text-center p-4 neumorphic-inset rounded-xl">
                      <div className="text-2xl font-bold text-primary">{property.square_feet}</div>
                      <div className="text-sm text-muted-foreground">Sq Ft</div>
                    </div>
                    <div className="text-center p-4 neumorphic-inset rounded-xl">
                      <div className="text-2xl font-bold text-primary">
                        {property.available_date ? new Date(property.available_date).getFullYear() : 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Available</div>
                    </div>
                  </div>

                  {property.description && (
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                    </div>
                  )}

                  {amenities.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Amenities</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {amenities.slice(0, 8).map((amenity, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                            {amenity}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <BookingForm propertyId={property.id} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}