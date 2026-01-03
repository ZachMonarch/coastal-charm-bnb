import { Wrench, Building2, Shield, Zap, Users, CheckCircle, ArrowRight, Clock, Award, Phone, Star, Headphones, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";

const services = [
  {
    icon: Building2,
    title: "Premium Property Management",
    description: "Full-service property management with AI-powered analytics and dedicated account managers for maximum ROI.",
    features: ["AI-Powered Analytics", "Dedicated Account Manager", "Premium Tenant Screening", "Real-time Financial Reporting"],
    price: "Starting at $199/month",
    popular: true
  },
  {
    icon: Wrench,
    title: "24/7 Maintenance Services",
    description: "Round-the-clock maintenance with certified professionals and 2-hour emergency response guarantee.",
    features: ["2-Hour Emergency Response", "Certified Technicians", "Preventive Maintenance", "IoT Monitoring"],
    price: "Starting at $89/month",
    popular: false
  },
  {
    icon: Shield,
    title: "Advanced Security Solutions",
    description: "Military-grade security systems with AI surveillance and instant threat detection capabilities.",
    features: ["AI Surveillance", "Instant Threat Detection", "Mobile Security App", "24/7 Monitoring"],
    price: "Starting at $149/month",
    popular: false
  },
  {
    icon: Zap,
    title: "Smart Home Technology",
    description: "Cutting-edge IoT integration with voice control, energy optimization, and predictive automation.",
    features: ["Voice Control Integration", "Energy Optimization", "Predictive Automation", "Smart Analytics"],
    price: "Starting at $299/month",
    popular: true
  },
  {
    icon: Users,
    title: "Concierge Tenant Services",
    description: "White-glove tenant experience with personal concierge, community management, and lifestyle services.",
    features: ["Personal Concierge", "Community Events", "Lifestyle Services", "VIP Support"],
    price: "Starting at $99/month",
    popular: false
  },
  {
    icon: TrendingUp,
    title: "Investment Advisory",
    description: "Professional real estate investment guidance with market analysis and portfolio optimization.",
    features: ["Market Analysis", "Portfolio Optimization", "Investment Strategy", "Performance Tracking"],
    price: "Custom Pricing",
    popular: true
  }
];

const stats = [
  { icon: Award, value: "15+", label: "Years Experience" },
  { icon: Users, value: "500+", label: "Happy Clients" },
  { icon: Building2, value: "1,200+", label: "Properties Managed" },
  { icon: Star, value: "4.9", label: "Average Rating" }
];

export default function Services() {
  return (
    <div className="min-h-screen w-full">
      <SEOHead
        title="Premium Property Management Services"
        description="Comprehensive property management solutions including 24/7 maintenance, AI-powered analytics, smart home technology, and concierge services. Starting at $89/month."
        keywords={["property management services", "24/7 maintenance", "smart home technology", "security solutions", "tenant services", "property investment"]}
        type="website"
        url="https://monarch-properties.com/services"
      />
      {/* Hero Section with Background - Full Width - Phase 2 Enhanced */}
      <div className="relative h-[50vh] overflow-hidden w-full breakout-full-width">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&h=1080&fit=crop')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/75 to-black/85" />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center max-w-4xl px-6">
            <span className="text-sm font-medium uppercase tracking-wider mb-4 block text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] [text-shadow:_0_2px_8px_rgb(0_0_0_/_80%)]">
              Professional Services
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] [text-shadow:_0_4px_16px_rgb(0_0_0_/_90%)]">
              Premium Property Services
            </h1>
            <p className="text-xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] max-w-3xl mx-auto leading-relaxed font-medium [text-shadow:_0_2px_8px_rgb(0_0_0_/_80%)]">
              Comprehensive property management solutions powered by cutting-edge technology and delivered by industry experts to maximize your property's potential.
            </p>
          </div>
        </div>
      </div>

      <main className="p-6 w-full">
        <div className="content-constrained">

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="neumorphic-card text-center p-6 animate-fade-in brand-gold-accent border-l-4" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="mx-auto brand-gold-bg p-3 rounded-xl w-fit mb-3">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-foreground/70">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {services.map((service, index) => (
              <Card 
                key={index} 
                id={service.title.toLowerCase().replace(/\s+/g, '-')} 
                className={`neumorphic-card floating-card group h-full animate-fade-in brand-gold-accent ${service.popular ? 'border-primary/50 ring-2 ring-primary/30' : 'border-primary/20'}`} 
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="text-center relative">
                  {service.popular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}
                  <div className="mx-auto brand-gold-bg p-4 rounded-2xl w-fit mb-4 group-hover:animate-pulse transition-all duration-300">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{service.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{service.description}</CardDescription>
                  <div className="text-primary font-semibold text-lg mt-2">{service.price}</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm group-hover:text-foreground transition-colors">
                        <CheckCircle className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6 group-hover:shadow-lg transition-all" variant="outline">
                    Contact Us
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Why Choose Us Section */}
          <div className="neumorphic-card p-12 rounded-3xl mb-16 animate-fade-in border-primary/20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose Monarch Property?</h2>
              <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                We combine cutting-edge technology with personalized service to deliver exceptional property management solutions that exceed expectations.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="neumorphic-inset p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:animate-pulse transition-all">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Trusted & Secure</h3>
                <p className="text-muted-foreground text-sm">Licensed, insured professionals with military-grade security protocols and comprehensive background checks.</p>
              </div>
              
              <div className="text-center group">
                <div className="neumorphic-inset p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:animate-pulse transition-all">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
                <p className="text-muted-foreground text-sm">24/7 emergency support with guaranteed 2-hour response time for urgent issues and real-time updates.</p>
              </div>
              
              <div className="text-center group">
                <div className="neumorphic-inset p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:animate-pulse transition-all">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Award Winning</h3>
                <p className="text-muted-foreground text-sm">Industry-recognized experts with 15+ years experience and certified property management professionals.</p>
              </div>
              
              <div className="text-center group">
                <div className="neumorphic-inset p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:animate-pulse transition-all">
                  <Headphones className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Premium Support</h3>
                <p className="text-muted-foreground text-sm">Dedicated support team with multilingual assistance and personalized service tailored to your needs.</p>
              </div>
            </div>
            
            {/* Customer Satisfaction */}
            <div className="mt-12 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-primary fill-current" />
                  ))}
                </div>
                <span className="text-lg font-semibold">4.9/5</span>
              </div>
              <p className="text-muted-foreground">Based on 500+ customer reviews</p>
              <div className="mt-4">
                <Progress value={98} className="h-2 w-64 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">98% Customer Satisfaction Rate</p>
              </div>
            </div>
          </div>

          {/* Become a Vendor CTA */}
          <div className="neumorphic-card p-12 rounded-3xl mb-16 animate-fade-in border-info/20 bg-gradient-to-br from-info/5 to-transparent">
            <div className="text-center">
              <Users className="h-12 w-12 text-info mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4 text-foreground">Become a Vendor</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                Join our network of verified vendors and contractors. Connect with property managers and grow your business with Monarch Property Management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/join-as-vendor">
                  <Button size="lg" className="text-lg px-8 py-3 group shadow-lg shadow-info/20 hover:shadow-info/40 bg-info hover:bg-info/90 text-info-foreground">
                    Join as a Vendor
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/request-quote">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-3 border-info/40 hover:border-info hover:bg-info/10">
                    Request a Quote
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* CTA Section - Phase 2 & 3 Enhanced */}
          <div className="text-center neumorphic-card p-12 rounded-3xl animate-fade-in border-primary/20">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Get Started?</h2>
            <p className="text-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              Let us help you manage your properties more efficiently. Contact us today for a consultation and discover how we can maximize your property's potential.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="text-lg px-8 py-3 group shadow-lg shadow-primary/20 hover:shadow-primary/40">
                  Get Free Consultation
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/properties">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3 border-primary/40 hover:border-primary hover:bg-primary/10">
                  View Properties
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}