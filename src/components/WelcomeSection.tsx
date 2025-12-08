import { ArrowRight, TrendingUp, Shield, Clock, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import LazyImage from "./LazyImage";
import { useLanguage } from "@/contexts/LanguageContext";
import teamMeeting from "@/assets/team-meeting.jpg";

export default function WelcomeSection() {
  const { t } = useLanguage();

  return (
    <section className="section bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="relative">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-64 h-64 neumorphic-card rounded-full animate-morphic-float" />
        <div className="absolute bottom-10 right-10 w-48 h-48 glass-card rounded-3xl rotate-12 animate-pulse-glow" />
      </div>
      
      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in [animation-delay:100ms] space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="neumorphic-inset p-2 rounded-full">
                  <Sparkles className="h-6 w-6 text-primary animate-pulse-glow" />
                </div>
                <span className="text-sm text-primary font-semibold uppercase tracking-wider">
                  {t.home.welcome.subtitle}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {t.home.welcome.title}
                </span>
              </h2>
            </div>
            
            <div className="space-y-6">
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t.home.welcome.description1}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t.home.welcome.description2}
              </p>
            </div>
            
            {/* Enhanced feature highlights */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: TrendingUp, text: "Advanced Analytics" },
                { icon: Shield, text: "Secure Platform" },
                { icon: Clock, text: "24/7 Support" },
                { icon: Users, text: "Expert Team" }
              ].map((feature, index) => (
                <div key={index} className="neumorphic-card p-4 rounded-2xl flex items-center space-x-3 group hover:neumorphic-inset transition-all duration-300">
                  <div className="neumorphic-inset p-2 rounded-full">
                    <feature.icon className="h-5 w-5 text-primary group-hover:animate-pulse" />
                  </div>
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
            
            <Button asChild className="btn-primary tech-glow group">
              <Link to="/contact">
                <ArrowRight className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                {t.home.welcome.learnMore}
              </Link>
            </Button>
          </div>
          
          {/* Enhanced image gallery */}
          <div className="relative animate-fade-in [animation-delay:300ms]">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="neumorphic-card rounded-3xl overflow-hidden floating-card">
                  <LazyImage 
                    src={teamMeeting}
                    alt="Professional property management team" 
                    className="w-full h-64 object-cover fast-refresh"
                  />
                </div>
                <div className="neumorphic-card rounded-3xl overflow-hidden floating-card">
                  <LazyImage 
                    src="https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=400&h=300&fit=crop"
                    alt="Professional team" 
                    className="w-full h-48 object-cover fast-refresh"
                  />
                </div>
              </div>
              <div className="space-y-6 mt-12">
                <div className="neumorphic-card rounded-3xl overflow-hidden floating-card">
                  <LazyImage 
                    src="https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&h=400&fit=crop"
                    alt="Luxury apartments" 
                    className="w-full h-56 object-cover fast-refresh"
                  />
                </div>
                <div className="neumorphic-card rounded-3xl overflow-hidden floating-card">
                  <LazyImage 
                    src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=400&fit=crop"
                    alt="Premium interiors" 
                    className="w-full h-48 object-cover fast-refresh"
                  />
                </div>
              </div>
            </div>
            
            {/* Tech accent overlay */}
            <div className="absolute -top-6 -right-6 w-24 h-24 opacity-20">
              <div className="tech-glow w-full h-full rounded-full animate-pulse-glow" />
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}