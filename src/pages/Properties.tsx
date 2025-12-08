import { useState } from "react";
import { Building2, AlertCircle, Loader2, Filter, Home, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Footer from "@/components/Footer";
import EnhancedApartmentFilter from "@/components/EnhancedApartmentFilter";
import ApartmentCard, { ApartmentProps } from "@/components/ApartmentCard";
import PropertyCard from "@/components/PropertyCard";
import EnhancedPropertyFilter from "@/components/EnhancedPropertyFilter";
import PropertyPagination from "@/components/PropertyPagination";
import { useProperties, PropertyFilters } from "@/hooks/useProperties";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SEOHead } from "@/components/SEOHead";
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";
import PageHero from "@/components/shared/PageHero";

// Mock data for properties (long-term rentals)
const mockProperties = [
  {
    id: 1,
    title: "Luxury Downtown Apartment",
    location: "Downtown District",
    price: 2500,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&h=300&fit=crop",
    type: "Apartment",
    status: "Available"
  },
  {
    id: 2,
    title: "Modern Condo with City Views",
    location: "Midtown",
    price: 3200,
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&h=300&fit=crop",
    type: "Condo",
    status: "Available"
  },
  {
    id: 3,
    title: "Executive Penthouse Suite",
    location: "Financial District",
    price: 4800,
    bedrooms: 4,
    bathrooms: 3,
    parking: 2,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop",
    type: "Penthouse",
    status: "Available"
  }
];

// Enhanced vacation rentals data - converted from long-term properties
const mockApartments: ApartmentProps[] = [
  {
    id: "1",
    name: "Deluxe Sea View Suite",
    description: "Luxurious suite with panoramic sea views, modern amenities, and a private balcony.",
    price: 180,
    capacity: 2,
    size: 45,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop",
    location: "Beachfront",
    features: ["Wi-Fi", "Kitchen", "Bathroom", "Air Conditioning", "TV", "Balcony"]
  },
  {
    id: "2",
    name: "Premium Family Apartment",
    description: "Spacious apartment ideal for families, with full kitchen and stunning coastal views.",
    price: 250,
    capacity: 4,
    size: 75,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    location: "Second row",
    features: ["Wi-Fi", "Kitchen", "Bathroom", "Air Conditioning", "TV", "Washing Machine"]
  },
  {
    id: "3",
    name: "Executive Beach Studio",
    description: "Elegant studio with direct beach access, modern design, and premium finishes.",
    price: 150,
    capacity: 2,
    size: 35,
    image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&h=600&fit=crop",
    location: "Beachfront",
    features: ["Wi-Fi", "Kitchenette", "Bathroom", "Air Conditioning", "TV"]
  },
  {
    id: "4",
    name: "Modern Downtown Loft",
    description: "Chic loft apartment in the heart of downtown with exposed brick and modern finishes.",
    price: 320,
    capacity: 3,
    size: 85,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
    location: "Downtown",
    features: ["Wi-Fi", "Full Kitchen", "Workspace", "Air Conditioning", "Smart TV", "Parking"]
  },
  {
    id: "5",
    name: "Luxury Penthouse Suite",
    description: "Exclusive penthouse with private terrace, city views, and premium amenities.",
    price: 480,
    capacity: 6,
    size: 120,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    location: "Financial District",
    features: ["Wi-Fi", "Gourmet Kitchen", "Private Terrace", "Jacuzzi", "Concierge", "Gym Access"]
  },
  {
    id: "6",
    name: "Cozy Garden Cottage",
    description: "Charming cottage with private garden, perfect for a peaceful getaway.",
    price: 140,
    capacity: 2,
    size: 40,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
    location: "Garden District",
    features: ["Wi-Fi", "Kitchenette", "Private Garden", "Fireplace", "Pet Friendly"]
  },
  {
    id: "7",
    name: "City View Executive Studio",
    description: "Modern studio with floor-to-ceiling windows and stunning city skyline views.",
    price: 200,
    capacity: 2,
    size: 50,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    location: "Midtown",
    features: ["Wi-Fi", "Kitchen", "City Views", "Gym Access", "24/7 Security"]
  },
  {
    id: "8",
    name: "Family Vacation Home",
    description: "Spacious family home with multiple bedrooms and entertainment areas.",
    price: 380,
    capacity: 8,
    size: 150,
    image: "https://images.unsplash.com/photo-1556912167-f556f1d99b04?w=800&h=600&fit=crop",
    location: "Residential",
    features: ["Wi-Fi", "Full Kitchen", "Game Room", "BBQ Area", "Parking", "Washer/Dryer"]
  }
];

export default function Properties() {
  const [propertyFilters, setPropertyFilters] = useState<Partial<PropertyFilters>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filteredApartments, setFilteredApartments] = useState(mockApartments);
  
  const { 
    properties, 
    loading, 
    error, 
    pagination, 
    setCurrentPage 
  } = useProperties(propertyFilters, 40); // 40 properties per page

  return (
    <EnhancedPageBackground gradient="linear" pattern="dots" primaryColor="primary">
      <SEOHead
        title="Properties & Vacation Rentals for Rent"
        description="Browse our curated selection of long-term rental properties and vacation accommodations. Find your perfect home with premium amenities and flexible lease terms."
        keywords={["property rentals", "vacation rentals", "apartments for rent", "long-term rentals", "furnished apartments", "property management"]}
        type="website"
        url="https://monarch-properties.com/properties"
      />
      
      {/* Hero Section with Background Image */}
      <section className="relative overflow-hidden min-h-[40vh] flex items-center justify-center mb-8">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&h=600&fit=crop"
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
        </div>
        <div className="container relative z-10 px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-2xl">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg">
            Properties & Accommodations
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-6 drop-shadow-md">
            Discover long-term rentals and vacation accommodations from our curated selection
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-background/20 backdrop-blur px-4 py-2 rounded-full text-white flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="font-semibold">{pagination.totalCount}</span>
              <span className="text-white/80">Total Listings</span>
            </div>
            <div className="bg-background/20 backdrop-blur px-4 py-2 rounded-full text-white flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="font-semibold">{mockApartments.length}</span>
              <span className="text-white/80">Vacation Rentals</span>
            </div>
          </div>
        </div>
      </section>
      
      <main className="w-full px-4 py-6 sm:px-6 lg:px-8" role="main" aria-label="Properties and vacation rentals">
        <div className="content-constrained">
          {/* Page Hero removed - using image hero above */}
          <div className="hidden">
          <PageHero
            title="Properties & Accommodations"
            description="Discover long-term rentals and vacation accommodations from our curated selection"
            icon={Building2}
            variant="gradient"
            stats={[]}
          />
          </div>

          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="grid w-full grid-cols-2 neumorphic-card p-1 sm:p-2 mb-6 sm:mb-8">
              <TabsTrigger value="properties" className="text-sm sm:text-base lg:text-lg py-2 sm:py-3">
                <span className="hidden sm:inline">Long-term Rentals</span>
                <span className="sm:hidden">Rentals</span>
              </TabsTrigger>
              <TabsTrigger value="apartments" className="text-sm sm:text-base lg:text-lg py-2 sm:py-3">
                <span className="hidden sm:inline">Vacation Stays</span>
                <span className="sm:hidden">Vacations</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="properties" className="space-y-8">
              {/* Properties Filter */}
              <EnhancedPropertyFilter
                filters={propertyFilters}
                onFiltersChange={setPropertyFilters}
              />

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="neumorphic-card p-8 rounded-3xl">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground text-center">Loading properties...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <Alert className="neumorphic-card border-destructive/20 bg-destructive/5">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Properties Grid */}
              {!loading && !error && (
                <>
                  {properties.length > 0 ? (
                    <>
                      {/* Results Summary and View Controls */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center space-x-3">
                          <Building2 className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">
                            {pagination.totalCount} Properties Found
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex border border-border rounded-lg p-1">
                            <Button
                              variant={viewMode === 'grid' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setViewMode('grid')}
                              className="px-3"
                            >
                              <div className="grid grid-cols-2 gap-1 w-4 h-4">
                                <div className="bg-current rounded-sm"></div>
                                <div className="bg-current rounded-sm"></div>
                                <div className="bg-current rounded-sm"></div>
                                <div className="bg-current rounded-sm"></div>
                              </div>
                            </Button>
                            <Button
                              variant={viewMode === 'list' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setViewMode('list')}
                              className="px-3"
                            >
                              <div className="flex flex-col gap-1 w-4 h-4">
                                <div className="bg-current h-1 rounded-sm"></div>
                                <div className="bg-current h-1 rounded-sm"></div>
                                <div className="bg-current h-1 rounded-sm"></div>
                              </div>
                            </Button>
                          </div>
                          
                          <Badge variant="secondary" className="neumorphic-inset">
                            Page {pagination.currentPage} of {pagination.totalPages}
                          </Badge>
                        </div>
                      </div>

                      {/* Properties Display with Grid/List View */}
                      <div className={
                        viewMode === 'grid' 
                          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                          : "space-y-4"
                      }>
                        {properties.map((property, index) => (
                          <div 
                            key={property.id} 
                            className="animate-fade-in" 
                            style={{ animationDelay: `${index * 25}ms` }}
                          >
                            <PropertyCard 
                              property={property} 
                              className="h-full"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      <PropertyPagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        totalCount={pagination.totalCount}
                        startItem={pagination.startItem}
                        endItem={pagination.endItem}
                        hasNextPage={pagination.hasNextPage}
                        hasPreviousPage={pagination.hasPreviousPage}
                        onPageChange={setCurrentPage}
                      />
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="neumorphic-card p-12 rounded-3xl">
                        <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Properties Found</h3>
                        <p className="text-muted-foreground mb-6">
                          Try adjusting your filters to see more results
                        </p>
                        <button 
                          onClick={() => setPropertyFilters({})}
                          className="btn-primary"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="apartments" className="space-y-8">
              <div className="neumorphic-card p-6 rounded-3xl">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-primary" />
                  Vacation Rentals & Short-term Stays
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Discover fully furnished apartments and vacation homes perfect for short-term stays.
                </p>
                <EnhancedApartmentFilter
                  onFilterChange={(filteredApartments) => setFilteredApartments(filteredApartments)}
                />
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {filteredApartments.length} Vacation Rentals Available
                  </h3>
                  <Badge variant="outline">Short-term Rentals</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredApartments.map((apartment, index) => (
                  <div key={apartment.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <ApartmentCard apartment={apartment} />
                  </div>
                ))}
              </div>

              {filteredApartments.length === 0 && (
                <div className="text-center py-12">
                  <div className="neumorphic-card p-12 rounded-3xl">
                    <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Vacation Rentals Found</h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your filters to see more results
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </EnhancedPageBackground>
  );
}