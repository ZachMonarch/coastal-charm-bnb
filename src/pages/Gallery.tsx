import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Play, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEOHead } from "@/components/SEOHead";

// Enhanced gallery images with more property photos
const galleryImages = [
  // Exterior Views
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
    alt: "Modern apartment building exterior",
    category: "exterior"
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
    alt: "Luxury downtown building",
    category: "exterior"
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
    alt: "Elegant property entrance",
    category: "exterior"
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    alt: "Garden courtyard view",
    category: "exterior"
  },
  
  // Interior Rooms
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
    alt: "Luxury suite interior",
    category: "rooms"
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    alt: "Spacious living room",
    category: "rooms"
  },
  {
    id: 7,
    src: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&h=600&fit=crop",
    alt: "Modern kitchen design",
    category: "rooms"
  },
  {
    id: 8,
    src: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    alt: "Elegant bedroom setup",
    category: "rooms"
  },
  {
    id: 9,
    src: "https://images.unsplash.com/photo-1556912167-f556f1d99b04?w=800&h=600&fit=crop",
    alt: "Luxury bathroom",
    category: "rooms"
  },
  {
    id: 10,
    src: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&h=600&fit=crop",
    alt: "Home office space",
    category: "rooms"
  },
  
  // Amenities
  {
    id: 11,
    src: "https://images.unsplash.com/photo-1584132905271-512c958d674a?w=800&h=600&fit=crop",
    alt: "Swimming pool area",
    category: "amenities"
  },
  {
    id: 12,
    src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    alt: "Fitness center",
    category: "amenities"
  },
  {
    id: 13,
    src: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop",
    alt: "Community lounge",
    category: "amenities"
  },
  {
    id: 14,
    src: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
    alt: "Rooftop terrace",
    category: "amenities"
  },
  {
    id: 15,
    src: "https://images.unsplash.com/photo-1566842600175-97dca489844f?w=800&h=600&fit=crop",
    alt: "Business center",
    category: "amenities"
  },
  {
    id: 16,
    src: "https://images.unsplash.com/photo-1593192630419-b6d7d4c8daf8?w=800&h=600&fit=crop",
    alt: "Parking garage",
    category: "amenities"
  }
];

export default function Gallery() {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  
  return (
    <div className="min-h-screen w-full">
      <SEOHead
        title="Property Gallery - Photos & Virtual Tours"
        description="Explore our stunning property gallery featuring luxury apartments, premium amenities, resort-style pools, fitness centers, and elegant interiors. View photos of exteriors, rooms, and community spaces."
        keywords={["property gallery", "apartment photos", "luxury interiors", "amenity photos", "property images", "virtual tours"]}
        type="website"
        url="https://monarch-properties.com/gallery"
      />
      
      {/* Hero Section with Background Image */}
      <section className="relative overflow-hidden min-h-[40vh] flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=600&fit=crop"
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/75 to-black/90" />
        </div>
        <div className="container relative z-10 px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-2xl">
            <Maximize className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 
            className="text-4xl md:text-5xl font-bold mb-4 text-white"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,1), 0 4px 8px rgba(0,0,0,0.9), 0 8px 16px rgba(0,0,0,0.7)' }}
          >
            {t.gallery?.title || 'Property Gallery'}
          </h1>
          <p 
            className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto font-medium"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,1), 0 4px 8px rgba(0,0,0,0.85)' }}
          >
            {t.gallery?.subtitle || 'Explore our professionally managed properties through stunning imagery.'}
          </p>
        </div>
      </section>
      
      <main className="p-6 w-full" role="main" aria-label="Property image gallery">
        <div className="content-constrained">

          {/* Gallery Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-8" role="group" aria-label="Filter gallery by category">
            {["all", "exterior", "rooms", "amenities"].map((category) => (
              <Button
                key={category}
                variant={activeFilter === category ? "default" : "outline"}
                onClick={() => setActiveFilter(category)}
                className="capitalize"
                aria-label={`Filter by ${category}`}
                aria-pressed={activeFilter === category}
              >
                {category}
              </Button>
            ))}
          </div>
          
          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages
              .filter(image => activeFilter === "all" || image.category === activeFilter)
              .map((image, index) => (
              <Card key={image.id} className="overflow-hidden cursor-pointer group neumorphic-card animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <div 
                  className="aspect-square relative"
                  onClick={() => setSelectedImage(image.id)}
                >
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
                    <Maximize className="h-8 w-8 text-white mb-2" />
                    <Badge variant="secondary" className="text-xs capitalize">
                      {image.category}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white text-sm font-medium drop-shadow-lg line-clamp-2">
                      {image.alt}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {galleryImages.filter(image => activeFilter === "all" || image.category === activeFilter).length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No images found for this category.</p>
            </div>
          )}
          
          {/* Lightbox */}
          {selectedImage !== null && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
              <Button 
                variant="ghost"
                size="sm"
                aria-label="Close image preview"
                className="absolute top-4 right-4 text-white hover:bg-white/10"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-6 w-6" />
              </Button>
              
              <div className="max-w-5xl max-h-[80vh] overflow-hidden">
                {galleryImages.find(img => img.id === selectedImage) && (
                  <img 
                    src={galleryImages.find(img => img.id === selectedImage)?.src} 
                    alt={galleryImages.find(img => img.id === selectedImage)?.alt}
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}