import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Filter, MapPin, Calendar, Users, Home, 
  Star, DollarSign, X, SlidersHorizontal
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeText } from '@/utils/sanitization';
import { toast } from 'sonner';
import { debounce } from 'lodash-es';
import { logger } from '@/utils/logger';

interface SearchFilters {
  query: string;
  category: string;
  location: string;
  priceMin: string;
  priceMax: string;
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  amenities: string[];
  dateRange: {
    start: string;
    end: string;
  };
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  id: string;
  type: 'property' | 'vendor' | 'project';
  title: string;
  description: string;
  location?: string;
  price?: number;
  rating?: number;
  image?: string;
  tags: string[];
  relevanceScore: number;
}

interface SearchSystemProps {
  onResultSelect?: (result: SearchResult) => void;
  defaultCategory?: string;
  showFilters?: boolean;
}

export const SearchSystem: React.FC<SearchSystemProps> = ({
  onResultSelect,
  defaultCategory = 'all',
  showFilters = true
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: defaultCategory,
    location: '',
    priceMin: '',
    priceMax: '',
    bedrooms: '',
    bathrooms: '',
    propertyType: '',
    amenities: [],
    dateRange: { start: '', end: '' },
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<Array<{ query: string; timestamp: number }>>([]);

  // Available amenities for filtering
  const availableAmenities = [
    'WiFi', 'Pool', 'Gym', 'Parking', 'Pet Friendly', 'AC', 'Balcony',
    'Kitchen', 'Laundry', 'Security', 'Garden', 'Furnished'
  ];

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      try {
        const history = JSON.parse(saved);
        setSearchHistory(history);
        setRecentSearches(history.slice(0, 5).map((h: any) => h.query));
      } catch (error) {
        logger.error('Failed to load search history:', error);
      }
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchFilters: SearchFilters) => {
      if (!searchFilters.query.trim() && searchFilters.category === 'all') return;
      
      setLoading(true);
      try {
        await performSearch(searchFilters);
      } catch (error) {
        logger.error('Search failed:', error);
        toast.error('Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Trigger search when filters change
  useEffect(() => {
    debouncedSearch(filters);
  }, [filters, debouncedSearch]);

  const performSearch = async (searchFilters: SearchFilters) => {
    const sanitizedQuery = sanitizeText(searchFilters.query);
    const searchResults: SearchResult[] = [];

    try {
      // Search properties
      if (searchFilters.category === 'all' || searchFilters.category === 'properties') {
        const propertyQuery = supabase
          .from('properties')
          .select('id, title, description, address, city, state, price, bedrooms, bathrooms, property_type, status, image_urls, amenities')
          .eq('status', 'available')
          .limit(20);

        // Apply filters
        if (sanitizedQuery) {
          propertyQuery.or(`title.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%,city.ilike.%${sanitizedQuery}%`);
        }
        
        if (searchFilters.location) {
          propertyQuery.or(`city.ilike.%${searchFilters.location}%,state.ilike.%${searchFilters.location}%`);
        }
        
        if (searchFilters.priceMin) {
          propertyQuery.gte('price', parseInt(searchFilters.priceMin));
        }
        
        if (searchFilters.priceMax) {
          propertyQuery.lte('price', parseInt(searchFilters.priceMax));
        }
        
        if (searchFilters.bedrooms) {
          propertyQuery.gte('bedrooms', parseInt(searchFilters.bedrooms));
        }
        
        if (searchFilters.bathrooms) {
          propertyQuery.gte('bathrooms', parseInt(searchFilters.bathrooms));
        }
        
        if (searchFilters.propertyType) {
          propertyQuery.eq('property_type', searchFilters.propertyType);
        }

        const { data: properties } = await propertyQuery.limit(20);

        if (properties) {
          const propertyResults = properties.map(property => ({
            id: property.id.toString(),
            type: 'property' as const,
            title: property.title || 'Untitled Property',
            description: property.description || '',
            location: `${property.city || ''}, ${property.state || ''}`.trim(),
            price: property.price,
            rating: 4.5, // This would come from reviews
            image: property.image_urls ? property.image_urls.split(',')[0] : undefined,
            tags: [
              property.property_type,
              `${property.bedrooms} bed`,
              `${property.bathrooms} bath`,
              ...(property.amenities ? property.amenities.split(',') : [])
            ].filter(Boolean),
            relevanceScore: calculateRelevanceScore(property, sanitizedQuery)
          }));

          searchResults.push(...propertyResults);
        }
      }

      // Search vendors
      if (searchFilters.category === 'all' || searchFilters.category === 'vendors') {
        const { data: vendors } = await supabase
          .from('vendor_profiles')
          .select('*, user_id')
          .eq('is_verified', true)
          .limit(10);

        if (vendors) {
          const vendorResults = vendors
            .filter(vendor => {
              if (!sanitizedQuery) return true;
              const searchText = `${vendor.company_name} ${vendor.specialties?.join(' ')}`.toLowerCase();
              return searchText.includes(sanitizedQuery.toLowerCase());
            })
            .map(vendor => ({
              id: vendor.id,
              type: 'vendor' as const,
              title: vendor.company_name,
              description: `Specializes in: ${vendor.specialties?.join(', ') || 'Various services'}`,
              location: 'Location not specified',
              rating: vendor.rating || 0,
              tags: vendor.specialties || [],
              relevanceScore: calculateVendorRelevanceScore(vendor, sanitizedQuery)
            }));

          searchResults.push(...vendorResults);
        }
      }

      // Search projects
      if (searchFilters.category === 'all' || searchFilters.category === 'projects') {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, title, description, category, priority, status, budget_min, budget_max, location, deadline, created_at, skills_required')
          .in('status', ['open', 'in_progress'])
          .limit(10);

        if (projects) {
          const projectResults = projects
            .filter(project => {
              if (!sanitizedQuery) return true;
              const searchText = `${project.title} ${project.description} ${project.category}`.toLowerCase();
              return searchText.includes(sanitizedQuery.toLowerCase());
            })
            .map(project => ({
              id: project.id,
              type: 'project' as const,
              title: project.title,
              description: project.description || '',
              location: project.location,
              price: project.budget_max,
              tags: [project.category, project.priority, ...(project.skills_required || [])],
              relevanceScore: calculateProjectRelevanceScore(project, sanitizedQuery)
            }));

          searchResults.push(...projectResults);
        }
      }

      // Sort results by relevance and sort preferences
      const sortedResults = searchResults.sort((a, b) => {
        if (searchFilters.sortBy === 'relevance') {
          return searchFilters.sortOrder === 'desc' 
            ? b.relevanceScore - a.relevanceScore
            : a.relevanceScore - b.relevanceScore;
        }
        if (searchFilters.sortBy === 'price') {
          const aPrice = a.price || 0;
          const bPrice = b.price || 0;
          return searchFilters.sortOrder === 'desc' ? bPrice - aPrice : aPrice - bPrice;
        }
        if (searchFilters.sortBy === 'rating') {
          const aRating = a.rating || 0;
          const bRating = b.rating || 0;
          return searchFilters.sortOrder === 'desc' ? bRating - aRating : aRating - bRating;
        }
        return 0;
      });

      setResults(sortedResults);

      // Save to search history
      if (sanitizedQuery.trim()) {
        saveToSearchHistory(sanitizedQuery);
      }

    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
  };

  const calculateRelevanceScore = (property: any, query: string): number => {
    if (!query) return 1;
    
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Title match (highest weight)
    if (property.title?.toLowerCase().includes(queryLower)) score += 10;
    
    // Description match
    if (property.description?.toLowerCase().includes(queryLower)) score += 5;
    
    // Location match
    if (property.city?.toLowerCase().includes(queryLower)) score += 7;
    if (property.state?.toLowerCase().includes(queryLower)) score += 5;
    
    // Amenities match
    if (property.amenities?.toLowerCase().includes(queryLower)) score += 3;
    
    return score;
  };

  const calculateVendorRelevanceScore = (vendor: any, query: string): number => {
    if (!query) return 1;
    
    let score = 0;
    const queryLower = query.toLowerCase();
    
    if (vendor.company_name?.toLowerCase().includes(queryLower)) score += 10;
    if (vendor.specialties?.some((s: string) => s.toLowerCase().includes(queryLower))) score += 8;
    // Profile name matching would need separate query
    
    return score;
  };

  const calculateProjectRelevanceScore = (project: any, query: string): number => {
    if (!query) return 1;
    
    let score = 0;
    const queryLower = query.toLowerCase();
    
    if (project.title?.toLowerCase().includes(queryLower)) score += 10;
    if (project.description?.toLowerCase().includes(queryLower)) score += 5;
    if (project.category?.toLowerCase().includes(queryLower)) score += 7;
    if (project.skills_required?.some((s: string) => s.toLowerCase().includes(queryLower))) score += 6;
    
    return score;
  };

  const saveToSearchHistory = (query: string) => {
    const newHistory = [
      { query, timestamp: Date.now() },
      ...searchHistory.filter(h => h.query !== query)
    ].slice(0, 50); // Keep last 50 searches

    setSearchHistory(newHistory);
    setRecentSearches(newHistory.slice(0, 5).map(h => h.query));
    
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: filters.query, // Keep the search query
      category: 'all',
      location: '',
      priceMin: '',
      priceMax: '',
      bedrooms: '',
      bathrooms: '',
      propertyType: '',
      amenities: [],
      dateRange: { start: '', end: '' },
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
  };

  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result);
    
    // Track click analytics (simplified) - analytics integration needed
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties, vendors, or projects..."
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              className="pl-10"
            />
          </div>
          {showFilters && (
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={showAdvancedFilters ? 'bg-primary text-primary-foreground' : ''}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
          )}
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && !filters.query && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Recent:</span>
            {recentSearches.map((search, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('query', search)}
                className="text-xs"
              >
                {search}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && showAdvancedFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Category and Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="properties">Properties</SelectItem>
                    <SelectItem value="vendors">Vendors</SelectItem>
                    <SelectItem value="projects">Projects</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Location"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />

                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Property-specific filters */}
              {(filters.category === 'all' || filters.category === 'properties') && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                      placeholder="Min Price"
                      type="number"
                      value={filters.priceMin}
                      onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                    />
                    <Input
                      placeholder="Max Price"
                      type="number"
                      value={filters.priceMax}
                      onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                    />
                    <Select value={filters.bedrooms} onValueChange={(value) => handleFilterChange('bedrooms', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Bedrooms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.bathrooms} onValueChange={(value) => handleFilterChange('bathrooms', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Bathrooms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amenities */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Amenities</label>
                    <div className="flex flex-wrap gap-2">
                      {availableAmenities.map((amenity) => (
                        <Badge
                          key={amenity}
                          variant={filters.amenities.includes(amenity) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleAmenityToggle(amenity)}
                        >
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Clear Filters */}
              <div className="flex justify-end">
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Searching...</p>
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </p>
            </div>
            
            <div className="grid gap-4">
              {results.map((result) => (
                <Card 
                  key={`${result.type}-${result.id}`}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleResultClick(result)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      {result.image && (
                        <img
                          src={result.image}
                          alt={result.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="secondary">{result.type}</Badge>
                          {result.rating && (
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 fill-current text-warning" />
                              <span className="text-sm">{result.rating}</span>
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold truncate">{result.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            {result.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{result.location}</span>
                              </div>
                            )}
                            {result.price && (
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3" />
                                <span>${result.price.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {result.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : filters.query || filters.category !== 'all' ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};