
import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, Maximize, MapPin, Bath, Coffee, Wifi, Star, Eye, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export interface ApartmentProps {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  size: number;
  image: string;
  location: string;
  features: string[];
}

export default function ApartmentCard({ apartment }: { apartment: ApartmentProps }) {
  const { t, language } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  
  // Use translated name and description if available
  const translatedName = language !== 'en' && t.apartmentDescriptions[apartment.id]?.name 
    ? t.apartmentDescriptions[apartment.id].name 
    : apartment.name;
    
  const translatedDescription = language !== 'en' && t.apartmentDescriptions[apartment.id]?.description 
    ? t.apartmentDescriptions[apartment.id].description 
    : apartment.description;
  
  return (
    <div 
      className="group neumorphic-card rounded-3xl overflow-hidden transition-all duration-700 hover:floating-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Enhanced image section */}
      <div className="relative overflow-hidden h-72">
        <img 
          src={apartment.image} 
          alt={translatedName}
          className={cn(
            "w-full h-full object-cover transition-all duration-700",
            isHovered ? "scale-110" : "scale-100"
          )}
        />
        
        {/* Tech overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/60" />
        
        {/* Floating badge */}
        <div className="absolute top-4 right-4 glass-card px-3 py-2 rounded-full">
          <div className="flex items-center text-white text-sm font-medium">
            <Star className="h-4 w-4 mr-1 fill-current text-primary" />
            <span>4.9</span>
          </div>
        </div>
        
        {/* Enhanced overlay content */}
        <div className="absolute inset-0 flex items-end p-6">
          <div className="w-full">
            <div className="glass-card p-4 rounded-2xl backdrop-blur-xl">
              <h3 className="text-white text-xl font-bold mb-2">{translatedName}</h3>
              <div className="flex items-center text-white/80 text-sm mb-3">
                <MapPin className="h-4 w-4 mr-1 text-primary" />
                <span>{apartment.location}</span>
              </div>
              <div className="flex items-center space-x-4 text-white">
                <div className="flex items-center neumorphic-card px-3 py-1 rounded-full bg-white/10">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="text-sm">{apartment.capacity}</span>
                </div>
                <div className="flex items-center neumorphic-card px-3 py-1 rounded-full bg-white/10">
                  <Maximize className="h-4 w-4 mr-1" />
                  <span className="text-sm">{apartment.size}m²</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced content section */}
      <div className="p-8 space-y-6">
        <div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {translatedDescription}
          </p>
        </div>
        
        {/* Enhanced features */}
        <div className="grid grid-cols-3 gap-3">
          {apartment.features.slice(0, 3).map((feature, index) => (
            <div 
              key={index} 
              className="neumorphic-inset p-3 rounded-2xl flex flex-col items-center text-center group hover:neumorphic-card transition-all duration-300"
            >
              <div className="mb-2">
                {feature === "Bathroom" && <Bath className="h-5 w-5 text-primary group-hover:animate-pulse" />}
                {feature === "Kitchen" && <Coffee className="h-5 w-5 text-primary group-hover:animate-pulse" />}
                {feature === "Wi-Fi" && <Wifi className="h-5 w-5 text-primary group-hover:animate-pulse" />}
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {feature}
              </span>
            </div>
          ))}
        </div>
        
        {/* More features indicator */}
        {apartment.features.length > 3 && (
          <div className="glass-card p-3 rounded-2xl text-center">
            <span className="text-sm text-muted-foreground">
              +{apartment.features.length - 3} {t.apartments.filters.more} features
            </span>
          </div>
        )}
        
        {/* Enhanced pricing and CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="space-y-1">
            <div className="flex items-baseline">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                ${apartment.price}
              </span>
              <span className="text-muted-foreground text-sm ml-1">/{t.booking.summary.night}</span>
            </div>
            <div className="text-xs text-muted-foreground">Includes all fees</div>
          </div>
          
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link to={`/apartments/${apartment.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Details
              </Link>
            </Button>
            <Button asChild className="btn-primary tech-glow group flex-1">
              <Link to={`/apartments/${apartment.id}`}>
                <Calendar className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                Book
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
