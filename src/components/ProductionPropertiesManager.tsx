import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { logger } from '@/utils/logger';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, MapPin, DollarSign, Users, Search, Filter, Plus, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { toast } from "sonner";
import { LazyImage } from './LazyImage';
import { getPropertyStatusColor } from "@/utils/themeColors";

interface Property {
  id: number;
  title: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: number | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: string | null;
  property_type: string | null;
  status: string | null;
  amenities: string | null;
  image_urls: string | null;
  available_date: string | null;
}

interface PropertyStats {
  total: number;
  available: number;
  rented: number;
  maintenance: number;
  totalValue: number;
  averagePrice: number;
}

export default function ProductionPropertiesManager() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [stats, setStats] = useState<PropertyStats>({
    total: 0,
    available: 0,
    rented: 0,
    maintenance: 0,
    totalValue: 0,
    averagePrice: 0,
  });
  const { user } = useAuth();

  // Fetch properties and calculate stats
  const fetchProperties = async () => {
    try {
      setLoading(true);
      
      // Use safe_property_listings view to avoid exposing sensitive data (owner_id, coordinates)
      const { data: propertiesData, error } = await supabase
        .from('safe_property_listings')
        .select('id, title, description, address, city, state, zip_code, price, bedrooms, bathrooms, square_feet, property_type, status, amenities, image_urls, available_date')
        .order('id', { ascending: false })
        .limit(100);

      if (error) throw error;

      setProperties(propertiesData || []);

      // Calculate stats
      const total = propertiesData?.length || 0;
      const available = propertiesData?.filter(p => p.status === 'Available' || p.status === 'available').length || 0;
      const rented = propertiesData?.filter(p => p.status === 'Rented' || p.status === 'rented').length || 0;
      const maintenance = propertiesData?.filter(p => p.status === 'Maintenance' || p.status === 'maintenance').length || 0;
      
      const totalValue = propertiesData?.reduce((sum, p) => sum + (p.price || 0), 0) || 0;
      const averagePrice = total > 0 ? totalValue / total : 0;

      setStats({
        total,
        available,
        rented,
        maintenance,
        totalValue,
        averagePrice,
      });
    } catch (error) {
      logger.error('Error fetching properties:', error);
      toast.error('Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Filter properties based on search and filters
  const filteredProperties = properties.filter(property => {
    const searchableText = [
      property.title,
      property.description,
      property.address,
      property.city,
      property.state,
      property.property_type
    ].filter(Boolean).join(' ').toLowerCase();
    
    const matchesSearch = searchTerm === '' || searchableText.includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "All" || property.property_type === selectedType;
    const matchesStatus = selectedStatus === "All" || property.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40';
      case 'rented':
        return 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40';
      case 'maintenance':
        return 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading properties...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Property Management</h1>
          <p className="text-muted-foreground">Manage your property portfolio</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="neumorphic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Portfolio size
            </p>
          </CardContent>
        </Card>
        
        <Card className="neumorphic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.available}</div>
            <p className="text-xs text-muted-foreground">
              Ready to rent
            </p>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rented</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.rented}</div>
            <p className="text-xs text-muted-foreground">
              Currently occupied
            </p>
          </CardContent>
        </Card>

        <Card className="neumorphic-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatPrice(stats.averagePrice)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="neumorphic-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search properties by title, address, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="House">House</SelectItem>
                <SelectItem value="Condo">Condo</SelectItem>
                <SelectItem value="Townhouse">Townhouse</SelectItem>
                <SelectItem value="Studio">Studio</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Rented">Rented</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle>Properties ({filteredProperties.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                        {property.image_urls ? (
                          <LazyImage
                            src={property.image_urls.split(',')[0]}
                            alt={property.title || 'Property'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{property.title || 'Untitled Property'}</div>
                        <div className="text-sm text-muted-foreground">{property.property_type}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm">{property.address}</div>
                        <div className="text-xs text-muted-foreground">
                          {property.city}, {property.state} {property.zip_code}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatPrice(property.price)}</div>
                    {property.available_date && (
                      <div className="text-xs text-muted-foreground">
                        Available: {property.available_date}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {property.bedrooms}br / {property.bathrooms}ba
                    </div>
                    {property.square_feet && (
                      <div className="text-xs text-muted-foreground">
                        {property.square_feet} sqft
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getPropertyStatusColor(property.status || 'unavailable')}>
                      {property.status || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredProperties.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No properties found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}