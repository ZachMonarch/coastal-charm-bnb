import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  MapPin,
  Clock,
  Shield,
  CheckCircle2,
  ArrowLeft,
  Briefcase,
  Calendar,
  Award,
  ImageIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVendorPortfolio } from "@/hooks/useVendorPortfolio";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import AnimatedCounter from "@/components/AnimatedCounter";
import LoadingSpinner from "@/components/LoadingSpinner";
import EnhancedPageBackground from "@/components/shared/EnhancedPageBackground";

export default function VendorShowcase() {
  const { vendorId } = useParams();
  const navigate = useNavigate();

  // Fetch vendor profile
  const { data: vendor, isLoading: loadingVendor } = useQuery({
    queryKey: ["vendor-showcase", vendorId],
    queryFn: async () => {
      if (!vendorId) return null;
      
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select(`
          id, user_id, company_name, description, avatar_url, 
          rating, completed_jobs, response_time_hours, 
          specialties, service_areas, is_verified, 
          insurance_verified, background_check_verified,
          created_at
        `)
        .eq("id", vendorId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });

  // Fetch reviews
  const { data: reviews } = useQuery({
    queryKey: ["vendor-reviews-public", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      
      const { data, error } = await supabase
        .from("vendor_reviews")
        .select(`
          id, overall_rating, review_text, vendor_response, 
          created_at, reviewer:profiles(full_name, avatar_url)
        `)
        .eq("vendor_id", vendorId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });

  const { items: portfolioItems, loading: loadingPortfolio } = useVendorPortfolio(
    vendor?.user_id
  );

  if (loadingVendor) {
    return (
      <EnhancedPageBackground gradient="linear" pattern="dots" primaryColor="primary">
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      </EnhancedPageBackground>
    );
  }

  if (!vendor) {
    return (
      <EnhancedPageBackground gradient="linear" pattern="dots" primaryColor="primary">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Vendor Not Found</h1>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </EnhancedPageBackground>
    );
  }

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "V";
  };

  const memberSince = new Date(vendor.created_at).getFullYear();

  return (
    <>
      <Helmet>
        <title>{vendor.company_name} | Monarch Vendor Marketplace</title>
        <meta
          name="description"
          content={`${vendor.company_name} - ${vendor.description?.slice(0, 150) || "Professional service provider"}`}
        />
      </Helmet>

      <EnhancedPageBackground gradient="linear" pattern="dots" primaryColor="primary">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/5 py-12">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              className="mb-6"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>

            <div className="flex flex-col md:flex-row items-start gap-8">
              {/* Avatar & Basic Info */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-28 w-28 border-4 border-primary/20">
                    <AvatarImage src={vendor.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                      {getInitials(vendor.company_name)}
                    </AvatarFallback>
                  </Avatar>
                  {vendor.is_verified && (
                    <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-1.5">
                      <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl md:text-3xl font-bold">
                      {vendor.company_name}
                    </h1>
                    {vendor.is_verified && (
                      <Badge className="bg-primary text-primary-foreground">
                        Verified
                      </Badge>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(vendor.rating || 0)
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                    <span className="text-lg font-semibold ml-1">
                      {vendor.rating?.toFixed(1) || "New"}
                    </span>
                    <span className="text-muted-foreground">
                      ({reviews?.length || 0} reviews)
                    </span>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <AnimatedCounter value={vendor.completed_jobs || 0} /> jobs
                    </div>
                    {vendor.response_time_hours && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {vendor.response_time_hours}h response
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Member since {memberSince}
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="md:ml-auto">
                <Button size="lg" onClick={() => navigate("/request-quote")}>
                  Request Quote
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Verification Badges */}
        <section className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap gap-3">
              {vendor.insurance_verified && (
                <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  Insurance Verified
                </Badge>
              )}
              {vendor.background_check_verified && (
                <Badge variant="outline" className="bg-info/10 text-info border-info/30 gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Background Checked
                </Badge>
              )}
              {vendor.is_verified && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1">
                  <Award className="h-3.5 w-3.5" />
                  Verified Business
                </Badge>
              )}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="about" className="space-y-6">
              <TabsList variant="default">
                <TabsTrigger variant="default" value="about">About</TabsTrigger>
                <TabsTrigger variant="default" value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger variant="default" value="reviews">Reviews</TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-6">
                <Card variant="interactive">
                  <CardHeader>
                    <CardTitle>About {vendor.company_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground line-clamp-4 break-words">
                      {vendor.description ||
                        "Professional service provider ready to help with your property needs."}
                    </p>

                    {vendor.specialties && vendor.specialties.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Services</h4>
                        <div className="flex flex-wrap gap-2">
                          {vendor.specialties.map((specialty: string, i: number) => (
                            <Badge key={i} variant="secondary">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {vendor.service_areas && vendor.service_areas.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Service Areas</h4>
                        <div className="flex flex-wrap gap-2">
                          {vendor.service_areas.map((area: string, i: number) => (
                            <Badge key={i} variant="outline">
                              <MapPin className="h-3 w-3 mr-1" />
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Portfolio Tab */}
              <TabsContent value="portfolio" className="space-y-6">
                {loadingPortfolio ? (
                  <LoadingSpinner />
                ) : portfolioItems.length === 0 ? (
                  <Card variant="interactive" className="text-center py-12">
                    <CardContent>
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No portfolio items yet
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {portfolioItems.map((item) => (
                      <Card key={item.id} variant="interactive">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                          <CardDescription className="truncate">
                            {item.category}
                            {item.completion_date &&
                              ` • ${new Date(item.completion_date).toLocaleDateString()}`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {item.before_image_url && item.after_image_url ? (
                            <BeforeAfterSlider
                              beforeImage={item.before_image_url}
                              afterImage={item.after_image_url}
                            />
                          ) : item.after_image_url ? (
                            <img
                              src={item.after_image_url}
                              alt={item.title}
                              className="w-full aspect-video object-cover rounded-lg"
                            />
                          ) : null}
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-3 break-words">
                              {item.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6">
                {!reviews || reviews.length === 0 ? (
                  <Card variant="interactive" className="text-center py-12">
                    <CardContent>
                      <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No reviews yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review: any) => (
                      <Card key={review.id} variant="interactive">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={review.reviewer?.avatar_url} />
                              <AvatarFallback>
                                {getInitials(review.reviewer?.full_name || "User")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">
                                  {review.reviewer?.full_name || "Anonymous"}
                                </span>
                                <div className="flex items-center gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3.5 w-3.5 ${
                                        i < review.overall_rating
                                          ? "fill-primary text-primary"
                                          : "text-muted-foreground/30"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-muted-foreground mb-2 line-clamp-4 break-words">
                                {review.review_text}
                              </p>
                              {review.vendor_response && (
                                <div className="mt-3 pl-4 border-l-2 border-primary/30">
                                  <p className="text-sm font-medium text-primary mb-1">
                                    Vendor Response
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {review.vendor_response}
                                  </p>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-12 bg-muted/30 border-t">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Ready to work with {vendor.company_name}?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Get a free quote for your project today
            </p>
            <Button size="lg" onClick={() => navigate("/request-quote")}>
              Request a Quote
            </Button>
          </div>
        </section>
      </EnhancedPageBackground>
    </>
  );
}