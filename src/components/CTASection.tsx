import { Building, ArrowRight, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function CTASection() {
  return (
    <section className="relative py-32 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 neumorphic-card rounded-full animate-morphic-float" />
        <div className="absolute bottom-10 right-10 w-48 h-48 glass-card rounded-3xl rotate-12 animate-pulse-glow" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 tech-glow rounded-full opacity-30" />
      </div>
      
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="neumorphic-card p-12 rounded-3xl space-y-8">
            <div className="flex items-center justify-center mb-6">
              <div className="neumorphic-inset p-4 rounded-full mr-4">
                <Building className="h-10 w-10 text-primary animate-pulse-glow" />
              </div>
              <span className="text-sm text-primary font-semibold uppercase tracking-wider">
                Ready to Get Started?
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Experience Premium Property Management
              </span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Join thousands of satisfied property owners who trust Monarch Property Management 
              for their real estate needs. Professional, reliable, and results-driven.
            </p>
            
            {/* Enhanced contact options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
              <div className="glass-card p-6 rounded-2xl text-center">
                <Phone className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Call Us</p>
                <p className="font-semibold">+1 (304) 365-8349</p>
              </div>
              <div className="glass-card p-6 rounded-2xl text-center">
                <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Email Us</p>
                <p className="font-semibold">info@monarchpropertymmgt.com</p>
              </div>
              <div className="glass-card p-6 rounded-2xl text-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Visit Us</p>
                <p className="font-semibold">West Virginia, USA</p>
              </div>
            </div>
            
            {/* Enhanced CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button asChild size="lg" className="btn-primary tech-glow min-w-[200px]">
                <Link to="/contact" className="text-white">
                  <Building className="mr-2 h-5 w-5" />
                  Start Your Journey
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[200px] neumorphic-card hover:neumorphic-inset border-2 border-primary">
                <Link to="/properties" className="text-foreground">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  View Properties
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}