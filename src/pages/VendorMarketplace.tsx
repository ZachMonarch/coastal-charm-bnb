import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, MapPin, Star, Clock, CheckCircle2, Shield, 
  Filter, ArrowRight, Building2, Phone, Mail, Users
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useVerifiedVendors } from "@/hooks/useVerifiedVendors";
import LoadingSpinner from "@/components/LoadingSpinner";
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";
import PageHero from "@/components/shared/PageHero";
import StatsCard from "@/components/shared/StatsCard";

const SERVICE_CATEGORIES = [
  "All Categories",
  "Plumbing",
  "Electrical",
  "HVAC",
  "Painting",
  "Landscaping",
  "General Contracting",
  "Roofing",
  "Cleaning",
  "Security",
  "Moving",
  "Carpentry",
  "Flooring",
];

const LOCATIONS = [
  "All Locations",
  "New York",
  "Los Angeles",
  "Chicago",
  "Houston",
  "Phoenix",
  "Philadelphia",
  "San Antonio",
  "San Diego",
  "Dallas",
  "Austin",
];

export default function VendorMarketplace() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  const { vendors, loading, error } = useVerifiedVendors({
    specialty: selectedCategory !== "All Categories" ? selectedCategory : undefined,
    location: selectedLocation !== "All Locations" ? selectedLocation : undefined,
    minRating: minRating,
  });

  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    
    return vendors.filter((vendor) => {
      const matchesSearch = 
        !searchQuery ||
        vendor.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesSearch;
    });
  }, [vendors, searchQuery]);

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'V';
  };

  const getRatingStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-primary text-primary' : 'text-muted'}`} 
      />
    ));
  };

  // Compute stats
  const verifiedCount = filteredVendors.filter(v => v.is_verified).length;
  const avgRating = filteredVendors.length > 0 
    ? (filteredVendors.reduce((sum, v) => sum + (v.rating || 0), 0) / filteredVendors.length).toFixed(1) 
    : '0.0';

  return (
    <>
      <Helmet>
        <title>Find Service Providers | Monarch Vendor Marketplace</title>
        <meta name="description" content="Browse verified contractors and service providers. Find trusted plumbers, electricians, landscapers, and more for your property management needs." />
      </Helmet>

      <EnhancedPageBackground pattern="mesh" gradient="radial" primaryColor="primary" intensity="subtle">
        <div className="min-h-screen">
          {/* Hero Section with PageHero */}
          <section className="container mx-auto px-4 py-8">
            <PageHero
              title="Vendor Marketplace"
              description="Browse our network of verified contractors ready to help with your property needs"
              icon={Building2}
              variant="vibrant"
              stats={[
                { label: 'Total Vendors', value: filteredVendors.length, icon: Users, color: 'info' },
                { label: 'Verified', value: verifiedCount, icon: CheckCircle2, color: 'success' },
                { label: 'Avg Rating', value: avgRating, icon: Star, color: 'warning' },
              ]}
              actions={[
                { label: 'Post a Project', href: '/dashboard/projects', variant: 'default' },
                { label: 'Join as Vendor', href: '/join-as-vendor', variant: 'outline' },
              ]}
            />

            {/* Search & Filters */}
            <div className="max-w-4xl mx-auto mt-8">
              <Card variant="glass" className="shadow-lg border-border/50">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by service, company name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map((loc) => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

        {/* Results Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {loading ? "Searching..." : `${filteredVendors.length} Verified Vendors`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  All vendors are verified and background-checked
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select 
                  value={minRating?.toString() || "any"} 
                  onValueChange={(v) => setMinRating(v === "any" ? undefined : Number(v))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Min Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Rating</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center py-20">
                <LoadingSpinner />
              </div>
            )}

            {/* Error State */}
            {error && (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground mb-4">Error loading vendors. Please try again.</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!loading && !error && filteredVendors.length === 0 && (
              <Card className="text-center py-16">
                <CardContent>
                  <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No vendors found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search criteria or browse all categories
                  </p>
                  <Button onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All Categories");
                    setSelectedLocation("All Locations");
                    setMinRating(undefined);
                  }}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Vendor Grid */}
            {!loading && !error && filteredVendors.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.map((vendor) => (
                  <Card 
                    key={vendor.id} 
                    className="hover:shadow-lg transition-all duration-300 hover:border-primary/30 group"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14 border-2 border-primary/20">
                          <AvatarImage src={vendor.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(vendor.company_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg truncate">
                              {vendor.company_name}
                            </CardTitle>
                            {vendor.is_verified && (
                              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {getRatingStars(vendor.rating || 0)}
                            <span className="text-sm text-muted-foreground ml-1">
                              ({vendor.completed_jobs || 0} jobs)
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Description */}
                      <CardDescription className="line-clamp-2">
                        {vendor.description || "Professional service provider ready to help with your property needs."}
                      </CardDescription>

                      {/* Specialties */}
                      <div className="flex flex-wrap gap-1.5">
                        {vendor.specialties?.slice(0, 3).map((specialty, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {(vendor.specialties?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{vendor.specialties!.length - 3} more
                          </Badge>
                        )}
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {vendor.response_time_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{vendor.response_time_hours}h response</span>
                          </div>
                        )}
                        {vendor.service_areas?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{vendor.service_areas[0]}</span>
                          </div>
                        )}
                      </div>

                      {/* Verification Badges */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        {vendor.insurance_verified && (
                          <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                            <Shield className="h-3 w-3 mr-1" />
                            Insured
                          </Badge>
                        )}
                        {vendor.background_check_verified && (
                          <Badge variant="outline" className="text-xs bg-info/10 text-info border-info/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Background Checked
                          </Badge>
                        )}
                      </div>

                      {/* Action Button */}
                      <Button 
                        className="w-full mt-2 group-hover:bg-primary"
                        variant="outline"
                        onClick={() => navigate(`/vendors/${vendor.id}`)}
                      >
                        View Profile & Request Quote
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA for Property Managers */}
        <section className="py-16 bg-muted/30 border-t border-border">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-4">
              Need a Service Provider?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Post your project and let qualified vendors come to you with quotes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/dashboard/projects')}>
                Post a Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/join-as-vendor')}>
                Join as a Vendor
              </Button>
            </div>
          </div>
        </section>
        </div>
      </EnhancedPageBackground>
    </>
  );
}
