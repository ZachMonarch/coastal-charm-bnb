import { TrendingUp, Zap, Users, Wrench, Calculator, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FeaturesShowcase() {
  const { t } = useLanguage();

  const features = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: t.home.amenities.features.beachfront.title,
      description: t.home.amenities.features.beachfront.description
    },
    {
      icon: <Wrench className="h-8 w-8 text-primary" />,
      title: t.home.amenities.features.pools.title,
      description: t.home.amenities.features.pools.description
    },
    {
      icon: <Calculator className="h-8 w-8 text-primary" />,
      title: t.home.amenities.features.restaurant.title,
      description: t.home.amenities.features.restaurant.description
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: t.home.amenities.features.wifi.title,
      description: t.home.amenities.features.wifi.description
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: t.home.amenities.features.bar.title,
      description: t.home.amenities.features.bar.description
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: t.home.amenities.features.location.title,
      description: t.home.amenities.features.location.description
    }
  ];

  return (
    <section className="section bg-gradient-to-br from-muted/20 via-background to-muted/20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 neumorphic-card rounded-full animate-morphic-float" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 glass-card rounded-3xl rotate-45 animate-pulse-glow" />
      </div>
      
      <div className="container relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-16 animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <div className="neumorphic-inset p-4 rounded-full mr-4">
              <Zap className="h-8 w-8 text-primary animate-pulse-glow" />
            </div>
            <span className="text-sm text-primary font-semibold uppercase tracking-wider">
              {t.home.amenities.subtitle}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {t.home.amenities.title}
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">
            {t.home.amenities.description}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="neumorphic-card p-8 rounded-3xl animate-fade-in floating-card text-center group"
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <div className="neumorphic-inset p-6 rounded-full w-fit mx-auto mb-6 group-hover:neumorphic-card transition-all duration-300">
                <div className="relative">
                  {feature.icon}
                  <div className="absolute inset-0 bg-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
        
        {/* Enhanced call to action */}
        <div className="text-center mt-16">
          <Button asChild className="btn-primary tech-glow">
            <Link to="/amenities">
              <TrendingUp className="mr-2 h-5 w-5" />
              Explore All Features
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}