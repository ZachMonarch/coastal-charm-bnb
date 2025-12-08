import { useState } from "react";
import { 
  Filter, 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Users, 
  DollarSign,
  Home,
  Star,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface FilterProps {
  onFilterChange: (apartments: any[]) => void;
  className?: string;
}

// Mock apartments data for filtering
const mockApartments = [
  {
    id: "1",
    name: "Deluxe Sea View Suite",
    description: "Luxurious suite with panoramic sea views, modern amenities, and a private balcony.",
    price: 180,
    capacity: 2,
    size: 45,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
    location: "beachfront",
    features: ["Wi-Fi", "Kitchen", "Bathroom", "Air Conditioning", "TV", "Balcony"],
    rating: 4.8,
    type: "suite"
  },
  {
    id: "2", 
    name: "Premium Family Apartment",
    description: "Spacious apartment ideal for families, with full kitchen and stunning coastal views.",
    price: 250,
    capacity: 4,
    size: 75,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    location: "beachfront",
    features: ["Wi-Fi", "Kitchen", "Bathroom", "Air Conditioning", "TV", "Washing Machine"],
    rating: 4.6,
    type: "apartment"
  }
];

export default function EnhancedApartmentFilter({ onFilterChange, className }: FilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    location: "all",
    capacity: "all",
    propertyType: "all",
    priceRange: [100, 500],
    rating: "all"
  });

  const applyFilters = (currentFilters: any) => {
    let filtered = [...mockApartments];

    // Search filter
    if (currentFilters.search) {
      filtered = filtered.filter(apt => 
        apt.name.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        apt.description.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        apt.features.some(feature => feature.toLowerCase().includes(currentFilters.search.toLowerCase()))
      );
    }

    // Location filter
    if (currentFilters.location !== "all") {
      filtered = filtered.filter(apt => apt.location === currentFilters.location);
    }

    // Capacity filter
    if (currentFilters.capacity !== "all") {
      filtered = filtered.filter(apt => apt.capacity >= parseInt(currentFilters.capacity));
    }

    // Property type filter
    if (currentFilters.propertyType !== "all") {
      filtered = filtered.filter(apt => apt.type === currentFilters.propertyType);
    }

    // Price range filter
    filtered = filtered.filter(apt => 
      apt.price >= currentFilters.priceRange[0] && apt.price <= currentFilters.priceRange[1]
    );

    // Rating filter
    if (currentFilters.rating !== "all") {
      filtered = filtered.filter(apt => apt.rating >= parseFloat(currentFilters.rating));
    }

    return filtered;
  };

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    const filteredApartments = applyFilters(newFilters);
    onFilterChange(filteredApartments);
  };

  const resetFilters = () => {
    const defaultFilters = {
      search: "",
      location: "all",
      capacity: "all", 
      propertyType: "all",
      priceRange: [100, 500],
      rating: "all"
    };
    setFilters(defaultFilters);
    const filteredApartments = applyFilters(defaultFilters);
    onFilterChange(filteredApartments);
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== "all" && value !== "" && 
    !(Array.isArray(value) && value[0] === 100 && value[1] === 500)
  ).length;

  return (
    <div className={cn("neumorphic-card rounded-3xl overflow-hidden", className)}>
      {/* Filter Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="neumorphic-inset p-2 rounded-full">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Advanced Filters</h3>
            {activeFiltersCount > 0 && (
              <span className="neumorphic-inset px-3 py-1 rounded-full text-sm font-medium text-primary">
                {activeFiltersCount} active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "neumorphic-card transition-all duration-300",
                isExpanded && "neumorphic-inset"
              )}
            >
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              {isExpanded ? 'Less' : 'More'}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center">
            <Search className="h-4 w-4 mr-2 text-primary" />
            Search Properties
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter property name, location, or features..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="neumorphic-inset h-12 pl-10 border-0 bg-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Location Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              Location
            </label>
            <Select value={filters.location} onValueChange={(value) => updateFilter('location', value)}>
              <SelectTrigger className="neumorphic-card h-12 border-0">
                <SelectValue placeholder="Any Location" />
              </SelectTrigger>
              <SelectContent className="glass-card border-0">
                <SelectItem value="all">Any Location</SelectItem>
                <SelectItem value="downtown">Downtown</SelectItem>
                <SelectItem value="beachfront">Beachfront</SelectItem>
                <SelectItem value="suburban">Suburban</SelectItem>
                <SelectItem value="arts-district">Arts District</SelectItem>
                <SelectItem value="garden-area">Garden Area</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Capacity Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-primary" />
              Guests
            </label>
            <Select value={filters.capacity} onValueChange={(value) => updateFilter('capacity', value)}>
              <SelectTrigger className="neumorphic-card h-12 border-0">
                <SelectValue placeholder="Any Capacity" />
              </SelectTrigger>
              <SelectContent className="glass-card border-0">
                <SelectItem value="all">Any Capacity</SelectItem>
                <SelectItem value="1">1+ Guests</SelectItem>
                <SelectItem value="2">2+ Guests</SelectItem>
                <SelectItem value="3">3+ Guests</SelectItem>
                <SelectItem value="4">4+ Guests</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Property Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <Home className="h-4 w-4 mr-2 text-primary" />
              Property Type
            </label>
            <Select value={filters.propertyType} onValueChange={(value) => updateFilter('propertyType', value)}>
              <SelectTrigger className="neumorphic-card h-12 border-0">
                <SelectValue placeholder="Any Type" />
              </SelectTrigger>
              <SelectContent className="glass-card border-0">
                <SelectItem value="all">Any Type</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="suite">Suite</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="penthouse">Penthouse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expandable Advanced Filters */}
        <div className={cn(
          "transition-all duration-500 ease-in-out overflow-hidden",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="space-y-6 pt-6 border-t border-border/50">
            {/* Price Range */}
            <div className="space-y-4">
              <label className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-primary" />
                Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]} per night
              </label>
              <div className="neumorphic-inset p-4 rounded-2xl">
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilter('priceRange', value)}
                  min={50}
                  max={1000}
                  step={25}
                  className="my-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$50</span>
                  <span>$1000+</span>
                </div>
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center">
                <Star className="h-4 w-4 mr-2 text-primary" />
                Minimum Rating
              </label>
              <Select value={filters.rating} onValueChange={(value) => updateFilter('rating', value)}>
                <SelectTrigger className="neumorphic-card h-12 border-0">
                  <SelectValue placeholder="Any Rating" />
                </SelectTrigger>
                <SelectContent className="glass-card border-0">
                  <SelectItem value="all">Any Rating</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  <SelectItem value="5">5 Stars Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Filter Tags */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Quick Filters</label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Pet Friendly',
                  'WiFi Included',
                  'Kitchen Available',
                  'Pool Access',
                  'Gym Access',
                  'Parking Included'
                ].map((tag) => (
                  <button
                    key={tag}
                    className="neumorphic-card px-4 py-2 rounded-full text-sm hover:neumorphic-inset transition-all duration-300"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Apply Filters Button */}
        <div className="pt-4 border-t border-border/50">
          <Button className="w-full btn-primary tech-glow h-12 group">
            <Filter className="mr-2 h-4 w-4 group-hover:animate-pulse" />
            Apply Filters
            {activeFiltersCount > 0 && (
              <span className="ml-2 neumorphic-inset px-2 py-1 rounded-full text-xs">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}