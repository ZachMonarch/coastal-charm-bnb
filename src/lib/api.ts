import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Types for our enhanced API responses
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface APIResponse<T> {
  data: T[];
  metadata: {
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
    totalPages: number;
  };
  performance: {
    queryTime: number;
    cacheHit: boolean;
    cached: boolean;
  };
}

export interface PropertySearchParams extends PaginationParams {
  search?: string;
  city?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  status?: string;
  sortBy?: 'price' | 'id' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface UserSearchParams extends PaginationParams {
  search?: string;
  role?: string;
  status?: string;
  sortBy?: 'created_at' | 'full_name' | 'email';
  sortOrder?: 'asc' | 'desc';
}

// Enhanced property API with field selection and optimization
export class PropertyAPI {
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static cache = new Map<string, { data: any; timestamp: number }>();

  private static generateCacheKey(params: PropertySearchParams): string {
    return `properties:${JSON.stringify(params)}`;
  }

  private static getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private static setCacheData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  static async getProperties(params: PropertySearchParams): Promise<APIResponse<any>> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(params);
    
    // Check cache first
    const cachedData = this.getCachedData<APIResponse<any>>(cacheKey);
    if (cachedData) {
      return {
        ...cachedData,
        performance: {
          ...cachedData.performance,
          queryTime: Date.now() - startTime,
          cacheHit: true,
          cached: true
        }
      };
    }

    // Field selection - only fetch public fields (security: owner_id excluded)
    const selectedFields = [
      'id',
      'title', 
      'description',
      'address',
      'city',
      'state',
      'zip_code',
      'price',
      'bedrooms',
      'bathrooms',
      'square_feet',
      'property_type',
      'status',
      'available_date',
      'image_urls',
      'amenities'
    ].join(',');

    try {
      // Use safe_property_listings view for public queries (excludes owner_id, coordinates)
      let query = supabase
        .from('safe_property_listings')
        .select(selectedFields, { count: 'exact' });

      // Apply filters with proper indexing consideration
      if (params.search) {
        query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%,city.ilike.%${params.search}%`);
      }
      
      if (params.city && params.city !== 'all') {
        query = query.eq('city', params.city);
      }
      
      if (params.propertyType && params.propertyType !== 'all') {
        query = query.eq('property_type', params.propertyType);
      }
      
      if (params.minPrice) {
        query = query.gte('price', params.minPrice);
      }
      
      if (params.maxPrice) {
        query = query.lte('price', params.maxPrice);
      }
      
      if (params.bedrooms) {
        query = query.gte('bedrooms', params.bedrooms);
      }
      
      if (params.bathrooms) {
        query = query.gte('bathrooms', params.bathrooms);
      }
      
      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      // Sorting with index optimization
      const sortBy = params.sortBy || 'id';
      const sortOrder = params.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
      query = query.order(sortBy, sortOrder);

      // Pagination
      const from = (params.page - 1) * params.pageSize;
      const to = from + params.pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('[PropertyAPI] Supabase error:', error.message, error.code, error.details);
        throw error;
      }

      console.log('[PropertyAPI] Fetched', count, 'properties successfully');

      const totalPages = Math.ceil((count || 0) / params.pageSize);
      const response: APIResponse<any> = {
        data: data || [],
        metadata: {
          total: count || 0,
          page: params.page,
          pageSize: params.pageSize,
          hasNext: params.page < totalPages,
          hasPrevious: params.page > 1,
          totalPages
        },
        performance: {
          queryTime: Date.now() - startTime,
          cacheHit: false,
          cached: true
        }
      };

      // Cache the response
      this.setCacheData(cacheKey, response);

      return response;
    } catch (error) {
      console.error('Properties API error:', error);
      throw new Error(`Failed to fetch properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getPropertyById(id: number): Promise<any> {
    const cacheKey = `property:${id}`;
    const cachedData = this.getCachedData<any>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    // Use safe_property_listings view for public single property view (excludes owner_id, coordinates)
    const { data, error } = await supabase
      .from('safe_property_listings')
      .select('id, title, address, city, state, zip_code, price, bedrooms, bathrooms, square_feet, property_type, status, description, amenities, image_urls, available_date')
      .eq('id', id)
      .single();

    if (error) throw error;

    this.setCacheData(cacheKey, data);
    return data;
  }
}

// Enhanced user API with role-based access
export class UserAPI {
  private static readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private static cache = new Map<string, { data: any; timestamp: number }>();

  private static generateCacheKey(params: UserSearchParams): string {
    return `users:${JSON.stringify(params)}`;
  }

  private static getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private static setCacheData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  static async getUsers(params: UserSearchParams): Promise<APIResponse<any>> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(params);
    
    // Check cache first
    const cachedData = this.getCachedData<APIResponse<any>>(cacheKey);
    if (cachedData) {
      return {
        ...cachedData,
        performance: {
          ...cachedData.performance,
          queryTime: Date.now() - startTime,
          cacheHit: true,
          cached: true
        }
      };
    }

    // Field selection for security and performance
    const selectedFields = [
      'id',
      'email',
      'full_name',
      'phone',
      'city',
      'state',
      'role',
      'status',
      'created_at',
      'updated_at'
    ].join(',');

    try {
      let query = supabase
        .from('profiles')
        .select(selectedFields, { count: 'exact' });

      // Apply filters
      if (params.search) {
        query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
      }
      
      if (params.role && params.role !== 'all') {
        query = query.eq('role', params.role);
      }
      
      if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      // Sorting
      const sortBy = params.sortBy || 'created_at';
      const sortOrder = params.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
      query = query.order(sortBy, sortOrder);

      // Pagination
      const from = (params.page - 1) * params.pageSize;
      const to = from + params.pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const totalPages = Math.ceil((count || 0) / params.pageSize);
      const response: APIResponse<any> = {
        data: data || [],
        metadata: {
          total: count || 0,
          page: params.page,
          pageSize: params.pageSize,
          hasNext: params.page < totalPages,
          hasPrevious: params.page > 1,
          totalPages
        },
        performance: {
          queryTime: Date.now() - startTime,
          cacheHit: false,
          cached: true
        }
      };

      // Cache the response
      this.setCacheData(cacheKey, response);

      return response;
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getUserStats(): Promise<{
    total: number;
    active: number;
    byRole: Record<string, number>;
  }> {
    const cacheKey = 'user:stats';
    const cachedData = this.getCachedData<any>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    try {
      // Get total count
      const { count: total } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      // Get active count
      const { count: active } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get count by role
      const { data: roleData } = await supabase
        .from('profiles')
        .select('role')
        .not('role', 'is', null);

      const byRole = (roleData || []).reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const stats = {
        total: total || 0,
        active: active || 0,
        byRole
      };

      this.setCacheData(cacheKey, stats);
      return stats;
    } catch (error) {
      throw new Error(`Failed to fetch user stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Cache management utilities
export class CacheManager {
  static clearCache(): void {
    PropertyAPI['cache'].clear();
    UserAPI['cache'].clear();
  }

  static clearPropertyCache(): void {
    PropertyAPI['cache'].clear();
  }

  static clearUserCache(): void {
    UserAPI['cache'].clear();
  }

  static getCacheStats(): {
    propertyCacheSize: number;
    userCacheSize: number;
    totalCacheSize: number;
  } {
    return {
      propertyCacheSize: PropertyAPI['cache'].size,
      userCacheSize: UserAPI['cache'].size,
      totalCacheSize: PropertyAPI['cache'].size + UserAPI['cache'].size
    };
  }
}