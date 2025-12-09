import { useState, useEffect, useMemo } from 'react';
import { PropertyAPI, PropertySearchParams } from '@/lib/api';

export interface Property {
  id: number;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: number;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: string;
  property_type: string;
  status: string;
  available_date: string;
  image_urls: string;
  amenities: string;
  latitude: number;
  longitude: number;
  owner_id: string;
  qualityImages?: string[];
}

export interface PropertyFilters {
  search: string;
  city: string;
  property_type: string;
  min_price: number;
  max_price: number;
  bedrooms: number;
  bathrooms: number;
  status: string;
  sortBy?: 'price' | 'id' | 'title';
  sortOrder?: 'asc' | 'desc';
}

const DEFAULT_PAGE_SIZE = 20;

// Image quality filtering function
const isHighQualityImage = (url: string): boolean => {
  if (!url) return false;
  
  // Filter out images that are likely to have text overlays or be unprofessional
  const lowQualityIndicators = [
    'text', 'overlay', 'watermark', 'logo', 'banner',
    'listing', 'sold', 'price', 'contact', 'realtor',
    'mls', 'pending', 'reduced', 'new', 'coming'
  ];
  
  const urlLower = url.toLowerCase();
  return !lowQualityIndicators.some(indicator => urlLower.includes(indicator));
};

// Extract and optimize images with bandwidth considerations
const getQualityImages = (imageUrls: string): string[] => {
  if (!imageUrls) return [];
  
  try {
    // Parse the image URLs (they come as a JSON array string)
    let urls: string[] = [];
    
    if (imageUrls.startsWith('{') && imageUrls.endsWith('}')) {
      // Handle PostgreSQL array format: {"url1", "url2", ...}
      const cleanedString = imageUrls.slice(1, -1); // Remove curly braces
      urls = cleanedString
        .split(',')
        .map(url => url.trim().replace(/^"/, '').replace(/"$/, ''))
        .filter(url => url.length > 0);
    } else if (imageUrls.startsWith('[') && imageUrls.endsWith(']')) {
      // Handle JSON array format: ["url1", "url2", ...]
      urls = JSON.parse(imageUrls);
    } else {
      // Handle single URL or comma-separated URLs
      urls = imageUrls.split(',').map(url => url.trim());
    }
    
    return urls
      .filter(isHighQualityImage)
      .slice(0, 3) // Limit to 3 images per property to reduce egress costs
      .map((url: string) => {
        // Optimize for bandwidth by using smaller sizes
        if (url.includes('w=1080')) {
          return url.replace('w=1080', 'w=800'); // Reduce image width
        }
        return url.trim();
      });
  } catch (error) {
    console.warn('Error parsing image URLs:', error, imageUrls);
    return [];
  }
};

export const useProperties = (filters: Partial<PropertyFilters> = {}, pageSize: number = DEFAULT_PAGE_SIZE) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [metadata, setMetadata] = useState({
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  });
  const [performance, setPerformance] = useState({
    queryTime: 0,
    cacheHit: false,
    cached: false
  });

  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 15000; // 15 seconds timeout

  const fetchProperties = async (isRetry = false) => {
    try {
      setLoading(true);
      if (!isRetry) {
        setError(null);
        setRetryCount(0);
      }

      const searchParams: PropertySearchParams = {
        page: currentPage,
        pageSize,
        search: filters.search,
        city: filters.city,
        propertyType: filters.property_type,
        minPrice: filters.min_price,
        maxPrice: filters.max_price,
        bedrooms: filters.bedrooms,
        bathrooms: filters.bathrooms,
        status: filters.status,
        sortBy: filters.sortBy || 'id',
        sortOrder: filters.sortOrder || 'desc'
      };

      // Add timeout with exponential backoff for retries
      const timeout = isRetry ? TIMEOUT_MS * (retryCount + 1) : TIMEOUT_MS;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      );

      const response = await Promise.race([
        PropertyAPI.getProperties(searchParams),
        timeoutPromise
      ]) as any;
      
      // Add fallback placeholder for properties without quality images
      const qualityProperties = response.data.map(property => {
        const qualityImages = getQualityImages(property.image_urls || '');
        return {
          ...property,
          qualityImages: qualityImages.length > 0 
            ? qualityImages 
            : ['/placeholder-property.webp']
        };
      });

      setProperties(qualityProperties);
      setMetadata(response.metadata);
      setPerformance(response.performance);
      setRetryCount(0);
    } catch (err) {
      // Auto-retry with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchProperties(true), delay);
        return;
      }

      // Use secure error handler to prevent schema exposure
      const errorMessage = err instanceof Error && err.message === 'Request timeout'
        ? 'Request timed out. Please check your connection and try again.'
        : 'Unable to load properties. Please try again.';
      setError(errorMessage);
      
      if (import.meta.env.DEV) {
        console.error('Properties fetch error:', err);
      }

      // Set empty data on error to prevent stuck loading state
      setProperties([]);
      setMetadata({
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      });
    } finally {
      setLoading(false);
    }
  };

  const retry = () => {
    setRetryCount(0);
    fetchProperties();
  };

  useEffect(() => {
    fetchProperties();
  }, [currentPage, pageSize, JSON.stringify(filters)]);

  const paginationInfo = useMemo(() => ({
    currentPage,
    totalPages: metadata.totalPages,
    totalCount: metadata.total,
    hasNextPage: metadata.hasNext,
    hasPreviousPage: metadata.hasPrevious,
    startItem: (currentPage - 1) * pageSize + 1,
    endItem: Math.min(currentPage * pageSize, metadata.total),
    performance
  }), [currentPage, metadata, pageSize, performance]);

  const propertiesWithImages = useMemo(() => 
    properties.map(property => ({
      ...property,
      qualityImages: getQualityImages(property.image_urls || '')
    })), [properties]);

  return {
    properties: propertiesWithImages,
    loading,
    error,
    pagination: paginationInfo,
    setCurrentPage,
    refetch: fetchProperties,
    retry,
    retryCount,
    clearCache: () => {
      setCurrentPage(1);
      setRetryCount(0);
      fetchProperties();
    }
  };
};