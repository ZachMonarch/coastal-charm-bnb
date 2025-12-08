import { ArrowRight, Calendar } from "lucide-react";
import BookingForm from "./BookingForm";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EnhancedBookingSection() {
  const { t } = useLanguage();

  return (
    <section className="relative py-24 bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-20 w-64 h-64 neumorphic-card rounded-3xl rotate-12 animate-morphic-float" />
        <div className="absolute bottom-20 left-20 w-48 h-48 glass-card rounded-full animate-pulse-glow" />
      </div>
      
      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="neumorphic-inset p-2 rounded-full">
                  <Calendar className="h-6 w-6 text-primary animate-pulse-glow" />
                </div>
                <span className="text-sm text-primary font-semibold uppercase tracking-wider">
                  {t.home.booking.subtitle}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {t.home.booking.title}
                </span>
              </h2>
            </div>
            
            <p className="text-muted-foreground text-lg leading-relaxed">
              {t.home.booking.description}
            </p>
            
            <div className="space-y-4">
              {t.home.booking.benefits.map((item, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="neumorphic-inset p-2 rounded-full">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
            
            {/* Enhanced stats */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              {[
                { value: "500+", label: "Properties Managed" },
                { value: "98%", label: "Client Satisfaction" }
              ].map((stat, index) => (
                <div key={index} className="neumorphic-card p-4 rounded-2xl text-center">
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="animate-fade-in [animation-delay:200ms]">
            <BookingForm />
          </div>
        </div>
      </div>
    </section>
  );
}