import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Home, DollarSign, Bed, Bath, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { PropertyFilters } from '@/hooks/useProperties';
import { supabase } from '@/integrations/supabase/client';

interface PropertiesFilterProps {
  filters: Partial<PropertyFilters>;
  onFiltersChange: (filters: Partial<PropertyFilters>) => void;
  className?: string;
}

export default function PropertiesFilter({ filters, onFiltersChange, className }: PropertiesFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 1000000]);

  // Fetch unique cities and property types for filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Get unique cities from safe view
        const { data: citiesData } = await supabase
          .from('safe_property_listings')
          .select('city')
          .not('city', 'is', null)
          .order('city');

        const uniqueCities = [...new Set(citiesData?.map(item => item.city).filter(Boolean))];
        setCities(uniqueCities);

        // Get unique property types from safe view
        const { data: typesData } = await supabase
          .from('safe_property_listings')
          .select('property_type')
          .not('property_type', 'is', null)
          .order('property_type');

        const uniqueTypes = [...new Set(typesData?.map(item => item.property_type).filter(Boolean))];
        setPropertyTypes(uniqueTypes);

        // Get price range from safe view
        const { data: priceData } = await supabase
          .from('safe_property_listings')
          .select('price')
          .not('price', 'is', null)
          .order('price');

        if (priceData && priceData.length > 0) {
          const prices = priceData.map(item => item.price).filter(Boolean);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          setPriceRange([minPrice, maxPrice]);
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  const updateFilter = (key: keyof PropertyFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const resetFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== '' && value !== 'all' && value !== 0
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
            <h3 className="text-lg font-semibold">Property Filters</h3>
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
              placeholder="Search by title, description, or city..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="neumorphic-inset h-12 pl-10 border-0 bg-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Basic Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* City Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              City
            </label>
            <Select value={filters.city || 'all'} onValueChange={(value) => updateFilter('city', value === 'all' ? '' : value)}>
              <SelectTrigger className="neumorphic-card h-12 border-0">
                <SelectValue placeholder="Any City" />
              </SelectTrigger>
              <SelectContent className="glass-card border-0">
                <SelectItem value="all">Any City</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <Home className="h-4 w-4 mr-2 text-primary" />
              Type
            </label>
            <Select value={filters.property_type || 'all'} onValueChange={(value) => updateFilter('property_type', value === 'all' ? '' : value)}>
              <SelectTrigger className="neumorphic-card h-12 border-0">
                <SelectValue placeholder="Any Type" />
              </SelectTrigger>
              <SelectContent className="glass-card border-0">
                <SelectItem value="all">Any Type</SelectItem>
                {propertyTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bedrooms Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <Bed className="h-4 w-4 mr-2 text-primary" />
              Bedrooms
            </label>
            <Select value={filters.bedrooms?.toString() || 'any'} onValueChange={(value) => updateFilter('bedrooms', value === 'any' ? 0 : parseInt(value))}>
              <SelectTrigger className="neumorphic-card h-12 border-0">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent className="glass-card border-0">
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bathrooms Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <Bath className="h-4 w-4 mr-2 text-primary" />
              Bathrooms
            </label>
            <Select value={filters.bathrooms?.toString() || 'any'} onValueChange={(value) => updateFilter('bathrooms', value === 'any' ? 0 : parseInt(value))}>
              <SelectTrigger className="neumorphic-card h-12 border-0">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent className="glass-card border-0">
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
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
                Price Range: ${(filters.min_price || priceRange[0]).toLocaleString()} - ${(filters.max_price || priceRange[1]).toLocaleString()}
              </label>
              <div className="neumorphic-inset p-4 rounded-2xl">
                <Slider
                  value={[filters.min_price || priceRange[0], filters.max_price || priceRange[1]]}
                  onValueChange={([min, max]) => {
                    updateFilter('min_price', min);
                    updateFilter('max_price', max);
                  }}
                  min={priceRange[0]}
                  max={priceRange[1]}
                  step={1000}
                  className="my-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${priceRange[0].toLocaleString()}</span>
                  <span>${priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value === 'all' ? '' : value)}>
                <SelectTrigger className="neumorphic-card h-12 border-0">
                  <SelectValue placeholder="Any Status" />
                </SelectTrigger>
                <SelectContent className="glass-card border-0">
                  <SelectItem value="all">Any Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                </SelectContent>
              </Select>
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