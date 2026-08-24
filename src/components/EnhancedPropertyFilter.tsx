import React, { useState, useCallback } from 'react';
import { Search, Filter, X, MapPin, Home, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { PropertyFilters } from '@/hooks/useProperties';

interface EnhancedPropertyFilterProps {
  filters: Partial<PropertyFilters>;
  onFiltersChange: (filters: Partial<PropertyFilters>) => void;
  className?: string;
}

export default function EnhancedPropertyFilter({
  filters,
  onFiltersChange,
  className
}: EnhancedPropertyFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.min_price || 0,
    filters.max_price || 1000000
  ]);

  const handleFilterChange = useCallback((key: keyof PropertyFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' ? undefined : value
    });
  }, [filters, onFiltersChange]);

  const handlePriceRangeChange = useCallback((values: number[]) => {
    const [min, max] = values;
    setPriceRange([min, max]);
    onFiltersChange({
      ...filters,
      min_price: min > 0 ? min : undefined,
      max_price: max < 1000000 ? max : undefined
    });
  }, [filters, onFiltersChange]);

  const clearAllFilters = () => {
    setPriceRange([0, 1000000]);
    onFiltersChange({});
  };

  const getActiveFilterCount = () => {
    const activeFilters = [
      filters.search,
      filters.city && filters.city !== 'all',
      filters.property_type && filters.property_type !== 'all',
      filters.status && filters.status !== 'all',
      filters.min_price && filters.min_price > 0,
      filters.max_price && filters.max_price < 1000000,
      filters.bedrooms && filters.bedrooms > 0,
      filters.bathrooms && filters.bathrooms > 0
    ].filter(Boolean).length;
    return activeFilters;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price.toLocaleString()}`;
  };

  const propertyTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'condo', label: 'Condo' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'loft', label: 'Loft' },
    { value: 'studio', label: 'Studio' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'available', label: 'Available' },
    { value: 'pending', label: 'Pending' },
    { value: 'sold', label: 'Sold' },
    { value: 'rented', label: 'Rented' }
  ];

  const cities = [
    { value: 'all', label: 'All Cities' },
    { value: 'New York', label: 'New York' },
    { value: 'Los Angeles', label: 'Los Angeles' },
    { value: 'Chicago', label: 'Chicago' },
    { value: 'Houston', label: 'Houston' },
    { value: 'Phoenix', label: 'Phoenix' },
    { value: 'Philadelphia', label: 'Philadelphia' },
    { value: 'San Antonio', label: 'San Antonio' },
    { value: 'San Diego', label: 'San Diego' },
    { value: 'Dallas', label: 'Dallas' },
    { value: 'San Jose', label: 'San Jose' }
  ];

  return (
    <Card className={cn("neumorphic-card border-0", className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, or location..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 neumorphic-inset"
            />
          </div>

          {/* Quick Filters Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* City Filter */}
              <Select 
                value={filters.city || 'all'} 
                onValueChange={(value) => handleFilterChange('city', value)}
              >
                <SelectTrigger className="w-[180px] neumorphic-inset" aria-label="Filter properties by city">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Property Type Filter */}
              <Select 
                value={filters.property_type || 'all'} 
                onValueChange={(value) => handleFilterChange('property_type', value)}
              >
                <SelectTrigger className="w-[180px] neumorphic-inset" aria-label="Filter properties by type">
                  <Home className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="flex items-center space-x-2">
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="neumorphic-inset">
                  {getActiveFilterCount()} active
                </Badge>
              )}
              <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="neumorphic-card">
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filters
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
              {getActiveFilterCount() > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Price Range */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <label className="text-sm font-medium">Price Range</label>
                  </div>
                  <div className="px-3">
                    <Slider
                      value={priceRange}
                      onValueChange={handlePriceRangeChange}
                      max={1000000}
                      min={0}
                      step={10000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>{formatPrice(priceRange[0])}</span>
                      <span>{formatPrice(priceRange[1])}</span>
                    </div>
                  </div>
                </div>

                {/* Bedrooms */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Bedrooms</label>
                  <Select 
                    value={filters.bedrooms?.toString() || 'all'} 
                    onValueChange={(value) => handleFilterChange('bedrooms', value === 'all' ? undefined : Number(value))}
                  >
                    <SelectTrigger className="neumorphic-inset">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                      <SelectItem value="5">5+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bathrooms */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Bathrooms</label>
                  <Select 
                    value={filters.bathrooms?.toString() || 'all'} 
                    onValueChange={(value) => handleFilterChange('bathrooms', value === 'all' ? undefined : Number(value))}
                  >
                    <SelectTrigger className="neumorphic-inset">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={filters.status || 'all'} 
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger className="neumorphic-inset">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex items-center space-x-4 pt-4 border-t">
                <label className="text-sm font-medium">Sort by:</label>
                <Select 
                  value={`${filters.sortBy || 'id'}-${filters.sortOrder || 'desc'}`}
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split('-') as [PropertyFilters['sortBy'], PropertyFilters['sortOrder']];
                    onFiltersChange({
                      ...filters,
                      sortBy,
                      sortOrder
                    });
                  }}
                >
                  <SelectTrigger className="w-[200px] neumorphic-inset">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id-desc">Newest First</SelectItem>
                    <SelectItem value="id-asc">Oldest First</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="title-asc">Title: A to Z</SelectItem>
                    <SelectItem value="title-desc">Title: Z to A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
}