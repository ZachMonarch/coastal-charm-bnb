import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wrench, Zap, Paintbrush, TreeDeciduous, ShieldCheck, Building2, 
  Truck, Sparkles, CheckCircle2, ArrowRight, Star, Users, 
  DollarSign, Clock, TrendingUp, Award
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import VendorQuickSignup from "@/components/vendor/VendorQuickSignup";

const SERVICE_CATEGORIES = [
  { icon: Wrench, name: "Plumbing", count: "120+ jobs/mo" },
  { icon: Zap, name: "Electrical", count: "95+ jobs/mo" },
  { icon: Paintbrush, name: "Painting", count: "80+ jobs/mo" },
  { icon: TreeDeciduous, name: "Landscaping", count: "70+ jobs/mo" },
  { icon: Building2, name: "General Contracting", count: "60+ jobs/mo" },
  { icon: ShieldCheck, name: "Security Systems", count: "45+ jobs/mo" },
  { icon: Truck, name: "Moving Services", count: "55+ jobs/mo" },
  { icon: Sparkles, name: "Cleaning Services", count: "150+ jobs/mo" },
];

const BENEFITS = [
  {
    icon: DollarSign,
    title: "Free to Join",
    description: "No signup fees, no monthly charges to get started. Pay only when you win jobs."
  },
  {
    icon: Users,
    title: "Quality Leads",
    description: "Get matched with property managers actively looking for your services."
  },
  {
    icon: Clock,
    title: "Instant Notifications",
    description: "Receive real-time alerts when new projects match your skills and location."
  },
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    description: "Build your reputation with reviews and unlock premium opportunities."
  },
];

const STATS = [
  { value: "500+", label: "Active Vendors" },
  { value: "$2M+", label: "Jobs Completed" },
  { value: "4.8★", label: "Average Rating" },
  { value: "24hr", label: "Avg Response Time" },
];

const TESTIMONIALS = [
  {
    name: "Mike's Plumbing Co.",
    quote: "Joined last month and already landed 8 commercial contracts. The lead quality is excellent.",
    rating: 5,
    category: "Plumbing"
  },
  {
    name: "Green Thumb Landscaping",
    quote: "Property managers reach out directly. No more chasing leads - they come to us!",
    rating: 5,
    category: "Landscaping"
  },
  {
    name: "Elite Electric Services",
    quote: "The instant notifications mean I'm always first to respond. Game changer for my business.",
    rating: 5,
    category: "Electrical"
  },
];

export default function JoinAsVendor() {
  const navigate = useNavigate();
  const [showSignup, setShowSignup] = useState(false);

  return (
    <>
      <Helmet>
        <title>Join as a Vendor | Monarch Property Management</title>
        <meta name="description" content="Join Monarch's network of trusted service providers. Get quality leads, grow your business, and connect with property managers looking for your services." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section - Phase 2 & 3 Enhanced */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
          
          <div className="container relative z-10 mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="mb-6 px-4 py-2 shadow-md">
                <Star className="w-4 h-4 mr-2 fill-primary text-primary" />
                Join 500+ Trusted Service Providers
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-6 leading-tight">
                Grow Your Business with{" "}
                <span className="text-primary">Quality Leads</span>
              </h1>
              
              <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
                Connect with property managers actively looking for reliable contractors. 
                Free to join, no monthly fees — pay only when you win jobs.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 shadow-lg shadow-primary/20 hover:shadow-primary/40"
                  onClick={() => setShowSignup(true)}
                >
                  Start Getting Jobs Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 border-primary/40 hover:border-primary hover:bg-primary/10"
                  onClick={() => navigate('/request-quote')}
                >
                  Request a Quote
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="py-8 bg-card border-y border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {STATS.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                Why Join Monarch?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to grow your service business in one platform
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {BENEFITS.map((benefit, i) => (
                <Card key={i} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <benefit.icon className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {benefit.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Service Categories */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                Services in High Demand
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Property managers are actively looking for these services
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SERVICE_CATEGORIES.map((category, i) => (
                <Card 
                  key={i} 
                  className="cursor-pointer hover:border-primary transition-colors group"
                  onClick={() => setShowSignup(true)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <category.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.count}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                Get Started in 3 Easy Steps
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Create Your Profile", desc: "Sign up for free in under 2 minutes. Add your services and service areas." },
                { step: "2", title: "Get Matched", desc: "Our system matches you with property managers looking for your expertise." },
                { step: "3", title: "Win Jobs & Grow", desc: "Submit quotes, win contracts, and build your reputation with reviews." },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                What Our Vendors Say
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {TESTIMONIALS.map((testimonial, i) => (
                <Card key={i} className="bg-card">
                  <CardContent className="pt-6">
                    <div className="flex mb-3">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <Star key={j} className="w-5 h-5 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{testimonial.name}</span>
                      <Badge variant="secondary">{testimonial.category}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Phase 2 & 3 Enhanced */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <Award className="w-16 h-16 mx-auto mb-6 text-primary-foreground" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-primary-foreground">
              Ready to Grow Your Business?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Join hundreds of successful contractors who've grown their business with Monarch.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl"
              onClick={() => setShowSignup(true)}
            >
              Join Now — It's Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-12 bg-card border-t border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-8">
              {[
                { icon: ShieldCheck, text: "Verified Vendors" },
                { icon: CheckCircle2, text: "Secure Payments" },
                { icon: Award, text: "Quality Guaranteed" },
                { icon: Users, text: "24/7 Support" },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <badge.icon className="h-5 w-5 text-primary" />
                  <span className="font-medium">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Signup Modal */}
        <VendorQuickSignup 
          open={showSignup} 
          onOpenChange={setShowSignup} 
        />
      </div>
    </>
  );
}
