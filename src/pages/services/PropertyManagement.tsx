import { Building2, CheckCircle, Shield, TrendingUp, Users, Clock, Star, Award, BarChart3, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function PropertyManagement() {
  const features = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Tenant Screening",
      description: "Comprehensive background checks and credit verification to ensure quality tenants.",
      colorClass: "from-feature-info to-feature-info-dark"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Rent Collection",
      description: "Automated rent collection and financial reporting for hassle-free income.",
      colorClass: "from-feature-success to-feature-success-dark"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Property Inspections",
      description: "Regular property inspections to maintain value and identify issues early.",
      colorClass: "from-feature-accent to-feature-accent-dark"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "24/7 Maintenance",
      description: "Round-the-clock maintenance coordination and emergency response.",
      colorClass: "from-feature-warning to-feature-warning-dark"
    }
  ];

  const benefits = [
    "Maximize rental income with competitive pricing strategies",
    "Reduce vacancy periods through effective marketing",
    "Handle all tenant communications and legal compliance",
    "Coordinate repairs and maintenance with trusted vendors",
    "Provide detailed financial reporting and tax documentation",
    "Ensure regulatory compliance and risk management"
  ];

  const stats = [
    { value: "500+", label: "Properties Managed", icon: <Building2 className="h-6 w-6" /> },
    { value: "98%", label: "Tenant Satisfaction", icon: <Star className="h-6 w-6" /> },
    { value: "15+", label: "Years Experience", icon: <Award className="h-6 w-6" /> },
    { value: "$50M+", label: "Assets Managed", icon: <BarChart3 className="h-6 w-6" /> }
  ];

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Property Management Services - Full-Service Property Care"
        description="Professional property management services including tenant screening, rent collection, maintenance coordination, and financial reporting. Maximize your investment with Monarch Property Management."
        keywords={["property management", "tenant screening", "rent collection", "property maintenance", "investment property"]}
        type="website"
      />

      {/* Hero Section with Background Image */}
      <section className="relative py-24 overflow-hidden min-h-[50vh] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&h=800&fit=crop"
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-background" />
        </div>
        
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-5" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
        }} />

        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <div className="mb-8">
            <Breadcrumbs />
          </div>

          <div className="max-w-4xl mx-auto text-center">
            {/* Icon with Glow */}
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
              <div className="relative p-6 rounded-full bg-gradient-to-br from-primary to-primary-dark shadow-2xl">
                <Building2 className="h-16 w-16 text-primary-foreground" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-overlay-foreground drop-shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-700">
              Property Management Services
            </h1>
            <p className="text-xl md:text-2xl text-overlay-muted mb-10 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700 drop-shadow-md" style={{ animationDelay: '100ms' }}>
              Full-service property management designed to maximize your investment while minimizing your stress.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-5 duration-700" style={{ animationDelay: '200ms' }}>
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-lg px-8 py-6 shadow-lg hover:shadow-primary/30 transition-all">
                <Link to="/contact">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-2 hover:bg-primary/5">
                <Link to="/properties">View Properties</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="text-center p-6 rounded-2xl bg-card/80 backdrop-blur border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-foreground/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Colorful Cards */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services Include</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive property management solutions tailored to your needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient Top Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.colorClass}`} />
                
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.colorClass} flex items-center justify-center mb-4 text-overlay-foreground shadow-lg group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section with Gradient Background */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-muted/50" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Our Management Services?</h2>
              <p className="text-lg text-muted-foreground">
                We handle every aspect of property management so you can focus on what matters
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-4 p-5 rounded-xl bg-card border-l-4 border-primary shadow-md hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-left-5"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <p className="text-foreground font-medium">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related Services Navigation */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Explore Related Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Link 
              to="/services/maintenance"
              className="group p-6 rounded-xl bg-card border-2 border-border hover:border-primary/50 shadow-md hover:shadow-lg transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-feature-warning to-feature-warning-dark flex items-center justify-center text-overlay-foreground">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Maintenance Services</h3>
                  <p className="text-sm text-muted-foreground">24/7 repair and upkeep</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
            <Link 
              to="/services/consultation"
              className="group p-6 rounded-xl bg-card border-2 border-border hover:border-primary/50 shadow-md hover:shadow-lg transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-feature-violet to-feature-violet-dark flex items-center justify-center text-overlay-foreground">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Consultation Services</h3>
                  <p className="text-sm text-muted-foreground">Expert property advice</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Maximize Your Property Investment?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Let our experienced team handle the day-to-day management while you enjoy the returns.
          </p>
          <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-lg px-10 py-6 shadow-xl hover:shadow-primary/40 transition-all">
            <Link to="/contact">Schedule a Consultation</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
