import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Sparkles, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import heroImageWebP from "@/assets/hero-image-new.webp";

export default function HeroSection() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  
  // Use IntersectionObserver for efficient visibility tracking instead of scroll events
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleScrollDown = useCallback(() => {
    const welcomeSection = document.getElementById('welcome');
    if (welcomeSection) {
      welcomeSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    }
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative h-screen overflow-hidden hero-section" 
      data-hero="true" 
      role="banner" 
      aria-label="Hero section"
    >
      {/* Hero image with CSS-only parallax for better performance */}
      <div 
        className="absolute inset-0 z-0 will-change-transform"
        style={{ 
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
      >
        <picture>
          <source 
            type="image/webp" 
            srcSet="/hero.webp 1920w, /hero.webp 1200w, /hero.webp 800w" 
            sizes="100vw" 
          />
          <img 
            src={heroImageWebP} 
            alt="Monarch Property Management - Luxury apartment complex with pool and modern architecture" 
            className="w-full h-full object-cover"
            loading="eager" 
            decoding="async" 
            width="1920" 
            height="1080"
            // @ts-expect-error - fetchpriority is valid HTML attribute
            fetchpriority="high"
          />
        </picture>
      </div>
      
      {/* Multi-layer gradient overlay */}
      <div className="absolute inset-0 z-[1] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/85" />
        <div 
          className="absolute inset-0" 
          style={{
            background: 'var(--gradient-hero)',
            mixBlendMode: 'overlay'
          }} 
        />
      </div>

      {/* Floating elements - CSS animations only, no JS calculations */}
      <div 
        className="absolute inset-0 z-[2] pointer-events-none transition-opacity duration-500"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <div className="absolute top-1/4 left-1/4 w-32 h-32 opacity-10">
          <div className="neumorphic-card w-full h-full rounded-3xl animate-morphic-float" />
        </div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 opacity-10">
          <div className="glass-card w-full h-full rounded-full animate-pulse-glow" />
        </div>
        <div className="absolute bottom-1/3 left-1/6 w-40 h-40 opacity-5">
          <div className="tech-glow w-full h-full rounded-2xl rotate-45 animate-morphic-float" />
        </div>
      </div>
      
      {/* Main content */}
      <div 
        className="relative h-full flex flex-col justify-center items-center text-center px-4 z-[10] pointer-events-auto transition-opacity duration-500"
        style={{ opacity: isVisible ? 1 : 0.5 }}
      >
        <div className="max-w-4xl animate-fade-in">
          {/* Subtitle badge */}
          <div className="inline-flex items-center px-6 py-3 mb-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20">
            <Sparkles className="h-5 w-5 text-primary mr-2 animate-pulse-glow" />
            <span className="text-lg tracking-wide text-white font-semibold drop-shadow-lg">
              {t.hero.subtitle}
            </span>
          </div>
          
          {/* Main title */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8">
            <span className="text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              Monarch Property Management
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              Excellence in Every Detail
            </span>
          </h1>
          
          {/* Description */}
          <p className="text-xl text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] mb-12 max-w-3xl mx-auto leading-relaxed font-medium [text-shadow:_0_2px_8px_rgb(0_0_0_/_80%)]">
            {t.hero.description}
          </p>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <Button asChild size="lg" className="btn-primary tech-glow min-w-[240px] group">
              <Link to="/auth?mode=signup" className="text-white">
                <Sparkles className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                Get Started
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="min-w-[240px] group bg-white/10 backdrop-blur-md border-white/30 hover:bg-white/20 hover:border-white/50"
            >
              <Link to="/properties" className="text-white hover:text-white">
                <Building className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                {t.hero.exploreApartments}
              </Link>
            </Button>
          </div>

          {/* Stats section */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { number: '500+', label: 'Properties' }, 
              { number: '98%', label: 'Satisfaction' }, 
              { number: '24/7', label: 'Support' }
            ].map((stat, index) => (
              <div 
                key={index} 
                className="bg-black/40 backdrop-blur-md border border-white/20 p-6 rounded-2xl animate-fade-in hover:bg-black/50 transition-all duration-300 border-l-4 border-l-primary" 
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="text-2xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-white/90 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-[10] pointer-events-auto">
        <button 
          onClick={handleScrollDown}
          className="bg-black/70 backdrop-blur-md border border-white/30 p-4 rounded-full hover:bg-black/80 transition-all duration-300 group" 
          aria-label="Scroll down to learn more"
        >
          <div className="flex flex-col items-center">
            <span className="text-sm text-white mb-2 group-hover:text-primary transition-colors font-medium">
              {t.hero.scrollDown}
            </span>
            <ChevronDown className="h-6 w-6 text-white animate-bounce group-hover:text-primary transition-colors" />
          </div>
        </button>
      </div>
      
      {/* Animated wave */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
        <svg 
          className="absolute bottom-0 w-full h-32 fill-background dark:fill-background" 
          preserveAspectRatio="none" 
          viewBox="0 0 1440 100" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--background))" />
              <stop offset="50%" stopColor="hsl(var(--primary) / 0.1)" />
              <stop offset="100%" stopColor="hsl(var(--background))" />
            </linearGradient>
          </defs>
          <path 
            d="M0,50 C240,20 480,80 720,50 C960,20 1200,80 1440,50 L1440,100 L0,100 Z" 
            fill="url(#waveGradient)" 
            className="animate-wave opacity-90" 
          />
          <path 
            d="M0,60 C240,30 480,90 720,60 C960,30 1200,90 1440,60 L1440,100 L0,100 Z" 
            className="animate-wave opacity-100 [animation-delay:-4s]" 
          />
        </svg>
      </div>
    </section>
  );
}
