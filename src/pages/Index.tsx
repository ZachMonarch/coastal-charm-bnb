import { useEffect, useState, useMemo, useRef, useCallback, lazy, Suspense } from "react";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import PropertyCard from "@/components/PropertyCard";
import WelcomeSection from "@/components/WelcomeSection";
import { EnhancedSEOLayout } from "@/components/EnhancedSEOLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProperties } from "@/hooks/useProperties";
import { useCanonicalUrl } from "@/hooks/useCanonicalUrl";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy/below-fold components to improve TTI
const EnhancedBookingSection = lazy(() => import("@/components/EnhancedBookingSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const FeaturesShowcase = lazy(() => import("@/components/FeaturesShowcase"));
const CTASection = lazy(() => import("@/components/CTASection"));

// Loading placeholder for booking section
function BookingSectionSkeleton() {
  return (
    <section className="relative py-24 bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-12 w-full max-w-md" />
            <Skeleton className="h-24 w-full" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-3/4" />
              ))}
            </div>
          </div>
          <div className="neumorphic-card p-8 rounded-3xl">
            <Skeleton className="h-10 w-3/4 mx-auto mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


export default function Index() {
  const { t } = useLanguage();
  const propertiesSectionRef = useRef<HTMLElement>(null);
  
  // Memoize filters for random properties - use random offset for variety
  const propertyFilters = useMemo(() => ({
    sortBy: 'id' as const,
    sortOrder: 'desc' as const
  }), []);
  
  // Defer property loading to break critical request chain
  // Properties will only load when the section becomes visible
  const { properties, loading, triggerFetch, hasFetched } = useProperties(
    propertyFilters, 
    20,
    { defer: true }
  );
  
  // Use IntersectionObserver to trigger property fetch when section is near viewport
  useEffect(() => {
    const section = propertiesSectionRef.current;
    if (!section || hasFetched) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          triggerFetch();
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Start loading 200px before section enters viewport
    );
    
    observer.observe(section);
    return () => observer.disconnect();
  }, [triggerFetch, hasFetched]);
  
  // Randomize and pick 9 properties for display variety
  const randomProperties = useMemo(() => {
    if (properties.length === 0) return [];
    const shuffled = [...properties].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 9);
  }, [properties]);
  
  // Set canonical URL for homepage
  useCanonicalUrl('https://monarchpropertymmgt.com/');
  
  useEffect(() => {
    // Scroll to top when component mounts - batched to prevent forced reflow
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, []);
  
  return (
    <>
      <EnhancedSEOLayout
      title="Monarch Property Management - Premier Property & Vendor Services"
      description="Transform your property investments with our comprehensive management platform. Connect with verified vendors, streamline operations, and maximize returns. Join thousands of satisfied property owners."
      keywords={[
        'property management software',
        'vendor management platform',
        'real estate investment',
        'property maintenance',
        'tenant management system',
        'property portfolio management',
        'commercial property management',
        'residential property services',
        'verified contractors',
        'property management company'
      ]}
      type="website"
      schemaType="LocalBusiness"
    >
      <div className="min-h-screen flex flex-col">
        <main id="main-content" className="flex-1">
          {/* Hero Section - Full Width */}
          <div className="breakout-full-width">
            <HeroSection />
          </div>
          
          {/* Welcome Section */}
          <div className="content-constrained">
            <WelcomeSection />
          </div>
          
          {/* Enhanced Booking Section - Lazy loaded to improve TTI */}
          <div className="content-constrained">
            <Suspense fallback={<BookingSectionSkeleton />}>
              <EnhancedBookingSection />
            </Suspense>
          </div>
          
          {/* Featured Properties - Deferred loading to improve initial page load */}
          <section 
            ref={propertiesSectionRef}
            className="section bg-gradient-to-br from-background via-accent/10 to-background full-width-section" 
            aria-labelledby="featured-properties-heading"
          >
            <div className="content-constrained">
              <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
                <span className="text-sm text-primary font-medium uppercase tracking-wider">
                  Featured Properties
                </span>
                <h2 id="featured-properties-heading" className="text-3xl md:text-4xl font-bold mt-2 mb-4">
                  Premium Real Estate
                </h2>
                <p className="text-muted-foreground">
                  Discover our curated selection of luxury properties and rental accommodations
                </p>
              </div>
              
              {(loading || !hasFetched) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(9)].map((_, index) => (
                    <div key={index} className="neumorphic-card p-6 rounded-3xl animate-pulse">
                      <div className="aspect-video bg-muted rounded-2xl mb-4"></div>
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : randomProperties.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No properties available at this time.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {randomProperties.map((property, index) => (
                    <div key={property.id} className="animate-fade-in" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
                       <PropertyCard 
                         property={property}
                       />
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-center mt-12">
                <Button asChild className="btn-primary group">
                  <Link to="/properties" className="text-white">
                    <Building2 className="mr-2 h-5 w-5" />
                    View All Properties 
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
          
          {/* Vendor CTA Section */}
          <section className="section bg-primary/5 full-width-section" aria-labelledby="vendor-cta-heading">
            <div className="content-constrained">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-center md:text-left">
                  <span className="text-sm text-primary font-medium uppercase tracking-wider">
                    For Service Providers
                  </span>
                  <h2 id="vendor-cta-heading" className="text-3xl md:text-4xl font-bold mt-2 mb-4">
                    Grow Your Business with Monarch
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Join our network of verified contractors and connect with property managers looking for your services. Free to join, quality leads guaranteed.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <Button asChild className="btn-primary">
                      <Link to="/join-as-vendor" className="text-white">
                        Join as a Vendor
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-2 border-primary bg-card text-foreground hover:bg-primary hover:text-white hover:border-primary font-medium">
                      <Link to="/services">
                        Our Services
                      </Link>
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="neumorphic-card p-6 text-center">
                    <div className="text-3xl font-bold text-primary">500+</div>
                    <div className="text-sm text-muted-foreground">Active Vendors</div>
                  </div>
                  <div className="neumorphic-card p-6 text-center">
                    <div className="text-3xl font-bold text-primary">$2M+</div>
                    <div className="text-sm text-muted-foreground">Jobs Completed</div>
                  </div>
                  <div className="neumorphic-card p-6 text-center">
                    <div className="text-3xl font-bold text-primary">4.8★</div>
                    <div className="text-sm text-muted-foreground">Avg Rating</div>
                  </div>
                  <div className="neumorphic-card p-6 text-center">
                    <div className="text-3xl font-bold text-primary">24h</div>
                    <div className="text-sm text-muted-foreground">Response Time</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials - Lazy loaded */}
          <div className="content-constrained">
            <Suspense fallback={<div className="py-16"><Skeleton className="h-64 w-full" /></div>}>
              <TestimonialsSection />
            </Suspense>
          </div>

          {/* Features - Lazy loaded */}
          <div className="content-constrained">
            <Suspense fallback={<div className="py-16"><Skeleton className="h-48 w-full" /></div>}>
              <FeaturesShowcase />
            </Suspense>
          </div>

          {/* CTA Section - Lazy loaded */}
          <div className="content-constrained">
            <Suspense fallback={<div className="py-16"><Skeleton className="h-32 w-full" /></div>}>
              <CTASection />
            </Suspense>
          </div>
        </main>
        <Footer />
      </div>
    </EnhancedSEOLayout>
    </>
  );
}