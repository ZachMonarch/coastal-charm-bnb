import { Car, Wifi, Users, Waves, Utensils, MapPin, Calendar, Shield, Zap, Dumbbell, Star, Heart, Coffee, Music } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { getCategoryColor } from '@/utils/themeColors';

const amenities = [
  {
    icon: Wifi,
    title: "High-Speed WiFi",
    description: "Complimentary fiber-optic internet access with speeds up to 1GB throughout the property",
    category: "connectivity",
    featured: true
  },
  {
    icon: Car,
    title: "Premium Parking",
    description: "Secure underground parking with EV charging stations and valet service",
    category: "convenience",
    featured: false
  },
  {
    icon: Shield,
    title: "Advanced Security",
    description: "24/7 security monitoring, biometric access, and smart surveillance systems",
    category: "safety",
    featured: true
  },
  {
    icon: Dumbbell,
    title: "State-of-Art Fitness",
    description: "Premium gym with personal trainers, yoga studio, and wellness programs",
    category: "wellness",
    featured: true
  },
  {
    icon: Waves,
    title: "Resort-Style Pool",
    description: "Infinity pool with poolside bar, hot tub, and private cabanas",
    category: "recreation",
    featured: true
  },
  {
    icon: Utensils,
    title: "Gourmet Dining",
    description: "Michelin-recommended restaurants and 24/7 room service available",
    category: "dining",
    featured: false
  },
  {
    icon: Zap,
    title: "Smart Living",
    description: "AI-powered home automation, voice control, and energy optimization",
    category: "technology",
    featured: true
  },
  {
    icon: Calendar,
    title: "Luxury Concierge",
    description: "Personal concierge for travel, dining, and entertainment bookings",
    category: "service",
    featured: false
  },
  {
    icon: Users,
    title: "Social Spaces",
    description: "Rooftop lounges, co-working spaces, and private event venues",
    category: "community",
    featured: true
  },
  {
    icon: Coffee,
    title: "Café & Lounge",
    description: "Artisan coffee shop and premium wine bar with outdoor seating",
    category: "dining",
    featured: false
  },
  {
    icon: Music,
    title: "Entertainment",
    description: "Private cinema, game room, and live music venues",
    category: "recreation",
    featured: false
  },
  {
    icon: Heart,
    title: "Wellness Center",
    description: "Full-service spa, meditation rooms, and health consultations",
    category: "wellness",
    featured: false
  }
];

// Category colors removed - using imported utility

export default function Amenities() {
  const { t } = useLanguage();

  const featuredAmenities = amenities.filter(amenity => amenity.featured);
  const regularAmenities = amenities.filter(amenity => !amenity.featured);

  return (
    <div className="min-h-screen w-full">
      <SEOHead
        title="Luxury Amenities & Premium Features"
        description="Experience world-class amenities including resort-style pools, state-of-the-art fitness centers, smart home technology, concierge services, and premium security."
        keywords={["luxury amenities", "resort pool", "fitness center", "smart home", "concierge services", "property features", "premium living"]}
        type="website"
        url="https://monarch-properties.com/amenities"
      />
      {/* Hero Section with Background - Full Width */}
      <div className="relative h-[50vh] overflow-hidden w-full breakout-full-width">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&h=1080&fit=crop')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70" />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center max-w-4xl px-6">
            <span className="text-sm font-medium uppercase tracking-wider mb-4 block text-overlay-foreground/90 drop-shadow-md">
              Premium Living
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-overlay-foreground drop-shadow-lg">
              Luxury Amenities & Features
            </h1>
            <p className="text-xl text-overlay-foreground/85 drop-shadow-lg max-w-3xl mx-auto leading-relaxed">
              Experience unparalleled luxury with our world-class amenities designed to elevate your lifestyle and provide the ultimate in comfort, convenience, and sophisticated living.
            </p>
          </div>
        </div>
      </div>

      <main className="p-6 w-full">
        <div className="content-constrained">

          {/* Featured Amenities */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
                <Star className="h-8 w-8 text-primary" />
                Featured Amenities
              </h2>
              <p className="text-muted-foreground">Our signature amenities that set us apart</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {featuredAmenities.map((amenity, index) => (
                <Card key={index} className="neumorphic-card floating-card group text-center border-primary/20 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <CardHeader className="relative">
                    <Badge className="absolute top-4 right-4 bg-primary/10 text-primary border-primary/30">
                      Featured
                    </Badge>
                    <div className="mx-auto neumorphic-inset p-4 rounded-2xl w-fit mb-4 group-hover:animate-pulse transition-all duration-300">
                      <amenity.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{amenity.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center leading-relaxed mb-4">
                      {amenity.description}
                    </CardDescription>
                    <Badge className={getCategoryColor(amenity.category)}>
                      {amenity.category}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* All Amenities */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Complete Amenity Collection</h2>
              <p className="text-muted-foreground">Every comfort and convenience at your fingertips</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {regularAmenities.map((amenity, index) => (
                <Card key={index} className="neumorphic-card floating-card group text-center h-full animate-fade-in" style={{ animationDelay: `${(index + featuredAmenities.length) * 50}ms` }}>
                  <CardHeader>
                    <div className="mx-auto neumorphic-inset p-3 rounded-xl w-fit mb-3 group-hover:neumorphic-card transition-all duration-300">
                      <amenity.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{amenity.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-sm leading-relaxed mb-3">
                      {amenity.description}
                    </CardDescription>
                    <Badge variant="outline" className={getCategoryColor(amenity.category)}>
                      {amenity.category}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Gallery Section */}
          <div className="neumorphic-card p-8 rounded-3xl mb-16 animate-fade-in border-primary/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Amenity Gallery</h2>
              <p className="text-muted-foreground">Experience luxury through our stunning facilities</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { id: 1, category: "Pool", src: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=400&fit=crop" },
                { id: 2, category: "Gym", src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop" },
                { id: 3, category: "Lounge", src: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop" },
                { id: 4, category: "Dining", src: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop" },
                { id: 5, category: "Spa", src: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=400&h=400&fit=crop" },
                { id: 6, category: "Garden", src: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=400&fit=crop" },
                { id: 7, category: "Cinema", src: "https://images.unsplash.com/photo-1489599639676-f27c041ae73b?w=400&h=400&fit=crop" },
                { id: 8, category: "Rooftop", src: "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=400&h=400&fit=crop" }
              ].map((image, index) => (
                <div 
                  key={image.id}
                  className="aspect-square rounded-2xl overflow-hidden neumorphic-card floating-card group relative"
                >
                  <img 
                    src={image.src}
                    alt={`${image.category} amenity`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-white/90 text-black">
                        {image.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center neumorphic-card p-12 rounded-3xl animate-fade-in border-primary/20">
            <h2 className="text-3xl font-bold mb-4">Ready to Experience Luxury?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Discover what it means to live in premium comfort. Schedule a tour today and see these amazing amenities for yourself.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button className="btn-primary text-lg px-8 py-3 group">
                  Schedule Tour
                  <Calendar className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/properties">
                <Button variant="outline" className="text-lg px-8 py-3 border-primary/30 hover:border-primary">
                  View Properties
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}