import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Users, MapPin, Star, Wifi, Car, Shield, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";

interface ApartmentProps {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  size: number;
  image: string;
  location: string;
  features: string[];
  rating?: number;
}

interface ApartmentBookingPageProps {
  apartment?: ApartmentProps;
}

export default function ApartmentBookingPage({ apartment }: ApartmentBookingPageProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Default apartment data if none provided
  const defaultApartment: ApartmentProps = {
    id: "1",
    name: "Deluxe Sea View Suite",
    description: "Luxurious suite with panoramic sea views, modern amenities, and a private balcony.",
    price: 180,
    capacity: 2,
    size: 45,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
    location: "Beachfront",
    features: ["Wi-Fi", "Kitchen", "Bathroom", "Air Conditioning", "TV", "Balcony"],
    rating: 4.8
  };

  const apt = apartment || defaultApartment;

  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case 'wi-fi':
        return <Wifi className="h-3 w-3" />;
      case 'parking':
        return <Car className="h-3 w-3" />;
      case 'security':
        return <Shield className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header with Back Button */}
          <div className="mb-8">
            <Link to="/properties">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Properties
              </Button>
            </Link>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{apt.name}</h1>
                <div className="flex items-center text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{apt.location}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-current text-primary mr-1" />
                    <span className="font-medium">{apt.rating || 'N/A'}</span>
                  </div>
                  <Badge variant="secondary">Vacation Rental</Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">${apt.price}</div>
                <div className="text-sm text-muted-foreground">per night</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Apartment Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Section */}
              <Card className="neumorphic-card">
                <CardContent className="p-0">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img
                      src={apt.image}
                      alt={apt.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Favorite Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 glass-card text-white hover:text-red-400"
                      onClick={() => setIsFavorite(!isFavorite)}
                    >
                      <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current text-red-400' : ''}`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Apartment Information */}
              <Card className="neumorphic-card">
                <CardHeader>
                  <CardTitle>Apartment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 neumorphic-inset rounded-xl">
                      <div className="text-2xl font-bold text-primary">{apt.capacity}</div>
                      <div className="text-sm text-muted-foreground">Guests</div>
                    </div>
                    <div className="text-center p-4 neumorphic-inset rounded-xl">
                      <div className="text-2xl font-bold text-primary">{apt.size}</div>
                      <div className="text-sm text-muted-foreground">m²</div>
                    </div>
                    <div className="text-center p-4 neumorphic-inset rounded-xl">
                      <div className="text-2xl font-bold text-primary">{apt.rating || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">Rating</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">{apt.description}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Features & Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {apt.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {getFeatureIcon(feature)}
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <div>
                      <h4 className="font-medium mb-2">Check-in</h4>
                      <p className="text-sm text-muted-foreground">After 3:00 PM</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Check-out</h4>
                      <p className="text-sm text-muted-foreground">Before 11:00 AM</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* House Rules */}
              <Card className="neumorphic-card">
                <CardHeader>
                  <CardTitle>House Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• No smoking inside the property</li>
                    <li>• Pets allowed with prior approval</li>
                    <li>• Quiet hours: 10 PM - 8 AM</li>
                    <li>• Maximum occupancy: {apt.capacity} guests</li>
                    <li>• No parties or events</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <BookingForm />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}