import { Wrench, Clock, Shield, CheckCircle, Phone, Zap, ArrowRight, Building2, Users, AlertTriangle, Star, Sparkles, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function Maintenance() {
  const services = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Emergency Repairs",
      description: "24/7 emergency response for urgent plumbing, electrical, and HVAC issues.",
      colorClass: "from-feature-danger to-feature-danger-dark"
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Preventive Maintenance",
      description: "Scheduled inspections and maintenance to prevent costly repairs.",
      colorClass: "from-feature-info to-feature-info-dark"
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Routine Upkeep",
      description: "Regular cleaning, landscaping, and property maintenance services.",
      colorClass: "from-feature-success to-feature-success-dark"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Quality Assurance",
      description: "All work performed by licensed, insured, and vetted professionals.",
      colorClass: "from-feature-violet to-feature-violet-dark"
    }
  ];

  const maintenanceTypes = [
    {
      title: "Plumbing",
      items: ["Leak repairs", "Drain cleaning", "Fixture replacement", "Water heater service"],
      icon: "💧",
      colorClass: "from-feature-cyan to-feature-info"
    },
    {
      title: "Electrical",
      items: ["Outlet repairs", "Lighting installation", "Circuit breaker service", "Safety inspections"],
      icon: "⚡",
      colorClass: "from-feature-warning to-feature-warning-dark"
    },
    {
      title: "HVAC",
      items: ["AC repair & service", "Heating system maintenance", "Filter replacement", "Duct cleaning"],
      icon: "❄️",
      colorClass: "from-feature-sky to-feature-cyan"
    },
    {
      title: "General",
      items: ["Painting & drywall", "Flooring repairs", "Door & window service", "Appliance repair"],
      icon: "🔧",
      colorClass: "from-feature-success to-feature-teal"
    }
  ];

  const processSteps = [
    {
      step: 1,
      title: "Report Issue",
      description: "Submit maintenance request online or call us",
      icon: <Phone className="h-6 w-6" />,
      colorClass: "from-feature-warning to-feature-warning-dark"
    },
    {
      step: 2,
      title: "Quick Response",
      description: "We assess and assign the right professional",
      icon: <Zap className="h-6 w-6" />,
      colorClass: "from-feature-danger to-feature-rose"
    },
    {
      step: 3,
      title: "Expert Repair",
      description: "Licensed technician completes the work",
      icon: <Wrench className="h-6 w-6" />,
      colorClass: "from-feature-rose to-feature-rose-dark"
    },
    {
      step: 4,
      title: "Quality Check",
      description: "We verify the work meets our standards",
      icon: <ThumbsUp className="h-6 w-6" />,
      colorClass: "from-feature-success to-feature-teal"
    }
  ];

  const guarantees = [
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Response Time",
      description: "30 min for emergencies"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Licensed & Insured",
      description: "All technicians verified"
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Satisfaction",
      description: "100% work guarantee"
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Transparent Pricing",
      description: "No hidden fees"
    }
  ];

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Property Maintenance Services - Repair and Upkeep Services"
        description="Professional property maintenance services including 24/7 emergency repairs, preventive maintenance, and routine upkeep. Trusted vendors and quality assurance guaranteed."
        keywords={["property maintenance", "emergency repairs", "preventive maintenance", "HVAC service", "plumbing repairs"]}
        type="website"
      />

      {/* Hero Section with Background Image */}
      <section className="relative py-24 overflow-hidden min-h-[50vh] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&h=800&fit=crop"
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-background" />
        </div>
        
        {/* Animated Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-success/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

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
                <Wrench className="h-16 w-16 text-primary-foreground" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-overlay-foreground drop-shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-700">
              Property Maintenance Services
            </h1>
            <p className="text-xl md:text-2xl text-overlay-muted mb-10 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700 drop-shadow-md" style={{ animationDelay: '100ms' }}>
              Keep your property in top condition with our comprehensive maintenance and repair services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-5 duration-700" style={{ animationDelay: '200ms' }}>
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-lg px-8 py-6 shadow-lg">
                <Link to="/contact">Request Service</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-2 bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20">
                <a href="tel:+13043658349" className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Emergency: (304) 365-8349
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantees Bar */}
      <section className="py-8 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {guarantees.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 justify-center animate-in fade-in slide-in-from-bottom-5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Maintenance Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From emergency repairs to routine upkeep, we've got you covered
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${service.colorClass}`} />
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.colorClass} flex items-center justify-center mb-4 text-overlay-foreground shadow-lg group-hover:scale-110 transition-transform`}>
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

      {/* What We Fix - Colorful Grid */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-muted/50" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What We Fix</h2>
            <p className="text-lg text-muted-foreground">Comprehensive repairs across all property systems</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {maintenanceTypes.map((type, index) => (
              <Card
                key={index}
                className="overflow-hidden animate-in fade-in slide-in-from-bottom-5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`h-16 bg-gradient-to-r ${type.colorClass} flex items-center justify-center`}>
                  <span className="text-3xl">{type.icon}</span>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {type.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Simple, fast, and reliable service</p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {/* Connecting Line */}
              <div
                className="hidden md:block absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-feature-warning via-feature-danger to-feature-success"
                style={{ marginLeft: '12%', marginRight: '12%' }}
              />
              
              {processSteps.map((step, index) => (
                <div
                  key={index}
                  className="text-center relative animate-in fade-in slide-in-from-bottom-5"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="relative inline-block mb-4">
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${step.colorClass} flex items-center justify-center mx-auto shadow-xl`}>
                      <div className="text-overlay-foreground">{step.icon}</div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-sm font-bold text-primary">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
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
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-feature-info to-feature-info-dark flex items-center justify-center text-overlay-foreground">
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/10 to-success/10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <Wrench className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Need Maintenance or Repairs?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Our team is available 24/7 for emergency repairs. For routine maintenance, submit a request online.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-lg px-10 py-6 shadow-xl">
              <Link to="/contact">Submit Request</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-10 py-6 border-2">
              <a href="tel:+13043658349" className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Call for Emergency
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
