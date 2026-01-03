import { useAuth } from '@/contexts/OptimizedAuthContext';

/**
 * Interface for masked property data (anonymous users)
 */
export interface MaskedProperty {
  id: number;
  title: string;
  description: string;
  property_type: string;
  status: string;
  city: string;
  state: string;
  location_display: string;
  price_range: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: string;
  image_urls: string;
  amenities: string;
  available_date: string;
}

/**
 * Interface for full property data (authenticated users)
 */
export interface FullProperty extends MaskedProperty {
  address: string;
  zip_code: number;
}

/**
 * Hook for auth-aware property data access
 * 
 * Anonymous users: See only city/state and price range
 * Authenticated users: See full address and exact price
 */
export function usePropertyAccess() {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return {
    /** Whether the user is authenticated */
    isAuthenticated,
    
    /** Whether user can view full property details (address, exact price) */
    canViewFullDetails: isAuthenticated,
    
    /** Whether user can see exact price (vs price range) */
    canViewExactPrice: isAuthenticated,
    
    /** Whether user can see full address (vs city/state only) */
    canViewFullAddress: isAuthenticated,
    
    /** Get the appropriate database view name based on auth status */
    getViewName: (): 'safe_property_listings' | 'public_property_listings_masked' => {
      return isAuthenticated ? 'safe_property_listings' : 'public_property_listings_masked';
    },
    
    /** Get the appropriate selected fields based on auth status */
    getSelectedFields: (): string => {
      return isAuthenticated 
        ? 'id,title,description,address,city,state,zip_code,price,bedrooms,bathrooms,square_feet,property_type,status,available_date,image_urls,amenities'
        : 'id,title,description,city,state,location_display,price_range,price,bedrooms,bathrooms,square_feet,property_type,status,available_date,image_urls,amenities';
    }
  };
}
