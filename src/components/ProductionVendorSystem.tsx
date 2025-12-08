import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { logger } from '@/utils/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReusableAvatar from './Avatar';
import { Star, MapPin, Clock, CheckCircle, AlertCircle, Filter, Search, Users, Award, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VendorProfile {
  id: string;
  user_id: string;
  company_name: string;
  specialties: string[];
  service_areas: string[];
  is_verified: boolean;
  rating: number;
  completed_jobs: number;
  response_time_hours: number;
  availability_status: string;
  subscription_status: string;
  subscription_plan: string;
  business_license: string;
  insurance_verified: boolean;
  background_check_verified: boolean;
  created_at: string;
  last_active_at: string;
  profiles: {
    full_name: string;
    email: string;
    avatar_url: string;
  } | null;
}

interface FilterState {
  search: string;
  specialty: string;
  availability: string;
  verified: string;
  rating: string;
  location: string;
}

const specialties = [
  'Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Painting', 
  'Flooring', 'Roofing', 'Landscaping', 'Cleaning', 'General Maintenance'
];

const availabilityOptions = ['available', 'busy', 'unavailable'];

export default function ProductionVendorSystem() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    specialty: '',
    availability: '',
    verified: '',
    rating: '',
    location: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select(`
          *,
          profiles!vendor_profiles_user_id_fkey(
            full_name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = data?.map(vendor => ({
        ...vendor,
        profiles: Array.isArray(vendor.profiles) ? vendor.profiles[0] || null : vendor.profiles
      })) || [];
      
      setVendors(transformedData);
    } catch (error: any) {
      logger.error('Error fetching vendors:', error);
      toast({
        title: "Error",
        description: "Failed to load vendors. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    if (filters.search && 
        !vendor.company_name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !vendor.profiles?.full_name?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !vendor.specialties?.some(s => s.toLowerCase().includes(filters.search.toLowerCase()))) {
      return false;
    }
    if (filters.specialty && !vendor.specialties?.includes(filters.specialty)) return false;
    if (filters.availability && vendor.availability_status !== filters.availability) return false;
    if (filters.verified === 'true' && !vendor.is_verified) return false;
    if (filters.verified === 'false' && vendor.is_verified) return false;
    if (filters.rating && vendor.rating < parseFloat(filters.rating)) return false;
    if (filters.location && !vendor.service_areas?.some(area => 
        area.toLowerCase().includes(filters.location.toLowerCase()))) return false;
    return true;
  });

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'busy': return 'secondary';
      case 'unavailable': return 'destructive';
      default: return 'outline';
    }
  };

  const getSubscriptionColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'expired': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
      />
    ));
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
        <h1 className="text-4xl font-bold text-foreground">Vendor Directory</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Find verified professionals for your projects
        </p>
      </div>

      {/* Filters */}
      <Card className="backdrop-blur-sm bg-card/90 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Vendors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors, companies, skills..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Specialty</label>
              <Select value={filters.specialty} onValueChange={(value) => setFilters({...filters, specialty: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Specialties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Specialties</SelectItem>
                  {specialties.map(specialty => (
                    <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Availability</label>
              <Select value={filters.availability} onValueChange={(value) => setFilters({...filters, availability: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Availability</SelectItem>
                  {availabilityOptions.map(option => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Verified Status</label>
              <Select value={filters.verified} onValueChange={(value) => setFilters({...filters, verified: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Status</SelectItem>
                  <SelectItem value="true">Verified Only</SelectItem>
                  <SelectItem value="false">Unverified Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Min Rating</label>
              <Select value={filters.rating} onValueChange={(value) => setFilters({...filters, rating: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Rating</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Service Area</label>
              <Input
                placeholder="Enter location..."
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => setFilters({
                search: '', specialty: '', availability: '', verified: '', rating: '', location: ''
              })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Users className="w-10 h-10 text-primary" />
            <div>
              <p className="text-2xl font-bold">{vendors.length}</p>
              <p className="text-sm text-muted-foreground">Total Vendors</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <CheckCircle className="w-10 h-10 text-success" />
            <div>
              <p className="text-2xl font-bold">{vendors.filter(v => v.is_verified).length}</p>
              <p className="text-sm text-muted-foreground">Verified</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Award className="w-10 h-10 text-warning" />
            <div>
              <p className="text-2xl font-bold">{vendors.filter(v => v.rating >= 4.5).length}</p>
              <p className="text-sm text-muted-foreground">Top Rated</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <Briefcase className="w-10 h-10 text-info" />
            <div>
              <p className="text-2xl font-bold">{vendors.filter(v => v.availability_status === 'available').length}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map((vendor) => (
          <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <ReusableAvatar 
                  url={vendor.profiles?.avatar_url}
                  name={vendor.profiles?.full_name || vendor.company_name}
                  size="lg"
                  variant="vendor"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{vendor.company_name}</h3>
                    {vendor.is_verified && (
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {vendor.profiles?.full_name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {renderStars(vendor.rating)}
                    <span className="text-sm text-muted-foreground ml-1">
                      ({vendor.rating.toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={getAvailabilityColor(vendor.availability_status)}>
                  {vendor.availability_status}
                </Badge>
                <Badge variant={getSubscriptionColor(vendor.subscription_status)}>
                  {vendor.subscription_plan || 'free'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span>{vendor.completed_jobs} completed jobs</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Responds in {vendor.response_time_hours}h</span>
                </div>

                {vendor.service_areas && vendor.service_areas.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{vendor.service_areas.join(', ')}</span>
                  </div>
                )}
              </div>

              {vendor.specialties && vendor.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {vendor.specialties.slice(0, 3).map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {vendor.specialties.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{vendor.specialties.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                {vendor.insurance_verified && (
                  <Badge variant="outline" className="text-xs text-success">
                    Insured
                  </Badge>
                )}
                {vendor.background_check_verified && (
                  <Badge variant="outline" className="text-xs text-info">
                    Background Checked
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  View Profile
                </Button>
                <Button size="sm" className="flex-1">
                  Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No vendors found matching your criteria.</p>
          <Button 
            onClick={() => setFilters({
              search: '', specialty: '', availability: '', verified: '', rating: '', location: ''
            })} 
            variant="outline" 
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}