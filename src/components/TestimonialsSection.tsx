import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface Testimonial {
  id: number;
  name: string;
  location: string;
  avatar: string;
  content: string;
  rating: number;
  role: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sophia Martinez",
    location: "New York, USA",
    role: "Property Owner",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=88&h=88&fit=crop&crop=faces&fm=webp&q=75",
    content: "Monarch Property Management transformed our investment portfolio. Their professional approach and cutting-edge technology made property management effortless. Outstanding results!",
    rating: 5
  },
  {
    id: 2,
    name: "Marco Rossi",
    location: "Rome, Italy",
    role: "Business Executive",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=88&h=88&fit=crop&crop=faces&fm=webp&q=75",
    content: "The level of service and attention to detail is exceptional. From tenant screening to maintenance coordination, everything runs seamlessly. Highly recommend their services!",
    rating: 5
  },
  {
    id: 3,
    name: "Emma Johnson",
    location: "London, UK",
    role: "Real Estate Investor",
    avatar: "https://images.unsplash.com/photo-1569913486515-b74bf7751574?w=88&h=88&fit=crop&crop=faces&fm=webp&q=75",
    content: "Their innovative platform and dedicated team have maximized our rental income while minimizing the hassle. The reporting and analytics are incredibly detailed and helpful.",
    rating: 4
  },
];

export default function TestimonialsSection() {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const nextTestimonial = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };
  
  const prevTestimonial = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };
  
  useEffect(() => {
    const interval = setInterval(nextTestimonial, 8000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <section className="section bg-gradient-to-br from-background via-muted/30 to-background py-24 relative overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 neumorphic-card rounded-full animate-morphic-float" />
        <div className="absolute bottom-20 right-20 w-48 h-48 glass-card rounded-3xl rotate-45 animate-pulse-glow" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 tech-glow rounded-2xl animate-morphic-float" />
      </div>
      
      <div className="container relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-16 animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <div className="neumorphic-inset p-4 rounded-full mr-4">
              <Quote className="h-8 w-8 text-primary animate-pulse-glow" />
            </div>
            <span className="text-sm text-primary font-semibold uppercase tracking-wider">
              Client Success Stories
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              {t.testimonials.title}
            </span>
          </h2>
          <p className="text-muted-foreground text-lg">
            {t.testimonials.description}
          </p>
        </div>
        
        <div className="relative max-w-6xl mx-auto">
          <div className="relative h-[500px] md:h-[400px]">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={cn(
                  "absolute inset-0 transition-all duration-700 ease-in-out",
                  activeIndex === index 
                    ? "opacity-100 translate-x-0 z-10 scale-100"
                    : index < activeIndex 
                      ? "opacity-0 -translate-x-full z-0 scale-95" 
                      : "opacity-0 translate-x-full z-0 scale-95"
                )}
              >
                <div className="neumorphic-card p-12 rounded-3xl h-full relative overflow-hidden">
                  {/* Tech accent */}
                  <div className="absolute top-6 right-6 w-16 h-16 opacity-10">
                    <div className="tech-glow w-full h-full rounded-full animate-pulse-glow" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-full">
                    {/* Enhanced Profile Section */}
                    <div className="flex flex-col items-center md:items-start justify-center space-y-6">
                      <div className="relative">
                        <div className="neumorphic-inset rounded-full p-2">
                          <div className="rounded-full overflow-hidden w-24 h-24 border-4 border-primary/20">
                            <img 
                              src={testimonial.avatar} 
                              alt={testimonial.name} 
                              className="w-full h-full object-cover"
                              width="96"
                              height="96"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        </div>
                        <div className="absolute -top-2 -right-2 neumorphic-card p-2 rounded-full">
                          <Star className="h-5 w-5 text-primary fill-current animate-pulse-glow" />
                        </div>
                      </div>
                      
                      <div className="text-center md:text-left space-y-3">
                        <div className="flex justify-center md:justify-start mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-5 w-5 ${
                                i < testimonial.rating 
                                  ? "fill-primary text-primary animate-pulse-glow" 
                                  : "text-muted-foreground/30"
                              }`} 
                            />
                          ))}
                        </div>
                        <h3 className="text-xl font-bold">{testimonial.name}</h3>
                        <p className="text-sm text-primary font-semibold">{testimonial.role}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                      </div>
                    </div>
                    
                    {/* Enhanced Content Section */}
                    <div className="md:col-span-2 flex items-center">
                      <div className="space-y-6">
                        <div className="neumorphic-inset p-6 rounded-2xl">
                          <Quote className="h-8 w-8 text-primary mb-4 opacity-50" />
                          <blockquote className="text-lg leading-relaxed text-muted-foreground italic">
                            "{testimonial.content}"
                          </blockquote>
                        </div>
                        
                        {/* Rating visualization */}
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-semibold text-muted-foreground">Rating:</span>
                          <div className="flex items-center space-x-1">
                            <span className="text-2xl font-bold text-primary">{testimonial.rating}</span>
                            <span className="text-muted-foreground">/5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Enhanced Navigation */}
          <div className="flex justify-between items-center mt-12">
            <button
              onClick={prevTestimonial}
              className="bg-card border-2 border-border shadow-lg p-4 rounded-2xl hover:bg-muted hover:border-primary/50 transition-all duration-300 group"
              disabled={isAnimating}
            >
              <ChevronLeft className="h-6 w-6 text-primary group-hover:animate-pulse" />
              <span className="sr-only">Previous testimonial</span>
            </button>
            
            <div className="flex space-x-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (isAnimating) return;
                    setIsAnimating(true);
                    setActiveIndex(index);
                    setTimeout(() => setIsAnimating(false), 600);
                  }}
                  className={cn(
                    "transition-all duration-300 border border-border",
                    activeIndex === index 
                      ? "bg-primary w-8 h-4 rounded-full" 
                      : "bg-card w-4 h-4 rounded-full hover:bg-muted"
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
            
            <button
              onClick={nextTestimonial}
              className="bg-card border-2 border-border shadow-lg p-4 rounded-2xl hover:bg-muted hover:border-primary/50 transition-all duration-300 group"
              disabled={isAnimating}
            >
              <ChevronRight className="h-6 w-6 text-primary group-hover:animate-pulse" />
              <span className="sr-only">Next testimonial</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
