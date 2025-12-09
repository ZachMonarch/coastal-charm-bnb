import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Play, Sparkles, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { rafBatch } from "@/utils/rafBatch";
import heroImageWebP from "@/assets/hero-image-new.webp";
export default function HeroSection() {
  const {
    t
  } = useLanguage();
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      rafBatch(() => {
        setScrollY(window.scrollY);
      });
    };
    window.addEventListener("scroll", handleScroll, {
      passive: true
    });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reduced parallax for performance (CSS transform is more efficient than JS calculations)
  const parallaxTransform = `translateY(${scrollY * 0.3}px)`;
  return <section className="relative h-screen overflow-hidden hero-section" data-hero="true" role="banner" aria-label="Hero section">
      {/* Optimized hero image for LCP - z-0 (base layer) */}
      <div className="absolute inset-0 z-0" style={{
      transform: parallaxTransform
    }}>
        <picture>
          <source type="image/webp" srcSet="/hero.webp 1920w, /hero.webp 1200w, /hero.webp 800w" sizes="100vw" />
          <img src={heroImageWebP} alt="Monarch Property Management - Luxury apartment complex with pool and modern architecture" className="w-full h-full object-cover" style={{
          objectPosition: `center ${50 + scrollY * 0.03}%`
        }} loading="eager" decoding="async" width="1920" height="1080" />
        </picture>
      </div>
      
      {/* Multi-layer gradient overlay - z-[1] - Enhanced contrast for better readability */}
      <div className="absolute inset-0 z-[1] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/85" />
        <div className="absolute inset-0" style={{
        background: 'var(--gradient-hero)',
        mixBlendMode: 'overlay'
      }} />
      </div>

      {/* Floating tech elements - z-[2] (decorative layer) - CSS animation for performance */}
      <div className="absolute inset-0 z-[2] pointer-events-none" style={{
      opacity: Math.max(0, 1 - scrollY / 500)
    }}>
        {/* Animated geometric shapes */}
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
      
      {/* Main content - z-[10] (content layer, below navigation) */}
      <div className="relative h-full flex flex-col justify-center items-center text-center px-4 z-[10] pointer-events-auto" style={{
      opacity: Math.max(0.5, 1 - scrollY / 800)
    }}>
        <div className="max-w-4xl animate-fade-in">
          {/* Enhanced subtitle with glassmorphic badge */}
          <div className="glass-card inline-flex items-center px-6 py-3 mb-8 rounded-full opacity-75">
            <Sparkles className="h-5 w-5 text-white/90 mr-2 animate-pulse-glow" />
            <span className="text-lg tracking-wide text-primary bg-primary/20 font-bold">
              {t.hero.subtitle}
            </span>
          </div>
          
          {/* Enhanced main title with gradient text - H1 for SEO */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8">
            <span className="text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              Monarch Property Management
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] text-slate-400">
              Excellence in Every Detail
            </span>
          </h1>
          
          {/* Enhanced description - Improved visibility for dark mode */}
          <p className="text-xl text-white/95 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] mb-12 max-w-3xl mx-auto leading-relaxed font-medium [text-shadow:_0_2px_8px_rgb(0_0_0_/_80%)]">
            {t.hero.description}
          </p>
          
          {/* Enhanced CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <Button asChild size="lg" className="btn-primary tech-glow min-w-[240px] group">
              <Link to="/contact">
                <Building className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                {t.hero.bookStay}
              </Link>
            </Button>
            <Button asChild size="lg" className="btn-glass min-w-[240px] group">
              <Link to="/properties">
                <Play className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                {t.hero.exploreApartments}
              </Link>
            </Button>
          </div>

          {/* Enhanced stats section */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[{
            number: '500+',
            label: 'Properties'
          }, {
            number: '98%',
            label: 'Satisfaction'
          }, {
            number: '24/7',
            label: 'Support'
          }].map((stat, index) => <div key={index} className="glass-card p-6 rounded-2xl animate-fade-in hover:floating-card transition-all duration-300 brand-gold-accent border-l-4" style={{
            animationDelay: `${index * 200}ms`
          }}>
                <div className="text-2xl font-bold text-primary mb-1">{stat.number}</div>
                <div className="text-white/90 text-sm">{stat.label}</div>
              </div>)}
          </div>
        </div>
      </div>
      
      {/* Enhanced scroll indicator - z-[10] */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-[10] pointer-events-auto">
        <a href="#welcome" className="glass-card p-4 rounded-full opacity-80 hover:opacity-100 transition-all duration-300 hover:floating-card group" aria-label="Scroll down to learn more">
          <div className="flex flex-col items-center">
            <span className="text-sm text-white/90 mb-2 group-hover:text-white transition-colors">
              {t.hero.scrollDown}
            </span>
            <ChevronDown className="h-6 w-6 text-white/90 animate-bounce group-hover:text-white transition-colors" />
          </div>
        </a>
      </div>
      
      {/* Enhanced animated wave with tech pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
        <svg className="absolute bottom-0 w-full h-32 fill-background dark:fill-background" preserveAspectRatio="none" viewBox="0 0 1440 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--background))" />
              <stop offset="50%" stopColor="hsl(var(--primary) / 0.1)" />
              <stop offset="100%" stopColor="hsl(var(--background))" />
            </linearGradient>
          </defs>
          <path d="M0,50 C240,20 480,80 720,50 C960,20 1200,80 1440,50 L1440,100 L0,100 Z" fill="url(#waveGradient)" className="animate-wave opacity-90" />
          <path d="M0,60 C240,30 480,90 720,60 C960,30 1200,90 1440,60 L1440,100 L0,100 Z" className="animate-wave opacity-100 [animation-delay:-4s]" />
        </svg>
      </div>
    </section>;
}