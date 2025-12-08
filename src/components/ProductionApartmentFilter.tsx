import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Users, Bed, Bath } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: number;
  title: string;
  description: string;
  property_type: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: string;
  address: string;
  city: string;
  state: string;
  image_urls: string;
  amenities: string;
  status: string;
  available_date: string;
}

interface FilterState {
  searchTerm: string;
  location: string;
  capacity: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  rating: string;
}

export default function ProductionApartmentFilter() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    location: '',
    capacity: '',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    rating: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [properties, filters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data: propertiesData, error } = await supabase
        .from('properties')
        .select('id, title, description, address, city, state, zip_code, price, bedrooms, bathrooms, square_feet, property_type, status, amenities, image_urls, available_date')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      setProperties(propertiesData || []);
    } catch (error: any) {
      logger.error('Error fetching properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    if (filters.searchTerm) {
      filtered = filtered.filter(property =>
        property.title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        property.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        property.address?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    if (filters.location) {
      filtered = filtered.filter(property =>
        property.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
        property.state?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.capacity) {
      const capacity = parseInt(filters.capacity);
      filtered = filtered.filter(property =>
        property.bedrooms >= capacity
      );
    }

    if (filters.propertyType) {
      filtered = filtered.filter(property =>
        property.property_type?.toLowerCase() === filters.propertyType.toLowerCase()
      );
    }

    if (filters.minPrice) {
      const minPrice = parseInt(filters.minPrice);
      filtered = filtered.filter(property =>
        property.price >= minPrice
      );
    }

    if (filters.maxPrice) {
      const maxPrice = parseInt(filters.maxPrice);
      filtered = filtered.filter(property =>
        property.price <= maxPrice
      );
    }

    setFilteredProperties(filtered);
  };

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      location: '',
      capacity: '',
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      rating: ''
    });
  };

  const getPropertyTypes = () => {
    const types = [...new Set(properties.map(p => p.property_type).filter(Boolean))];
    return types;
  };

  const getCities = () => {
    const cities = [...new Set(properties.map(p => p.city).filter(Boolean))];
    return cities.sort();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Find Your Perfect Property</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover amazing properties with advanced filtering options
        </p>
      </div>

      {/* Filters */}
      <Card className="backdrop-blur-sm bg-card/90 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Search & Filter Properties
            <Button variant="outline" onClick={clearFilters} size="sm">
              Clear All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search properties, locations..."
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select value={filters.location} onValueChange={(value) => updateFilter('location', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Location</SelectItem>
                  {getCities().map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Bedrooms</label>
              <Select value={filters.capacity} onValueChange={(value) => updateFilter('capacity', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Bedrooms</SelectItem>
                  <SelectItem value="1">1+ Bedroom</SelectItem>
                  <SelectItem value="2">2+ Bedrooms</SelectItem>
                  <SelectItem value="3">3+ Bedrooms</SelectItem>
                  <SelectItem value="4">4+ Bedrooms</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Property Type</label>
              <Select value={filters.propertyType} onValueChange={(value) => updateFilter('propertyType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Type</SelectItem>
                  {getPropertyTypes().map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Min Price</label>
              <Input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Price</label>
              <Input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            Properties Found: {filteredProperties.length}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted relative">
                {property.image_urls ? (
                  <img
                    src={property.image_urls}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <span className="text-muted-foreground">No Image</span>
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-background/90">
                    ${property.price?.toLocaleString()}/month
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
                  <p className="text-muted-foreground text-sm flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {property.address}, {property.city}, {property.state}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    {property.bedrooms} bed
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    {property.bathrooms} bath
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {property.square_feet} sq ft
                  </div>
                </div>

                {property.amenities && (
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.split(',').slice(0, 3).map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {amenity.trim()}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button className="w-full" variant="default">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProperties.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No properties found matching your criteria.</p>
            <Button onClick={clearFilters} variant="outline" className="mt-4">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}