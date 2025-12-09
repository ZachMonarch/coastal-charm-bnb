import { MessageSquare, Target, TrendingUp, FileText, Users, Award, Calendar, CheckCircle, ArrowRight, Star, Clock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function Consultation() {
  const services = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Investment Analysis",
      description: "Comprehensive market analysis and ROI projections for potential investments.",
      color: "from-rose-500 to-rose-600"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Portfolio Optimization",
      description: "Strategic advice to maximize returns across your property portfolio.",
      color: "from-emerald-500 to-emerald-600"
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Legal Compliance",
      description: "Guidance on regulations, permits, and legal requirements for your properties.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Tenant Relations",
      description: "Best practices for tenant retention and satisfaction improvement.",
      color: "from-violet-500 to-violet-600"
    }
  ];

  const consultationTypes = [
    {
      title: "Initial Consultation",
      duration: "60 minutes",
      price: "Free",
      description: "Perfect for property owners looking to understand their options and develop a strategy.",
      features: ["Property assessment", "Market overview", "Q&A session", "Written summary"],
      color: "from-emerald-500 to-teal-500",
      popular: false
    },
    {
      title: "Portfolio Review",
      duration: "2-3 hours",
      price: "$299",
      description: "In-depth analysis of your entire property portfolio with actionable recommendations.",
      features: ["Full portfolio analysis", "ROI optimization", "Risk assessment", "Action plan", "Follow-up call"],
      color: "from-primary to-primary-dark",
      popular: true
    },
    {
      title: "Market Analysis",
      duration: "Custom",
      price: "Custom",
      description: "Detailed market research and competitive analysis for specific properties or areas.",
      features: ["Area demographics", "Competitor analysis", "Pricing strategy", "Investment forecast", "Detailed report"],
      color: "from-violet-500 to-purple-600",
      popular: false
    }
  ];

  const stats = [
    { value: "20+", label: "Years Experience" },
    { value: "500+", label: "Properties Analyzed" },
    { value: "98%", label: "Client Satisfaction" },
    { value: "$100M+", label: "Investment Guided" }
  ];

  const testimonials = [
    {
      quote: "The portfolio review completely changed how I manage my properties. ROI increased by 23% in the first year.",
      author: "Michael R.",
      role: "Property Investor",
      rating: 5
    },
    {
      quote: "Their market analysis was incredibly thorough. It helped me make a confident decision on my first investment.",
      author: "Sarah L.",
      role: "First-time Investor",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Property Consultation Services - Expert Property Advice"
        description="Professional property consultation services including investment analysis, portfolio optimization, legal compliance guidance, and market analysis. Get expert advice from Monarch Property Management."
        keywords={["property consultation", "investment analysis", "portfolio optimization", "real estate advice", "market analysis"]}
        type="website"
      />

      {/* Hero Section with Background Image */}
      <section className="relative py-24 overflow-hidden min-h-[50vh] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=1600&h=800&fit=crop"
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-background" />
        </div>
        
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumbs */}
          <div className="mb-8">
            <Breadcrumbs />
          </div>

          <div className="max-w-4xl mx-auto text-center">
            {/* Icon with Glow */}
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-violet-500/30 rounded-full blur-xl animate-pulse" />
              <div className="relative p-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-2xl">
                <MessageSquare className="h-16 w-16 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-700">
              Property Consultation Services
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700 drop-shadow-md" style={{ animationDelay: '100ms' }}>
              Expert guidance to help you make informed decisions and maximize your property investments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-5 duration-700" style={{ animationDelay: '200ms' }}>
              <Button asChild size="lg" className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-purple-600 hover:to-violet-500 text-lg px-8 py-6 shadow-lg">
                <Link to="/contact">Book Consultation</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-2">
                <Link to="/services">All Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-gradient-to-r from-violet-500/10 via-primary/5 to-violet-500/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center animate-in fade-in slide-in-from-bottom-5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Consultation Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tailored advice for every stage of your property investment journey
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card 
                key={index} 
                className="group relative overflow-hidden border-2 hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${service.color}`} />
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-4 text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    {service.icon}
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{service.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Consultation Packages */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-muted/50" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Consultation Packages</h2>
            <p className="text-lg text-muted-foreground">Choose the package that fits your needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {consultationTypes.map((pkg, index) => (
              <Card 
                key={index} 
                className={`relative overflow-hidden ${pkg.popular ? 'border-2 border-primary shadow-xl scale-105' : 'border-2'} transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-5`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {pkg.popular && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className={`h-2 bg-gradient-to-r ${pkg.color}`} />
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">{pkg.title}</CardTitle>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{pkg.duration}</span>
                  </div>
                  <div className="text-4xl font-bold text-primary mt-4">{pkg.price}</div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center mb-6">{pkg.description}</p>
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    asChild 
                    className={`w-full ${pkg.popular ? 'bg-gradient-to-r from-primary to-primary-dark' : ''}`}
                    variant={pkg.popular ? 'default' : 'outline'}
                  >
                    <Link to="/contact">Book Now</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Award className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Clients Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-l-4 border-primary animate-in fade-in slide-in-from-bottom-5" style={{ animationDelay: `${index * 100}ms` }}>
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-lg italic mb-4">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Related Services */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Explore Related Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Link 
              to="/services/property-management"
              className="group p-6 rounded-xl bg-card border-2 border-border hover:border-primary/50 shadow-md hover:shadow-lg transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Property Management</h3>
                  <p className="text-sm text-muted-foreground">Full-service property care</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
            <Link 
              to="/services/maintenance"
              className="group p-6 rounded-xl bg-card border-2 border-border hover:border-primary/50 shadow-md hover:shadow-lg transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Maintenance Services</h3>
                  <p className="text-sm text-muted-foreground">24/7 repair and upkeep</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-primary/10 to-violet-500/10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <Calendar className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Expert Advice?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Schedule a consultation today and discover how we can help you achieve your property investment goals.
          </p>
          <Button asChild size="lg" className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-purple-600 hover:to-violet-500 text-lg px-10 py-6 shadow-xl">
            <Link to="/contact">Schedule Consultation</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
